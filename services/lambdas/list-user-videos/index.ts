import type { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb';

const tableName = process.env.VIDEOS_TABLE_NAME!;
const cloudfrontDomain = process.env.CLOUDFRONT_DISTRIBUTION_DOMAIN;

const ddb = new DynamoDBClient({});

// CORS headers for all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Credentials': 'true',
};

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    const userId = event.queryStringParameters?.userId;

    if (!userId) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'userId query parameter is required' }),
      };
    }

    // Scan table and filter by userId
    // Note: For production, consider adding a GSI on userId for better performance
    const result = await ddb.send(
      new ScanCommand({
        TableName: tableName,
        FilterExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': { S: userId },
        },
      })
    );

    // Transform DynamoDB items to video objects
    const videos =
      result.Items?.map((item) => {
        const videoId = item.videoId?.S || '';
        const s3Key = item.s3Key?.S || '';

        let thumb = '';
        if (cloudfrontDomain && s3Key) {
          thumb = `https://${cloudfrontDomain}/${s3Key}`;
        }

        return {
          id: videoId,
          videoId,
          userId: item.userId?.S || '',
          userHandle: item.userHandle?.S || '',
          s3Key,
          status: item.status?.S || 'uploaded',
          createdAt: item.createdAt?.S || '',
          hashtags: item.hashtags?.SS || [],
          thumb,
        };
      }) || [];

    // Sort by createdAt descending (newest first)
    videos.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA;
    });

    return {
      statusCode: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ videos }),
    };
  } catch (err) {
    console.error('Error in list-user-videos', err);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};

