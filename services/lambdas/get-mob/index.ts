import type { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { DynamoDBClient, GetItemCommand, ScanCommand } from '@aws-sdk/client-dynamodb';
import type { MobSummary, VideoSummary } from '@twelve/core-types';

const mobsTableName = process.env.MOBS_TABLE_NAME!;
const videosTableName = process.env.VIDEOS_TABLE_NAME!;

const ddb = new DynamoDBClient({});

// CORS headers for all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Credentials': 'true',
};

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    const mobId = event.pathParameters?.mobId;

    if (!mobId) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'mobId is required' }),
      };
    }

    // Fetch mob from MobsTable
    const mobResult = await ddb.send(
      new GetItemCommand({
        TableName: mobsTableName,
        Key: {
          mobId: { S: mobId },
        },
      })
    );

    if (!mobResult.Item) {
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Mob not found' }),
      };
    }

    const mob: MobSummary = {
      id: mobResult.Item.mobId?.S || mobId,
      name: mobResult.Item.name?.S || 'Unknown Mob',
      description: mobResult.Item.description?.S || '',
      videoCount: mobResult.Item.videoCount?.N ? parseInt(mobResult.Item.videoCount.N, 10) : 0,
      exampleHashtags: mobResult.Item.exampleHashtags?.SS || [],
    };

    // Fetch videos in this mob (scan with filter)
    const videosResult = await ddb.send(
      new ScanCommand({
        TableName: videosTableName,
        FilterExpression: 'mobId = :mobId',
        ExpressionAttributeValues: {
          ':mobId': { S: mobId },
        },
      })
    );

    const videos: VideoSummary[] =
      videosResult.Items?.map((item) => ({
        id: item.videoId?.S || '',
        userHandle: item.userHandle?.S || item.userId?.S || 'unknown',
        mobId: item.mobId?.S || null,
        status: (item.status?.S as any) || 'uploaded',
        createdAt: item.createdAt?.S || '',
        caption: item.hashtags?.SS?.[0] || '',
        hashtags: item.hashtags?.SS || [],
        thumbnailUrl: null,
        validationScore: item.participationScore?.N
          ? parseFloat(item.participationScore.N)
          : item.validationScore?.N
          ? parseFloat(item.validationScore.N)
          : undefined,
      })) || [];

    // Sort videos by createdAt descending
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
      body: JSON.stringify({
        mob,
        videos,
      }),
    };
  } catch (err) {
    console.error('Error in get-mob', err);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};

