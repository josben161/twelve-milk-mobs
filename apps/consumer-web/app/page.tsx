// apps/consumer-web/app/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { PostCard } from '@/components/ui';
import { getFeed, type FeedPost } from '@/lib/api';

export default function HomePage() {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFeed = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getFeed(20);
        setPosts(data.posts || []);
      } catch (err) {
        console.error('Error fetching feed:', err);
        setError(err instanceof Error ? err.message : 'Failed to load feed.');
      } finally {
        setLoading(false);
      }
    };

    fetchFeed();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] transition-colors duration-300">
        <div className="text-sm text-[var(--text-muted)]">Loading feed...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] px-4 transition-colors duration-300">
        <div className="text-sm text-[var(--text-muted)] mb-2">Failed to load feed</div>
        <div className="text-xs text-[var(--text-soft)]">{error}</div>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] px-4 transition-colors duration-300">
        <div className="text-center">
          <p className="text-base font-medium text-[var(--text)] mb-2">No videos yet</p>
          <p className="text-sm text-[var(--text-muted)]">
            Be the first to share your milk mob moment!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col transition-colors duration-300">
      {posts.map((post) => (
        <PostCard
          key={post.id}
          video={post.video}
          user={post.user}
          caption={post.caption}
          hashtags={post.tags}
          timestamp={post.createdAt}
          mobName={post.mobName || undefined}
          location={post.location || undefined}
        />
      ))}
    </div>
  );
}
