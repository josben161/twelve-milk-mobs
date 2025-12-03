'use client';

import { useEffect, useState } from 'react';
import { use } from 'react';
import { useRouter } from 'next/navigation';
import { Panel, ExecutionGraph, VideoPlayer } from '@/components/ui';
import { StatusPill } from '@/components/ui';
import type { VideoDetail } from '@twelve/core-types';
import { getApiBase, getExecutionHistory, deleteVideo, type ExecutionGraph as ExecutionGraphType } from '@/lib/api';

export default function VideoDetailPage({
  params,
}: {
  params: Promise<{ videoId: string }>;
}) {
  const { videoId } = use(params);
  const router = useRouter();
  const [video, setVideo] = useState<VideoDetail | null>(null);
  const [executionGraph, setExecutionGraph] = useState<ExecutionGraphType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [executionLoading, setExecutionLoading] = useState(false);
  const [executionError, setExecutionError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [debugInfo, setDebugInfo] = useState<{
    show: boolean;
    requestUrl?: string;
    requestStatus?: number;
    responseData?: any;
    error?: string;
  }>({ show: false });

  useEffect(() => {
    const fetchVideo = async () => {
      setLoading(true);
      setError(null);
      try {
        const apiBase = getApiBase();
        const res = await fetch(`${apiBase}/videos/${videoId}`);
        if (!res.ok) {
          throw new Error(`Failed to fetch video (${res.status})`);
        }
        const data = await res.json();
        setVideo(data);

        // Fetch execution history
        setExecutionLoading(true);
        setExecutionError(null);
        try {
          const apiBase = getApiBase();
          const requestUrl = `${apiBase}/execution-history?videoId=${encodeURIComponent(videoId)}`;
          
          console.log('[VideoDetailPage] Fetching execution history for videoId:', videoId);
          console.log('[VideoDetailPage] Request URL:', requestUrl);
          
          setDebugInfo({
            show: true,
            requestUrl,
            requestStatus: undefined,
            responseData: undefined,
            error: undefined,
          });
          
          const executionData = await getExecutionHistory(videoId);
          console.log('[VideoDetailPage] Execution data received:', executionData);
          
          setDebugInfo(prev => ({
            ...prev,
            requestStatus: 200,
            responseData: executionData,
          }));
          
          if (executionData.execution) {
            console.log('[VideoDetailPage] Setting execution graph with', executionData.execution.steps.length, 'steps');
            setExecutionGraph(executionData.execution);
          } else {
            console.warn('[VideoDetailPage] No execution found for video:', videoId);
            setExecutionError('No Step Functions execution found for this video. The video may not have been processed yet.');
          }
        } catch (execErr) {
          console.error('[VideoDetailPage] Failed to fetch execution history:', execErr);
          const errorMessage = execErr instanceof Error ? execErr.message : 'Failed to load execution history';
          setExecutionError(errorMessage);
          
          setDebugInfo(prev => ({
            ...prev,
            requestStatus: execErr instanceof Error && 'status' in execErr ? (execErr as any).status : undefined,
            error: errorMessage,
          }));
          // Don't fail the page if execution history is unavailable
        } finally {
          setExecutionLoading(false);
        }
      } catch (err) {
        console.error('Error fetching video:', err);
        setError(err instanceof Error ? err.message : 'Failed to load video.');
      } finally {
        setLoading(false);
      }
    };

    fetchVideo();
  }, [videoId]);

  const handleDelete = async () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      return;
    }

    setDeleting(true);
    setError(null);
    try {
      await deleteVideo(videoId);
      // Redirect to videos list after successful deletion
      router.push('/videos');
    } catch (err) {
      console.error('Error deleting video:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete video.');
      setShowDeleteConfirm(false);
    } finally {
      setDeleting(false);
    }
  };

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
    <div className="w-full space-y-12">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold mb-3 text-[var(--text)]">Video analysis</h1>
          <p className="text-sm text-[var(--text-muted)] leading-relaxed">
            @{video.userHandle} · {video.mobId || 'No mob'} · {new Date(video.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {showDeleteConfirm ? (
            <div className="flex items-center gap-2">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-[var(--error)] hover:bg-[var(--error)]/80 transition-colors disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="px-4 py-2 rounded-lg text-sm font-medium text-[var(--text-muted)] bg-[var(--bg-subtle)] hover:bg-[var(--bg-subtle)]/80 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-4 py-2 rounded-lg text-sm font-medium text-[var(--error)] hover:bg-[var(--error)]/10 transition-colors disabled:opacity-50"
            >
              Delete Video
            </button>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-lg border border-[var(--error)]/20 bg-[var(--error)]/10 p-4">
          <p className="text-sm text-[var(--error)]">{error}</p>
        </div>
      )}

      {/* Two Column Layout */}
      <section className="grid gap-6 grid-cols-1 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        {/* Left Column */}
        <div className="space-y-8">
          {/* Video Preview Panel */}
          <Panel>
            {video.playbackUrl ? (
              <div className="mb-6">
                <VideoPlayer 
                  videoUrl={video.playbackUrl} 
                  thumbnailUrl={video.thumbnailUrl || undefined}
                  autoplay={false}
                  muted={false}
                  className="w-full"
                />
              </div>
            ) : (
              <div className="aspect-[4/5] rounded-lg bg-gradient-to-br from-[var(--bg-subtle)] to-[var(--bg)] border border-[var(--border-subtle)] mb-6 flex items-center justify-center">
                <span className="text-sm text-[var(--text-muted)]">Video preview unavailable</span>
              </div>
            )}
            <div className="space-y-6">
              <div>
                <p className="text-sm font-semibold text-[var(--text)] mb-3">Caption</p>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed">{video.caption}</p>
              </div>
              {video.hashtags && video.hashtags.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-[var(--text)] mb-3">Hashtags</p>
                  <div className="flex flex-wrap gap-2">
                    {video.hashtags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--border-subtle)]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {video.location && (
                <div>
                  <p className="text-sm font-semibold text-[var(--text)] mb-3">Location</p>
                  <p className="text-sm text-[var(--text-muted)]">{video.location}</p>
                </div>
              )}
            </div>
          </Panel>

          {/* Semantic Timeline Panel */}
          {timeline.length > 0 && (
            <Panel title="Semantic timeline" description="Key moments detected by TwelveLabs analysis.">
              <div className="space-y-6">
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
                        <p className="text-sm text-[var(--text)] leading-relaxed">{entry.description}</p>
                        {entry.score !== undefined && (
                          <p className="text-xs text-[var(--text-muted)] mt-2">
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
        <div className="space-y-8">
          {/* TwelveLabs Summary Panel */}
          <Panel title="TwelveLabs summary" description="AI-detected actions, objects, and scenes.">
            <div className="space-y-6">
              {video.actions && video.actions.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-[var(--text-muted)] mb-3">Actions detected</p>
                  <div className="flex flex-wrap gap-2">
                    {video.actions.map((action) => (
                      <span
                        key={action}
                        className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--border-subtle)]"
                      >
                        {action}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {video.objectsScenes && video.objectsScenes.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-[var(--text-muted)] mb-3">Objects & scenes</p>
                  <div className="flex flex-wrap gap-2">
                    {video.objectsScenes.map((item) => (
                      <span
                        key={item}
                        className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--border-subtle)]"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {(!video.actions || video.actions.length === 0) && (!video.objectsScenes || video.objectsScenes.length === 0) && (
                <p className="text-sm text-[var(--text-muted)]">No analysis data available yet.</p>
              )}
            </div>
          </Panel>

          {/* Decision Inputs Panel */}
          <Panel title="Decision inputs" description="Validation score and status determination.">
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0">
                  <div className="h-16 w-16 rounded-full bg-[var(--accent-soft)] border-2 border-[var(--accent)] flex items-center justify-center">
                    <span className="text-lg font-semibold text-[var(--accent)]">
                      {video.validationScore != null ? Math.round(video.validationScore * 100) : '–'}
                    </span>
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-[var(--text)] mb-3">Validation score</p>
                  <StatusPill status={video.status} />
                </div>
              </div>
              <div>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed">
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

      {/* Execution Graph Panel */}
      <section>
        <Panel
          title="Analysis Pipeline Execution"
          description="Step Functions state machine execution graph showing the processing flow for this video."
        >
          {executionLoading ? (
            <div className="flex items-center justify-center h-64 border border-[var(--border-subtle)] rounded-lg bg-[var(--bg-soft)]">
              <p className="text-sm text-[var(--text-muted)]">Loading execution history...</p>
            </div>
          ) : executionError ? (
            <div className="flex flex-col items-center justify-center h-64 border border-[var(--border-subtle)] rounded-lg bg-[var(--bg-soft)] p-6">
              <p className="text-sm font-medium text-[var(--text)] mb-2">Unable to load execution graph</p>
              <p className="text-xs text-[var(--text-muted)] text-center max-w-md">{executionError}</p>
              <p className="text-xs text-[var(--text-muted)] mt-4">
                Check the browser console for detailed error information.
              </p>
            </div>
          ) : executionGraph ? (
            <ExecutionGraph steps={executionGraph.steps} executionStatus={executionGraph.status} />
          ) : (
            <div className="flex items-center justify-center h-64 border border-[var(--border-subtle)] rounded-lg bg-[var(--bg-soft)]">
              <p className="text-sm text-[var(--text-muted)]">No execution data available</p>
            </div>
          )}
        </Panel>
      </section>

      {/* Debug Panel */}
      <section>
        <Panel
          title="Debug Information"
          description="API request and response details for troubleshooting."
        >
          <div className="mb-4 flex items-center justify-end">
            <button
              onClick={() => setDebugInfo(prev => ({ ...prev, show: !prev.show }))}
              className="text-xs px-3 py-1 rounded border transition-colors"
              style={{
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-muted)',
                backgroundColor: 'var(--bg-soft)',
              }}
            >
              {debugInfo.show ? 'Hide' : 'Show'} Debug
            </button>
          </div>
          {debugInfo.show && (
            <div className="space-y-4 text-xs font-mono">
              {debugInfo.requestUrl && (
                <div>
                  <p className="font-semibold text-[var(--text)] mb-1">Request URL:</p>
                  <p className="text-[var(--text-muted)] break-all p-2 rounded bg-[var(--bg-soft)] border border-[var(--border-subtle)]">
                    {debugInfo.requestUrl}
                  </p>
                </div>
              )}
              {debugInfo.requestStatus !== undefined && (
                <div>
                  <p className="font-semibold text-[var(--text)] mb-1">Response Status:</p>
                  <p className="text-[var(--text-muted)]">
                    <span className={`px-2 py-1 rounded ${
                      debugInfo.requestStatus >= 200 && debugInfo.requestStatus < 300
                        ? 'bg-emerald-500/10 text-emerald-600'
                        : debugInfo.requestStatus >= 400
                        ? 'bg-rose-500/10 text-rose-600'
                        : 'bg-gray-500/10 text-gray-600'
                    }`}>
                      {debugInfo.requestStatus}
                    </span>
                  </p>
                </div>
              )}
              {debugInfo.error && (
                <div>
                  <p className="font-semibold text-[var(--text)] mb-1">Error:</p>
                  <p className="text-rose-600 p-2 rounded bg-rose-500/10 border border-rose-500/20 break-all">
                    {debugInfo.error}
                  </p>
                </div>
              )}
              {debugInfo.responseData && (
                <div>
                  <p className="font-semibold text-[var(--text)] mb-1">Response Data:</p>
                  <pre className="text-[var(--text-muted)] p-3 rounded bg-[var(--bg-soft)] border border-[var(--border-subtle)] overflow-auto max-h-96">
                    {JSON.stringify(debugInfo.responseData, null, 2)}
                  </pre>
                </div>
              )}
              {!debugInfo.requestUrl && !debugInfo.error && (
                <p className="text-[var(--text-muted)]">No debug information available yet. Try loading the page again.</p>
              )}
            </div>
          )}
        </Panel>
      </section>
    </div>
  );
}
