const getApiBase = () => {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE;
  if (!apiBase) {
    throw new Error('API base URL is not configured');
  }
  return apiBase.replace(/\/$/, '');
};

export interface FeedPost {
  id: string;
  user: {
    handle: string;
    avatarColor: string;
  };
  mobName: string | null;
  location: string | null;
  tags: string[];
  caption: string;
  status: string;
  createdAt: string;
  video: {
    id: string;
    videoUrl?: string;
    thumbnailUrl?: string;
  };
}

export interface FeedResponse {
  posts: FeedPost[];
  lastKey: string | null;
}

export async function getFeed(limit?: number, lastKey?: string): Promise<FeedResponse> {
  const apiBase = getApiBase();
  const params = new URLSearchParams();
  if (limit) params.append('limit', limit.toString());
  if (lastKey) params.append('lastKey', lastKey);

  const url = `${apiBase}/feed${params.toString() ? `?${params.toString()}` : ''}`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`Failed to fetch feed (${res.status})`);
  }

  return res.json();
}

