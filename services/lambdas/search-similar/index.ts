import type { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { DynamoDBClient, GetItemCommand, ScanCommand } from '@aws-sdk/client-dynamodb';
import { defaultProvider } from '@aws-sdk/credential-providers';
import { SignatureV4 } from '@aws-sdk/signature-v4';
import { HttpRequest } from '@aws-sdk/protocol-http';
import { Sha256 } from '@aws-crypto/sha256-js';

const tableName = process.env.VIDEOS_TABLE_NAME!;
const opensearchEndpoint = process.env.OPENSEARCH_ENDPOINT;
const opensearchIndexName = process.env.OPENSEARCH_INDEX_NAME || 'videos';

const ddb = new DynamoDBClient({});
const region = process.env.AWS_REGION || 'us-east-1';

// CORS headers for all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Credentials': 'true',
};

interface SimilarVideo {
  videoId: string;
  userHandle: string;
  mobId: string | null;
  score: number; // cosine similarity score
}

/**
 * Cosine similarity between two vectors (fallback for DynamoDB scan)
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
 * Fallback to DynamoDB scan if OpenSearch is not available
 */
async function fallbackDynamoDBSearch(
  videoId: string,
  sourceEmbedding: number[],
  limit: number
): Promise<SimilarVideo[]> {
  const scanResult = await ddb.send(
    new ScanCommand({
      TableName: tableName,
      ProjectionExpression: 'videoId, userHandle, mobId, embedding',
    })
  );

  const similarVideos: SimilarVideo[] = [];

  for (const item of scanResult.Items || []) {
    const candidateVideoId = item.videoId?.S || '';
    
    // Skip the source video itself
    if (candidateVideoId === videoId) continue;

    const candidateEmbeddingStr = item.embedding?.S;
    if (!candidateEmbeddingStr) continue; // Skip videos without embeddings

    let candidateEmbedding: number[];
    try {
      candidateEmbedding = JSON.parse(candidateEmbeddingStr);
    } catch (e) {
      continue; // Skip invalid embeddings
    }

    // Calculate cosine similarity
    const score = cosineSimilarity(sourceEmbedding, candidateEmbedding);

    similarVideos.push({
      videoId: candidateVideoId,
      userHandle: item.userHandle?.S || item.userId?.S || 'unknown',
      mobId: item.mobId?.S || null,
      score,
    });
  }

  return similarVideos;
}

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    const videoId = event.queryStringParameters?.videoId;
    const limit = parseInt(event.queryStringParameters?.limit || '10', 10);

    if (!videoId) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'videoId query parameter is required' }),
      };
    }

    // Fetch the source video to get its embedding
    const sourceResult = await ddb.send(
      new GetItemCommand({
        TableName: tableName,
        Key: {
          videoId: { S: videoId },
        },
      })
    );

    if (!sourceResult.Item) {
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Video not found' }),
      };
    }

    const sourceEmbeddingStr = sourceResult.Item.embedding?.S;
    if (!sourceEmbeddingStr) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Source video does not have an embedding yet' }),
      };
    }

    let sourceEmbedding: number[];
    try {
      sourceEmbedding = JSON.parse(sourceEmbeddingStr);
    } catch (e) {
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Invalid embedding format' }),
      };
    }

    // Use OpenSearch k-NN search if available, otherwise fallback to DynamoDB scan
    let similarVideos: SimilarVideo[] = [];

    if (opensearchEndpoint) {
      try {
        // Query OpenSearch with k-NN
        const query = {
          size: limit + 1, // +1 to account for potentially excluding the source video
          query: {
            knn: {
              embedding: {
                vector: sourceEmbedding,
                k: limit + 1,
              },
            },
          },
        };

        const url = new URL(`https://${opensearchEndpoint}/${opensearchIndexName}/_search`);
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
          region,
          sha256: Sha256,
        });

        const signedRequest = await signer.sign(request);
        const response = await fetch(url.toString(), {
          method: signedRequest.method,
          headers: signedRequest.headers as HeadersInit,
          body: signedRequest.body as string,
        });

        if (!response.ok) {
          throw new Error(`OpenSearch query failed: ${response.status}`);
        }

        const searchResult = await response.json();
        const hits = searchResult.hits?.hits || [];

        for (const hit of hits) {
          const doc = hit._source;
          const candidateVideoId = doc.videoId;

          // Skip the source video itself
          if (candidateVideoId === videoId) continue;

          similarVideos.push({
            videoId: candidateVideoId,
            userHandle: doc.userHandle || 'unknown',
            mobId: doc.mobId || null,
            score: hit._score || 0, // OpenSearch returns similarity score
          });
        }
      } catch (err) {
        console.warn('OpenSearch query failed, falling back to DynamoDB scan:', err);
        // Fallback to DynamoDB scan (code below)
        similarVideos = await fallbackDynamoDBSearch(videoId, sourceEmbedding, limit);
      }
    } else {
      // Fallback to DynamoDB scan if OpenSearch not configured
      similarVideos = await fallbackDynamoDBSearch(videoId, sourceEmbedding, limit);
    }

    // Sort by similarity score (highest first) and take top N
    similarVideos.sort((a, b) => b.score - a.score);
    const topSimilar = similarVideos.slice(0, limit);

    return {
      statusCode: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ videos: topSimilar }),
    };
  } catch (err) {
    console.error('Error in search-similar', err);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};

