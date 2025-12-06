'use client';

import { useMemo, useState, useCallback } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { projectTo2D, getMobColor, type Point2D } from '@/lib/clustering';
import Link from 'next/link';

interface VideoEmbedding {
  videoId: string;
  mobId: string | null;
  embedding: number[];
  userHandle?: string;
  thumbnailUrl?: string;
}

type DisplayMode = 'always' | 'hover' | 'dots';

interface ClusterMapProps {
  videos: VideoEmbedding[];
  mobNames?: Record<string, string>;
  height?: number;
  showLabels?: boolean;
}

export function ClusterMap({ videos, mobNames = {}, height = 500, showLabels = false }: ClusterMapProps) {
  const [selectedMob, setSelectedMob] = useState<string | null>(null);
  const [hoveredPoint, setHoveredPoint] = useState<Point2D | null>(null);
  const [displayMode, setDisplayMode] = useState<DisplayMode>('always');
  const [thumbnailSize, setThumbnailSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [showUnassigned, setShowUnassigned] = useState(true);

  // Project embeddings to 2D (memoized for performance)
  const points = useMemo(() => {
    if (videos.length === 0) return [];
    try {
      return projectTo2D(videos);
    } catch (error) {
      console.error('PCA projection failed:', error);
      // Fallback to simple projection if PCA fails
      return videos.map((v, idx) => ({
        x: (idx % 10) * 60 - 270,
        y: Math.floor(idx / 10) * 60 - 270,
        videoId: v.videoId,
        mobId: v.mobId,
      }));
    }
  }, [videos]);

  // Group points by mob
  const mobGroups = useMemo(() => {
    const groups: Record<string, Point2D[]> = {};
    const unassigned: Point2D[] = [];
    
    points.forEach(point => {
      if (point.mobId) {
        if (!groups[point.mobId]) {
          groups[point.mobId] = [];
        }
        groups[point.mobId].push(point);
      } else {
        unassigned.push(point);
      }
    });
    
    return { groups, unassigned };
  }, [points]);

  // Get unique mobs for legend
  const uniqueMobs = useMemo(() => {
    const mobSet = new Set<string>();
    points.forEach(p => {
      if (p.mobId) mobSet.add(p.mobId);
    });
    return Array.from(mobSet);
  }, [points]);

  if (videos.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 border border-[var(--border-subtle)] rounded-lg bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5">
        <div className="text-center">
          <div className="mb-4">
            <svg className="w-16 h-16 mx-auto text-[var(--text-muted)] opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-[var(--text)] mb-2">No video embeddings available</p>
          <p className="text-xs text-[var(--text-muted)] max-w-md">
            Videos need to be processed with TwelveLabs Marengo to generate embeddings for clustering visualization
          </p>
        </div>
      </div>
    );
  }

  // Thumbnail size mapping
  const thumbnailSizes = {
    small: 32,
    medium: 48,
    large: 64,
  };

  const currentThumbnailSize = thumbnailSizes[thumbnailSize];

  // Create video lookup map for performance
  const videoMap = useMemo(() => {
    const map = new Map<string, VideoEmbedding>();
    videos.forEach(v => map.set(v.videoId, v));
    return map;
  }, [videos]);

  // Create thumbnail shape component (memoized)
  const createThumbnailShape = useCallback((color: string, opacity: number) => {
    return (props: any) => {
      const { cx, cy, payload } = props;
      const video = videoMap.get(payload.videoId);
      const showThumbnail = displayMode === 'always' || (displayMode === 'hover' && hoveredPoint?.videoId === payload.videoId);
      
      if (!showThumbnail || !video?.thumbnailUrl) {
        // Fallback to colored circle
        return (
          <circle
            cx={cx}
            cy={cy}
            r={6}
            fill={color}
            fillOpacity={opacity}
            stroke={color}
            strokeWidth={2}
            style={{ cursor: 'pointer' }}
          />
        );
      }

      const size = currentThumbnailSize;
      const clipId = `clip-${payload.videoId}`;
      
      return (
        <g>
          <defs>
            <clipPath id={clipId}>
              <circle cx={cx} cy={cy} r={size / 2} />
            </clipPath>
          </defs>
          <image
            x={cx - size / 2}
            y={cy - size / 2}
            width={size}
            height={size}
            href={video.thumbnailUrl}
            clipPath={`url(#${clipId})`}
            style={{ cursor: 'pointer' }}
            onError={(e: any) => {
              // Fallback if image fails to load
              e.target.style.display = 'none';
            }}
          />
          <circle
            cx={cx}
            cy={cy}
            r={size / 2 + 2}
            fill="none"
            stroke={color}
            strokeWidth={2}
            opacity={opacity}
            style={{ cursor: 'pointer' }}
          />
        </g>
      );
    };
  }, [videoMap, displayMode, hoveredPoint, currentThumbnailSize]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const point = payload[0].payload as Point2D;
      const video = videoMap.get(point.videoId);
      
      return (
        <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-lg p-3 shadow-lg max-w-xs">
          {video?.thumbnailUrl && (
            <div className="mb-2">
              <img
                src={video.thumbnailUrl}
                alt="Video thumbnail"
                className="w-full h-32 object-cover rounded"
                onError={(e: any) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>
          )}
          <div className="text-sm font-semibold text-[var(--text)] mb-1">
            {video?.userHandle ? `@${video.userHandle}` : point.videoId.slice(0, 8)}
          </div>
          {point.mobId && (
            <div className="text-xs text-[var(--text-muted)] mb-1">
              Mob: {mobNames[point.mobId] || point.mobId}
            </div>
          )}
          <div className="text-xs text-[var(--text-soft)] mb-2">
            Video ID: {point.videoId.slice(0, 12)}...
          </div>
          <div className="flex gap-2">
            <Link
              href={`/videos/${point.videoId}`}
              className="text-xs text-[var(--accent)] hover:underline"
            >
              View video →
            </Link>
            {point.mobId && (
              <Link
                href={`/mobs/${point.mobId}`}
                className="text-xs text-[var(--accent)] hover:underline"
              >
                View mob →
              </Link>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-sm font-semibold text-[var(--text)]">
              Clustering Visualization
            </h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-600 border border-indigo-500/30">
              Powered by TwelveLabs Marengo
            </span>
          </div>
          <p className="text-xs text-[var(--text-muted)]">
            {videos.length} videos projected to 2D using PCA • Interactive cluster map showing embedding similarity
          </p>
        </div>
        
        {/* Display Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-xs text-[var(--text-muted)]">Display:</label>
            <select
              value={displayMode}
              onChange={(e) => setDisplayMode(e.target.value as DisplayMode)}
              className="text-xs px-2 py-1 rounded border border-[var(--border-subtle)] bg-[var(--bg-soft)] text-[var(--text)]"
            >
              <option value="always">Always</option>
              <option value="hover">On Hover</option>
              <option value="dots">Dots Only</option>
            </select>
          </div>
          
          {displayMode !== 'dots' && (
            <div className="flex items-center gap-2">
              <label className="text-xs text-[var(--text-muted)]">Size:</label>
              <select
                value={thumbnailSize}
                onChange={(e) => setThumbnailSize(e.target.value as 'small' | 'medium' | 'large')}
                className="text-xs px-2 py-1 rounded border border-[var(--border-subtle)] bg-[var(--bg-soft)] text-[var(--text)]"
              >
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
            </div>
          )}
          
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="show-unassigned"
              checked={showUnassigned}
              onChange={(e) => setShowUnassigned(e.target.checked)}
              className="w-3 h-3 rounded border-[var(--border-subtle)]"
            />
            <label htmlFor="show-unassigned" className="text-xs text-[var(--text-muted)] cursor-pointer">
              Show unassigned
            </label>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="border border-[var(--border-subtle)] rounded-lg bg-[var(--bg-soft)] p-4">
        <ResponsiveContainer width="100%" height={height}>
          <ScatterChart
            margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
          >
            <XAxis
              type="number"
              dataKey="x"
              name="X"
              domain={['auto', 'auto']}
              tick={false}
              axisLine={false}
            />
            <YAxis
              type="number"
              dataKey="y"
              name="Y"
              domain={['auto', 'auto']}
              tick={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            
            {/* Render each mob as a separate Scatter series */}
            {Object.entries(mobGroups.groups).map(([mobId, mobPoints]) => {
              const color = getMobColor(mobId, uniqueMobs.indexOf(mobId));
              const isSelected = selectedMob === null || selectedMob === mobId;
              
              if (!isSelected) return null;
              
              const opacity = selectedMob === mobId ? 0.8 : 0.6;
              const ThumbnailShape = createThumbnailShape(color, opacity);
              
              return (
                <Scatter
                  key={mobId}
                  name={mobNames[mobId] || mobId}
                  data={mobPoints}
                  fill={color}
                  fillOpacity={opacity}
                  shape={displayMode === 'dots' ? undefined : <ThumbnailShape />}
                  onMouseEnter={(data: any) => {
                    if (data && data.payload) {
                      setHoveredPoint(data.payload);
                    }
                  }}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
              );
            })}
            
            {/* Unassigned videos */}
            {mobGroups.unassigned.length > 0 && selectedMob === null && showUnassigned && (
              <Scatter
                name="Unassigned"
                data={mobGroups.unassigned}
                fill="#9ca3af"
                fillOpacity={0.4}
                shape={displayMode === 'dots' ? undefined : createThumbnailShape('#9ca3af', 0.4)}
                onMouseEnter={(data: any) => {
                  if (data && data.payload) {
                    setHoveredPoint(data.payload);
                  }
                }}
                onMouseLeave={() => setHoveredPoint(null)}
              />
            )}
            
            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="circle"
              onClick={(e: any) => {
                const clickedMob = e.dataKey as string;
                // Handle "Unassigned" specially
                if (clickedMob === 'Unassigned') {
                  setSelectedMob(null); // Show all when clicking unassigned
                  return;
                }
                if (selectedMob === clickedMob) {
                  setSelectedMob(null);
                } else {
                  setSelectedMob(clickedMob);
                }
              }}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-soft)] p-3">
          <div className="text-xs text-[var(--text-muted)] mb-1">Total Videos</div>
          <div className="text-lg font-semibold text-[var(--text)]">{videos.length}</div>
        </div>
        <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-soft)] p-3">
          <div className="text-xs text-[var(--text-muted)] mb-1">Mobs</div>
          <div className="text-lg font-semibold text-[var(--text)]">{uniqueMobs.length}</div>
        </div>
        <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-soft)] p-3">
          <div className="text-xs text-[var(--text-muted)] mb-1">Assigned</div>
          <div className="text-lg font-semibold text-[var(--text)]">
            {videos.filter(v => v.mobId).length}
          </div>
        </div>
        <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-soft)] p-3">
          <div className="text-xs text-[var(--text-muted)] mb-1">Unassigned</div>
          <div className="text-lg font-semibold text-[var(--text)]">
            {videos.filter(v => !v.mobId).length}
          </div>
        </div>
      </div>
    </div>
  );
}

