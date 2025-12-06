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
 * Generate mob ID from cluster hashtags
 */
export function generateMobIdFromHashtags(cluster: VideoWithEmbedding[]): string {
  if (cluster.length === 0) return 'misc_milk_mob';
  
  // Analyze hashtags to generate mob name
  const allHashtags = cluster.flatMap((v) => v.hashtags);
  const hashtagCounts: Record<string, number> = {};
  
  for (const tag of allHashtags) {
    const normalized = tag.toLowerCase().replace(/^#/, '');
    hashtagCounts[normalized] = (hashtagCounts[normalized] || 0) + 1;
  }
  
  const topHashtag = Object.entries(hashtagCounts)
    .sort(([, a], [, b]) => b - a)[0]?.[0] || 'misc';
  
  // Generate mob ID from top hashtag
  const mobId = topHashtag.replace(/[^a-z0-9]/g, '_').substring(0, 20) || 'misc_milk_mob';
  return mobId;
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
  
  for (const component of components) {
    if (component.length === 0) continue;
    
    const centroid = calculateCentroid(component.map((v) => v.embedding));
    const mobId = generateMobIdFromHashtags(component);
    
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
        const mobId = generateMobIdFromHashtags(cluster);
        
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
      const mobId = generateMobIdFromHashtags([video]);
      
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

