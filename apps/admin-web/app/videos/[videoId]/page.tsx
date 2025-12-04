'use client';

import { useEffect, useState } from 'react';
import { use } from 'react';
import { useRouter } from 'next/navigation';
import { Panel, ExecutionGraph, ExecutionMetrics, VideoPlayer } from '@/components/ui';
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
                  highlights={timeline}
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

          {/* Pegasus Participation Analysis Panel */}
          {(video.mentionsMilk !== undefined || video.showsMilkObject !== undefined || video.showsActionAligned !== undefined || video.participationRationale) && (
            <Panel 
              title="Pegasus Participation Analysis" 
              description="Validates contents are related to 'Got Milk' campaign using multimodal analysis."
            >
              <div className="space-y-6">
                {/* Campaign Goal Badge */}
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-1 rounded bg-emerald-500/20 text-emerald-600">
                    Validate
                  </span>
                  <span className="text-xs font-medium px-2 py-1 rounded bg-indigo-100 text-indigo-700">
                    TwelveLabs Pegasus
                  </span>
                </div>

                {/* Participation Score */}
                {video.validationScore !== undefined && (
                  <div>
                    <p className="text-sm font-medium text-[var(--text-muted)] mb-2">Participation Score</p>
                    <div className="relative w-full h-3 bg-[var(--bg-subtle)] rounded-full overflow-hidden">
                      <div
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-300"
                        style={{ width: `${(video.validationScore * 100).toFixed(0)}%` }}
                      />
                    </div>
                    <p className="text-xs text-[var(--text-muted)] mt-1">
                      {Math.round(video.validationScore * 100)}% confidence
                    </p>
                  </div>
                )}

                {/* Multimodal Detection Flags */}
                <div>
                  <p className="text-sm font-medium text-[var(--text-muted)] mb-3">Multimodal Detection</p>
                  <div className="space-y-2">
                    {video.mentionsMilk !== undefined && (
                      <div className="flex items-center gap-2">
                        <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
                          video.mentionsMilk 
                            ? 'bg-emerald-500/20 text-emerald-600' 
                            : 'bg-gray-500/20 text-gray-500'
                        }`}>
                          {video.mentionsMilk ? '✓' : '✗'}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-[var(--text)]">Spoken mentions of milk</p>
                          <p className="text-xs text-[var(--text-muted)]">Audio analysis</p>
                        </div>
                      </div>
                    )}
                    {video.showsMilkObject !== undefined && (
                      <div className="flex items-center gap-2">
                        <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
                          video.showsMilkObject 
                            ? 'bg-emerald-500/20 text-emerald-600' 
                            : 'bg-gray-500/20 text-gray-500'
                        }`}>
                          {video.showsMilkObject ? '✓' : '✗'}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-[var(--text)]">Milk containers/objects detected</p>
                          <p className="text-xs text-[var(--text-muted)]">Visual analysis</p>
                        </div>
                      </div>
                    )}
                    {video.showsActionAligned !== undefined && (
                      <div className="flex items-center gap-2">
                        <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
                          video.showsActionAligned 
                            ? 'bg-emerald-500/20 text-emerald-600' 
                            : 'bg-gray-500/20 text-gray-500'
                        }`}>
                          {video.showsActionAligned ? '✓' : '✗'}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-[var(--text)]">Drinking milk actions detected</p>
                          <p className="text-xs text-[var(--text-muted)]">Visual + Audio analysis</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Participation Rationale */}
                {video.participationRationale && (
                  <div>
                    <p className="text-sm font-medium text-[var(--text-muted)] mb-2">Analysis Rationale</p>
                    <p className="text-sm text-[var(--text)] leading-relaxed bg-[var(--bg-subtle)] p-3 rounded-lg border border-[var(--border-subtle)]">
                      {video.participationRationale}
                    </p>
                  </div>
                )}

                {/* OCR Results */}
                {(video.detectedText && video.detectedText.length > 0) || (video.onScreenText && video.onScreenText.length > 0) ? (
                  <div>
                    <p className="text-sm font-medium text-[var(--text-muted)] mb-3">OCR Text Detection</p>
                    {video.onScreenText && video.onScreenText.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs text-[var(--text-muted)] mb-2">On-Screen Text</p>
                        <div className="flex flex-wrap gap-2">
                          {video.onScreenText.map((text, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-2 py-1 rounded text-xs bg-blue-500/10 text-blue-600 border border-blue-500/20"
                            >
                              {text}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {video.detectedText && video.detectedText.length > 0 && (
                      <div>
                        <p className="text-xs text-[var(--text-muted)] mb-2">All Detected Text</p>
                        <div className="flex flex-wrap gap-2">
                          {video.detectedText.map((text, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-2 py-1 rounded text-xs bg-purple-500/10 text-purple-600 border border-purple-500/20"
                            >
                              {text}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            </Panel>
          )}

          {/* Marengo Embedding Analysis Panel */}
          {(video.embeddingDim !== undefined || video.clusteringMethod) && (
            <Panel 
              title="Marengo Embedding Analysis" 
              description="Enables video clustering and similarity search by activity, location, or vibe."
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

                {/* Embedding Dimension */}
                {video.embeddingDim && (
                  <div>
                    <p className="text-sm font-medium text-[var(--text-muted)] mb-1">Embedding Vector</p>
                    <p className="text-lg font-semibold text-[var(--text)]">
                      {video.embeddingDim}-dimensional
                    </p>
                    <p className="text-xs text-[var(--text-muted)] mt-1">
                      High-dimensional vector representation for similarity search
                    </p>
                  </div>
                )}

                {/* Clustering Method */}
                {video.clusteringMethod && (
                  <div>
                    <p className="text-sm font-medium text-[var(--text-muted)] mb-2">Clustering Method</p>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium ${
                        video.clusteringMethod === 'embedding'
                          ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                          : 'bg-gray-100 text-gray-700 border border-gray-200'
                      }`}>
                        {video.clusteringMethod === 'embedding' ? '✓ Embedding-based' : 
                         video.clusteringMethod === 'keyword' ? 'Keyword-based (fallback)' : 
                         'Unknown'}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--text-muted)] mt-2">
                      {video.clusteringMethod === 'embedding' 
                        ? 'Video assigned to mob using Marengo embedding similarity'
                        : 'Video assigned to mob using keyword matching'}
                    </p>
                  </div>
                )}

                {/* Similarity Score */}
                {video.similarityScore !== undefined && (
                  <div>
                    <p className="text-sm font-medium text-[var(--text-muted)] mb-2">Similarity to Mob Centroid</p>
                    <div className="relative w-full h-3 bg-[var(--bg-subtle)] rounded-full overflow-hidden">
                      <div
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-violet-500 to-violet-600 rounded-full transition-all duration-300"
                        style={{ width: `${(video.similarityScore * 100).toFixed(0)}%` }}
                      />
                    </div>
                    <p className="text-xs text-[var(--text-muted)] mt-1">
                      {Math.round(video.similarityScore * 100)}% similarity
                    </p>
                  </div>
                )}
              </div>
            </Panel>
          )}

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
              
              {/* Validation Breakdown */}
              {video.validationBreakdown && (
                <div>
                  <p className="text-sm font-medium text-[var(--text-muted)] mb-3">Modality Breakdown</p>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-[var(--text-muted)]">Visual</span>
                        <span className="text-xs font-medium text-[var(--text)]">
                          {Math.round(video.validationBreakdown.visual * 100)}%
                        </span>
                      </div>
                      <div className="h-2 bg-[var(--bg-subtle)] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${video.validationBreakdown.visual * 100}%` }}
                        />
                      </div>
                    </div>
                    {video.validationBreakdown.audio !== null ? (
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs text-[var(--text-muted)]">Audio</span>
                          <span className="text-xs font-medium text-[var(--text)]">
                            {Math.round(video.validationBreakdown.audio * 100)}%
                          </span>
                        </div>
                        <div className="h-2 bg-[var(--bg-subtle)] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500 rounded-full"
                            style={{ width: `${video.validationBreakdown.audio * 100}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs text-[var(--text-muted)]">Audio</span>
                          <span className="text-xs font-medium text-[var(--text-muted)] italic">
                            Unavailable (not penalized)
                          </span>
                        </div>
                      </div>
                    )}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-[var(--text-muted)]">OCR</span>
                        <span className="text-xs font-medium text-[var(--text)]">
                          {Math.round(video.validationBreakdown.ocr * 100)}%
                        </span>
                      </div>
                      <div className="h-2 bg-[var(--bg-subtle)] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-500 rounded-full"
                          style={{ width: `${video.validationBreakdown.ocr * 100}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-[var(--text-muted)]">Hashtags</span>
                        <span className="text-xs font-medium text-[var(--text)]">
                          {Math.round(video.validationBreakdown.hashtags * 100)}%
                        </span>
                      </div>
                      <div className="h-2 bg-[var(--bg-subtle)] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-orange-500 rounded-full"
                          style={{ width: `${video.validationBreakdown.hashtags * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
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

      {/* Execution Metrics Panel */}
      {executionGraph && (
        <section>
          <Panel
            title="Execution Metrics"
            description="Performance metrics and TwelveLabs API usage for this video analysis."
          >
            <ExecutionMetrics execution={executionGraph} />
          </Panel>
        </section>
      )}

      {/* Execution Graph Panel */}
      <section>
        <Panel
          title="Analysis Pipeline Execution"
          description="Step Functions state machine execution graph showing how TwelveLabs APIs enable the Identify → Validate → Segment → Explore workflow for the Got Milk campaign."
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
