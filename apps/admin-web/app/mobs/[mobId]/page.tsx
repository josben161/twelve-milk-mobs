'use client';

import { useEffect, useState } from 'react';
import { use } from 'react';
import Link from 'next/link';
import { Panel } from '@/components/ui';
import { StatusPill } from '@/components/ui';
import type { MobSummary, VideoSummary } from '@twelve/core-types';

export default function MobDetailPage({
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
        const apiBase = process.env.NEXT_PUBLIC_API_BASE;
        if (!apiBase) {
          throw new Error('API base URL is not configured');
        }
        const res = await fetch(`${apiBase.replace(/\/$/, '')}/mobs/${mobId}`);
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
      <>
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text)]">Loading...</h1>
        </div>
      </>
    );
  }

  if (error || !mob) {
    return (
      <>
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text)]">Mob not found</h1>
          <p className="mt-1.5 text-sm text-[var(--text-muted)]">
            {error || "The mob you're looking for doesn't exist."}
          </p>
        </div>
      </>
    );
  }

  return (
    <div className="w-full space-y-10">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold mb-3 text-[var(--text)]">{mob.name}</h1>
        <p className="text-sm text-[var(--text-muted)] leading-relaxed">
          {mob.description} · {mob.videoCount} videos
        </p>
      </div>

      {/* Mob Summary */}
      <Panel>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-xs text-[var(--text-muted)] mb-1">Video Count</p>
            <p className="text-2xl font-bold text-[var(--text)]">{mob.videoCount}</p>
          </div>
          <div>
            <p className="text-xs text-[var(--text-muted)] mb-1">Mob ID</p>
            <p className="text-sm font-mono text-[var(--text)]">{mob.id}</p>
          </div>
          {mob.exampleHashtags && mob.exampleHashtags.length > 0 && (
            <div>
              <p className="text-xs text-[var(--text-muted)] mb-2">Example Hashtags</p>
              <div className="flex flex-wrap gap-1">
                {mob.exampleHashtags.map((tag, idx) => (
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
            </div>
          )}
        </div>
      </Panel>

      {/* Videos Table */}
      <Panel>
        <div className="p-4 border-b border-[var(--border-subtle)]">
          <h2 className="text-lg font-semibold text-[var(--text)]">Videos in this Mob</h2>
        </div>
        {videos.length === 0 ? (
          <div className="p-8 text-center text-sm text-[var(--text-muted)]">
            No videos in this mob yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-[var(--bg-subtle)] border-b border-[var(--border-subtle)]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">
                    Video
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">
                    Score
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">
                    Created
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {videos.map((v) => (
                  <tr
                    key={v.id}
                    className="hover:bg-[var(--bg-subtle)] transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-16 rounded-lg bg-gradient-to-br from-[var(--bg-subtle)] to-[var(--bg)] border border-[var(--border-subtle)] flex-shrink-0" />
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-semibold text-[var(--text)] truncate">
                            @{v.userHandle}
                          </span>
                          <span className="text-xs text-[var(--text-muted)] truncate mt-0.5">
                            {v.caption}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill status={v.status} />
                    </td>
                    <td className="px-4 py-3">
                      {v.validationScore != null ? (
                        <span className="text-sm font-semibold text-[var(--text)]">
                          {Math.round(v.validationScore * 100)}%
                        </span>
                      ) : (
                        <span className="text-sm text-[var(--text-soft)]">–</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-[var(--text-muted)]">
                        {new Date(v.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/videos/${v.id}`}
                        className="text-sm font-medium text-[var(--accent)] hover:text-[var(--accent)]/80 transition-colors"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
