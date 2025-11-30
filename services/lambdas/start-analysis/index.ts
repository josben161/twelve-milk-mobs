import type { S3Event } from 'aws-lambda';
import { DynamoDBClient, GetItemCommand } from '@aws-sdk/client-dynamodb';
import { SFNClient, StartExecutionCommand } from '@aws-sdk/client-sfn';

const tableName = process.env.VIDEOS_TABLE_NAME!;
const stateMachineArn = process.env.STATE_MACHINE_ARN!;

const ddb = new DynamoDBClient({});
const sfn = new SFNClient({});

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

      await sfn.send(
        new StartExecutionCommand({
          stateMachineArn,
          input: JSON.stringify(input),
        })
      );

      console.log(`Started Step Functions execution for video ${videoId}`);
    } catch (err) {
      console.error(`Error starting analysis for ${record.s3.object.key}:`, err);
      // Continue processing other records
    }
  }
};

