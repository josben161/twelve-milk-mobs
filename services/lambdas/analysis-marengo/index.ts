import type { Context } from 'aws-lambda';
import { CloudWatchClient, PutMetricDataCommand } from '@aws-sdk/client-cloudwatch';
import { createTwelveLabsClient } from '../../../packages/twelvelabs-client/src/index';
import type { EmbeddingResult } from '../../../packages/twelvelabs-client/src/index';

const bedrockRegion = process.env.BEDROCK_REGION || process.env.AWS_REGION || 'us-east-1';
const twelvelabsMarengoModelId = process.env.TWELVELABS_MARENGO_MODEL_ID || '';
const cloudwatch = new CloudWatchClient({ region: bedrockRegion });

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

  // Emit CloudWatch metrics for Bedrock usage
  try {
    const metrics = [];
    
    // Always emit invocation count
    metrics.push({
      MetricName: 'BedrockInvocations',
      Value: 1,
      Unit: 'Count',
      Dimensions: [
        { Name: 'ModelId', Value: twelvelabsMarengoModelId || 'unknown' },
        { Name: 'ModelType', Value: 'Marengo' },
      ],
    });

    // Emit token metrics if available
    if (embedding.bedrockUsage) {
      if (embedding.bedrockUsage.inputTokens !== undefined) {
        metrics.push({
          MetricName: 'BedrockInputTokens',
          Value: embedding.bedrockUsage.inputTokens,
          Unit: 'Count',
          Dimensions: [
            { Name: 'ModelId', Value: twelvelabsMarengoModelId || 'unknown' },
            { Name: 'ModelType', Value: 'Marengo' },
          ],
        });
      }
      if (embedding.bedrockUsage.outputTokens !== undefined) {
        metrics.push({
          MetricName: 'BedrockOutputTokens',
          Value: embedding.bedrockUsage.outputTokens,
          Unit: 'Count',
          Dimensions: [
            { Name: 'ModelId', Value: twelvelabsMarengoModelId || 'unknown' },
            { Name: 'ModelType', Value: 'Marengo' },
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
    console.error('Failed to emit Bedrock metrics:', metricError);
  }

  // Log Bedrock usage for tracking
  console.log(`Marengo embedding complete for ${event.videoId}`, {
    dimension: embedding.dim,
    bedrockModelId: twelvelabsMarengoModelId,
    bedrockInvocation: true,
    inputTokens: embedding.bedrockUsage?.inputTokens,
    outputTokens: embedding.bedrockUsage?.outputTokens,
  });

  return {
    ...event,
    embedding,
  };
};

