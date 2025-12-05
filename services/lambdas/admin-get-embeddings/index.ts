import type { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb';

const tableName = process.env.VIDEOS_TABLE_NAME!;
const ddb = new DynamoDBClient({});

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Credentials': 'true',
};

interface VideoEmbedding {
  videoId: string;
  mobId: string | null;
  embedding: number[];
  userHandle?: string;
  thumbnailUrl?: string;
}

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    const mobId = event.queryStringParameters?.mobId;
    const limit = parseInt(event.queryStringParameters?.limit || '1000', 10);

    // Build filter expression
    let filterExpression = 'attribute_exists(embedding)';
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};

    if (mobId) {
      filterExpression += ' AND mobId = :mobId';
      expressionAttributeValues[':mobId'] = { S: mobId };
    }

    // Scan videos with embeddings
    const scanResult = await ddb.send(
      new ScanCommand({
        TableName: tableName,
        FilterExpression: filterExpression,
        ExpressionAttributeNames: Object.keys(expressionAttributeNames).length > 0 ? expressionAttributeNames : undefined,
        ExpressionAttributeValues: Object.keys(expressionAttributeValues).length > 0 ? expressionAttributeValues : undefined,
        ProjectionExpression: 'videoId, mobId, embedding, userHandle, thumbnailUrl',
        Limit: limit,
      })
    );

    const videos: VideoEmbedding[] = [];

    for (const item of scanResult.Items || []) {
      const embeddingStr = item.embedding?.S;
      if (!embeddingStr) continue;

      try {
        const embedding = JSON.parse(embeddingStr);
        if (!Array.isArray(embedding) || embedding.length === 0) continue;

        videos.push({
          videoId: item.videoId?.S || '',
          mobId: item.mobId?.S || null,
          embedding,
          userHandle: item.userHandle?.S,
          thumbnailUrl: item.thumbnailUrl?.S || undefined,
        });
      } catch (e) {
        console.warn(`Failed to parse embedding for video ${item.videoId?.S}:`, e);
        continue;
      }
    }

    return {
      statusCode: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        videos,
        count: videos.length,
      }),
    };
  } catch (error) {
    console.error('Error fetching embeddings:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Failed to fetch embeddings',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};

