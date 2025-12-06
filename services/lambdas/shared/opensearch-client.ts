import { defaultProvider } from '@aws-sdk/credential-providers';
import { SignatureV4 } from '@aws-sdk/signature-v4';
import { HttpRequest } from '@aws-sdk/protocol-http';
import { Sha256 } from '@aws-crypto/sha256-js';

export interface VideoWithEmbedding {
  videoId: string;
  userId: string;
  embedding: number[];
  hashtags: string[];
  mobId?: string | null;
  userHandle?: string;
  actions?: string[];
  objectsScenes?: string[];
}

export interface SimilarVideoResult {
  videoId: string;
  userId: string;
  embedding: number[];
  hashtags: string[];
  mobId: string | null;
  userHandle: string;
  score: number; // Similarity score from OpenSearch
  actions?: string[];
  objectsScenes?: string[];
}

/**
 * OpenSearch client for k-NN vector search
 */
export class OpenSearchClient {
  private endpoint: string;
  private indexName: string;
  private region: string;

  constructor(endpoint?: string, indexName: string = 'videos', region?: string) {
    this.endpoint = endpoint || process.env.OPENSEARCH_ENDPOINT || '';
    this.indexName = indexName || process.env.OPENSEARCH_INDEX_NAME || 'videos';
    this.region = region || process.env.AWS_REGION || 'us-east-1';
  }

  /**
   * Check if OpenSearch is configured
   */
  isAvailable(): boolean {
    return !!this.endpoint;
  }

  /**
   * Query OpenSearch with k-NN to find similar videos
   */
  async queryKNN(
    embedding: number[],
    k: number,
    options: {
      minScore?: number;
      filterMobId?: string;
      excludeVideoId?: string;
    } = {}
  ): Promise<SimilarVideoResult[]> {
    if (!this.isAvailable()) {
      throw new Error('OpenSearch endpoint not configured');
    }

    const { minScore, filterMobId, excludeVideoId } = options;

    // Build query with optional filters
    const query: any = {
      size: k + (excludeVideoId ? 1 : 0), // +1 to account for potentially excluding a video
      query: {
        bool: {
          must: [
            {
              knn: {
                embedding: {
                  vector: embedding,
                  k: k + (excludeVideoId ? 1 : 0),
                },
              },
            },
          ],
        },
      },
    };

    // Add mobId filter if specified
    if (filterMobId) {
      query.query.bool.filter = [
        {
          term: {
            mobId: filterMobId,
          },
        },
      ];
    }

    const url = new URL(`https://${this.endpoint}/${this.indexName}/_search`);
    const body = JSON.stringify(query);

    const request = new HttpRequest({
      hostname: url.hostname,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Host': url.host,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body).toString(),
      },
      body,
    });

    const signer = new SignatureV4({
      credentials: defaultProvider(),
      service: 'es',
      region: this.region,
      sha256: Sha256,
    });

    const signedRequest = await signer.sign(request);
    const response = await fetch(url.toString(), {
      method: signedRequest.method,
      headers: signedRequest.headers as HeadersInit,
      body: signedRequest.body as string,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenSearch query failed: ${response.status} ${errorText}`);
    }

    const searchResult = await response.json();
    const hits = searchResult.hits?.hits || [];

    const results: SimilarVideoResult[] = [];

    for (const hit of hits) {
      const doc = hit._source;
      const candidateVideoId = doc.videoId;

      // Skip excluded video
      if (excludeVideoId && candidateVideoId === excludeVideoId) continue;

      // Filter by minimum score if specified
      const score = hit._score || 0;
      if (minScore !== undefined && score < minScore) continue;

      // Parse embedding if available
      let embedding: number[] = [];
      if (doc.embedding && Array.isArray(doc.embedding)) {
        embedding = doc.embedding;
      }

      results.push({
        videoId: candidateVideoId,
        userId: doc.userId || '',
        embedding,
        hashtags: doc.hashtags || [],
        mobId: doc.mobId || null,
        userHandle: doc.userHandle || doc.userId || 'unknown',
        score,
        actions: doc.actions || [],
        objectsScenes: doc.objectsScenes || [],
      });
    }

    return results;
  }

  /**
   * Get all videos with embeddings from OpenSearch
   * Useful for small datasets where we need all videos
   */
  async getAllVideosWithEmbeddings(filterMobId?: string): Promise<VideoWithEmbedding[]> {
    if (!this.isAvailable()) {
      throw new Error('OpenSearch endpoint not configured');
    }

    const query: any = {
      size: 10000, // OpenSearch default max is 10000
      query: {
        bool: {
          must: [
            {
              exists: {
                field: 'embedding',
              },
            },
          ],
        },
      },
    };

    // Add mobId filter if specified
    if (filterMobId) {
      query.query.bool.filter.push({
        term: {
          mobId: filterMobId,
        },
      });
    }

    const url = new URL(`https://${this.endpoint}/${this.indexName}/_search`);
    const body = JSON.stringify(query);

    const request = new HttpRequest({
      hostname: url.hostname,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Host': url.host,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body).toString(),
      },
      body,
    });

    const signer = new SignatureV4({
      credentials: defaultProvider(),
      service: 'es',
      region: this.region,
      sha256: Sha256,
    });

    const signedRequest = await signer.sign(request);
    const response = await fetch(url.toString(), {
      method: signedRequest.method,
      headers: signedRequest.headers as HeadersInit,
      body: signedRequest.body as string,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenSearch query failed: ${response.status} ${errorText}`);
    }

    const searchResult = await response.json();
    const hits = searchResult.hits?.hits || [];

    const videos: VideoWithEmbedding[] = [];

    for (const hit of hits) {
      const doc = hit._source;
      const embedding = doc.embedding;

      if (!embedding || !Array.isArray(embedding) || embedding.length === 0) {
        continue;
      }

      videos.push({
        videoId: doc.videoId,
        userId: doc.userId || '',
        embedding,
        hashtags: doc.hashtags || [],
        mobId: doc.mobId || null,
        userHandle: doc.userHandle || doc.userId || 'unknown',
        actions: doc.actions || [],
        objectsScenes: doc.objectsScenes || [],
      });
    }

    return videos;
  }

  /**
   * Build similarity graph for small datasets
   * Queries OpenSearch k-NN for each video to build pairwise similarity relationships
   */
  async buildSimilarityGraph(
    videos: VideoWithEmbedding[],
    similarityThreshold: number = 0.7
  ): Promise<Map<string, Array<{ videoId: string; score: number }>>> {
    const similarityGraph = new Map<string, Array<{ videoId: string; score: number }>>();

    // Initialize graph with empty arrays
    for (const video of videos) {
      similarityGraph.set(video.videoId, []);
    }

    // For each video, query OpenSearch to find similar videos
    for (const video of videos) {
      try {
        const similar = await this.queryKNN(video.embedding, videos.length, {
          minScore: similarityThreshold,
          excludeVideoId: video.videoId,
        });

        const neighbors: Array<{ videoId: string; score: number }> = [];
        for (const similarVideo of similar) {
          // Only include videos that are in our dataset
          if (similarityGraph.has(similarVideo.videoId)) {
            neighbors.push({
              videoId: similarVideo.videoId,
              score: similarVideo.score,
            });
          }
        }

        similarityGraph.set(video.videoId, neighbors);
      } catch (err) {
        console.warn(`Failed to query similarity for video ${video.videoId}:`, err);
        // Continue with empty neighbors
      }
    }

    return similarityGraph;
  }
}

