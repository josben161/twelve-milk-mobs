import type { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { DynamoDBClient, DeleteItemCommand } from '@aws-sdk/client-dynamodb';
import { S3Client, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';

const tableName = process.env.VIDEOS_TABLE_NAME!;
const bucketName = process.env.UPLOADS_BUCKET_NAME!;

const ddb = new DynamoDBClient({});
const s3 = new S3Client({});

// CORS headers for all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Credentials': 'true',
};

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    const videoId = event.pathParameters?.videoId;

    if (!videoId) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'videoId is required' }),
      };
    }

    // First, get the video record to find the S3 key
    const getItemResult = await ddb.send(
      new DeleteItemCommand({
        TableName: tableName,
        Key: {
          videoId: { S: videoId },
        },
        ReturnValues: 'ALL_OLD',
      })
    );

    if (!getItemResult.Attributes) {
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Video not found' }),
      };
    }

    const s3Key = getItemResult.Attributes.s3Key?.S;
    const thumbnailUrl = getItemResult.Attributes.thumbnailUrl?.S;

    // Delete video file from S3 if it exists
    if (s3Key) {
      try {
        await s3.send(
          new DeleteObjectCommand({
            Bucket: bucketName,
            Key: s3Key,
          })
        );
        console.log(`Deleted video file: ${s3Key}`);
      } catch (s3Err) {
        console.error(`Failed to delete video file ${s3Key}:`, s3Err);
        // Continue even if S3 deletion fails - DynamoDB record is already deleted
      }
    }

    // Delete thumbnail if it exists (check both thumbnailUrl and constructed path)
    const thumbnailKey = `thumbnails/${videoId}.jpg`;
    try {
      await s3.send(
        new DeleteObjectCommand({
          Bucket: bucketName,
          Key: thumbnailKey,
        })
      );
      console.log(`Deleted thumbnail: ${thumbnailKey}`);
    } catch (thumbErr) {
      // Thumbnail might not exist, which is fine
      console.log(`Thumbnail ${thumbnailKey} not found or already deleted`);
    }

    // If thumbnailUrl is a different S3 key, try to delete it too
    if (thumbnailUrl && thumbnailUrl.includes(bucketName)) {
      try {
        // Extract key from URL if it's a full URL
        const urlParts = thumbnailUrl.split('/');
        const keyFromUrl = urlParts.slice(-2).join('/'); // Get last two parts (thumbnails/videoId.jpg)
        if (keyFromUrl !== thumbnailKey) {
          await s3.send(
            new DeleteObjectCommand({
              Bucket: bucketName,
              Key: keyFromUrl,
            })
          );
          console.log(`Deleted thumbnail from URL: ${keyFromUrl}`);
        }
      } catch (thumbUrlErr) {
        console.log(`Could not delete thumbnail from URL: ${thumbnailUrl}`);
      }
    }

    return {
      statusCode: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        success: true,
        message: 'Video deleted successfully',
        videoId,
      }),
    };
  } catch (err) {
    console.error('Error in admin-delete-video', err);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};

