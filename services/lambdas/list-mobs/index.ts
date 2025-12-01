import type { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb';
import type { MobSummary } from '@twelve/core-types';

const tableName = process.env.MOBS_TABLE_NAME!;

const ddb = new DynamoDBClient({});

// CORS headers for all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Credentials': 'true',
};

export const handler: APIGatewayProxyHandlerV2 = async () => {
  try {
    // Scan all mobs
    const result = await ddb.send(
      new ScanCommand({
        TableName: tableName,
      })
    );

    // Map DynamoDB items to MobSummary array
    const mobs: MobSummary[] =
      result.Items?.map((item) => ({
        id: item.mobId?.S || '',
        name: item.name?.S || 'Unknown Mob',
        description: item.description?.S || '',
        videoCount: item.videoCount?.N ? parseInt(item.videoCount.N, 10) : 0,
        exampleHashtags: item.exampleHashtags?.SS || [],
      })) || [];

    // Sort by videoCount descending (most popular first)
    mobs.sort((a, b) => b.videoCount - a.videoCount);

    return {
      statusCode: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ mobs }),
    };
  } catch (err) {
    console.error('Error in list-mobs', err);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};

