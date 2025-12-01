import type { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb';
import type { VideoSummary } from '@twelve/core-types';

const tableName = process.env.VIDEOS_TABLE_NAME!;
const cloudfrontDomain = process.env.CLOUDFRONT_DISTRIBUTION_DOMAIN;

const ddb = new DynamoDBClient({});

// CORS headers for all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Credentials': 'true',
};

export const handler: APIGatewayProxyHandlerV2 = async () => {
  try {
    // Scan all videos (for production, consider pagination)
    const result = await ddb.send(
      new ScanCommand({
        TableName: tableName,
      })
    );

    // Map DynamoDB items to VideoSummary array
    const videos: VideoSummary[] =
      result.Items?.map((item) => {
        const s3Key = item.s3Key?.S || '';
        const thumbnailUrl = s3Key && cloudfrontDomain
          ? `https://${cloudfrontDomain}/${s3Key}`
          : null;

        return {
          id: item.videoId?.S || '',
          userHandle: item.userHandle?.S || item.userId?.S || 'unknown',
          mobId: item.mobId?.S || null,
          status: (item.status?.S as any) || 'uploaded',
          createdAt: item.createdAt?.S || '',
          caption: item.hashtags?.SS?.[0] || '', // Use first hashtag as caption
          hashtags: item.hashtags?.SS || [],
          thumbnailUrl,
          validationScore: item.participationScore?.N
            ? parseFloat(item.participationScore.N)
            : item.validationScore?.N
            ? parseFloat(item.validationScore.N)
            : undefined,
        };
      }) || [];

    // Sort by createdAt descending (newest first)
    videos.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA;
    });

    return {
      statusCode: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ videos }),
    };
  } catch (err) {
    console.error('Error in admin-list-videos', err);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};

