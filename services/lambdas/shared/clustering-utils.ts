import { OpenSearchClient, VideoWithEmbedding, SimilarVideoResult } from './opensearch-client';

export interface Cluster {
  centroid: number[];
  videos: VideoWithEmbedding[];
  mobId: string;
}

/**
 * Calculate centroid from embeddings
 */
export function calculateCentroid(embeddings: number[][]): number[] {
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

/**
 * Generate mob ID from cluster content (activities, locations, etc.)
 * This aligns with the brief: "similar activities, locations, etc."
 * Uses actions and objectsScenes from Pegasus analysis, with hashtags as fallback
 */
export function generateMobIdFromContent(
  cluster: VideoWithEmbedding[],
  clusterIndex: number
): string {
  if (cluster.length === 0) return `misc_milk_${clusterIndex}`;
  
  // Collect all actions and objects/scenes from cluster
  const allActions = cluster.flatMap((v) => v.actions || []);
  const allObjectsScenes = cluster.flatMap((v) => v.objectsScenes || []);
  
  // Count frequency of each action
  const actionCounts: Record<string, number> = {};
  for (const action of allActions) {
    const normalized = action.toLowerCase().trim();
    if (normalized) {
      actionCounts[normalized] = (actionCounts[normalized] || 0) + 1;
    }
  }
  
  // Count frequency of each object/scene
  const sceneCounts: Record<string, number> = {};
  for (const scene of allObjectsScenes) {
    const normalized = scene.toLowerCase().trim();
    if (normalized) {
      sceneCounts[normalized] = (sceneCounts[normalized] || 0) + 1;
    }
  }
  
  // Get top action and top scene
  const topAction = Object.entries(actionCounts)
    .sort(([, a], [, b]) => b - a)[0]?.[0];
  const topScene = Object.entries(sceneCounts)
    .sort(([, a], [, b]) => b - a)[0]?.[0];
  
  // Build mob ID: {action}_{scene}_{index}
  // e.g., "skate_drink_skatepark_0", "study_cafe_1"
  const parts: string[] = [];
  
  if (topAction) {
    const actionPart = topAction.replace(/[^a-z0-9]/g, '_').substring(0, 12);
    parts.push(actionPart);
  }
  
  if (topScene) {
    const scenePart = topScene.replace(/[^a-z0-9]/g, '_').substring(0, 12);
    parts.push(scenePart);
  }
  
  // If we have semantic content, use it
  if (parts.length > 0) {
    return `${parts.join('_')}_${clusterIndex}`;
  }
  
  // Fallback to hashtags if actions/scenes are missing
  const allHashtags = cluster.flatMap((v) => v.hashtags || []);
  const hashtagCounts: Record<string, number> = {};
  
  for (const tag of allHashtags) {
    const normalized = tag.toLowerCase().replace(/^#/, '').trim();
    if (normalized) {
      hashtagCounts[normalized] = (hashtagCounts[normalized] || 0) + 1;
    }
  }
  
  const topHashtag = Object.entries(hashtagCounts)
    .sort(([, a], [, b]) => b - a)[0]?.[0] || 'misc';
  
  const hashtagPart = topHashtag.replace(/[^a-z0-9]/g, '_').substring(0, 15);
  return `${hashtagPart}_${clusterIndex}`;
}

/**
 * Generate mob ID from cluster hashtags (legacy function, kept for backward compatibility)
 * @deprecated Use generateMobIdFromContent instead
 */
export function generateMobIdFromHashtags(cluster: VideoWithEmbedding[]): string {
  return generateMobIdFromContent(cluster, 0);
}

/**
 * Find connected components in similarity graph (DFS)
 */
function findConnectedComponents(
  similarityGraph: Map<string, Array<{ videoId: string; score: number }>>,
  videos: VideoWithEmbedding[]
): VideoWithEmbedding[][] {
  const visited = new Set<string>();
  const components: VideoWithEmbedding[][] = [];
  const videoMap = new Map<string, VideoWithEmbedding>();
  
  for (const video of videos) {
    videoMap.set(video.videoId, video);
  }
  
  function dfs(videoId: string, component: VideoWithEmbedding[]): void {
    if (visited.has(videoId)) return;
    
    visited.add(videoId);
    const video = videoMap.get(videoId);
    if (video) {
      component.push(video);
    }
    
    const neighbors = similarityGraph.get(videoId) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor.videoId)) {
        dfs(neighbor.videoId, component);
      }
    }
  }
  
  for (const video of videos) {
    if (!visited.has(video.videoId)) {
      const component: VideoWithEmbedding[] = [];
      dfs(video.videoId, component);
      if (component.length > 0) {
        components.push(component);
      }
    }
  }
  
  return components;
}

