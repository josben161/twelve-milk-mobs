import type { Context } from 'aws-lambda';
import { DynamoDBClient, UpdateItemCommand, GetItemCommand } from '@aws-sdk/client-dynamodb';
import { defaultProvider } from '@aws-sdk/credential-providers';
import { SignatureV4 } from '@aws-sdk/signature-v4';
import { HttpRequest } from '@aws-sdk/protocol-http';
import { Sha256 } from '@aws-crypto/sha256-js';
import type { ParticipationResult, EmbeddingResult } from '../../../packages/twelvelabs-client/src/index';
import { createLogger } from '../shared/logger';

const tableName = process.env.VIDEOS_TABLE_NAME!;
const opensearchEndpoint = process.env.OPENSEARCH_ENDPOINT;
const opensearchIndexName = process.env.OPENSEARCH_INDEX_NAME || 'videos';

const ddb = new DynamoDBClient({});
const region = process.env.AWS_REGION || 'us-east-1';

interface AnalysisInput {
  videoId: string;
  s3Bucket: string;
  s3Key: string;
  hashtags: string[];
  participation: ParticipationResult;
  embedding: EmbeddingResult;
}

interface AnalysisOutput {
  videoId: string;
  status: string;
  participationScore: number;
  mobId: string | null;
}

export const handler = async (
  event: AnalysisInput,
  context: Context
): Promise<AnalysisOutput> => {
  const logger = createLogger({
    videoId: event.videoId,
    requestId: context.requestId,
  });

  logger.info('Writing analysis results', {
    participationScore: event.participation.participationScore,
    embeddingDim: event.embedding.dim,
  });

  const { videoId, participation, embedding } = event;
  
  // Update DynamoDB with analysis results (status will be set by validation step)
  await ddb.send(
    new UpdateItemCommand({
      TableName: tableName,
      Key: {
        videoId: { S: videoId },
      },
      UpdateExpression: `
        SET participationScore = :score,
            mentionsMilk = :mentionsMilk,
            showsMilkObject = :showsMilkObject,
            showsActionAligned = :showsActionAligned,
            participationRationale = :rationale,
            embedding = :embedding,
            embeddingDim = :embeddingDim,
            timeline = :timeline,
            detectedText = :detectedText,
            onScreenText = :onScreenText
      `,
      ExpressionAttributeValues: {
        ':score': { N: participation.participationScore.toString() },
        ':mentionsMilk': { BOOL: participation.mentionsMilk },
        ':showsMilkObject': { BOOL: participation.showsMilkObject },
        ':showsActionAligned': { BOOL: participation.showsActionAligned },
        ':rationale': { S: participation.rationale },
        ':embedding': { S: JSON.stringify(embedding.embedding) }, // Store as JSON string
        ':embeddingDim': { N: embedding.dim.toString() },
        ':timeline': { S: JSON.stringify(participation.highlights || []) }, // Store timeline highlights as JSON string
        ':detectedText': participation.detectedText && participation.detectedText.length > 0 
          ? { SS: participation.detectedText } 
          : { NULL: true },
        ':onScreenText': participation.onScreenText && participation.onScreenText.length > 0 
          ? { SS: participation.onScreenText } 
          : { NULL: true },
      },
    })
  );

  logger.info('Analysis results written to DynamoDB');

  // Index embedding in OpenSearch if endpoint is configured
  if (opensearchEndpoint) {
    try {
      // Fetch additional video metadata for OpenSearch document
      const videoResult = await ddb.send(
        new GetItemCommand({
          TableName: tableName,
          Key: { videoId: { S: videoId } },
          ProjectionExpression: 'userHandle, hashtags, createdAt, mobId',
        })
      );

      const userHandle = videoResult.Item?.userHandle?.S || 'unknown';
      const hashtags = videoResult.Item?.hashtags?.SS || [];
      const createdAt = videoResult.Item?.createdAt?.S || '';
      const mobId = videoResult.Item?.mobId?.S || null;

      // Create OpenSearch document
      const document = {
        videoId,
        embedding: embedding.embedding,
        userHandle,
        hashtags,
        createdAt,
        mobId,
      };

      // Index document in OpenSearch
      await indexInOpenSearch(videoId, document);
      logger.info('Embedding indexed in OpenSearch');
    } catch (err) {
      // Log error but don't fail the Lambda - OpenSearch indexing is optional
      logger.error('Failed to index embedding in OpenSearch', err);
    }
  }

  return {
    videoId,
    status: 'processing', // Status will be set by validation step
    participationScore: participation.participationScore,
    mobId: null, // Will be assigned by clustering step
  };
}

/**
 * Ensure OpenSearch index exists with k-NN mapping
 */
async function ensureIndexExists(): Promise<void> {
  if (!opensearchEndpoint) return;

  const indexUrl = new URL(`https://${opensearchEndpoint}/${opensearchIndexName}`);
  
  // Check if index exists
  const checkRequest = new HttpRequest({
    hostname: indexUrl.hostname,
    path: indexUrl.pathname,
    method: 'HEAD',
    headers: {
      'Host': indexUrl.host,
    },
  });

  const signer = new SignatureV4({
    credentials: defaultProvider(),
    service: 'es',
    region,
    sha256: Sha256,
  });

  const signedCheckRequest = await signer.sign(checkRequest);
  const checkResponse = await fetch(indexUrl.toString(), {
    method: signedCheckRequest.method,
    headers: signedCheckRequest.headers as HeadersInit,
  });

  // If index exists, return
  if (checkResponse.ok) {
    return;
  }

  // Create index with k-NN mapping
  const mapping = {
    mappings: {
      properties: {
        videoId: { type: 'keyword' },
        embedding: {
          type: 'knn_vector',
          dimension: 256, // Marengo embedding dimension
          method: {
            name: 'hnsw',
            space_type: 'cosinesimil',
            engine: 'nmslib',
          },
        },
        userHandle: { type: 'keyword' },
        hashtags: { type: 'keyword' },
        createdAt: { type: 'date' },
        mobId: { type: 'keyword' },
      },
    },
  };

  const createRequest = new HttpRequest({
    hostname: indexUrl.hostname,
    path: indexUrl.pathname,
    method: 'PUT',
    headers: {
      'Host': indexUrl.host,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(JSON.stringify(mapping)).toString(),
    },
    body: JSON.stringify(mapping),
  });

  const signedCreateRequest = await signer.sign(createRequest);
  const createResponse = await fetch(indexUrl.toString(), {
    method: signedCreateRequest.method,
    headers: signedCreateRequest.headers as HeadersInit,
    body: signedCreateRequest.body as string,
  });

  if (!createResponse.ok) {
    const errorText = await createResponse.text();
    throw new Error(`Failed to create OpenSearch index: ${createResponse.status} ${errorText}`);
  }
}

/**
 * Index a document in OpenSearch using AWS Signature V4
 */
async function indexInOpenSearch(videoId: string, document: any): Promise<void> {
  if (!opensearchEndpoint) return;

  // Ensure index exists with proper mapping
  await ensureIndexExists();

  const url = new URL(`https://${opensearchEndpoint}/${opensearchIndexName}/_doc/${videoId}`);
  const body = JSON.stringify(document);

  const request = new HttpRequest({
    hostname: url.hostname,
    path: url.pathname,
    method: 'PUT',
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
    const errorText = await response.text();
    throw new Error(`OpenSearch indexing failed: ${response.status} ${errorText}`);
  }
}

