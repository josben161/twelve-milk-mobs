'use client';

import Link from 'next/link';
import { use, useEffect, useState } from 'react';
import type { MobSummary, VideoSummary } from '@twelve/core-types';
import { VideoThumbnailCard } from '@/components/explore';
import { JoinMobButton } from '@/components/ui/JoinMobButton';
import { getApiBase } from '@/lib/api';

export default function MobFeedPage({
  params,
}: {
  params: Promise<{ mobId: string }>;
}) {
  const { mobId } = use(params);
  const [mob, setMob] = useState<MobSummary | null>(null);
  const [videos, setVideos] = useState<VideoSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMob = async () => {
      setLoading(true);
      setError(null);
      try {
        const apiBase = getApiBase();
        const res = await fetch(`${apiBase}/mobs/${mobId}`);
        if (!res.ok) {
          throw new Error(`Failed to fetch mob (${res.status})`);
        }
        const data = await res.json();
        setMob(data.mob);
        setVideos(data.videos || []);
      } catch (err) {
        console.error('Error fetching mob:', err);
        setError(err instanceof Error ? err.message : 'Failed to load mob.');
      } finally {
        setLoading(false);
      }
    };

    fetchMob();
  }, [mobId]);

  if (loading) {
    return (
      <div className="pb-6 pt-4 text-center text-sm text-[var(--text-muted)]">
        Loading mob...
      </div>
    );
  }

  if (error || !mob) {
    return (
      <div className="pb-6 pt-4 px-4">
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-soft)]/70 backdrop-blur-sm p-8 text-center">
          <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text)' }}>
            Mob not found
          </h1>
          <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
            {error || `The mob with ID ${mobId} could not be found.`}
          </p>
          <Link
            href="/mob"
            className="inline-flex items-center text-sm transition-colors"
            style={{ color: 'var(--accent)' }}
          >
            ← Back to Mobs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-6 pt-4 transition-colors duration-300">
      <Link
        href="/mob"
        className="inline-flex items-center text-sm mb-6 px-4 transition-colors"
        style={{ color: 'var(--text-muted)' }}
      >
        ← Back to Mobs
      </Link>

      {/* Hero */}
      <div className="px-4 mb-6">
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-gradient-to-br from-[var(--bg-soft)]/90 via-[var(--bg-soft)]/70 to-[var(--bg)]/50 backdrop-blur-sm p-6 shadow-lg">
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text)' }}>
            {mob.name}
          </h1>
          <p className="text-base mb-3" style={{ color: 'var(--text-muted)' }}>
            {mob.description}
          </p>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4 text-sm" style={{ color: 'var(--text-muted)' }}>
              <span>
                <span className="font-semibold" style={{ color: 'var(--text)' }}>
                  {mob.videoCount}
                </span>{' '}
                videos
              </span>
            </div>
            <JoinMobButton 
              mobId={mob.id} 
              mobName={mob.name}
              variant="default"
              size="lg"
            />
          </div>
          {mob.exampleHashtags && mob.exampleHashtags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-4">
              {mob.exampleHashtags.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-full text-[10px] font-medium"
                  style={{
                    backgroundColor: 'var(--accent-soft)',
                    color: 'var(--accent)',
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Video Grid */}
      {videos.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 px-4">
          {videos.map((video) => (
            <VideoThumbnailCard
              key={video.id}
              video={video}
              mobName={mob.name}
            />
          ))}
        </div>
      ) : (
        <div className="px-4">
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-soft)]/70 backdrop-blur-sm p-8 text-center">
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              No videos in this mob yet.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
