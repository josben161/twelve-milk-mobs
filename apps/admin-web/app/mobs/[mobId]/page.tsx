'use client';

import { useEffect, useState } from 'react';
import { use } from 'react';
import Link from 'next/link';
import { Panel, ClusterMap } from '@/components/ui';
import { StatusPill } from '@/components/ui';
import { getEmbeddings, type VideoEmbedding } from '@/lib/api';
import type { MobSummary, VideoSummary } from '@twelve/core-types';

export default function MobDetailPage({
  params,
}: {
  params: Promise<{ mobId: string }>;
}) {
  const { mobId } = use(params);
  const [mob, setMob] = useState<MobSummary | null>(null);
  const [videos, setVideos] = useState<VideoSummary[]>([]);
  const [embeddings, setEmbeddings] = useState<VideoEmbedding[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingEmbeddings, setLoadingEmbeddings] = useState(false);
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

  useEffect(() => {
    const fetchEmbeddings = async () => {
      if (!mobId) return;
      setLoadingEmbeddings(true);
      try {
        const data = await getEmbeddings(mobId, 200); // Fetch videos for this mob
        setEmbeddings(data.videos || []);
      } catch (err) {
        console.error('Error fetching embeddings:', err);
        // Don't set error state, visualization is optional
      } finally {
        setLoadingEmbeddings(false);
      }
    };

    if (mobId) {
      fetchEmbeddings();
    }
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

      {/* Clustering Analysis Panel */}
      {(mob.centroidDim !== undefined || mob.clusteringMethod || mob.avgSimilarityScore !== undefined) && (
        <Panel 
          title="Clustering Analysis" 
          description="Segments users into 'Milk Mobs' by activity, location, or vibe using Marengo embeddings."
        >
          <div className="space-y-6">
            {/* Campaign Goal Badge */}
            <div className="flex items-center gap-2 mb-4">
              <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-1 rounded bg-violet-500/20 text-violet-600">
                Segment
              </span>
              <span className="text-xs font-medium px-2 py-1 rounded bg-indigo-100 text-indigo-700">
                TwelveLabs Marengo
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Centroid Dimension */}
              {mob.centroidDim !== undefined && (
                <div>
                  <p className="text-sm font-medium text-[var(--text-muted)] mb-1">Centroid Embedding</p>
                  <p className="text-lg font-semibold text-[var(--text)]">
                    {mob.centroidDim}-dimensional
                  </p>
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    Vector representation for similarity search
                  </p>
                </div>
              )}

              {/* Clustering Method */}
              {mob.clusteringMethod && (
                <div>
                  <p className="text-sm font-medium text-[var(--text-muted)] mb-1">Clustering Method</p>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium ${
                      mob.clusteringMethod === 'k-means' || mob.clusteringMethod === 'similarity'
                        ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                        : 'bg-gray-100 text-gray-700 border border-gray-200'
                    }`}>
                      {mob.clusteringMethod === 'k-means' ? 'K-Means Clustering' : 
                       mob.clusteringMethod === 'similarity' ? 'Similarity-based' : 
                       'Keyword-based'}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-muted)] mt-2">
                    {mob.clusteringMethod === 'k-means' 
                      ? 'Videos clustered using k-means on Marengo embeddings'
                      : mob.clusteringMethod === 'similarity'
                      ? 'Videos assigned by similarity threshold'
                      : 'Videos grouped by keyword matching'}
                  </p>
                </div>
              )}

              {/* Average Similarity Score */}
              {mob.avgSimilarityScore !== undefined && (
                <div>
                  <p className="text-sm font-medium text-[var(--text-muted)] mb-1">Avg. Similarity</p>
                  <p className="text-lg font-semibold text-[var(--text)]">
                    {Math.round(mob.avgSimilarityScore * 100)}%
                  </p>
                  <div className="relative w-full h-2 bg-[var(--bg-subtle)] rounded-full overflow-hidden mt-2">
                    <div
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-violet-500 to-violet-600 rounded-full transition-all duration-300"
                      style={{ width: `${(mob.avgSimilarityScore * 100).toFixed(0)}%` }}
                    />
                  </div>
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    Average similarity to centroid
                  </p>
                </div>
              )}
            </div>
          </div>
        </Panel>
      )}

      {/* Mob-Specific Clustering Visualization */}
      {!loadingEmbeddings && embeddings.length > 0 && (
        <Panel 
          title="Mob Clustering Visualization" 
          description="2D projection of videos in this mob showing embedding similarity"
        >
          <ClusterMap 
            videos={embeddings} 
            mobNames={{ [mobId]: mob.name }} 
            height={400} 
          />
        </Panel>
      )}

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
