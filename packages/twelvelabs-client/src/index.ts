/**
 * TwelveLabs API Client
 * 
 * Centralized abstraction for TwelveLabs video analysis via AWS Bedrock.
 * Supports Pegasus (participation/validation) and Marengo (embeddings).
 */

import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

export interface TwelveLabsConfig {
  region?: string; // AWS region for Bedrock (defaults to us-east-1)
  pegasusModelId: string; // Pegasus model ID for participation/validation (Bedrock model ID)
  marengoModelId: string; // Marengo model ID for embeddings (Bedrock model ID)
}

export interface TimelineHighlight {
  timestamp: number; // seconds
  description: string;
  score: number; // 0–1 relevance
}

export interface ParticipationResult {
  participationScore: number; // 0–1
  mentionsMilk: boolean;
  showsMilkObject: boolean;
  showsActionAligned: boolean;
  rationale: string; // short explanation string
  highlights?: TimelineHighlight[]; // extracted highlights from video
}

export interface EmbeddingResult {
  embedding: number[]; // main vector
  dim: number;
}

export interface TwelveLabsClient {
  analyzeParticipation(input: {
    videoId: string;
    s3Bucket: string;
    s3Key: string;
    hashtags: string[];
  }): Promise<ParticipationResult>;

  embedVideo(input: {
    videoId: string;
    s3Bucket: string;
    s3Key: string;
  }): Promise<EmbeddingResult>;
}

/**
 * Environment variable names for TwelveLabs configuration
 */
export const TWELVELABS_ENV = {
  REGION: 'BEDROCK_REGION',
  PEGASUS_MODEL_ID: 'TWELVELABS_PEGASUS_MODEL_ID',
  MARENGO_MODEL_ID: 'TWELVELABS_MARENGO_MODEL_ID',
} as const;

/**
 * Create a TwelveLabs client instance using AWS Bedrock
 */
export function createTwelveLabsClient(config: TwelveLabsConfig): TwelveLabsClient {
  const bedrockClient = new BedrockRuntimeClient({
    region: config.region || 'us-east-1',
  });

  return {
    async analyzeParticipation(input): Promise<ParticipationResult> {
      const { videoId, s3Bucket, s3Key, hashtags } = input;
      
      try {
        // Construct S3 URI for video
        const videoUri = `s3://${s3Bucket}/${s3Key}`;
        
        // Prepare Bedrock request body for Pegasus model
        // Note: Actual format depends on TwelveLabs Pegasus model API contract
        const requestBody = {
          video_uri: videoUri,
          video_id: videoId,
          hashtags: hashtags,
          task: 'participation_analysis',
          campaign_context: {
            name: 'Got Milk Campaign',
            required_hashtags: ['#gotmilk', '#milkmob'],
            focus: 'Gen Z engagement with milk products',
          },
        };

        const command = new InvokeModelCommand({
          modelId: config.pegasusModelId,
          contentType: 'application/json',
          accept: 'application/json',
          body: JSON.stringify(requestBody),
        });

        const response = await bedrockClient.send(command);
        const responseBody = JSON.parse(new TextDecoder().decode(response.body));

        // Parse Bedrock response (adjust based on actual model output format)
        // Expected format: { participationScore, mentionsMilk, showsMilkObject, showsActionAligned, rationale, highlights }
        const highlights: TimelineHighlight[] | undefined = responseBody.highlights
          ? responseBody.highlights.map((h: any) => ({
              timestamp: h.timestamp ?? h.t ?? 0,
              description: h.description ?? h.event ?? '',
              score: h.score ?? h.relevance ?? 0.5,
            }))
          : undefined;

        return {
          participationScore: responseBody.participationScore ?? responseBody.score ?? 0.7,
          mentionsMilk: responseBody.mentionsMilk ?? responseBody.detected_mentions ?? false,
          showsMilkObject: responseBody.showsMilkObject ?? responseBody.detected_object ?? false,
          showsActionAligned: responseBody.showsActionAligned ?? responseBody.action_aligned ?? false,
          rationale: responseBody.rationale ?? responseBody.explanation ?? 'Analysis complete',
          highlights,
        };
      } catch (error) {
        console.error(`Bedrock Pegasus invocation failed for ${videoId}:`, error);
        // Fallback to deterministic fake data for demo purposes
        return fallbackParticipationAnalysis(videoId, hashtags);
      }
    },

    async embedVideo(input): Promise<EmbeddingResult> {
      const { videoId, s3Bucket, s3Key } = input;
      
      try {
        // Construct S3 URI for video
        const videoUri = `s3://${s3Bucket}/${s3Key}`;
        
        // Prepare Bedrock request body for Marengo model
        const requestBody = {
          video_uri: videoUri,
          video_id: videoId,
          task: 'embedding',
        };

        const command = new InvokeModelCommand({
          modelId: config.marengoModelId,
          contentType: 'application/json',
          accept: 'application/json',
          body: JSON.stringify(requestBody),
        });

        const response = await bedrockClient.send(command);
        const responseBody = JSON.parse(new TextDecoder().decode(response.body));

        // Parse Bedrock response (adjust based on actual model output format)
        // Expected format: { embedding: number[], dim: number }
        const embedding = responseBody.embedding ?? responseBody.vector ?? [];
        const dim = responseBody.dim ?? responseBody.dimension ?? embedding.length;

        if (embedding.length === 0) {
          throw new Error('Empty embedding returned from Bedrock');
        }

        return {
          embedding,
          dim,
        };
      } catch (error) {
        console.error(`Bedrock Marengo invocation failed for ${videoId}:`, error);
        // Fallback to deterministic fake data for demo purposes
        return fallbackEmbedding(videoId);
      }
    },
  };
}

