import type { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { CloudWatchClient, GetMetricDataCommand } from '@aws-sdk/client-cloudwatch';

const cloudwatch = new CloudWatchClient({});

// CORS headers for all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Credentials': 'true',
};

interface TimeRange {
  startTime: Date;
  endTime: Date;
  period: number;
}

function getTimeRange(timeRangeParam: string): TimeRange {
  const endTime = new Date();
  let startTime: Date;
  let period: number;

  switch (timeRangeParam) {
    case '1h':
      startTime = new Date(endTime.getTime() - 60 * 60 * 1000);
      period = 60; // 1 minute periods
      break;
    case '24h':
      startTime = new Date(endTime.getTime() - 24 * 60 * 60 * 1000);
      period = 300; // 5 minute periods
      break;
    case '7d':
      startTime = new Date(endTime.getTime() - 7 * 24 * 60 * 60 * 1000);
      period = 3600; // 1 hour periods
      break;
    case '30d':
      startTime = new Date(endTime.getTime() - 30 * 24 * 60 * 60 * 1000);
      period = 86400; // 1 day periods
      break;
    default:
      startTime = new Date(endTime.getTime() - 24 * 60 * 60 * 1000);
      period = 300;
  }

  return { startTime, endTime, period };
}

async function getMetricSum(
  namespace: string,
  metricName: string,
  dimensions: Record<string, string>,
  timeRange: TimeRange
): Promise<number> {
  try {
    const command = new GetMetricDataCommand({
      MetricDataQueries: [
        {
          Id: 'm1',
          MetricStat: {
            Metric: {
              Namespace: namespace,
              MetricName: metricName,
              Dimensions: Object.entries(dimensions).map(([Name, Value]) => ({ Name, Value })),
            },
            Period: timeRange.period,
            Stat: 'Sum',
          },
          ReturnData: true,
        },
      ],
      StartTime: timeRange.startTime,
      EndTime: timeRange.endTime,
    });

    const response = await cloudwatch.send(command);
    const values = response.MetricDataResults?.[0]?.Values || [];
    return values.reduce((sum, val) => sum + (val || 0), 0);
  } catch (err) {
    console.warn(`Failed to get metric ${namespace}/${metricName}:`, err);
    return 0;
  }
}

