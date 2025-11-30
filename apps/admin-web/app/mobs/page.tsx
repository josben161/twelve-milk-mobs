'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Panel } from '@/components/ui';
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
    <>
      <div>
        <h1 className="text-2xl font-semibold text-[var(--text)]">Mobs</h1>
        <p className="mt-1.5 text-sm text-[var(--text-muted)]">
          All Milk Mob clusters and their performance metrics.
        </p>
      </div>

      {loading ? (
        <Panel>
          <div className="p-8 text-center text-sm text-[var(--text-muted)]">Loading mobs...</div>
        </Panel>
      ) : error ? (
        <Panel>
          <div className="p-8 text-center text-sm text-rose-500">Error: {error}</div>
        </Panel>
      ) : mobs.length === 0 ? (
        <Panel>
          <div className="p-8 text-center text-sm text-[var(--text-muted)]">No mobs found.</div>
        </Panel>
      ) : (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {mobs.map((mob) => (
            <Link key={mob.id} href={`/mobs/${mob.id}`}>
              <Panel className="p-6 hover:border-[var(--accent)]/50 transition-colors cursor-pointer">
                <h3 className="text-lg font-semibold mb-2 text-[var(--text)]">{mob.name}</h3>
                <p className="text-sm text-[var(--text-muted)] mb-4">{mob.description}</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-[var(--text-muted)]">Videos</p>
                    <p className="text-lg font-bold text-[var(--text)]">{mob.videoCount}</p>
                  </div>
                  {mob.exampleHashtags && mob.exampleHashtags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {mob.exampleHashtags.slice(0, 3).map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded text-[10px] font-medium"
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
              </Panel>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
