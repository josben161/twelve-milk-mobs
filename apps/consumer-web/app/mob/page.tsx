'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { MobSummary } from '@twelve/core-types';

export default function MobIndexPage() {
  const [mobs, setMobs] = useState<MobSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMobs = async () => {
      setLoading(true);
      setError(null);
      try {
        const apiBase = process.env.NEXT_PUBLIC_API_BASE;
        if (!apiBase) {
          throw new Error('API base URL is not configured');
        }
        const res = await fetch(`${apiBase.replace(/\/$/, '')}/mobs`);
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

  return (
    <div className="pb-6 pt-4 transition-colors duration-300">
      <div className="px-4 mb-6">
        <h1 className="text-2xl font-bold tracking-tight mb-2" style={{ color: 'var(--text)' }}>
          Milk Mobs
        </h1>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          Discover communities of similar videos
        </p>
      </div>

      {loading ? (
        <div className="p-4 text-center text-sm text-[var(--text-muted)]">Loading mobs...</div>
      ) : error ? (
        <div className="p-4 text-center text-sm text-rose-500">Error: {error}</div>
      ) : mobs.length === 0 ? (
        <div className="p-4 text-center text-sm text-[var(--text-muted)]">No mobs found.</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 px-4">
          {mobs.map((mob) => (
            <Link
              key={mob.id}
              href={`/mob/${mob.id}`}
              className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-soft)]/70 backdrop-blur-sm p-4 shadow-lg transition-all duration-200 hover:border-[var(--accent)]/50 hover:shadow-xl"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-1" style={{ color: 'var(--text)' }}>
                    {mob.name}
                  </h3>
                  <p className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>
                    {mob.description}
                  </p>
                  <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--text-muted)' }}>
                    <span>
                      <span className="font-semibold text-[var(--text)]">{mob.videoCount}</span> videos
                    </span>
                  </div>
                  {mob.exampleHashtags && mob.exampleHashtags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
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
      )}
    </div>
  );
}

