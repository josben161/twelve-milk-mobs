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
  validationBreakdown?: {
    visual: number;
    audio: number | null;
    ocr: number;
    hashtags: number;
  };
}

interface ModalityScores {
  visual: number;
  audio: number | null; // null if audio unavailable
  ocr: number;
  hashtags: number;
}

/**
 * Calculate individual modality scores
 */
function calculateModalityScores(
  showsMilkObject: boolean,
  showsActionAligned: boolean,
  mentionsMilk: boolean | undefined,
  onScreenText: string[] | undefined,
  detectedText: string[] | undefined,
  hashtags: string[]
): ModalityScores {
  // Visual score: showsMilkObject (0.5) + showsActionAligned (0.5)
  const visualScore = (showsMilkObject ? 0.5 : 0) + (showsActionAligned ? 0.5 : 0);
  
  // Audio score: mentionsMilk (1.0) if audio available, else null
  // For now, assume audio is available if mentionsMilk is defined
  // In production, we'd check video metadata for audio track presence/duration
  const audioScore = mentionsMilk !== undefined ? (mentionsMilk ? 1.0 : 0) : null;
  
  // OCR score: presence of milk-related text in onScreenText (0.5) + campaign hashtags in detected text (0.5)
  let ocrScore = 0;
  const milkKeywords = ['milk', 'dairy', 'got milk', 'milkmob', 'gotmilk'];
  
  if (onScreenText && onScreenText.length > 0) {
    const onScreenTextLower = onScreenText.join(' ').toLowerCase();
    const hasMilkText = milkKeywords.some(keyword => onScreenTextLower.includes(keyword));
    if (hasMilkText) {
      ocrScore += 0.5;
    }
  }
  
  if (detectedText && detectedText.length > 0) {
    const detectedTextLower = detectedText.join(' ').toLowerCase();
    const hasCampaignHashtags = detectedTextLower.includes('gotmilk') || detectedTextLower.includes('milkmob');
    if (hasCampaignHashtags) {
      ocrScore += 0.5;
    }
  }
  
  // Hashtag score: presence of #gotmilk or #milkmob (1.0)
  const hashtagText = hashtags.join(' ').toLowerCase();
  const hasMilkHashtags = hashtagText.includes('gotmilk') || hashtagText.includes('milkmob');
  const hashtagScore = hasMilkHashtags ? 1.0 : 0;
  
  return {
    visual: visualScore,
    audio: audioScore,
    ocr: ocrScore,
    hashtags: hashtagScore,
  };
}

/**
 * Determine if audio is available (not missing or very short)
 * For now, we assume audio is available unless explicitly marked otherwise
 * In production, this would check video metadata
 */
function determineAudioAvailability(mentionsMilk: boolean | undefined): boolean {
  // If mentionsMilk is undefined, we don't have audio data, so assume unavailable
  // If mentionsMilk is defined (true or false), we have audio data, so assume available
  // This is a heuristic - in production, check video metadata for audio track
  return mentionsMilk !== undefined;
}

/**
 * Calculate weighted validation score with dynamic weight adjustment
 */
function calculateWeightedScore(scores: ModalityScores, audioAvailable: boolean): { score: number; breakdown: ModalityScores } {
  let weights: [number, number, number, number]; // [visual, audio, ocr, hashtags]
  
  if (!audioAvailable) {
    // Audio unavailable: redistribute weights - Visual 50%, OCR 30%, Hashtags 20%
    weights = [0.5, 0, 0.3, 0.2];
  } else {
    // Audio available: Visual 40%, Audio 30%, OCR 20%, Hashtags 10%
    weights = [0.4, 0.3, 0.2, 0.1];
  }
  
  // Calculate weighted sum
  const weightedScore = 
    scores.visual * weights[0] +
    (scores.audio !== null ? scores.audio * weights[1] : 0) +
    scores.ocr * weights[2] +
    scores.hashtags * weights[3];
  
  return {
    score: Math.min(1.0, weightedScore), // Cap at 1.0
    breakdown: scores,
  };
}

/**
 * Perform validation and update video status
 */
