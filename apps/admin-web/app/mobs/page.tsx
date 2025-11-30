'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Panel, EmptyState } from '@/components/ui';
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
    <div className="w-full space-y-10">
      <div>
        <h1 className="text-2xl font-semibold mb-3 text-[var(--text)]">Mobs</h1>
        <p className="text-sm text-[var(--text-muted)] leading-relaxed">
          All Milk Mob clusters and their performance metrics.
        </p>
      </div>

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
            description="Mobs will appear here once videos are clustered and grouped."
          />
        </Panel>
      ) : (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {mobs.map((mob) => (
            <Link key={mob.id} href={`/mobs/${mob.id}`}>
              <Panel className="hover:border-[var(--accent)]/50 transition-colors cursor-pointer">
                <div className="p-8">
                  <h3 className="text-lg font-semibold mb-3 text-[var(--text)]">{mob.name}</h3>
                  <p className="text-sm text-[var(--text-muted)] mb-6 leading-relaxed">{mob.description}</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-[var(--text-muted)] mb-2">Videos</p>
                      <p className="text-lg font-semibold text-[var(--text)]">{mob.videoCount}</p>
                    </div>
                    {mob.exampleHashtags && mob.exampleHashtags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {mob.exampleHashtags.slice(0, 3).map((tag, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 rounded-lg text-xs font-medium bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--border-subtle)]"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </Panel>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
