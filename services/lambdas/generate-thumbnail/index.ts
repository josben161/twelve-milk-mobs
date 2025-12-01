import type { S3Event } from 'aws-lambda';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { DynamoDBClient, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { exec } from 'child_process';
import { promisify } from 'util';
import { createWriteStream, unlinkSync, existsSync } from 'fs';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';

const execAsync = promisify(exec);

const bucketName = process.env.UPLOADS_BUCKET_NAME!;
const tableName = process.env.VIDEOS_TABLE_NAME!;
const cloudfrontDomain = process.env.CLOUDFRONT_DISTRIBUTION_DOMAIN;

const s3 = new S3Client({});
const ddb = new DynamoDBClient({});

// FFmpeg is installed in the container image at /usr/bin/ffmpeg
// Check common locations: container image (/usr/bin), Lambda layer (/opt/bin), or system PATH
const FFMPEG_PATH = existsSync('/usr/bin/ffmpeg')
  ? '/usr/bin/ffmpeg'
  : existsSync('/opt/bin/ffmpeg')
  ? '/opt/bin/ffmpeg'
  : 'ffmpeg';

// Check if FFmpeg is available
async function checkFFmpegAvailable(): Promise<boolean> {
  try {
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);
    await execAsync(`${FFMPEG_PATH} -version`);
    console.log(`FFmpeg is available at: ${FFMPEG_PATH}`);
    return true;
  } catch (err) {
    console.error(`FFmpeg is not available at ${FFMPEG_PATH}:`, err);
    return false;
  }
}

