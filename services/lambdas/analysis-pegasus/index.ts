import type { Context } from 'aws-lambda';
import { CloudWatchClient, PutMetricDataCommand } from '@aws-sdk/client-cloudwatch';
import { createTwelveLabsClient } from '../../../packages/twelvelabs-client/src/index';
import type { ParticipationResult } from '../../../packages/twelvelabs-client/src/index';
import { createLogger } from '../shared/logger';

const bedrockRegion = process.env.BEDROCK_REGION || process.env.AWS_REGION || 'us-east-1';
const twelvelabsPegasusModelId = process.env.TWELVELABS_PEGASUS_MODEL_ID || '';
const cloudwatch = new CloudWatchClient({ region: bedrockRegion });

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
      detectText: true, // Enable OCR/text detection
    });

    // Emit CloudWatch metrics for Bedrock usage
    try {
      const metrics = [];
      
      // Always emit invocation count
      metrics.push({
        MetricName: 'BedrockInvocations',
        Value: 1,
        Unit: 'Count',
        Dimensions: [
          { Name: 'ModelId', Value: twelvelabsPegasusModelId || 'unknown' },
          { Name: 'ModelType', Value: 'Pegasus' },
        ],
      });

      // Emit token metrics if available
      if (participation.bedrockUsage) {
        if (participation.bedrockUsage.inputTokens !== undefined) {
          metrics.push({
            MetricName: 'BedrockInputTokens',
            Value: participation.bedrockUsage.inputTokens,
            Unit: 'Count',
            Dimensions: [
              { Name: 'ModelId', Value: twelvelabsPegasusModelId || 'unknown' },
              { Name: 'ModelType', Value: 'Pegasus' },
            ],
          });
        }
        if (participation.bedrockUsage.outputTokens !== undefined) {
          metrics.push({
            MetricName: 'BedrockOutputTokens',
            Value: participation.bedrockUsage.outputTokens,
            Unit: 'Count',
            Dimensions: [
              { Name: 'ModelId', Value: twelvelabsPegasusModelId || 'unknown' },
              { Name: 'ModelType', Value: 'Pegasus' },
            ],
          });
        }
      }

      if (metrics.length > 0) {
        await cloudwatch.send(
          new PutMetricDataCommand({
            Namespace: 'MilkMobs/Bedrock',
            MetricData: metrics,
          })
        );
      }
    } catch (metricError) {
      // Log but don't fail the Lambda if metrics fail
      logger.error('Failed to emit Bedrock metrics', metricError);
    }

    // Log Bedrock usage for tracking
    logger.info('Pegasus analysis complete', {
      participationScore: participation.participationScore,
      mentionsMilk: participation.mentionsMilk,
      showsMilkObject: participation.showsMilkObject,
      bedrockModelId: twelvelabsPegasusModelId,
      bedrockInvocation: true,
      inputTokens: participation.bedrockUsage?.inputTokens,
      outputTokens: participation.bedrockUsage?.outputTokens,
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