async function validateVideo(videoId: string, participationScore?: number): Promise<{ 
  status: string; 
  validationScore: number; 
  reasons: string[];
  breakdown?: ModalityScores;
}> {
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
  const showsMilkObject = result.Item.showsMilkObject?.BOOL ?? false;
  const showsActionAligned = result.Item.showsActionAligned?.BOOL ?? false;
  const mentionsMilk = result.Item.mentionsMilk?.BOOL;
  const onScreenText = result.Item.onScreenText?.SS;
  const detectedText = result.Item.detectedText?.SS;
  const rationale = result.Item.participationRationale?.S;

  // Calculate modality scores
  const modalityScores = calculateModalityScores(
    showsMilkObject,
    showsActionAligned,
    mentionsMilk,
    onScreenText,
    detectedText,
    hashtags
  );

  // Determine audio availability
  const audioAvailable = determineAudioAvailability(mentionsMilk);

  // Calculate weighted score
  const { score: calculatedScore, breakdown } = calculateWeightedScore(modalityScores, audioAvailable);

  // Build validation reasons
  const reasons: string[] = [];
  
  // Visual modality
  if (showsMilkObject) {
    reasons.push('Shows milk carton or product (visual)');
  }
  if (showsActionAligned) {
    reasons.push('Action aligns with campaign theme (visual)');
  }
  reasons.push(`Visual score: ${(modalityScores.visual * 100).toFixed(0)}%`);

  // Audio modality
  if (audioAvailable) {
    if (mentionsMilk) {
      reasons.push('Mentions milk in content (audio)');
    } else {
      reasons.push('No milk mentions detected in audio');
    }
    reasons.push(`Audio score: ${(modalityScores.audio! * 100).toFixed(0)}%`);
  } else {
    reasons.push('Audio unavailable or too short - not penalized');
  }

  // OCR modality
  if (onScreenText && onScreenText.length > 0) {
    const milkKeywords = ['milk', 'dairy', 'got milk', 'milkmob', 'gotmilk'];
    const onScreenTextLower = onScreenText.join(' ').toLowerCase();
    const hasMilkText = milkKeywords.some(keyword => onScreenTextLower.includes(keyword));
    if (hasMilkText) {
      reasons.push('Milk-related text detected on screen (OCR)');
    }
  }
  if (detectedText && detectedText.length > 0) {
    const detectedTextLower = detectedText.join(' ').toLowerCase();
    const hasCampaignHashtags = detectedTextLower.includes('gotmilk') || detectedTextLower.includes('milkmob');
    if (hasCampaignHashtags) {
      reasons.push('Campaign hashtags detected in video text (OCR)');
    }
  }
  reasons.push(`OCR score: ${(modalityScores.ocr * 100).toFixed(0)}%`);

  // Hashtag modality
  const hashtagText = hashtags.join(' ').toLowerCase();
  const hasMilkHashtags = hashtagText.includes('gotmilk') || hashtagText.includes('milkmob');
  if (hasMilkHashtags) {
    reasons.push('Contains campaign hashtags (#gotmilk, #milkmob)');
  } else {
    reasons.push('Missing required campaign hashtags');
  }
  reasons.push(`Hashtag score: ${(modalityScores.hashtags * 100).toFixed(0)}%`);

  // Add participation rationale if available
  if (rationale) {
    reasons.push(`Analysis: ${rationale}`);
  }

  // Determine status based on threshold
  const pass = calculatedScore >= validationThreshold;
  const status = pass ? 'validated' : 'rejected';

  if (!pass) {
    reasons.push(`Overall score ${(calculatedScore * 100).toFixed(1)}% below threshold (${(validationThreshold * 100).toFixed(0)}%)`);
  } else {
    reasons.push(`Overall score ${(calculatedScore * 100).toFixed(1)}% meets threshold`);
  }

  // Store validation breakdown as JSON string
  const breakdownJson = JSON.stringify({
    visual: breakdown.visual,
    audio: breakdown.audio,
    ocr: breakdown.ocr,
    hashtags: breakdown.hashtags,
  });

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
            validationReasons = :reasons,
            validationBreakdown = :breakdown
      `,
      ExpressionAttributeNames: {
        '#status': 'status',
      },
      ExpressionAttributeValues: {
        ':status': { S: status },
        ':validationScore': { N: calculatedScore.toString() },
        ':reasons': { SS: reasons },
        ':breakdown': { S: breakdownJson },
      },
    })
  );

  return { status, validationScore: calculatedScore, reasons, breakdown };
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
    const { status, validationScore, reasons, breakdown } = await validateVideo(
      stepInput.videoId,
      stepInput.participationScore
    );
    return {
      ...stepInput,
      status,
      validationScore,
      validationReasons: reasons,
      validationBreakdown: breakdown,
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

