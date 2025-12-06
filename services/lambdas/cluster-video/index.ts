import type { APIGatewayProxyHandlerV2, Context } from 'aws-lambda';
import { DynamoDBClient, GetItemCommand, UpdateItemCommand, PutItemCommand, ScanCommand } from '@aws-sdk/client-dynamodb';
import { OpenSearchClient, VideoWithEmbedding } from '../shared/opensearch-client';
import { calculateCentroid, generateMobIdFromContent } from '../shared/clustering-utils';
import { generateMobNameFromId, generateMobDescriptionFromId } from '../shared/mob-naming';

const videosTableName = process.env.VIDEOS_TABLE_NAME!;
const mobsTableName = process.env.MOBS_TABLE_NAME!;

const ddb = new DynamoDBClient({});

/**
 * Simple k-means clustering implementation
 */
interface Cluster {
  centroid: number[];
  videos: VideoWithEmbedding[];
  mobId: string;
}

function calculateCentroid(embeddings: number[][]): number[] {
  if (embeddings.length === 0) return [];
  
  const dim = embeddings[0].length;
  const centroid = new Array(dim).fill(0);
  
  for (const embedding of embeddings) {
    for (let i = 0; i < dim; i++) {
      centroid[i] += embedding[i];
    }
  }
  
  for (let i = 0; i < dim; i++) {
    centroid[i] /= embeddings.length;
  }
  
  return centroid;
}

function euclideanDistance(a: number[], b: number[]): number {
  if (a.length !== b.length) return Infinity;
  
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const diff = a[i] - b[i];
    sum += diff * diff;
  }
  
  return Math.sqrt(sum);
}

function kMeans(videos: VideoWithEmbedding[], k: number, maxIterations: number = 10): Cluster[] {
  if (videos.length === 0) return [];
  if (videos.length < k) k = videos.length;
  
  const dim = videos[0].embedding.length;
  
  // Initialize centroids randomly
  const centroids: number[][] = [];
  for (let i = 0; i < k; i++) {
    const randomVideo = videos[Math.floor(Math.random() * videos.length)];
    centroids.push([...randomVideo.embedding]);
  }
  
  let clusters: Cluster[] = [];
  
  for (let iter = 0; iter < maxIterations; iter++) {
    // Assign videos to nearest centroid
    clusters = centroids.map((_, idx) => ({
      centroid: centroids[idx],
      videos: [],
      mobId: `mob_${idx + 1}`,
    }));
    
    for (const video of videos) {
      let minDist = Infinity;
      let nearestClusterIdx = 0;
      
      for (let i = 0; i < centroids.length; i++) {
        const dist = euclideanDistance(video.embedding, centroids[i]);
        if (dist < minDist) {
          minDist = dist;
          nearestClusterIdx = i;
        }
      }
      
      clusters[nearestClusterIdx].videos.push(video);
    }
    
    // Update centroids
    let converged = true;
    for (let i = 0; i < k; i++) {
      if (clusters[i].videos.length === 0) continue;
      
      const newCentroid = calculateCentroid(clusters[i].videos.map((v) => v.embedding));
      const oldCentroid = centroids[i];
      
      // Check convergence
      if (euclideanDistance(newCentroid, oldCentroid) > 0.001) {
        converged = false;
      }
      
      centroids[i] = newCentroid;
      clusters[i].centroid = newCentroid;
    }
    
    if (converged) break;
  }
  
  // Generate meaningful mob IDs based on content (actions, objectsScenes, hashtags)
  for (let i = 0; i < clusters.length; i++) {
    const cluster = clusters[i];
    if (cluster.videos.length === 0) continue;
    
    // Use generateMobIdFromContent which uses actions/objectsScenes with hashtag fallback
    cluster.mobId = generateMobIdFromContent(cluster.videos, i);
  }
  
  return clusters.filter((c) => c.videos.length > 0);
}

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
 * Find nearest cluster centroid for a video embedding
 */
