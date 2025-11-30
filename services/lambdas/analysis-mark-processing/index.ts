import type { Context } from 'aws-lambda';
import { DynamoDBClient, UpdateItemCommand } from '@aws-sdk/client-dynamodb';

const tableName = process.env.VIDEOS_TABLE_NAME!;

const ddb = new DynamoDBClient({});

interface AnalysisInput {
  videoId: string;
  s3Bucket: string;
  s3Key: string;
  hashtags: string[];
}

export const handler = async (
  event: AnalysisInput,
  _context: Context
): Promise<AnalysisInput> => {
  console.log('Marking video as processing:', event.videoId);

  // Update status to 'processing'
  await ddb.send(
    new UpdateItemCommand({
      TableName: tableName,
      Key: {
        videoId: { S: event.videoId },
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

  console.log(`Video ${event.videoId} marked as processing`);

  // Pass through the input for next step
  return event;
};