async function getMetricAverage(
  namespace: string,
  metricName: string,
  dimensions: Record<string, string>,
  timeRange: TimeRange
): Promise<number> {
  try {
    const command = new GetMetricDataCommand({
      MetricDataQueries: [
        {
          Id: 'm1',
          MetricStat: {
            Metric: {
              Namespace: namespace,
              MetricName: metricName,
              Dimensions: Object.entries(dimensions).map(([Name, Value]) => ({ Name, Value })),
            },
            Period: timeRange.period,
            Stat: 'Average',
          },
          ReturnData: true,
        },
      ],
      StartTime: timeRange.startTime,
      EndTime: timeRange.endTime,
    });

    const response = await cloudwatch.send(command);
    const values = response.MetricDataResults?.[0]?.Values || [];
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + (val || 0), 0) / values.length;
  } catch (err) {
    console.warn(`Failed to get metric ${namespace}/${metricName}:`, err);
    return 0;
  }
}

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    const timeRangeParam = event.queryStringParameters?.timeRange || '24h';
    const timeRange = getTimeRange(timeRangeParam);

    // Get stack name from environment or use default
    const stackName = process.env.STACK_NAME || 'MilkMobsStack';

    // Lambda metrics
    const lambdaInvocations = await getMetricSum('AWS/Lambda', 'Invocations', {}, timeRange);
    const lambdaDuration = await getMetricAverage('AWS/Lambda', 'Duration', {}, timeRange);
    const lambdaErrors = await getMetricSum('AWS/Lambda', 'Errors', {}, timeRange);

    // API Gateway metrics
    const apiRequests = await getMetricSum('AWS/ApiGateway', 'Count', {}, timeRange);
    const apiErrors = await getMetricSum('AWS/ApiGateway', '4XXError', {}, timeRange) +
      await getMetricSum('AWS/ApiGateway', '5XXError', {}, timeRange);

    // DynamoDB metrics
    const dynamoReadUnits = await getMetricSum('AWS/DynamoDB', 'ConsumedReadCapacityUnits', {}, timeRange);
    const dynamoWriteUnits = await getMetricSum('AWS/DynamoDB', 'ConsumedWriteCapacityUnits', {}, timeRange);

    // S3 metrics
    const s3Storage = await getMetricAverage('AWS/S3', 'BucketSizeBytes', {}, timeRange);
    const s3Requests = await getMetricSum('AWS/S3', 'NumberOfObjects', {}, timeRange);

    // Step Functions metrics
    const stepFunctionsExecutions = await getMetricSum('AWS/States', 'ExecutionsStarted', {}, timeRange);
    const stepFunctionsDuration = await getMetricAverage('AWS/States', 'ExecutionTime', {}, timeRange);

    // CloudFront metrics
    const cloudfrontRequests = await getMetricSum('AWS/CloudFront', 'Requests', {}, timeRange);
    const cloudfrontDataTransfer = await getMetricSum('AWS/CloudFront', 'BytesDownloaded', {}, timeRange);

    // Estimate costs (simplified - actual costs would require Cost Explorer API or pricing APIs)
    const lambdaCost = (lambdaInvocations / 1000000) * 0.2 + (lambdaDuration / 1000 / 1000000) * 0.0000166667;
    const apiGatewayCost = (apiRequests / 1000000) * 3.5;
    const dynamoDBCost = (dynamoReadUnits / 1000000) * 0.25 + (dynamoWriteUnits / 1000000) * 1.25;
    const s3Cost = (s3Storage / 1024 / 1024 / 1024) * 0.023; // GB storage
    const stepFunctionsCost = (stepFunctionsExecutions / 1000000) * 0.025;
    const cloudfrontCost = (cloudfrontDataTransfer / 1024 / 1024 / 1024) * 0.085; // GB transfer

    const usageStats = {
      timeRange: timeRangeParam,
      bedrock: {
        invocations: 0, // Will be tracked via CloudWatch Logs Insights or custom metrics
        estimatedCost: 0,
        byModel: [] as Array<{ modelId: string; invocations: number }>,
      },
      lambda: {
        invocations: Math.round(lambdaInvocations),
        duration: Math.round(lambdaDuration),
        errors: Math.round(lambdaErrors),
        estimatedCost: lambdaCost,
      },
      apiGateway: {
        requests: Math.round(apiRequests),
        errors: Math.round(apiErrors),
        dataTransfer: 0, // Would need DataProcessed metric
        estimatedCost: apiGatewayCost,
      },
      dynamodb: {
        readUnits: Math.round(dynamoReadUnits),
        writeUnits: Math.round(dynamoWriteUnits),
        storage: 0, // Would need table size metric
        estimatedCost: dynamoDBCost,
      },
      s3: {
        storage: Math.round(s3Storage / 1024 / 1024), // MB
        requests: Math.round(s3Requests),
        dataTransfer: 0,
        estimatedCost: s3Cost,
      },
      opensearch: {
        instanceHours: 0, // Would need custom metric
        storage: 0,
        estimatedCost: 0,
      },
      stepFunctions: {
        executions: Math.round(stepFunctionsExecutions),
        duration: Math.round(stepFunctionsDuration),
        estimatedCost: stepFunctionsCost,
      },
      cloudfront: {
        requests: Math.round(cloudfrontRequests),
        dataTransfer: Math.round(cloudfrontDataTransfer / 1024 / 1024), // MB
        estimatedCost: cloudfrontCost,
      },
    };

    return {
      statusCode: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(usageStats),
    };
  } catch (err) {
    console.error('Error in admin-get-usage-stats', err);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};

