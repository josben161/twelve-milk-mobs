import type { S3Event } from 'aws-lambda';
import { DynamoDBClient, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';
// Import from relative path to avoid workspace bundling issues
import { createTwelveLabsClient } from '../../../packages/twelvelabs-client/src/index';

const tableName = process.env.VIDEOS_TABLE_NAME!;
const bucketName = process.env.UPLOADS_BUCKET_NAME!;
const clusterVideoFunctionName = process.env.CLUSTER_VIDEO_FUNCTION_NAME!;
const twelvelabsApiKey = process.env.TWELVELABS_API_KEY || '';
const twelvelabsEndpoint = process.env.TWELVELABS_ENDPOINT || 'https://api.twelvelabs.io/v1';
const twelvelabsModelId = process.env.TWELVELABS_MODEL_ID || '';

const ddb = new DynamoDBClient({});
const lambda = new LambdaClient({});

// Initialize TwelveLabs client
const tlClient = createTwelveLabsClient({
  apiKey: twelvelabsApiKey,
  endpoint: twelvelabsEndpoint,
  modelId: twelvelabsModelId,
});

export const handler = async (event: S3Event): Promise<void> => {
  console.log('Processing S3 event:', JSON.stringify(event, null, 2));

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
      console.log(`Processing video: ${videoId} from bucket: ${bucket}, key: ${key}`);

      // Update status to 'processing'
      await ddb.send(
        new UpdateItemCommand({
          TableName: tableName,
          Key: {
            videoId: { S: videoId },
          },
          UpdateExpression: 'SET #status = :processing',
          ExpressionAttributeNames: {
            '#status': 'status',
          },
          ExpressionAttributeValues: {
            ':processing': { S: 'processing' },
          },
        })
      );

      // Call TwelveLabs to analyze the video
      console.log(`Calling TwelveLabs analyzeVideo for ${videoId}`);
      const analysis = await tlClient.analyzeVideo({
        videoId,
        s3Bucket: bucket,
        s3Key: key,
      });

      console.log(`TwelveLabs analysis complete for ${videoId}:`, JSON.stringify(analysis, null, 2));

      // Update DynamoDB with analysis results
      await ddb.send(
        new UpdateItemCommand({
          TableName: tableName,
          Key: {
            videoId: { S: videoId },
          },
          UpdateExpression: `
            SET #status = :validated,
                validationScore = :score,
                actions = :actions,
                objectsScenes = :objectsScenes,
                timeline = :timeline
          `,
          ExpressionAttributeNames: {
            '#status': 'status',
          },
          ExpressionAttributeValues: {
            ':validated': { S: 'validated' },
            ':score': { N: analysis.validationScore.toString() },
            ':actions': { SS: analysis.actions },
            ':objectsScenes': { SS: analysis.objectsScenes },
            ':timeline': { S: JSON.stringify(analysis.timeline) },
          },
        })
      );

      console.log(`Successfully updated video ${videoId} with analysis results`);

      // Invoke cluster-video Lambda asynchronously
      if (clusterVideoFunctionName) {
        try {
          await lambda.send(
            new InvokeCommand({
              FunctionName: clusterVideoFunctionName,
              InvocationType: 'Event', // Asynchronous invocation
              Payload: JSON.stringify({ videoId }),
            })
          );
          console.log(`Invoked cluster-video Lambda for ${videoId}`);
        } catch (invokeErr) {
          console.error(`Failed to invoke cluster-video Lambda for ${videoId}:`, invokeErr);
          // Don't fail the whole process if clustering fails
        }
      }
    } catch (err) {
      console.error(`Error processing video ${key}:`, err);
      // Update status to 'rejected' on error
      try {
        const videoId = key.replace(/\.mp4$/, '');
        await ddb.send(
          new UpdateItemCommand({
            TableName: tableName,
            Key: {
              videoId: { S: videoId },
            },
            UpdateExpression: 'SET #status = :rejected',
            ExpressionAttributeNames: {
              '#status': 'status',
            },
            ExpressionAttributeValues: {
              ':rejected': { S: 'rejected' },
            },
          })
        );
      } catch (updateErr) {
        console.error(`Failed to update status to rejected for ${key}:`, updateErr);
      }
    }
  }
};

