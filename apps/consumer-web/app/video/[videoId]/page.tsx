'use client';

import Link from 'next/link';
import { use, useEffect, useState } from 'react';
import type { VideoDetail, VideoSummary } from '@twelve/core-types';
import { StatusPill, VideoPlayer, JoinMobButton } from '@/components/ui';
import { SimilarVideosSection } from '@/components/explore';
import { getApiBase } from '@/lib/api';

interface SimilarVideo {
  videoId: string;
  userHandle: string;
  mobId: string | null;
  score: number;
}

interface ValidationResult {
  videoId: string;
  participationScore: number;
  pass: boolean;
  reasons: string[];
}

export default function VideoDetailPage({
  params,
}: {
  params: Promise<{ videoId: string }>;
}) {
  const { videoId } = use(params);
  const [video, setVideo] = useState<VideoDetail | null>(null);
  const [similarVideos, setSimilarVideos] = useState<SimilarVideo[]>([]);
  const [similarVideoDetails, setSimilarVideoDetails] = useState<VideoSummary[]>([]);
  const [mobNames, setMobNames] = useState<Record<string, string>>({});
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const baseUrl = getApiBase();

        // Fetch video detail
        const videoRes = await fetch(`${baseUrl}/videos/${videoId}`);
        if (!videoRes.ok) {
          throw new Error(`Failed to fetch video (${videoRes.status})`);
        }
        const videoData = await videoRes.json();
        setVideo(videoData);

        // Fetch similar videos
        try {
          const similarRes = await fetch(`${baseUrl}/search/similar?videoId=${videoId}&limit=12`);
          if (similarRes.ok) {
            const similarData = await similarRes.json();
            const similar = similarData.videos || [];
            setSimilarVideos(similar);
            
            // Fetch full video details for similar videos
            const videoDetailsPromises = similar.slice(0, 12).map(async (sv: SimilarVideo) => {
              try {
                const detailRes = await fetch(`${baseUrl}/videos/${sv.videoId}`);
                if (detailRes.ok) {
                  const detailData = await detailRes.json();
                  return {
                    id: detailData.id,
                    userHandle: detailData.userHandle || sv.userHandle,
                    mobId: detailData.mobId || sv.mobId,
                    status: detailData.status,
                    createdAt: detailData.createdAt,
                    caption: detailData.caption || '',
                    hashtags: detailData.hashtags || [],
                    thumbnailUrl: detailData.thumbnailUrl,
                    validationScore: detailData.validationScore,
                  } as VideoSummary;
                }
              } catch (e) {
                console.warn(`Failed to fetch details for video ${sv.videoId}:`, e);
              }
              return null;
            });
            
            const details = await Promise.all(videoDetailsPromises);
            setSimilarVideoDetails(details.filter((v): v is VideoSummary => v !== null));
            
            // Fetch mob names if any similar videos have mobIds
            const mobIds = new Set(similar.filter((sv: SimilarVideo) => sv.mobId).map((sv: SimilarVideo) => sv.mobId));
            if (mobIds.size > 0) {
              try {
                const mobsRes = await fetch(`${baseUrl}/mobs`);
                if (mobsRes.ok) {
                  const mobsData = await mobsRes.json();
                  const names: Record<string, string> = {};
                  (mobsData.mobs || []).forEach((mob: any) => {
                    if (mobIds.has(mob.id)) {
                      names[mob.id] = mob.name;
                    }
                  });
                  setMobNames(names);
                }
              } catch (e) {
                console.warn('Failed to fetch mob names:', e);
              }
            }
          }
        } catch (e) {
          console.warn('Failed to fetch similar videos:', e);
        }

        // Fetch validation
        try {
          const validateRes = await fetch(`${baseUrl}/validate/${videoId}`);
          if (validateRes.ok) {
            const validateData = await validateRes.json();
            setValidation(validateData);
          }
        } catch (e) {
          console.warn('Failed to fetch validation:', e);
        }
      } catch (err) {
        console.error('Error fetching video:', err);
        setError(err instanceof Error ? err.message : 'Failed to load video.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [videoId]);

  if (loading) {
    return (
      <div className="pb-6 pt-4 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
        Loading video...
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="pb-6 pt-4 px-4">
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-soft)]/70 backdrop-blur-sm p-8 text-center">
          <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text)' }}>
            Video not found
          </h1>
          <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
            {error || `The video with ID ${videoId} could not be found.`}
          </p>
          <Link
            href="/my-videos"
            className="inline-flex items-center text-sm transition-colors"
            style={{ color: 'var(--accent)' }}
          >
            ← Back to My Videos
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-6 pt-4 transition-colors duration-300">
      <Link
        href="/my-videos"
        className="inline-flex items-center gap-2 text-sm mb-4 px-4 transition-colors hover:opacity-70"
        style={{ color: 'var(--text-muted)' }}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to My Videos
      </Link>

      <div className="px-4 space-y-6">
        {/* Video Player */}
        {video.playbackUrl ? (
          <div className="rounded-lg overflow-hidden shadow-lg">
            <VideoPlayer 
              videoUrl={video.playbackUrl} 
              thumbnailUrl={video.thumbnailUrl || undefined}
              autoplay={false}
              muted={false}
              className="w-full"
              highlights={video.timeline || []}
            />
          </div>
        ) : (
          <div
            className="aspect-video rounded-lg flex items-center justify-center shadow-lg"
            style={{
              background: 'linear-gradient(to bottom right, var(--accent), var(--accent-strong))',
            }}
          >
            <div className="text-center">
              <svg
                className="h-16 w-16 text-white/50 mx-auto mb-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-white/50 text-sm">Video processing...</p>
            </div>
          </div>
        )}

        {/* Title & Status */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text)' }}>
              @{video.userHandle}
            </h1>
            {video.caption && (
              <p className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>
                {video.caption}
              </p>
            )}
          </div>
          <StatusPill status={video.status} />
        </div>

        {/* Validation Section */}
        {validation && (
          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-soft)]/70 backdrop-blur-sm p-4">
            <h2 className="text-base font-semibold mb-3" style={{ color: 'var(--text)' }}>
              Participation Check
            </h2>
            <div className="flex items-center gap-3 mb-3">
              <span
                className={`text-lg font-bold ${validation.pass ? 'text-emerald-400' : 'text-rose-400'}`}
              >
                {(validation.participationScore * 100).toFixed(1)}%
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  validation.pass
                    ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/40'
                    : 'bg-rose-500/10 text-rose-300 border border-rose-500/40'
                }`}
              >
                {validation.pass ? 'Pass' : 'Fail'}
              </span>
            </div>
            <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
              {validation.pass
                ? 'This video met the campaign participation threshold for Got Milk?'
                : 'This video did not meet the campaign participation threshold. Details below:'}
            </p>
            <ul className="space-y-1 text-xs" style={{ color: 'var(--text-muted)' }}>
              {validation.reasons.map((reason, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span>•</span>
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Hashtags */}
        {video.hashtags && video.hashtags.length > 0 && (
          <div>
            <h2 className="text-sm font-medium mb-3" style={{ color: 'var(--text-muted)' }}>
              Hashtags
            </h2>
            <div className="flex flex-wrap gap-2">
              {video.hashtags.map((tag, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium border"
                  style={{
                    backgroundColor: 'var(--accent-soft)',
                    color: 'var(--accent)',
                    borderColor: 'var(--accent)',
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Timeline Highlights - Now integrated into video player, but show list for reference */}
        {video.timeline && video.timeline.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text)' }}>
              Key Moments
            </h2>
            <p className="text-sm text-[var(--text-muted)] mb-4">
              Click on the timeline markers in the video player above to jump to these moments.
            </p>
            <div className="space-y-2">
              {video.timeline.map((highlight, idx) => {
                const minutes = Math.floor(highlight.timestamp / 60);
                const seconds = Math.floor(highlight.timestamp % 60);
                const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
                
                return (
                  <div
                    key={idx}
                    className="w-full text-left rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-soft)]/70 backdrop-blur-sm p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                            style={{
                              backgroundColor: 'var(--accent-soft)',
                              color: 'var(--accent)',
                            }}
                          >
                            {timeString}
                          </span>
                          {highlight.score !== undefined && (
                            <span
                              className="text-[10px] px-1.5 py-0.5 rounded"
                              style={{
                                backgroundColor: 'var(--bg-soft)',
                                color: 'var(--text-muted)',
                              }}
                            >
                              {(highlight.score * 100).toFixed(0)}% relevance
                            </span>
                          )}
                        </div>
                        <p className="text-sm leading-relaxed" style={{ color: 'var(--text)' }}>
                          {highlight.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Similar Videos - Prominent Section */}
        {similarVideoDetails.length > 0 && (
          <div className="border-t pt-6" style={{ borderColor: 'var(--border-subtle)' }}>
            <SimilarVideosSection
              title="More like this"
              videos={similarVideoDetails}
              mobNames={mobNames}
              similarityScores={similarVideos.reduce((acc, sv) => {
                acc[sv.videoId] = sv.score;
                return acc;
              }, {} as Record<string, number>)}
              viewAllHref="/explore"
            />
            <div className="px-4 mt-4">
              <Link
                href="/explore"
                className="inline-flex items-center gap-2 text-sm font-medium text-[var(--accent)] hover:underline"
              >
                Explore all videos →
              </Link>
            </div>
          </div>
        )}

        {/* Mob Information */}
        {video.mobId && (
          <div className="border-t pt-6" style={{ borderColor: 'var(--border-subtle)' }}>
            <div className="px-4">
              <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text)' }}>
                Part of a Mob
              </h2>
              <div className="flex flex-col gap-3">
                <div className="rounded-xl border border-[var(--border-subtle)] bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 p-4">
                  <div className="text-sm font-medium text-[var(--text-muted)] mb-1">Explore this mob</div>
                  <div className="text-base font-semibold text-[var(--text)] mb-3">
                    {mobNames[video.mobId] || 'Mob'}
                  </div>
                  <JoinMobButton 
                    mobId={video.mobId} 
                    mobName={mobNames[video.mobId]}
                    variant="default"
                    size="md"
                    className="w-full justify-center"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Analysis Results */}
        {(video.actions || video.objectsScenes) && (
          <div className="border-t pt-6" style={{ borderColor: 'var(--border-subtle)' }}>
            <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text)' }}>
              Analysis Results
            </h2>
            <div className="space-y-4">
              {video.actions && video.actions.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
                    Detected Actions
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {video.actions.map((action, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center rounded-full px-3 py-1.5 text-sm border"
                        style={{
                          backgroundColor: 'var(--bg-soft)',
                          color: 'var(--text)',
                          borderColor: 'var(--border-subtle)',
                        }}
                      >
                        {action}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {video.objectsScenes && video.objectsScenes.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
                    Objects & Scenes
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {video.objectsScenes.map((item, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center rounded-full px-3 py-1.5 text-sm border"
                        style={{
                          backgroundColor: 'var(--bg-soft)',
                          color: 'var(--text)',
                          borderColor: 'var(--border-subtle)',
                        }}
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
