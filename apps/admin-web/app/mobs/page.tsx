'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Panel, EmptyState } from '@/components/ui';
import { getApiBase } from '@/lib/api';
import type { MobSummary } from '@twelve/core-types';

export default function MobsPage() {
  const [mobs, setMobs] = useState<MobSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMobs = async () => {
      setLoading(true);
      setError(null);
      try {
        const apiBase = getApiBase();
        const res = await fetch(`${apiBase}/mobs`);
        if (!res.ok) {
          throw new Error(`Failed to fetch mobs (${res.status})`);
        }
        const data = await res.json();
        setMobs(data.mobs || []);
      } catch (err) {
        console.error('Error fetching mobs:', err);
        setError(err instanceof Error ? err.message : 'Failed to load mobs.');
      } finally {
        setLoading(false);
      }
    };

    fetchMobs();
  }, []);

  // Calculate summary stats
  const totalVideos = mobs.reduce((sum, mob) => sum + mob.videoCount, 0);
  const totalMobs = mobs.length;
  const avgVideosPerMob = totalMobs > 0 ? Math.round(totalVideos / totalMobs) : 0;
  const largestMob = mobs.length > 0 ? mobs.reduce((max, mob) => mob.videoCount > max.videoCount ? mob : max, mobs[0]) : null;

  return (
    <div className="w-full space-y-10">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold mb-3 text-[var(--text)]">Milk Mobs</h1>
        <p className="text-sm text-[var(--text-muted)] leading-relaxed">
          Video clusters segmented by activity, location, and vibe using TwelveLabs Marengo embeddings. Users can explore similar videos within each mob.
        </p>
      </div>

      {/* Stats Overview */}
      {!loading && !error && mobs.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-soft)] p-4">
            <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
              Total Mobs
            </p>
            <p className="text-2xl font-semibold" style={{ color: 'var(--text)' }}>
              {totalMobs}
            </p>
          </div>
          <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-soft)] p-4">
            <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
              Total Videos
            </p>
            <p className="text-2xl font-semibold" style={{ color: 'var(--text)' }}>
              {totalVideos}
            </p>
          </div>
          <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-soft)] p-4">
            <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
              Avg Videos/Mob
            </p>
            <p className="text-2xl font-semibold" style={{ color: 'var(--text)' }}>
              {avgVideosPerMob}
            </p>
          </div>
          {largestMob && (
            <div className="rounded-lg border border-[var(--border-subtle)] bg-gradient-to-br from-indigo-50 to-indigo-100 p-4">
              <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
                Largest Mob
              </p>
              <p className="text-lg font-semibold mb-0.5 text-indigo-700">
                {largestMob.name}
              </p>
              <p className="text-xs text-indigo-600">
                {largestMob.videoCount} videos
              </p>
            </div>
          )}
        </div>
      )}

      {/* Mobs Grid */}
      {loading ? (
        <Panel>
          <div className="p-8 text-center text-sm text-[var(--text-muted)]">Loading mobs...</div>
        </Panel>
      ) : error ? (
        <Panel>
          <EmptyState
            title="Error loading mobs"
            description={error}
          />
        </Panel>
      ) : mobs.length === 0 ? (
        <Panel>
          <EmptyState
            title="No mobs found"
            description="Mobs will appear here once videos are clustered and grouped using TwelveLabs Marengo embeddings."
          />
        </Panel>
      ) : (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {mobs.map((mob) => (
            <Link key={mob.id} href={`/mobs/${mob.id}`}>
              <div className="group relative rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-soft)] hover:border-[var(--accent)]/50 hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden">
                {/* Card Header with Gradient */}
                <div className="relative h-32 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 border-b border-[var(--border-subtle)]">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-4xl font-bold mb-1" style={{ color: 'var(--text)' }}>
                        {mob.videoCount}
                      </div>
                      <div className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                        Videos
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-6 space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2 text-[var(--text)] group-hover:text-[var(--accent)] transition-colors">
                      {mob.name}
                    </h3>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                      {mob.description}
                    </p>
                  </div>

                  {/* Hashtags */}
                  {mob.exampleHashtags && mob.exampleHashtags.length > 0 && (
                    <div>
                      <p className="text-xs font-medium mb-2 uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                        Top Hashtags
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {mob.exampleHashtags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--border-subtle)] hover:bg-[var(--accent-soft)]/80 transition-colors"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* View Details Link */}
                  <div className="flex items-center justify-between pt-2 border-t border-[var(--border-subtle)]">
                    <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                      View details
                    </span>
                    <svg 
                      className="w-4 h-4 transition-transform group-hover:translate-x-1" 
                      style={{ color: 'var(--accent)' }}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
