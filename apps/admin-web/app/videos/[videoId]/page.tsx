'use client';

import { useEffect, useState } from 'react';
import { use } from 'react';
import { Panel } from '@/components/ui';
import { StatusPill } from '@/components/ui';
import type { VideoDetail } from '@twelve/core-types';

export default function VideoDetailPage({
  params,
}: {
  params: Promise<{ videoId: string }>;
}) {
  const { videoId } = use(params);
  const [video, setVideo] = useState<VideoDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVideo = async () => {
      setLoading(true);
      setError(null);
      try {
        const apiBase = process.env.NEXT_PUBLIC_API_BASE;
        if (!apiBase) {
          throw new Error('API base URL is not configured');
        }
        const res = await fetch(`${apiBase.replace(/\/$/, '')}/videos/${videoId}`);
        if (!res.ok) {
          throw new Error(`Failed to fetch video (${res.status})`);
        }
        const data = await res.json();
        setVideo(data);
      } catch (err) {
        console.error('Error fetching video:', err);
        setError(err instanceof Error ? err.message : 'Failed to load video.');
      } finally {
        setLoading(false);
      }
    };

    fetchVideo();
  }, [videoId]);

  if (loading) {
    return (
      <>
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text)]">Loading...</h1>
        </div>
      </>
    );
  }

  if (error || !video) {
    return (
      <>
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text)]">Video not found</h1>
          <p className="mt-1.5 text-sm text-[var(--text-muted)]">
            {error || "The video you're looking for doesn't exist."}
          </p>
        </div>
      </>
    );
  }

  const timeline = video.timeline || [];

  return (
    <>
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold text-[var(--text)]">Video analysis</h1>
        <p className="mt-1.5 text-sm text-[var(--text-muted)]">
          @{video.userHandle} · {video.mobId || 'No mob'} · {new Date(video.createdAt).toLocaleDateString()}
        </p>
      </div>

      {/* Two Column Layout */}
      <section className="grid gap-4 grid-cols-1 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        {/* Left Column */}
        <div className="space-y-4">
          {/* Video Preview Panel */}
          <Panel className="p-6">
            <div className="aspect-[4/5] rounded-lg bg-gradient-to-br from-[var(--bg-subtle)] to-[var(--bg)] border border-[var(--border-subtle)] mb-4 flex items-center justify-center">
              <span className="text-sm text-[var(--text-muted)]">Video preview</span>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-semibold text-[var(--text)] mb-1">Caption</p>
                <p className="text-sm text-[var(--text-muted)]">{video.caption}</p>
              </div>
              {video.hashtags && video.hashtags.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-[var(--text)] mb-2">Hashtags</p>
                  <div className="flex flex-wrap gap-2">
                    {video.hashtags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--border-subtle)]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {video.location && (
                <div>
                  <p className="text-sm font-semibold text-[var(--text)] mb-1">Location</p>
                  <p className="text-sm text-[var(--text-muted)]">{video.location}</p>
                </div>
              )}
            </div>
          </Panel>

          {/* Semantic Timeline Panel */}
          {timeline.length > 0 && (
            <Panel className="p-6">
              <div className="mb-4">
                <h2 className="text-sm font-semibold text-[var(--text)] mb-1">Semantic timeline</h2>
                <p className="text-xs text-[var(--text-muted)]">
                  Key moments detected by TwelveLabs analysis.
                </p>
              </div>
              <div className="space-y-3">
                {timeline.map((entry, index) => {
                  const minutes = Math.floor(entry.timestamp / 60);
                  const seconds = Math.floor(entry.timestamp % 60);
                  const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
                  
                  return (
                    <div key={index} className="flex gap-4">
                      <div className="flex-shrink-0 w-16">
                        <span className="text-xs font-medium text-[var(--text-muted)]">{timeString}</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-[var(--text)]">{entry.description}</p>
                        {entry.score !== undefined && (
                          <p className="text-[10px] text-[var(--text-muted)] mt-1">
                            Relevance: {(entry.score * 100).toFixed(0)}%
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Panel>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          {/* TwelveLabs Summary Panel */}
          <Panel className="p-6">
            <div className="mb-4">
              <h2 className="text-sm font-semibold text-[var(--text)] mb-1">TwelveLabs summary</h2>
              <p className="text-xs text-[var(--text-muted)]">
                AI-detected actions, objects, and scenes.
              </p>
            </div>
            <div className="space-y-4">
              {video.actions && video.actions.length > 0 && (
                <div>
                  <p className="text-xs text-[var(--text-muted)] mb-2">Actions detected</p>
                  <div className="flex flex-wrap gap-2">
                    {video.actions.map((action) => (
                      <span
                        key={action}
                        className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--border-subtle)]"
                      >
                        {action}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {video.objectsScenes && video.objectsScenes.length > 0 && (
                <div>
                  <p className="text-xs text-[var(--text-muted)] mb-2">Objects & scenes</p>
                  <div className="flex flex-wrap gap-2">
                    {video.objectsScenes.map((item) => (
                      <span
                        key={item}
                        className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--border-subtle)]"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {(!video.actions || video.actions.length === 0) && (!video.objectsScenes || video.objectsScenes.length === 0) && (
                <p className="text-xs text-[var(--text-muted)]">No analysis data available yet.</p>
              )}
            </div>
          </Panel>

          {/* Timeline Highlights Panel */}
          {video.timeline && video.timeline.length > 0 && (
            <Panel className="p-6">
              <div className="mb-4">
                <h2 className="text-sm font-semibold text-[var(--text)] mb-1">Timeline highlights</h2>
                <p className="text-xs text-[var(--text-muted)]">
                  Key moments extracted from video analysis.
                </p>
              </div>
              <div className="space-y-2">
                {video.timeline.map((highlight, idx) => {
                  const minutes = Math.floor(highlight.timestamp / 60);
                  const seconds = Math.floor(highlight.timestamp % 60);
                  const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
                  
                  return (
                    <div
                      key={idx}
                      className="flex items-start gap-3 p-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)]"
                    >
                      <div className="flex-shrink-0">
                        <span className="text-xs font-medium text-[var(--accent)]">{timeString}</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-[var(--text)]">{highlight.description}</p>
                        {highlight.score !== undefined && (
                          <p className="text-[10px] text-[var(--text-muted)] mt-1">
                            Relevance: {(highlight.score * 100).toFixed(0)}%
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Panel>
          )}

          {/* Decision Inputs Panel */}
          <Panel className="p-6">
            <div className="mb-4">
              <h2 className="text-sm font-semibold text-[var(--text)] mb-1">Decision inputs</h2>
              <p className="text-xs text-[var(--text-muted)]">
                Validation score and status determination.
              </p>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0">
                  <div className="h-16 w-16 rounded-full bg-[var(--accent-soft)] border-2 border-[var(--accent)] flex items-center justify-center">
                    <span className="text-lg font-bold text-[var(--accent)]">
                      {video.validationScore != null ? Math.round(video.validationScore * 100) : '–'}
                    </span>
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-[var(--text)] mb-1">Validation score</p>
                  <StatusPill status={video.status} />
                </div>
              </div>
              <div>
                <p className="text-sm text-[var(--text-muted)]">
                  {video.status === 'validated'
                    ? 'This video matches the campaign brief and has been approved for the feed.'
                    : video.status === 'processing'
                    ? 'This video is currently being analyzed and validated.'
                    : 'This video did not meet the campaign requirements and was rejected.'}
                </p>
              </div>
            </div>
          </Panel>
        </div>
      </section>
    </>
  );
}
