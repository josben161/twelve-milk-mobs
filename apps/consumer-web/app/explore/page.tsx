'use client';

import { useEffect, useState } from 'react';
import { ExploreGrid, SimilarVideosSection } from '@/components/explore';
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
    <div className="pb-6 pt-4 transition-colors duration-300">
      {/* Header */}
      <div className="px-4 mb-6">
        <div className="flex items-center gap-2 mb-2">
          <h1 className="text-2xl font-bold text-[var(--text)]">Explore</h1>
          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-600 border border-indigo-500/30">
            Powered by TwelveLabs
          </span>
        </div>
        <p className="text-sm text-[var(--text-muted)]">
          Discover videos and join Milk Mobs based on similar content using AI-powered semantic search
        </p>
      </div>

      {/* Featured Mobs Section */}
      {mobs.length > 0 && (
        <div className="mb-8">
          <div className="px-4 mb-4">
            <h2 className="text-lg font-semibold text-[var(--text)]">Featured Mobs</h2>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Groups of similar videos powered by TwelveLabs Marengo
            </p>
          </div>
          <div className="flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide">
            {mobs.slice(0, 5).map((mob) => (
              <a
                key={mob.id}
                href={`/mob/${mob.id}`}
                className="flex-shrink-0 w-48 rounded-xl border border-[var(--border-subtle)] bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 p-4 hover:border-[var(--accent)]/50 hover:shadow-lg transition-all duration-200"
              >
                <div className="text-2xl font-bold mb-1 text-[var(--text)]">{mob.videoCount}</div>
                <div className="text-sm font-semibold mb-1 text-[var(--text)]">{mob.name}</div>
                <div className="text-xs text-[var(--text-muted)] line-clamp-2 mb-3">{mob.description}</div>
                {mob.exampleHashtags && mob.exampleHashtags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {mob.exampleHashtags.slice(0, 3).map((tag, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--accent-soft)] text-[var(--accent)]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Main Video Grid */}
      <div className="mb-8">
        <div className="px-4 mb-4">
          <h2 className="text-lg font-semibold text-[var(--text)]">All Videos</h2>
        </div>
        <ExploreGrid videos={videos} mobNames={mobNames} loading={loading} />
      </div>
    </div>
  );
}

