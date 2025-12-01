import type { APIGatewayProxyHandlerV2, Context } from 'aws-lambda';
import { DynamoDBClient, GetItemCommand, UpdateItemCommand, PutItemCommand, ScanCommand } from '@aws-sdk/client-dynamodb';

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

interface StepFunctionsInput {
  videoId: string;
  status?: string;
  participationScore?: number;
  mobId?: string | null;
}

interface StepFunctionsOutput extends StepFunctionsInput {
  mobId: string;
}

/**
 * Cosine similarity between two vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator === 0 ? 0 : dotProduct / denominator;
}

/**
 * Find nearest mob by embedding similarity
 */
async function findNearestMobByEmbedding(videoEmbedding: number[]): Promise<string | null> {
  try {
    // Scan all mobs to find centroids
    const mobsScan = await ddb.send(
      new ScanCommand({
        TableName: mobsTableName,
        ProjectionExpression: 'mobId, centroid',
      })
    );

    let bestMobId: string | null = null;
    let bestSimilarity = -1;
    const similarityThreshold = 0.7; // Minimum similarity to assign to existing mob

    for (const mob of mobsScan.Items || []) {
      const mobId = mob.mobId?.S;
      const centroidStr = mob.centroid?.S;
      
      if (!mobId || !centroidStr) continue;

      try {
        const centroid = JSON.parse(centroidStr);
        if (!Array.isArray(centroid) || centroid.length !== videoEmbedding.length) continue;

        const similarity = cosineSimilarity(videoEmbedding, centroid);
        if (similarity > bestSimilarity && similarity >= similarityThreshold) {
          bestSimilarity = similarity;
          bestMobId = mobId;
        }
      } catch (e) {
        console.warn(`Failed to parse centroid for mob ${mobId}:`, e);
        continue;
      }
    }

    return bestMobId;
  } catch (err) {
    console.error('Error finding nearest mob by embedding:', err);
    return null;
  }
}

/**
 * Rule-based clustering: assign video to mob based on keywords (fallback)
 */
function determineMobIdByKeywords(hashtags: string[], actions: string[], objectsScenes: string[]): string {
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

/**
 * Main clustering logic: uses embeddings first, falls back to keywords
 */
async function clusterVideo(videoId: string): Promise<string> {
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
    throw new Error(`Video ${videoId} not found`);
  }

  const hashtags = videoResult.Item.hashtags?.SS || [];
  const actions = videoResult.Item.actions?.SS || [];
  const objectsScenes = videoResult.Item.objectsScenes?.SS || [];
  const embeddingStr = videoResult.Item.embedding?.S;

  let mobId: string;

  // Try embedding-based clustering first
  if (embeddingStr) {
    try {
      const embedding = JSON.parse(embeddingStr);
      if (Array.isArray(embedding) && embedding.length > 0) {
        const nearestMobId = await findNearestMobByEmbedding(embedding);
        if (nearestMobId) {
          console.log(`Assigned video ${videoId} to existing mob ${nearestMobId} by embedding similarity`);
          mobId = nearestMobId;
        } else {
          // No similar mob found, use keyword-based clustering
          console.log(`No similar mob found for ${videoId}, using keyword-based clustering`);
          mobId = determineMobIdByKeywords(hashtags, actions, objectsScenes);
        }
      } else {
        // Invalid embedding, fallback to keywords
        mobId = determineMobIdByKeywords(hashtags, actions, objectsScenes);
      }
    } catch (e) {
      console.warn(`Failed to parse embedding for ${videoId}, using keyword-based clustering:`, e);
      mobId = determineMobIdByKeywords(hashtags, actions, objectsScenes);
    }
  } else {
    // No embedding available, use keyword-based clustering
    console.log(`No embedding available for ${videoId}, using keyword-based clustering`);
    mobId = determineMobIdByKeywords(hashtags, actions, objectsScenes);
  }

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

  return mobId;
}

/**
 * Unified handler that works for both Step Functions and API Gateway
 */
export const handler = async (
  event: StepFunctionsInput | APIGatewayProxyHandlerV2['event'],
  context?: Context
): Promise<StepFunctionsOutput | APIGatewayProxyHandlerV2['response']> => {
  // Detect if this is a Step Functions invocation (has videoId directly) or API Gateway
  if ('videoId' in event && typeof event.videoId === 'string') {
    // Step Functions invocation
    const stepInput = event as StepFunctionsInput;
    const mobId = await clusterVideo(stepInput.videoId);
    return {
      ...stepInput,
      mobId,
    };
  } else {
    // API Gateway invocation
    const apiEvent = event as Parameters<APIGatewayProxyHandlerV2>[0];
    try {
      // Extract videoId from event body or path parameters
      let videoId: string;
      
      if (apiEvent.body) {
        const body = JSON.parse(apiEvent.body) as ClusterRequest;
        videoId = body.videoId;
      } else if (apiEvent.pathParameters?.videoId) {
        videoId = apiEvent.pathParameters.videoId;
      } else {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'videoId is required' }),
        };
      }

      const mobId = await clusterVideo(videoId);

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
  }
};

