import type { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb';
import type { AdminStats } from '@twelve/core-types';

const videosTableName = process.env.VIDEOS_TABLE_NAME!;
const mobsTableName = process.env.MOBS_TABLE_NAME!;

const ddb = new DynamoDBClient({});

// CORS headers for all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Credentials': 'true',
};

export const handler: APIGatewayProxyHandlerV2 = async () => {
  try {
    // Scan all videos
    const videosResult = await ddb.send(
      new ScanCommand({
        TableName: videosTableName,
      })
    );

    // Scan all mobs
    const mobsResult = await ddb.send(
      new ScanCommand({
        TableName: mobsTableName,
      })
    );

    const videos = videosResult.Items || [];
    const mobs = mobsResult.Items || [];

    // Calculate statistics
    let totalVideos = 0;
    let validated = 0;
    let rejected = 0;
    let processing = 0;
    let uploaded = 0;
    let totalValidationScore = 0;
    let validationScoreCount = 0;
    const validationTimes: number[] = [];

    videos.forEach((item) => {
      totalVideos++;
      const status = item.status?.S || 'uploaded';
      
      if (status === 'validated') validated++;
      else if (status === 'rejected') rejected++;
      else if (status === 'processing') processing++;
      else uploaded++;

      // Get validation score - only count validated videos for average
      // Prefer validationScore (calculated score), fallback to participationScore
      const score = status === 'validated'
        ? (item.validationScore?.N
            ? parseFloat(item.validationScore.N)
            : item.participationScore?.N
            ? parseFloat(item.participationScore.N)
            : null)
        : null;

      if (score !== null) {
        totalValidationScore += score;
        validationScoreCount++;
      }

      // Calculate time to validate (if status is validated and we have timestamps)
      if (status === 'validated' && item.createdAt?.S) {
        const createdAt = new Date(item.createdAt.S).getTime();
        // Use validatedAt timestamp if available, otherwise fall back to current time
        const validatedAtStr = item.validatedAt?.S;
        const validatedAt = validatedAtStr 
          ? new Date(validatedAtStr).getTime()
          : Date.now();
        
        const timeToValidate = (validatedAt - createdAt) / 1000; // seconds
        // Only include reasonable times (positive and less than 7 days)
        if (timeToValidate > 0 && timeToValidate < 86400 * 7) {
          validationTimes.push(timeToValidate);
        }
      }
    });

    // Calculate averages
    const avgValidationScore = validationScoreCount > 0
      ? totalValidationScore / validationScoreCount
      : 0;

    const avgTimeToValidateSeconds = validationTimes.length > 0
      ? validationTimes.reduce((a, b) => a + b, 0) / validationTimes.length
      : 0;

    // Count active mobs (mobs with at least one video)
    const mobIdsWithVideos = new Set<string>();
    videos.forEach((item) => {
      if (item.mobId?.S) {
        mobIdsWithVideos.add(item.mobId.S);
      }
    });
    const activeMobs = mobIdsWithVideos.size;

    const stats: AdminStats = {
      totalVideos,
      validated,
      rejected,
      processing,
      activeMobs,
      avgValidationScore,
      avgTimeToValidateSeconds,
    };

    return {
      statusCode: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(stats),
    };
  } catch (err) {
    console.error('Error in admin-get-stats', err);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};

