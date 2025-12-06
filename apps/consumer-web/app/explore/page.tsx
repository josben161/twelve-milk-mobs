'use client';

import { useEffect, useState } from 'react';
import { ExploreGrid } from '@/components/explore';
import { getApiBase } from '@/lib/api';
import type { VideoSummary, MobSummary } from '@twelve/core-types';

interface SimilarVideo {
  videoId: string;
  userHandle: string;
  mobId: string | null;
  score: number;
}

export default function ExplorePage() {
  const [videos, setVideos] = useState<VideoSummary[]>([]);
  const [mobs, setMobs] = useState<MobSummary[]>([]);
  const [mobNames, setMobNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const apiBase = getApiBase();

        // Fetch all mobs to get names
        const mobsRes = await fetch(`${apiBase}/mobs`);
        if (mobsRes.ok) {
          const mobsData = await mobsRes.json();
          setMobs(mobsData.mobs || []);
          const names: Record<string, string> = {};
          (mobsData.mobs || []).forEach((mob: MobSummary) => {
            names[mob.id] = mob.name;
          });
          setMobNames(names);
        }

        // Fetch feed for general exploration
        const feedRes = await fetch(`${apiBase}/feed?limit=50`);
        if (feedRes.ok) {
          const feedData = await feedRes.json();
          // Convert feed posts to video summaries
          const feedVideos: VideoSummary[] = (feedData.posts || []).map((post: any) => ({
            id: post.video.id,
            userHandle: post.user.handle,
            mobId: null, // Feed doesn't include mobId, we'll need to enhance this
            status: post.status,
            createdAt: post.createdAt,
            caption: post.caption,
            hashtags: post.tags,
            thumbnailUrl: post.video.thumbnailUrl,
            validationScore: undefined,
          }));
          setVideos(feedVideos);
        } else {
          throw new Error(`Failed to fetch feed (${feedRes.status})`);
        }
      } catch (err) {
        console.error('Error fetching explore data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load explore page.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] px-4">
        <div className="text-center">
          <p className="text-base font-medium text-[var(--text)] mb-2">Failed to load explore</p>
          <p className="text-sm text-[var(--text-muted)]">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-6 pt-2 transition-colors duration-300">
      {/* Minimal Header */}
      <div className="px-3 mb-2">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-xl font-bold text-[var(--text)]">Explore</h1>
          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-600 border border-indigo-500/30">
            Powered by TwelveLabs
          </span>
        </div>
        <p className="text-xs text-[var(--text-muted)]">
          Discover videos and join Milk Mobs
        </p>
      </div>

      {/* Unified Grid - Mobs and Videos Mixed */}
      <ExploreGrid videos={videos} mobs={mobs} mobNames={mobNames} loading={loading} />
    </div>
  );
}