/**
 * Build clusters from similarity graph (for small datasets)
 */
export async function buildClustersFromSimilarityGraph(
  videos: VideoWithEmbedding[],
  opensearchClient: OpenSearchClient,
  similarityThreshold: number = 0.7
): Promise<Cluster[]> {
  if (videos.length === 0) return [];
  
  console.log(`Building similarity graph for ${videos.length} videos with threshold ${similarityThreshold}`);
  
  // Build similarity graph using OpenSearch
  const similarityGraph = await opensearchClient.buildSimilarityGraph(videos, similarityThreshold);
  
  // Find connected components (clusters)
  const components = findConnectedComponents(similarityGraph, videos);
  
  console.log(`Found ${components.length} clusters from similarity graph`);
  
  // Convert components to clusters
  const clusters: Cluster[] = [];
  
  for (let i = 0; i < components.length; i++) {
    const component = components[i];
    if (component.length === 0) continue;
    
    const centroid = calculateCentroid(component.map((v) => v.embedding));
    const mobId = generateMobIdFromContent(component, i);
    
    clusters.push({
      centroid,
      videos: component,
      mobId,
    });
  }
  
  return clusters;
}

/**
 * Similarity-based clustering using OpenSearch k-NN (for larger datasets)
 */
export async function openSearchBasedClustering(
  videos: VideoWithEmbedding[],
  opensearchClient: OpenSearchClient,
  similarityThreshold: number = 0.7
): Promise<Cluster[]> {
  if (videos.length === 0) return [];
  
  console.log(`Running similarity-based clustering for ${videos.length} videos with threshold ${similarityThreshold}`);
  
  const clusters: Cluster[] = [];
  const assigned = new Set<string>();
  let clusterIndex = 0;
  
  // Iterate through unassigned videos
  for (const video of videos) {
    if (assigned.has(video.videoId)) continue;
    
    try {
      // Query OpenSearch k-NN to find similar videos
      const similarVideos = await opensearchClient.queryKNN(
        video.embedding,
        Math.min(50, videos.length), // Get up to 50 similar videos
        {
          minScore: similarityThreshold,
          excludeVideoId: video.videoId,
        }
      );
      
      // Build cluster from similar videos
      const cluster: VideoWithEmbedding[] = [video];
      assigned.add(video.videoId);
      
      // Find matching videos from our dataset
      const similarVideoMap = new Map(similarVideos.map(v => [v.videoId, v]));
      
      for (const similarResult of similarVideos) {
        if (!assigned.has(similarResult.videoId) && similarResult.score >= similarityThreshold) {
          // Find the video in our dataset
          const matchingVideo = videos.find(v => v.videoId === similarResult.videoId);
          if (matchingVideo) {
            cluster.push(matchingVideo);
            assigned.add(matchingVideo.videoId);
          }
        }
      }
      
      // Only create cluster if it has at least 2 videos (or allow singletons)
      if (cluster.length > 0) {
        const centroid = calculateCentroid(cluster.map((v) => v.embedding));
        const mobId = generateMobIdFromContent(cluster, clusterIndex);
        clusterIndex++;
        
        clusters.push({
          centroid,
          videos: cluster,
          mobId,
        });
      }
    } catch (err) {
      console.warn(`Failed to cluster video ${video.videoId}, creating singleton cluster:`, err);
      // Create singleton cluster as fallback
      const centroid = calculateCentroid([video.embedding]);
      const mobId = generateMobIdFromContent([video], clusterIndex);
      clusterIndex++;
      
      clusters.push({
        centroid,
        videos: [video],
        mobId,
      });
      assigned.add(video.videoId);
    }
  }
  
  console.log(`Generated ${clusters.length} clusters from similarity-based clustering`);
  
  return clusters;
}

