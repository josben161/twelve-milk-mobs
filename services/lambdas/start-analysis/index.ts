import type { S3Event } from 'aws-lambda';
import { DynamoDBClient, GetItemCommand } from '@aws-sdk/client-dynamodb';
import { SFNClient, StartExecutionCommand } from '@aws-sdk/client-sfn';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';

const tableName = process.env.VIDEOS_TABLE_NAME!;
const stateMachineArn = process.env.STATE_MACHINE_ARN!;
const generateThumbnailFunctionName = process.env.GENERATE_THUMBNAIL_FUNCTION_NAME;

const ddb = new DynamoDBClient({});
const sfn = new SFNClient({});
const lambda = new LambdaClient({});

export const handler = async (event: S3Event): Promise<void> => {
  console.log('Processing S3 event for analysis pipeline:', JSON.stringify(event, null, 2));

  for (const record of event.Records) {
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
      console.log(`Starting analysis pipeline for video: ${videoId} from bucket: ${bucket}, key: ${key}`);

      // Fetch video metadata from DynamoDB to get hashtags
      const videoResult = await ddb.send(
        new GetItemCommand({
          TableName: tableName,
          Key: {
            videoId: { S: videoId },
          },
        })
      );

      if (!videoResult.Item) {
        console.error(`Video ${videoId} not found in DynamoDB, skipping analysis`);
        continue;
      }

      const hashtags = videoResult.Item.hashtags?.SS || [];

      // Start Step Functions state machine
      const input = {
        videoId,
        s3Bucket: bucket,
        s3Key: key,
        hashtags,
      };

      // Start Step Functions execution
      await sfn.send(
        new StartExecutionCommand({
          stateMachineArn,
          input: JSON.stringify(input),
        })
      );

      console.log(`Started Step Functions execution for video ${videoId}`);

      // Trigger thumbnail generation asynchronously (don't wait for it)
      if (generateThumbnailFunctionName) {
        try {
          // Create a synthetic S3 event for the thumbnail Lambda
          const thumbnailEvent = {
            Records: [
              {
                s3: {
                  bucket: { name: bucket },
                  object: { key: key },
                },
              },
            ],
          };

          await lambda.send(
            new InvokeCommand({
              FunctionName: generateThumbnailFunctionName,
              InvocationType: 'Event', // Async invocation
              Payload: JSON.stringify(thumbnailEvent),
            })
          );

          console.log(`Triggered thumbnail generation for video ${videoId}`);
        } catch (thumbnailErr) {
          // Log but don't fail - thumbnail generation is optional
          console.warn(`Failed to trigger thumbnail generation for ${videoId}:`, thumbnailErr);
        }
      }
    } catch (err) {
      console.error(`Error starting analysis for ${record.s3.object.key}:`, err);
      // Continue processing other records
    }
  }
};