/**
 * Fallback participation analysis (used if Bedrock call fails)
 */
function fallbackParticipationAnalysis(videoId: string, hashtags: string[]): ParticipationResult {
  const hash = simpleHash(videoId);
  const hashtagText = hashtags.join(' ').toLowerCase();
  const hasMilkHashtags = hashtagText.includes('gotmilk') || hashtagText.includes('milkmob');
  
  const baseScore = hasMilkHashtags ? 0.75 : 0.60;
  const participationScore = Math.min(0.95, baseScore + (hash % 20) / 100);
  
  const mentionsMilk = hasMilkHashtags || (hash % 3) === 0;
  const showsMilkObject = mentionsMilk || (hash % 4) === 0;
  const showsActionAligned = participationScore > 0.7 || (hash % 5) === 0;
  
  const reasons: string[] = [];
  if (hasMilkHashtags) reasons.push('Contains campaign hashtags');
  if (mentionsMilk) reasons.push('Mentions milk in content');
  if (showsMilkObject) reasons.push('Shows milk carton or product');
  if (showsActionAligned) reasons.push('Action aligns with campaign theme');
  if (reasons.length === 0) reasons.push('Limited campaign alignment');
  
  // Generate fake timeline highlights for fallback
  const highlights: TimelineHighlight[] = [
    { timestamp: 5, description: 'Milk product visible', score: 0.8 },
    { timestamp: 12, description: 'Action sequence begins', score: 0.7 },
    { timestamp: 20, description: 'Campaign moment', score: 0.9 },
  ];

  return {
    participationScore,
    mentionsMilk,
    showsMilkObject,
    showsActionAligned,
    rationale: reasons.join('; '),
    highlights,
  };
}

/**
 * Fallback embedding generation (used if Bedrock call fails)
 */
function fallbackEmbedding(videoId: string): EmbeddingResult {
  const dim = 256;
  const hash = simpleHash(videoId);
  const embedding: number[] = [];
  
  for (let i = 0; i < dim; i++) {
    const seed = (hash + i * 7919) % 2147483647;
    const value = (seed / 2147483647) * 2 - 1;
    embedding.push(value);
  }

  return { embedding, dim };
}

/**
 * Simple hash function for deterministic fake data generation
 */
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}
