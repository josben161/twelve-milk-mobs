import type { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { DynamoDBClient, GetItemCommand } from '@aws-sdk/client-dynamodb';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { VideoDetail } from '@twelve/core-types';

const tableName = process.env.VIDEOS_TABLE_NAME!;
const bucketName = process.env.UPLOADS_BUCKET_NAME!;
const cloudfrontDomain = process.env.CLOUDFRONT_DISTRIBUTION_DOMAIN;

const ddb = new DynamoDBClient({});
const s3 = new S3Client({});

// CORS headers for all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Credentials': 'true',
};

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    const videoId = event.pathParameters?.videoId;

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

    // Parse timeline from JSON string if present
    let timeline: Array<{ timestamp: number; description: string; score?: number }> | undefined;
    if (result.Item.timeline?.S) {
      try {
        const parsed = JSON.parse(result.Item.timeline.S);
        // Support both old format { t, event } and new format { timestamp, description, score }
        timeline = Array.isArray(parsed)
          ? parsed.map((item: any) => ({
              timestamp: item.timestamp ?? parseFloat(item.t ?? '0'),
              description: item.description ?? item.event ?? '',
              score: item.score,
            }))
          : undefined;
      } catch (e) {
        console.warn(`Failed to parse timeline for ${videoId}:`, e);
      }
    }

    // Generate playback URL (CloudFront if available, otherwise S3 presigned URL)
    const s3Key = result.Item.s3Key?.S || '';
    let playbackUrl: string | undefined;
    let thumbnailUrl: string | undefined;

    if (s3Key) {
      if (cloudfrontDomain) {
        // Use CloudFront URL (bucket is private, CloudFront OAI provides access)
        playbackUrl = `https://${cloudfrontDomain}/${s3Key}`;
        // For now, use the same URL as thumbnail (can be enhanced with thumbnail generation later)
        thumbnailUrl = playbackUrl; // Placeholder - can generate thumbnail from first frame later
      } else {
        // Fallback to S3 presigned URL
        try {
          const getObjectCmd = new GetObjectCommand({
            Bucket: bucketName,
            Key: s3Key,
          });
          playbackUrl = await getSignedUrl(s3, getObjectCmd, {
            expiresIn: 60 * 60, // 1 hour
          });
          thumbnailUrl = playbackUrl; // Placeholder
        } catch (err) {
          console.warn(`Failed to generate presigned URL for ${s3Key}:`, err);
        }
      }
    }

    // Map DynamoDB item to VideoDetail
    const video: VideoDetail = {
      id: result.Item.videoId?.S || videoId,
      videoId: result.Item.videoId?.S || videoId,
      userHandle: result.Item.userHandle?.S || result.Item.userId?.S || 'unknown',
      mobId: result.Item.mobId?.S || null,
      status: (result.Item.status?.S as any) || 'uploaded',
      createdAt: result.Item.createdAt?.S || '',
      caption: result.Item.hashtags?.SS?.[0] || '', // Use first hashtag as caption
      hashtags: result.Item.hashtags?.SS || [],
      thumbnailUrl,
      playbackUrl,
      validationScore: result.Item.participationScore?.N
        ? parseFloat(result.Item.participationScore.N)
        : result.Item.validationScore?.N
        ? parseFloat(result.Item.validationScore.N)
        : undefined,
      actions: result.Item.actions?.SS || [],
      objectsScenes: result.Item.objectsScenes?.SS || [],
      timeline,
      // TwelveLabs Pegasus data
      mentionsMilk: result.Item.mentionsMilk?.BOOL,
      showsMilkObject: result.Item.showsMilkObject?.BOOL,
      showsActionAligned: result.Item.showsActionAligned?.BOOL,
      participationRationale: result.Item.participationRationale?.S,
      // TwelveLabs Marengo data
      embeddingDim: result.Item.embeddingDim?.N ? parseInt(result.Item.embeddingDim.N) : undefined,
      // Note: clusteringMethod and similarityScore would need to be stored separately or calculated
      // For now, we can infer clusteringMethod from whether embedding exists
      clusteringMethod: result.Item.embedding?.S ? 'embedding' : result.Item.mobId?.S ? 'keyword' : undefined,
    };

    return {
      statusCode: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(video),
    };
  } catch (err) {
    console.error('Error in get-video-detail', err);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};

