import type { APIGatewayProxyHandlerV2, Context } from 'aws-lambda';
import { DynamoDBClient, GetItemCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb';

const tableName = process.env.VIDEOS_TABLE_NAME!;
const validationThreshold = parseFloat(process.env.VALIDATION_THRESHOLD || '0.7');

const ddb = new DynamoDBClient({});

// CORS headers for all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Credentials': 'true',
};

interface ValidationResponse {
  videoId: string;
  participationScore: number;
  pass: boolean;
  reasons: string[];
}

interface StepFunctionsInput {
  videoId: string;
  status?: string;
  participationScore?: number;
  mobId?: string | null;
}

interface StepFunctionsOutput extends StepFunctionsInput {
  status: string;
  validationScore: number;
  validationReasons: string[];
}

/**
 * Perform validation and update video status
 */
async function validateVideo(videoId: string, participationScore?: number): Promise<{ status: string; validationScore: number; reasons: string[] }> {
  // Fetch video from DynamoDB
  const result = await ddb.send(
    new GetItemCommand({
      TableName: tableName,
      Key: {
        videoId: { S: videoId },
      },
    })
  );

  if (!result.Item) {
    throw new Error(`Video ${videoId} not found`);
  }

  const hashtags = result.Item.hashtags?.SS || [];
  const score = participationScore ?? (result.Item.participationScore?.N ? parseFloat(result.Item.participationScore.N) : 0);

  // Fuse validation signals
  const reasons: string[] = [];
  
  // Check hashtag coverage
  const hashtagText = hashtags.join(' ').toLowerCase();
  const hasMilkHashtags = hashtagText.includes('gotmilk') || hashtagText.includes('milkmob');
  if (hasMilkHashtags) {
    reasons.push('Contains campaign hashtags (#gotmilk, #milkmob)');
  } else {
    reasons.push('Missing required campaign hashtags');
  }

  // Check Pegasus flags
  const mentionsMilk = result.Item.mentionsMilk?.BOOL ?? false;
  const showsMilkObject = result.Item.showsMilkObject?.BOOL ?? false;
  const showsActionAligned = result.Item.showsActionAligned?.BOOL ?? false;

  if (mentionsMilk) {
    reasons.push('Mentions milk in content');
  }
  if (showsMilkObject) {
    reasons.push('Shows milk carton or product');
  }
  if (showsActionAligned) {
    reasons.push('Action aligns with campaign theme');
  }

  // Add participation rationale if available
  const rationale = result.Item.participationRationale?.S;
  if (rationale) {
    reasons.push(`Analysis: ${rationale}`);
  }

  // Calculate final validation score
  let calculatedScore = score;
  if (calculatedScore === 0) {
    // Fallback calculation if participationScore not set
    calculatedScore = (hasMilkHashtags ? 0.3 : 0) +
      (mentionsMilk ? 0.2 : 0) +
      (showsMilkObject ? 0.3 : 0) +
      (showsActionAligned ? 0.2 : 0);
  }

  // Determine status based on threshold
  const pass = calculatedScore >= validationThreshold;
  const status = pass ? 'validated' : 'rejected';

  if (!pass) {
    reasons.push(`Score ${(calculatedScore * 100).toFixed(1)}% below threshold (${(validationThreshold * 100).toFixed(0)}%)`);
  } else {
    reasons.push(`Score ${(calculatedScore * 100).toFixed(1)}% meets threshold`);
  }

  // Update video status and validation results in DynamoDB
  await ddb.send(
    new UpdateItemCommand({
      TableName: tableName,
      Key: {
        videoId: { S: videoId },
      },
      UpdateExpression: `
        SET #status = :status,
            validationScore = :validationScore,
            validationReasons = :reasons
      `,
      ExpressionAttributeNames: {
        '#status': 'status',
      },
      ExpressionAttributeValues: {
        ':status': { S: status },
        ':validationScore': { N: calculatedScore.toString() },
        ':reasons': { SS: reasons },
      },
    })
  );

  return { status, validationScore: calculatedScore, reasons };
}

/**
 * Unified handler that works for both Step Functions and API Gateway
 */
export const handler = async (
  event: StepFunctionsInput | APIGatewayProxyHandlerV2['event'],
  context?: Context
): Promise<StepFunctionsOutput | APIGatewayProxyHandlerV2['response']> => {
  // Detect if this is a Step Functions invocation or API Gateway
  if ('videoId' in event && typeof event.videoId === 'string') {
    // Step Functions invocation
    const stepInput = event as StepFunctionsInput;
    const { status, validationScore, reasons } = await validateVideo(
      stepInput.videoId,
      stepInput.participationScore
    );
    return {
      ...stepInput,
      status,
      validationScore,
      validationReasons: reasons,
    };
  } else {
    // API Gateway invocation
    const apiEvent = event as Parameters<APIGatewayProxyHandlerV2>[0];
    try {
      const videoId = apiEvent.pathParameters?.videoId || (apiEvent.body ? JSON.parse(apiEvent.body).videoId : null);

      if (!videoId) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'videoId is required' }),
        };
      }

      const { status, validationScore, reasons } = await validateVideo(videoId);

      const response: ValidationResponse = {
        videoId,
        participationScore: validationScore,
        pass: status === 'validated',
        reasons,
      };

      return {
        statusCode: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(response),
      };
    } catch (err) {
      console.error('Error in validate-video', err);
      const errorMessage = err instanceof Error ? err.message : 'Internal server error';
      return {
        statusCode: err instanceof Error && err.message.includes('not found') ? 404 : 500,
        headers: corsHeaders,
        body: JSON.stringify({ error: errorMessage }),
      };
    }
  }
};

