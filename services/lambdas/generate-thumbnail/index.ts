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

// FFmpeg is available in /opt/bin/ffmpeg when using a Lambda Layer
// Or we can use the system PATH if FFmpeg is installed
const FFMPEG_PATH = existsSync('/opt/bin/ffmpeg') ? '/opt/bin/ffmpeg' : 'ffmpeg';

// Handler can accept either S3Event (from S3 trigger) or a synthetic event (from Lambda invocation)
export const handler = async (event: S3Event | { Records: Array<{ s3: { bucket: { name: string }; object: { key: string } } }> }): Promise<void> => {
  console.log('Processing event for thumbnail generation:', JSON.stringify(event, null, 2));

  for (const record of event.Records) {
    let tempVideoPath: string | null = null;
    let tempThumbnailPath: string | null = null;

    try {
      const bucket = record.s3.bucket.name;
      const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));

      // Only process video files matching vid_*.mp4 pattern
      if (!key.match(/^vid_[a-f0-9-]+\.mp4$/)) {
        console.log(`Skipping non-video file: ${key}`);
        continue;
      }

      // Extract videoId from key (remove .mp4 extension)
      const videoId = key.replace(/\.mp4$/, '');
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

      try {
        await execAsync(ffmpegCommand);
      } catch (ffmpegError) {
        console.error(`FFmpeg error for ${videoId}:`, ffmpegError);
        // Fallback: try extracting frame at 0.5 seconds
        const fallbackCommand = `${FFMPEG_PATH} -i ${tempVideoPath} -ss 00:00:00.5 -vframes 1 -q:v 2 ${tempThumbnailPath} -y`;
        await execAsync(fallbackCommand);
      }

      if (!existsSync(tempThumbnailPath)) {
        throw new Error(`Thumbnail file was not created: ${tempThumbnailPath}`);
      }

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

      console.log(`Updated DynamoDB with thumbnail URL for ${videoId}`);
    } catch (err) {
      console.error('Error generating thumbnail:', err);
      // Don't throw - we don't want to fail the entire batch if one thumbnail fails
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