// Handler can accept either S3Event (from S3 trigger) or a synthetic event (from Lambda invocation)
export const handler = async (event: S3Event | { Records: Array<{ s3: { bucket: { name: string }; object: { key: string } } }> }): Promise<void> => {
  console.log('Processing event for thumbnail generation:', JSON.stringify(event, null, 2));

  // Check FFmpeg availability at the start
  const ffmpegAvailable = await checkFFmpegAvailable();
  if (!ffmpegAvailable) {
    console.error('FFmpeg is not available. Thumbnail generation will fail. Please configure an FFmpeg Lambda Layer.');
    // Continue anyway - individual records will handle the error
  }

  for (const record of event.Records) {
    let tempVideoPath: string | null = null;
    let tempThumbnailPath: string | null = null;
    let videoId: string | null = null;

    try {
      const bucket = record.s3.bucket.name;
      const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));

      // Only process video files matching vid_*.mp4 pattern
      if (!key.match(/^vid_[a-f0-9-]+\.mp4$/)) {
        console.log(`Skipping non-video file: ${key}`);
        continue;
      }

      // Extract videoId from key (remove .mp4 extension)
      videoId = key.replace(/\.mp4$/, '');
      console.log(`Generating thumbnail for video: ${videoId} from bucket: ${bucket}, key: ${key}`);

      // Download video from S3 to temporary file
      const getObjectResponse = await s3.send(
        new GetObjectCommand({
          Bucket: bucket,
          Key: key,
        })
      );

      if (!getObjectResponse.Body) {
        throw new Error(`Failed to download video ${key} from S3`);
      }

      tempVideoPath = `/tmp/${videoId}.mp4`;
      const videoStream = getObjectResponse.Body as Readable;
      const writeStream = createWriteStream(tempVideoPath);
      await pipeline(videoStream, writeStream);

      // Generate thumbnail using FFmpeg (extract frame at 1 second)
      tempThumbnailPath = `/tmp/${videoId}_thumb.jpg`;
      const ffmpegCommand = `${FFMPEG_PATH} -i ${tempVideoPath} -ss 00:00:01 -vframes 1 -q:v 2 ${tempThumbnailPath} -y`;

      console.log(`Attempting to generate thumbnail for ${videoId} using command: ${ffmpegCommand}`);

      try {
        const { stdout, stderr } = await execAsync(ffmpegCommand);
        if (stderr) {
          console.log(`FFmpeg stderr for ${videoId}:`, stderr);
        }
        if (stdout) {
          console.log(`FFmpeg stdout for ${videoId}:`, stdout);
        }
        console.log(`FFmpeg command completed successfully for ${videoId}`);
      } catch (ffmpegError: any) {
        console.error(`FFmpeg error for ${videoId}:`, {
          message: ffmpegError?.message,
          code: ffmpegError?.code,
          stderr: ffmpegError?.stderr,
          stdout: ffmpegError?.stdout,
        });
        
        // Check if FFmpeg is not found
        if (ffmpegError?.code === 'ENOENT' || ffmpegError?.message?.includes('not found')) {
          throw new Error(`FFmpeg is not available. Please configure an FFmpeg Lambda Layer. Original error: ${ffmpegError.message}`);
        }

        // Fallback: try extracting frame at 0.5 seconds
        console.log(`Attempting fallback thumbnail generation for ${videoId} at 0.5 seconds`);
        try {
          const fallbackCommand = `${FFMPEG_PATH} -i ${tempVideoPath} -ss 00:00:00.5 -vframes 1 -q:v 2 ${tempThumbnailPath} -y`;
          const { stdout: fallbackStdout, stderr: fallbackStderr } = await execAsync(fallbackCommand);
          if (fallbackStderr) {
            console.log(`FFmpeg fallback stderr for ${videoId}:`, fallbackStderr);
          }
          console.log(`FFmpeg fallback command completed successfully for ${videoId}`);
        } catch (fallbackError: any) {
          console.error(`FFmpeg fallback also failed for ${videoId}:`, {
            message: fallbackError?.message,
            code: fallbackError?.code,
            stderr: fallbackError?.stderr,
          });
          throw new Error(`Failed to generate thumbnail: ${fallbackError.message}`);
        }
      }

      if (!existsSync(tempThumbnailPath)) {
        const errorMsg = `Thumbnail file was not created: ${tempThumbnailPath}. FFmpeg may have failed silently.`;
        console.error(errorMsg);
        throw new Error(errorMsg);
      }

      const thumbnailSize = (await import('fs')).statSync(tempThumbnailPath).size;
      console.log(`Thumbnail generated successfully for ${videoId}, size: ${thumbnailSize} bytes`);

      // Upload thumbnail to S3
      const thumbnailKey = `thumbnails/${videoId}.jpg`;
      const { createReadStream } = await import('fs');
      const thumbnailStream = createReadStream(tempThumbnailPath);

      // Read file into buffer for S3 upload
      const { readFileSync } = await import('fs');
      const thumbnailBuffer = readFileSync(tempThumbnailPath);

      await s3.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: thumbnailKey,
          Body: thumbnailBuffer,
          ContentType: 'image/jpeg',
          CacheControl: 'max-age=31536000', // Cache for 1 year
        })
      );

      console.log(`Thumbnail uploaded to S3: ${thumbnailKey}`);

      // Update DynamoDB with thumbnail URL
      const thumbnailUrl = cloudfrontDomain
        ? `https://${cloudfrontDomain}/${thumbnailKey}`
        : `https://${bucket}.s3.amazonaws.com/${thumbnailKey}`;

      await ddb.send(
        new UpdateItemCommand({
          TableName: tableName,
          Key: {
            videoId: { S: videoId },
          },
          UpdateExpression: 'SET thumbnailUrl = :thumbnailUrl',
          ExpressionAttributeValues: {
            ':thumbnailUrl': { S: thumbnailUrl },
          },
        })
      );

      console.log(`Successfully completed thumbnail generation for ${videoId}. URL: ${thumbnailUrl}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      const key = record.s3?.object?.key ? decodeURIComponent(record.s3.object.key.replace(/\+/g, ' ')) : 'unknown';
      const extractedVideoId = videoId || (key.match(/^vid_[a-f0-9-]+\.mp4$/) ? key.replace(/\.mp4$/, '') : 'unknown');
      
      console.error(`Error generating thumbnail for video ${extractedVideoId}:`, {
        error: errorMessage,
        stack: err instanceof Error ? err.stack : undefined,
        videoId: extractedVideoId,
        bucket: record.s3?.bucket?.name,
        key: key,
      });
      
      // Log to CloudWatch for monitoring
      // Note: In production, you might want to send this to CloudWatch Metrics or SNS
      console.error('THUMBNAIL_GENERATION_FAILED', {
        videoId: extractedVideoId,
        error: errorMessage,
        timestamp: new Date().toISOString(),
      });
      
      // Don't throw - we don't want to fail the entire batch if one thumbnail fails
      // But we should log it clearly for debugging
    } finally {
      // Clean up temporary files
      if (tempVideoPath && existsSync(tempVideoPath)) {
        try {
          unlinkSync(tempVideoPath);
        } catch (e) {
          console.warn(`Failed to delete temp video file: ${tempVideoPath}`, e);
        }
      }
      if (tempThumbnailPath && existsSync(tempThumbnailPath)) {
        try {
          unlinkSync(tempThumbnailPath);
        } catch (e) {
          console.warn(`Failed to delete temp thumbnail file: ${tempThumbnailPath}`, e);
        }
      }
    }
  }
};

