import type { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import {
  S3Client,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';
import type {
  SubmitVideoRequest,
  SubmitVideoResponse,
  VideoStatus,
} from '@twelve/core-types';

const bucketName = process.env.UPLOADS_BUCKET_NAME!;
const tableName = process.env.VIDEOS_TABLE_NAME!;

const ddb = new DynamoDBClient({});
const s3 = new S3Client({});

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    if (!event.body) {
      return { statusCode: 400, body: 'Missing body' };
    }

    const parsed = JSON.parse(event.body) as SubmitVideoRequest;
    const hashtags = Array.isArray(parsed.hashtags)
      ? parsed.hashtags
      : [];

    const videoId = `vid_${randomUUID()}`;
    const key = `${videoId}.mp4`;
    const createdAt = new Date().toISOString();
    const status: VideoStatus = 'uploaded';

    // 1) Write metadata to DynamoDB
    await ddb.send(
      new PutItemCommand({
        TableName: tableName,
        Item: {
          videoId: { S: videoId },
          status: { S: status },
          createdAt: { S: createdAt },
          hashtags: { SS: hashtags },
        },
      })
    );

    // 2) Create presigned PUT URL for S3
    const putCmd = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      ContentType: 'video/mp4', // client can override later if needed
    });

    const uploadUrl = await getSignedUrl(s3, putCmd, {
      expiresIn: 15 * 60, // 15 minutes
    });

    const response: SubmitVideoResponse = {
      videoId,
      uploadUrl,
    };

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(response),
    };
  } catch (err) {
    console.error('Error in create-upload', err);
    return {
      statusCode: 500,
      body: 'Internal server error',
    };
  }
};
