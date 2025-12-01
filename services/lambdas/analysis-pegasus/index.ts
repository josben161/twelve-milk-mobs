import type { Context } from 'aws-lambda';
import { createTwelveLabsClient } from '../../../packages/twelvelabs-client/src/index';
import type { ParticipationResult } from '../../../packages/twelvelabs-client/src/index';
import { createLogger } from '../shared/logger';

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
  context: Context
): Promise<AnalysisOutput> => {
  const logger = createLogger({
    videoId: event.videoId,
    requestId: context.requestId,
  });

  logger.info('Running Pegasus analysis', {
    s3Bucket: event.s3Bucket,
    s3Key: event.s3Key,
    hashtags: event.hashtags,
  });

  try {
    // Call TwelveLabs Pegasus to analyze participation
    const participation = await tlClient.analyzeParticipation({
      videoId: event.videoId,
      s3Bucket: event.s3Bucket,
      s3Key: event.s3Key,
      hashtags: event.hashtags,
    });

    // Log Bedrock usage for tracking
    logger.info('Pegasus analysis complete', {
      participationScore: participation.participationScore,
      mentionsMilk: participation.mentionsMilk,
      showsMilkObject: participation.showsMilkObject,
      bedrockModelId: twelvelabsPegasusModelId,
      bedrockInvocation: true,
      // Note: Input/output tokens would be available from Bedrock response if exposed by client
    });

    return {
      ...event,
      participation,
    };
  } catch (error) {
    logger.error('Pegasus analysis failed', error, {
      s3Bucket: event.s3Bucket,
      s3Key: event.s3Key,
    });
    throw error;
  }
};