function findNearestCluster(videoEmbedding: number[], clusters: Cluster[]): { mobId: string; distance: number } | null {
  if (clusters.length === 0) return null;
  
  let bestCluster: Cluster | null = null;
  let bestDistance = Infinity;
  
  for (const cluster of clusters) {
    const distance = euclideanDistance(videoEmbedding, cluster.centroid);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestCluster = cluster;
    }
  }
  
  return bestCluster ? { mobId: bestCluster.mobId, distance: bestDistance } : null;
}

/**
 * Update mob centroid in DynamoDB
 */
async function updateMobCentroid(mobId: string, centroid: number[]): Promise<void> {
  await ddb.send(
    new UpdateItemCommand({
      TableName: mobsTableName,
      Key: {
        mobId: { S: mobId },
      },
      UpdateExpression: 'SET centroid = :centroid',
      ExpressionAttributeValues: {
        ':centroid': { S: JSON.stringify(centroid) },
      },
    })
  );
}

/**
 * Fetch videos with embeddings for clustering
 * Uses OpenSearch if available, falls back to DynamoDB scan
 */
async function fetchVideosWithEmbeddings(mobId?: string | null): Promise<VideoWithEmbedding[]> {
  const opensearchClient = new OpenSearchClient();
  
  // Try OpenSearch first
  if (opensearchClient.isAvailable()) {
    try {
      return await opensearchClient.getAllVideosWithEmbeddings(mobId || undefined);
    } catch (err) {
      console.warn('OpenSearch fetch failed, falling back to DynamoDB:', err);
      // Fall through to DynamoDB
    }
  }
  
  // Fallback to DynamoDB scan
  const videos: VideoWithEmbedding[] = [];
  
  try {
    let scanResult;
    
    if (mobId) {
      // Fetch videos from specific mob
      scanResult = await ddb.send(
        new ScanCommand({
          TableName: videosTableName,
          FilterExpression: 'mobId = :mobId AND attribute_exists(embedding) AND #status = :status',
          ExpressionAttributeNames: {
            '#status': 'status',
          },
          ExpressionAttributeValues: {
            ':mobId': { S: mobId },
            ':status': { S: 'validated' },
          },
          ProjectionExpression: 'videoId, userId, embedding, hashtags, actions, objectsScenes',
        })
      );
    } else {
      // Fetch all validated videos with embeddings
      scanResult = await ddb.send(
        new ScanCommand({
          TableName: videosTableName,
          FilterExpression: 'attribute_exists(embedding) AND #status = :status',
          ExpressionAttributeNames: {
            '#status': 'status',
          },
          ExpressionAttributeValues: {
            ':status': { S: 'validated' },
          },
          ProjectionExpression: 'videoId, userId, embedding, hashtags, actions, objectsScenes',
        })
      );
    }
    
    for (const item of scanResult.Items || []) {
      const embeddingStr = item.embedding?.S;
      if (!embeddingStr) continue;
      
      try {
        const embedding = JSON.parse(embeddingStr);
        if (!Array.isArray(embedding) || embedding.length === 0) continue;
        
        videos.push({
          videoId: item.videoId?.S || '',
          userId: item.userId?.S || '',
          embedding,
          hashtags: item.hashtags?.SS || [],
          actions: item.actions?.SS || [],
          objectsScenes: item.objectsScenes?.SS || [],
        });
      } catch (e) {
        console.warn(`Failed to parse embedding for video ${item.videoId?.S}:`, e);
        continue;
      }
    }
  } catch (err) {
    console.error('Error fetching videos with embeddings:', err);
  }
  
  return videos;
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
  // Check for legacy mob IDs first
  const legacyMobNames: Record<string, { name: string; description: string }> = {
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

  // Use legacy names if available, otherwise generate from mob ID
  const mobInfo = legacyMobNames[mobId] || {
    name: generateMobNameFromId(mobId),
    description: generateMobDescriptionFromId(mobId),
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
 * Run on-demand similarity-based clustering using OpenSearch
 */
async function runOpenSearchClustering(
  currentVideoEmbedding: number[],
  currentVideoId: string,
  currentVideoHashtags: string[],
  currentVideoActions: string[],
  currentVideoObjectsScenes: string[],
  existingMobId?: string | null
): Promise<string> {
  console.log(`Running on-demand OpenSearch clustering for video ${currentVideoId}`);
  
  const opensearchClient = new OpenSearchClient();
  
  // Try OpenSearch first
  if (opensearchClient.isAvailable()) {
    try {
      // Query OpenSearch k-NN to find similar videos
      const similarityThreshold = 0.7;
      const similarVideos = await opensearchClient.queryKNN(
        currentVideoEmbedding,
        Math.min(50, 100), // Get up to 50 similar videos
        {
          minScore: similarityThreshold,
          excludeVideoId: currentVideoId,
          filterMobId: existingMobId || undefined,
        }
      );
      
      console.log(`Found ${similarVideos.length} similar videos from OpenSearch`);
      
      if (similarVideos.length === 0) {
        // No similar videos found, create new mob or use keyword-based
        console.log('No similar videos found, using keyword-based clustering');
        return determineMobIdByKeywords(currentVideoHashtags, [], []);
      }
      
      // Find the most similar video's mob, or create cluster from similar videos
      const topSimilar = similarVideos[0];
      
      // If top similar video has a mob and similarity is high, join that mob
      if (topSimilar.mobId && topSimilar.score >= 0.8) {
        console.log(`High similarity (${topSimilar.score}) to mob ${topSimilar.mobId}, joining that mob`);
        return topSimilar.mobId;
      }
      
      // Otherwise, build a cluster from similar videos
      const clusterVideos: VideoWithEmbedding[] = [
        {
          videoId: currentVideoId,
          userId: '', // Will be updated later
          embedding: currentVideoEmbedding,
          hashtags: currentVideoHashtags,
          actions: currentVideoActions,
          objectsScenes: currentVideoObjectsScenes,
        },
      ];
      
      // Add similar videos to cluster
      for (const similar of similarVideos.slice(0, 10)) {
        if (similar.score >= similarityThreshold) {
          clusterVideos.push({
            videoId: similar.videoId,
            userId: similar.userId,
            embedding: similar.embedding,
            hashtags: similar.hashtags,
            mobId: similar.mobId,
            actions: similar.actions,
            objectsScenes: similar.objectsScenes,
          });
        }
      }
      
      // Generate mob ID from cluster content (actions, objectsScenes, hashtags)
      // Use 0 as cluster index for on-demand clusters (they're created individually)
      const mobId = generateMobIdFromContent(clusterVideos, 0);
      const centroid = calculateCentroid(clusterVideos.map(v => v.embedding));
      
      // Update mob centroid
      await updateMobCentroid(mobId, centroid);
      console.log(`Created/updated mob ${mobId} with centroid`);
      
      return mobId;
    } catch (err) {
      console.warn('OpenSearch clustering failed, falling back to K-means:', err);
      // Fall through to K-means fallback
    }
  }
  
  // Fallback to K-means if OpenSearch unavailable
  console.log('Using K-means fallback for clustering');
  return await runKMeansFallback(currentVideoEmbedding, currentVideoId, existingMobId);
}

/**
 * Fallback K-means clustering (used if OpenSearch unavailable)
 */
async function runKMeansFallback(
  currentVideoEmbedding: number[],
  currentVideoId: string,
  existingMobId?: string | null
): Promise<string> {
  console.log(`Running K-means fallback clustering for video ${currentVideoId}`);
  
  // Step 1: Fetch existing videos with embeddings
  let candidateVideos = await fetchVideosWithEmbeddings(existingMobId);
  
  // If mob has < 3 videos or no mob, fetch all validated videos
  if (!existingMobId || candidateVideos.length < 3) {
    console.log(`Mob ${existingMobId || 'none'} has ${candidateVideos.length} videos, fetching all validated videos`);
    candidateVideos = await fetchVideosWithEmbeddings(null);
  }
  
  // Add current video to candidate set if not already included
  const currentVideoInSet = candidateVideos.some(v => v.videoId === currentVideoId);
  if (!currentVideoInSet) {
    // We need to get the current video's hashtags, userId, actions, and objectsScenes
    const currentVideoResult = await ddb.send(
      new GetItemCommand({
        TableName: videosTableName,
        Key: { videoId: { S: currentVideoId } },
        ProjectionExpression: 'userId, hashtags, actions, objectsScenes',
      })
    );
    
    if (currentVideoResult.Item) {
      candidateVideos.push({
        videoId: currentVideoId,
        userId: currentVideoResult.Item.userId?.S || '',
        embedding: currentVideoEmbedding,
        hashtags: currentVideoResult.Item.hashtags?.SS || [],
        actions: currentVideoResult.Item.actions?.SS || [],
        objectsScenes: currentVideoResult.Item.objectsScenes?.SS || [],
      });
    }
  }
  
  if (candidateVideos.length < 2) {
    console.log('Not enough videos for K-means, using keyword-based clustering');
    return 'misc_milk_mob'; // Fallback
  }
  
  // Step 2: Run K-means clustering with adaptive k
  const k = candidateVideos.length < 10
    ? Math.max(1, Math.floor(candidateVideos.length / 2))
    : Math.min(10, Math.max(3, Math.floor(Math.sqrt(candidateVideos.length / 2))));
  console.log(`Running K-means fallback with k=${k} on ${candidateVideos.length} videos`);
  
  const clusters = kMeans(candidateVideos, k, 10);
  
  // Step 3: Find nearest cluster for current video
  const nearest = findNearestCluster(currentVideoEmbedding, clusters);
  
  if (!nearest) {
    console.log('No nearest cluster found, using keyword-based clustering');
    return 'misc_milk_mob'; // Fallback
  }
  
  const assignedMobId = nearest.mobId;
  const assignedCluster = clusters.find(c => c.mobId === assignedMobId);
  
  if (!assignedCluster) {
    console.log('Assigned cluster not found, using keyword-based clustering');
    return 'misc_milk_mob'; // Fallback
  }
  
  // Step 4: Update mob centroid in DynamoDB
  await updateMobCentroid(assignedMobId, assignedCluster.centroid);
  console.log(`Updated centroid for mob ${assignedMobId}`);
  
  return assignedMobId;
}

/**
 * Main clustering logic: uses on-demand K-means, falls back to keywords
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

  // Only cluster validated videos - rejections should not be in mobs
  const status = videoResult.Item.status?.S;
  if (status !== 'validated') {
    console.log(`Video ${videoId} has status '${status}', skipping clustering. Rejected/processing videos should not be in mobs.`);
    // Remove mobId if video is rejected
    if (status === 'rejected' && videoResult.Item.mobId?.S) {
      await ddb.send(
        new UpdateItemCommand({
          TableName: videosTableName,
          Key: { videoId: { S: videoId } },
          UpdateExpression: 'REMOVE mobId',
        })
      );
      console.log(`Removed mobId from rejected video ${videoId}`);
    }
    throw new Error(`Video ${videoId} is not validated (status: ${status}). Only validated videos can be clustered.`);
  }

  const hashtags = videoResult.Item.hashtags?.SS || [];
  const actions = videoResult.Item.actions?.SS || [];
  const objectsScenes = videoResult.Item.objectsScenes?.SS || [];
  const embeddingStr = videoResult.Item.embedding?.S;
  const existingMobId = videoResult.Item.mobId?.S;

  let mobId: string;

  // Try OpenSearch similarity clustering if embedding available
  if (embeddingStr) {
    try {
      const embedding = JSON.parse(embeddingStr);
      if (Array.isArray(embedding) && embedding.length > 0) {
        try {
          mobId = await runOpenSearchClustering(embedding, videoId, hashtags, actions, objectsScenes, existingMobId);
          console.log(`Assigned video ${videoId} to mob ${mobId} using OpenSearch similarity clustering`);
        } catch (clusteringError) {
          console.warn(`OpenSearch clustering failed for ${videoId}, using keyword-based clustering:`, clusteringError);
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

