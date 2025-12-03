'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Panel, StatusPill, EmptyState } from '@/components/ui';
import { deleteVideo } from '@/lib/api';
import type { VideoSummary } from '@twelve/core-types';

export default function VideosPage() {
  const [videos, setVideos] = useState<VideoSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingVideoId, setDeletingVideoId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    const fetchVideos = async () => {
      setLoading(true);
      setError(null);
      try {
        const apiBase = process.env.NEXT_PUBLIC_API_BASE;
        if (!apiBase) {
          throw new Error('API base URL is not configured');
        }
        const res = await fetch(`${apiBase.replace(/\/$/, '')}/admin/videos`);
        if (!res.ok) {
          throw new Error(`Failed to fetch videos (${res.status})`);
        }
        const data = await res.json();
        setVideos(data.videos || []);
      } catch (err) {
        console.error('Error fetching videos:', err);
        setError(err instanceof Error ? err.message : 'Failed to load videos.');
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, []);

  const handleDelete = async (videoId: string) => {
    if (confirmDeleteId !== videoId) {
      setConfirmDeleteId(videoId);
      return;
    }

    setDeletingVideoId(videoId);
    setError(null);
    try {
      await deleteVideo(videoId);
      // Remove video from list
      setVideos(videos.filter(v => v.id !== videoId));
      setConfirmDeleteId(null);
    } catch (err) {
      console.error('Error deleting video:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete video.');
    } finally {
      setDeletingVideoId(null);
    }
  };

  const handleCancelDelete = () => {
    setConfirmDeleteId(null);
  };

  return (
    <div className="w-full space-y-10">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold mb-3 text-[var(--text)]">Videos</h1>
        <p className="text-sm text-[var(--text-muted)] leading-relaxed">
          All campaign submissions with current validation status and TwelveLabs analysis.
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-lg border border-[var(--error)]/20 bg-[var(--error)]/10 p-4">
          <p className="text-sm text-[var(--error)]">{error}</p>
        </div>
      )}

      {/* Videos Table */}
      <Panel>
        {loading ? (
          <div className="p-8 text-center text-sm text-[var(--text-muted)]">Loading videos...</div>
        ) : error ? (
          <EmptyState
            title="Error loading videos"
            description={error}
          />
        ) : videos.length === 0 ? (
          <EmptyState
            title="No videos found"
            description="Videos will appear here once they are uploaded and processed."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-[var(--bg-subtle)] border-b border-[var(--border-subtle)]">
                <tr>
                  <th className="px-8 py-5 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">
                    Video
                  </th>
                  <th className="px-8 py-5 text-center text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">
                    Mob
                  </th>
                  <th className="px-8 py-5 text-center text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">
                    Status
                  </th>
                  <th className="px-8 py-5 text-center text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">
                    Score
                  </th>
                  <th className="px-8 py-5 text-center text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">
                    Created
                  </th>
                  <th className="px-8 py-5 text-center text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">
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
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        {v.thumbnailUrl ? (
                          <div
                            className="h-12 w-16 rounded-lg border border-[var(--border-subtle)] flex-shrink-0 bg-cover bg-center overflow-hidden"
                            style={{ backgroundImage: `url(${v.thumbnailUrl})` }}
                          />
                        ) : (
                          <div className="h-12 w-16 rounded-lg bg-gradient-to-br from-[var(--bg-subtle)] to-[var(--bg)] border border-[var(--border-subtle)] flex-shrink-0" />
                        )}
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-semibold text-[var(--text)] truncate">
                            @{v.userHandle}
                          </span>
                          <span className="text-xs text-[var(--text-muted)] truncate mt-0.5 leading-relaxed">
                            {v.caption || 'No caption'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <span className="text-sm text-[var(--text)]">{v.mobId || '–'}</span>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <StatusPill status={v.status} />
                    </td>
                    <td className="px-8 py-5 text-center">
                      {v.validationScore != null ? (
                        <span className="text-sm font-semibold text-[var(--text)]">
                          {Math.round(v.validationScore * 100)}%
                        </span>
                      ) : (
                        <span className="text-sm text-[var(--text-soft)]">–</span>
                      )}
                    </td>
                    <td className="px-8 py-5 text-center">
                      <span className="text-sm text-[var(--text-muted)]">
                        {new Date(v.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <div className="flex items-center justify-center gap-3">
                        <Link
                          href={`/videos/${v.id}`}
                          className="text-sm font-medium text-[var(--accent)] hover:text-[var(--accent)]/80 transition-colors"
                        >
                          View
                        </Link>
                        {confirmDeleteId === v.id ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleDelete(v.id)}
                              disabled={deletingVideoId === v.id}
                              className="text-xs px-2 py-1 rounded text-white bg-[var(--error)] hover:bg-[var(--error)]/80 transition-colors disabled:opacity-50"
                            >
                              {deletingVideoId === v.id ? 'Deleting...' : 'Confirm'}
                            </button>
                            <button
                              onClick={handleCancelDelete}
                              disabled={deletingVideoId === v.id}
                              className="text-xs px-2 py-1 rounded text-[var(--text-muted)] bg-[var(--bg-subtle)] hover:bg-[var(--bg-subtle)]/80 transition-colors disabled:opacity-50"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleDelete(v.id)}
                            disabled={deletingVideoId === v.id}
                            className="text-xs px-2 py-1 rounded text-[var(--error)] hover:bg-[var(--error)]/10 transition-colors disabled:opacity-50"
                          >
                            {deletingVideoId === v.id ? 'Deleting...' : 'Delete'}
                          </button>
                        )}
                      </div>
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
