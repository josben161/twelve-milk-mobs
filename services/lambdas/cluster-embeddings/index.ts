import type { ScheduledEvent } from 'aws-lambda';
import { DynamoDBClient, ScanCommand, UpdateItemCommand, PutItemCommand, GetItemCommand } from '@aws-sdk/client-dynamodb';

const videosTableName = process.env.VIDEOS_TABLE_NAME!;
const mobsTableName = process.env.MOBS_TABLE_NAME!;

const ddb = new DynamoDBClient({});

/**
 * Simple k-means clustering implementation
 * For production, consider using a library like ml-kmeans or AWS SageMaker
 */
interface VideoWithEmbedding {
  videoId: string;
  userId: string;
  embedding: number[];
  hashtags: string[];
}

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
  
  // Generate meaningful mob IDs based on content
  for (const cluster of clusters) {
    if (cluster.videos.length === 0) continue;
    
    // Analyze hashtags to generate mob name
    const allHashtags = cluster.videos.flatMap((v) => v.hashtags);
    const hashtagCounts: Record<string, number> = {};
    for (const tag of allHashtags) {
      const normalized = tag.toLowerCase();
      hashtagCounts[normalized] = (hashtagCounts[normalized] || 0) + 1;
    }
    
    const topHashtag = Object.entries(hashtagCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || 'misc';
    
    // Generate mob ID from top hashtag
    const mobId = topHashtag.replace(/[^a-z0-9]/g, '_').substring(0, 20) || `mob_${cluster.mobId}`;
    cluster.mobId = mobId;
  }
  
  return clusters.filter((c) => c.videos.length > 0);
}

export const handler = async (event: ScheduledEvent): Promise<void> => {
  console.log('Starting batch clustering job');

  try {
    // Scan all validated videos with embeddings (exclude rejected/processing)
    const scanResult = await ddb.send(
      new ScanCommand({
        TableName: videosTableName,
        ProjectionExpression: 'videoId, userId, embedding, hashtags, mobId',
        FilterExpression: 'attribute_exists(embedding) AND #status = :status',
        ExpressionAttributeNames: {
          '#status': 'status',
        },
        ExpressionAttributeValues: {
          ':status': { S: 'validated' },
        },
      })
    );

    const videosWithEmbeddings: VideoWithEmbedding[] = [];

    for (const item of scanResult.Items || []) {
      const embeddingStr = item.embedding?.S;
      if (!embeddingStr) continue;

      let embedding: number[];
      try {
        embedding = JSON.parse(embeddingStr);
      } catch (e) {
        console.warn(`Invalid embedding for video ${item.videoId?.S}:`, e);
        continue;
      }

      videosWithEmbeddings.push({
        videoId: item.videoId?.S || '',
        userId: item.userId?.S || '',
        embedding,
        hashtags: item.hashtags?.SS || [],
      });
    }

    console.log(`Found ${videosWithEmbeddings.length} videos with embeddings`);

    if (videosWithEmbeddings.length === 0) {
      console.log('No videos to cluster');
      return;
    }

    // Run k-means clustering (k = 5, or adjust based on data size)
    const k = Math.min(5, Math.max(2, Math.floor(videosWithEmbeddings.length / 3)));
    const clusters = kMeans(videosWithEmbeddings, k);

    console.log(`Generated ${clusters.length} clusters`);

    // Update videos with mobId and upsert mob summaries
    for (const cluster of clusters) {
      // Upsert mob summary
      const existingMob = await ddb.send(
        new GetItemCommand({
          TableName: mobsTableName,
          Key: {
            mobId: { S: cluster.mobId },
          },
        })
      );

      const videoCount = cluster.videos.length;
      const exampleHashtags = Array.from(
        new Set(cluster.videos.flatMap((v) => v.hashtags))
      ).slice(0, 5);

      if (existingMob.Item) {
        // Update existing mob
        await ddb.send(
          new UpdateItemCommand({
            TableName: mobsTableName,
            Key: {
              mobId: { S: cluster.mobId },
            },
            UpdateExpression: 'SET videoCount = :count, exampleHashtags = :hashtags',
            ExpressionAttributeValues: {
              ':count': { N: videoCount.toString() },
              ':hashtags': { SS: exampleHashtags },
            },
          })
        );
      } else {
        // Create new mob
        const mobName = cluster.mobId.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
        await ddb.send(
          new PutItemCommand({
            TableName: mobsTableName,
            Item: {
              mobId: { S: cluster.mobId },
              name: { S: mobName },
              description: { S: `Cluster of ${videoCount} similar videos` },
              videoCount: { N: videoCount.toString() },
              exampleHashtags: { SS: exampleHashtags },
            },
          })
        );
      }

      // Update all videos in cluster with mobId
      for (const video of cluster.videos) {
        await ddb.send(
          new UpdateItemCommand({
            TableName: videosTableName,
            Key: {
              videoId: { S: video.videoId },
            },
            UpdateExpression: 'SET mobId = :mobId',
            ExpressionAttributeValues: {
              ':mobId': { S: cluster.mobId },
            },
          })
        );
      }

      console.log(`Assigned ${videoCount} videos to mob ${cluster.mobId}`);
    }

    console.log('Batch clustering job completed successfully');
  } catch (err) {
    console.error('Error in cluster-embeddings', err);
    throw err;
  }
};

