'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { MobSummary } from '@twelve/core-types';
import { getApiBase } from '@/lib/api';

export default function MobIndexPage() {
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

  // Sort mobs by video count for featured section
  const sortedMobs = [...mobs].sort((a, b) => b.videoCount - a.videoCount);
  const featuredMobs = sortedMobs.slice(0, 3);
  const otherMobs = sortedMobs.slice(3);

  return (
    <div className="pb-6 pt-4 transition-colors duration-300">
      <div className="px-4 mb-6">
        <div className="flex items-center gap-2 mb-2">
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text)' }}>
            Milk Mobs
          </h1>
          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-600 border border-indigo-500/30">
            TwelveLabs Marengo
          </span>
        </div>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          Discover communities of similar videos powered by AI embeddings. Join mobs based on activity, location, or vibe.
        </p>
      </div>

      {loading ? (
        <div className="p-4 text-center text-sm text-[var(--text-muted)]">Loading mobs...</div>
      ) : error ? (
        <div className="p-4 text-center text-sm text-rose-500">Error: {error}</div>
      ) : mobs.length === 0 ? (
        <div className="p-4 text-center text-sm text-[var(--text-muted)]">No mobs found.</div>
      ) : (
        <>
          {/* Featured Mobs Section */}
          {featuredMobs.length > 0 && (
            <div className="mb-8">
              <div className="px-4 mb-4">
                <h2 className="text-lg font-semibold text-[var(--text)]">Featured Mobs</h2>
                <p className="text-xs text-[var(--text-muted)] mt-1">Most active communities</p>
              </div>
              <div className="flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide">
                {featuredMobs.map((mob) => (
                  <Link
                    key={mob.id}
                    href={`/mob/${mob.id}`}
                    className="flex-shrink-0 w-64 rounded-xl border border-[var(--border-subtle)] bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 p-5 hover:border-[var(--accent)]/50 hover:shadow-lg transition-all duration-200"
                  >
                    <div className="text-3xl font-bold mb-2 text-[var(--text)]">{mob.videoCount}</div>
                    <h3 className="text-base font-semibold mb-2 text-[var(--text)]">{mob.name}</h3>
                    <p className="text-xs text-[var(--text-muted)] line-clamp-2 mb-3">{mob.description}</p>
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
                    <div className="mt-3 text-xs font-medium text-[var(--accent)]">Explore →</div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* All Mobs Grid */}
          {otherMobs.length > 0 && (
            <div>
              <div className="px-4 mb-4">
                <h2 className="text-lg font-semibold text-[var(--text)]">All Mobs</h2>
              </div>
              <div className="grid grid-cols-1 gap-4 px-4">
                {otherMobs.map((mob) => (
                  <Link
                    key={mob.id}
                    href={`/mob/${mob.id}`}
                    className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-soft)]/70 backdrop-blur-sm p-5 shadow-lg transition-all duration-200 hover:border-[var(--accent)]/50 hover:shadow-xl"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
                            {mob.name}
                          </h3>
                          <span className="text-sm font-semibold text-[var(--accent)]">
                            {mob.videoCount} videos
                          </span>
                        </div>
                        <p className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>
                          {mob.description}
                        </p>
                        {mob.exampleHashtags && mob.exampleHashtags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {mob.exampleHashtags.slice(0, 5).map((tag, idx) => (
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
                  </Link>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

