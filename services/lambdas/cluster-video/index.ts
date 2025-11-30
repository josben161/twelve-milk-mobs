import type { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { DynamoDBClient, GetItemCommand, UpdateItemCommand, PutItemCommand } from '@aws-sdk/client-dynamodb';

const videosTableName = process.env.VIDEOS_TABLE_NAME!;
const mobsTableName = process.env.MOBS_TABLE_NAME!;

const ddb = new DynamoDBClient({});

// CORS headers for all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Credentials': 'true',
};

interface ClusterRequest {
  videoId: string;
}

/**
 * Rule-based clustering: assign video to mob based on keywords
 */
function determineMobId(hashtags: string[], actions: string[], objectsScenes: string[]): string {
  const allText = [
    ...hashtags.map((h) => h.toLowerCase()),
    ...actions.map((a) => a.toLowerCase()),
    ...objectsScenes.map((o) => o.toLowerCase()),
  ].join(' ');

  // Check for skate-related keywords
  if (allText.includes('skate') || allText.includes('skateboard') || allText.includes('skatepark')) {
    return 'skatepark';
  }

  // Check for study/cafe-related keywords
  if (
    allText.includes('study') ||
    allText.includes('cafe') ||
    allText.includes('café') ||
    allText.includes('coffee') ||
    allText.includes('notebook') ||
    allText.includes('laptop')
  ) {
    return 'cafe_study';
  }

  // Default mob
  return 'misc_milk_mob';
}

/**
 * Get or create mob summary in MobsTable
 */
async function upsertMob(mobId: string, exampleHashtags: string[]): Promise<void> {
  const mobNames: Record<string, { name: string; description: string }> = {
    skatepark: {
      name: 'Skatepark',
      description: 'Videos featuring skateboarding, tricks, and skatepark scenes',
    },
    cafe_study: {
      name: 'Café Study',
      description: 'Study sessions, café vibes, and academic content',
    },
    misc_milk_mob: {
      name: 'Misc Milk Mob',
      description: 'General milk-related content and everyday moments',
    },
  };

  const mobInfo = mobNames[mobId] || {
    name: mobId,
    description: 'A cluster of related videos',
  };

  // Try to get existing mob
  const getResult = await ddb.send(
    new GetItemCommand({
      TableName: mobsTableName,
      Key: {
        mobId: { S: mobId },
      },
    })
  );

  if (getResult.Item) {
    // Update videoCount atomically
    await ddb.send(
      new UpdateItemCommand({
        TableName: mobsTableName,
        Key: {
          mobId: { S: mobId },
        },
        UpdateExpression: 'ADD videoCount :one',
        ExpressionAttributeValues: {
          ':one': { N: '1' },
        },
      })
    );
  } else {
    // Create new mob
    await ddb.send(
      new PutItemCommand({
        TableName: mobsTableName,
        Item: {
          mobId: { S: mobId },
          name: { S: mobInfo.name },
          description: { S: mobInfo.description },
          videoCount: { N: '1' },
          exampleHashtags: { SS: exampleHashtags.slice(0, 5) }, // Limit to 5 example hashtags
        },
      })
    );
  }
}

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    // Extract videoId from event body or path parameters
    let videoId: string;
    
    if (event.body) {
      const body = JSON.parse(event.body) as ClusterRequest;
      videoId = body.videoId;
    } else if (event.pathParameters?.videoId) {
      videoId = event.pathParameters.videoId;
    } else {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'videoId is required' }),
      };
    }

    console.log(`Clustering video: ${videoId}`);

    // Fetch video record from Videos table
    const videoResult = await ddb.send(
      new GetItemCommand({
        TableName: videosTableName,
        Key: {
          videoId: { S: videoId },
        },
      })
    );

    if (!videoResult.Item) {
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Video not found' }),
      };
    }

    const hashtags = videoResult.Item.hashtags?.SS || [];
    const actions = videoResult.Item.actions?.SS || [];
    const objectsScenes = videoResult.Item.objectsScenes?.SS || [];

    // Determine mobId based on content
    const mobId = determineMobId(hashtags, actions, objectsScenes);

    console.log(`Assigned video ${videoId} to mob: ${mobId}`);

    // Update video with mobId
    await ddb.send(
      new UpdateItemCommand({
        TableName: videosTableName,
        Key: {
          videoId: { S: videoId },
        },
        UpdateExpression: 'SET mobId = :mobId',
        ExpressionAttributeValues: {
          ':mobId': { S: mobId },
        },
      })
    );

    // Upsert mob summary
    await upsertMob(mobId, hashtags);

    return {
      statusCode: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ videoId, mobId }),
    };
  } catch (err) {
    console.error('Error in cluster-video', err);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};

