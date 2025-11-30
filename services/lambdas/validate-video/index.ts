import type { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { DynamoDBClient, GetItemCommand } from '@aws-sdk/client-dynamodb';

const tableName = process.env.VIDEOS_TABLE_NAME!;

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

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    const videoId = event.pathParameters?.videoId || (event.body ? JSON.parse(event.body).videoId : null);

    if (!videoId) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'videoId is required' }),
      };
    }

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
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Video not found' }),
      };
    }

    const hashtags = result.Item.hashtags?.SS || [];
    const participationScore = result.Item.participationScore?.N
      ? parseFloat(result.Item.participationScore.N)
      : result.Item.participationScore?.N
      ? parseFloat(result.Item.participationScore.N)
      : 0;

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

    // Calculate final participation score (weighted combination)
    // Hashtags: 30%, Pegasus flags: 70%
    let calculatedScore = participationScore;
    if (calculatedScore === 0) {
      // Fallback calculation if participationScore not set
      calculatedScore = (hasMilkHashtags ? 0.3 : 0) +
        (mentionsMilk ? 0.2 : 0) +
        (showsMilkObject ? 0.3 : 0) +
        (showsActionAligned ? 0.2 : 0);
    }

    // Threshold: 0.7
    const pass = calculatedScore >= 0.7;

    if (!pass) {
      reasons.push(`Score ${(calculatedScore * 100).toFixed(1)}% below threshold (70%)`);
    } else {
      reasons.push(`Score ${(calculatedScore * 100).toFixed(1)}% meets threshold`);
    }

    const response: ValidationResponse = {
      videoId,
      participationScore: calculatedScore,
      pass,
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
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};

