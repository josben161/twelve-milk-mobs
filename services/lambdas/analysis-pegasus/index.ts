import type { Context } from 'aws-lambda';
import { createTwelveLabsClient } from '../../../packages/twelvelabs-client/src/index';
import type { ParticipationResult } from '../../../packages/twelvelabs-client/src/index';

const bedrockRegion = process.env.BEDROCK_REGION || process.env.AWS_REGION || 'us-east-1';
const twelvelabsPegasusModelId = process.env.TWELVELABS_PEGASUS_MODEL_ID || '';

const tlClient = createTwelveLabsClient({
  region: bedrockRegion,
  pegasusModelId: twelvelabsPegasusModelId,
  marengoModelId: '', // Not needed for this Lambda
});

interface AnalysisInput {
  videoId: string;
  s3Bucket: string;
  s3Key: string;
  hashtags: string[];
}

interface AnalysisOutput extends AnalysisInput {
  participation: ParticipationResult;
}

export const handler = async (
  event: AnalysisInput,
  _context: Context
): Promise<AnalysisOutput> => {
  console.log(`Running Pegasus analysis for video: ${event.videoId}`);

  // Call TwelveLabs Pegasus to analyze participation
  const participation = await tlClient.analyzeParticipation({
    videoId: event.videoId,
    s3Bucket: event.s3Bucket,
    s3Key: event.s3Key,
    hashtags: event.hashtags,
  });

  console.log(`Pegasus analysis complete for ${event.videoId}:`, JSON.stringify(participation, null, 2));

  return {
    ...event,
    participation,
  };
};

