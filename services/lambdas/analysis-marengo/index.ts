import type { Context } from 'aws-lambda';
import { createTwelveLabsClient } from '../../../packages/twelvelabs-client/src/index';
import type { EmbeddingResult } from '../../../packages/twelvelabs-client/src/index';

const bedrockRegion = process.env.BEDROCK_REGION || process.env.AWS_REGION || 'us-east-1';
const twelvelabsMarengoModelId = process.env.TWELVELABS_MARENGO_MODEL_ID || '';

const tlClient = createTwelveLabsClient({
  region: bedrockRegion,
  pegasusModelId: '', // Not needed for this Lambda
  marengoModelId: twelvelabsMarengoModelId,
});

interface AnalysisInput {
  videoId: string;
  s3Bucket: string;
  s3Key: string;
  hashtags: string[];
}

interface AnalysisOutput extends AnalysisInput {
  embedding: EmbeddingResult;
}

export const handler = async (
  event: AnalysisInput,
  _context: Context
): Promise<AnalysisOutput> => {
  console.log(`Running Marengo embedding for video: ${event.videoId}`);

  // Call TwelveLabs Marengo to generate embedding
  const embedding = await tlClient.embedVideo({
    videoId: event.videoId,
    s3Bucket: event.s3Bucket,
    s3Key: event.s3Key,
  });

  // Log Bedrock usage for tracking
  console.log(`Marengo embedding complete for ${event.videoId}`, {
    dimension: embedding.dim,
    bedrockModelId: twelvelabsMarengoModelId,
    bedrockInvocation: true,
    // Note: Input/output tokens would be available from Bedrock response if exposed by client
  });

  return {
    ...event,
    embedding,
  };
};

