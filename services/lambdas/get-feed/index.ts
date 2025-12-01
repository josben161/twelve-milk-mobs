import type { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { DynamoDBClient, ScanCommand, GetItemCommand } from '@aws-sdk/client-dynamodb';

const videosTableName = process.env.VIDEOS_TABLE_NAME!;
const mobsTableName = process.env.MOBS_TABLE_NAME!;
const cloudfrontDomain = process.env.CLOUDFRONT_DISTRIBUTION_DOMAIN;

const ddb = new DynamoDBClient({});

// CORS headers for all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Credentials': 'true',
};

// Generate avatar color from user handle hash
function getAvatarColor(handle: string): string {
  const colors = ['indigo', 'emerald', 'rose'];
  const hash = handle.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
}

// Format timestamp as relative time
function formatRelativeTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return `${Math.floor(diffDays / 7)}w`;
}

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    const limit = parseInt(event.queryStringParameters?.limit || '20', 10);
    const lastKey = event.queryStringParameters?.lastKey;

    // Scan videos table for all videos (any status)
    const scanParams: any = {
      TableName: videosTableName,
      Limit: limit + 1, // Fetch one extra to determine if there's more
    };

    if (lastKey) {
      try {
        scanParams.ExclusiveStartKey = JSON.parse(decodeURIComponent(lastKey));
      } catch (e) {
        console.warn('Failed to parse lastKey:', e);
      }
    }

    const result = await ddb.send(new ScanCommand(scanParams));

    if (!result.Items || result.Items.length === 0) {
      return {
        statusCode: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ posts: [], lastKey: null }),
      };
    }

    // Check if there are more items
    const hasMore = result.Items.length > limit;
    const items = hasMore ? result.Items.slice(0, limit) : result.Items;
    const nextLastKey = hasMore && result.LastEvaluatedKey
      ? encodeURIComponent(JSON.stringify(result.LastEvaluatedKey))
      : null;

    // Fetch mob names for videos that have mobId
    const mobIds = new Set<string>();
    items.forEach((item) => {
      if (item.mobId?.S) {
        mobIds.add(item.mobId.S);
      }
    });

    // Batch fetch mobs
    const mobMap = new Map<string, string>();
    for (const mobId of mobIds) {
      try {
        const mobResult = await ddb.send(
          new GetItemCommand({
            TableName: mobsTableName,
            Key: {
              mobId: { S: mobId },
            },
          })
        );
        if (mobResult.Item?.name?.S) {
          mobMap.set(mobId, mobResult.Item.name.S);
        }
      } catch (err) {
        console.warn(`Failed to fetch mob ${mobId}:`, err);
      }
    }

    // Transform to feed post format
    const posts = await Promise.all(
      items.map(async (item) => {
        const videoId = item.videoId?.S || '';
        const userHandle = item.userHandle?.S || item.userId?.S || 'unknown';
        const mobId = item.mobId?.S || null;
        const s3Key = item.s3Key?.S || '';
        const hashtags = item.hashtags?.SS || [];
        const caption = hashtags.length > 0 ? hashtags.join(' ') : '';
        const createdAt = item.createdAt?.S || new Date().toISOString();
        const status = item.status?.S || 'uploaded';

        // Generate video URL
        const videoUrl = s3Key && cloudfrontDomain
          ? `https://${cloudfrontDomain}/${s3Key}`
          : undefined;

        // Get thumbnail URL from DynamoDB, or fallback to constructed URL
        const thumbnailUrlFromDb = item.thumbnailUrl?.S || '';
        const thumbnailUrl = thumbnailUrlFromDb || (s3Key && cloudfrontDomain
          ? `https://${cloudfrontDomain}/thumbnails/${videoId}.jpg`
          : videoUrl);

        return {
          id: videoId,
          user: {
            handle: userHandle,
            avatarColor: getAvatarColor(userHandle),
          },
          mobName: mobId ? mobMap.get(mobId) || null : null,
          location: null, // Location can be added later from metadata
          tags: hashtags,
          caption,
          status,
          createdAt: formatRelativeTime(createdAt),
          video: {
            id: videoId,
            videoUrl,
            thumbnailUrl: thumbnailUrl || videoUrl,
          },
        };
      })
    );

    // Sort by createdAt (already sorted by DynamoDB scan, but ensure descending)
    posts.sort((a, b) => {
      // Parse relative time back to approximate timestamp for sorting
      // This is approximate but works for feed ordering
      const aTime = items.find((item) => item.videoId?.S === a.id)?.createdAt?.S || '';
      const bTime = items.find((item) => item.videoId?.S === b.id)?.createdAt?.S || '';
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    });

    return {
      statusCode: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        posts,
        lastKey: nextLastKey,
      }),
    };
  } catch (err) {
    console.error('Error in get-feed', err);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};

