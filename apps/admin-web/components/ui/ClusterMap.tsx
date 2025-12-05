'use client';

import { useMemo, useState } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';
import { projectTo2D, getMobColor, type Point2D } from '@/lib/clustering';
import Link from 'next/link';

interface VideoEmbedding {
  videoId: string;
  mobId: string | null;
  embedding: number[];
  userHandle?: string;
  thumbnailUrl?: string;
}

interface ClusterMapProps {
  videos: VideoEmbedding[];
  mobNames?: Record<string, string>;
  height?: number;
  showLabels?: boolean;
}

export function ClusterMap({ videos, mobNames = {}, height = 500, showLabels = false }: ClusterMapProps) {
  const [selectedMob, setSelectedMob] = useState<string | null>(null);
  const [hoveredPoint, setHoveredPoint] = useState<Point2D | null>(null);

  // Project embeddings to 2D
  const points = useMemo(() => {
    if (videos.length === 0) return [];
    return projectTo2D(videos);
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

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const point = payload[0].payload as Point2D;
      const video = videos.find(v => v.videoId === point.videoId);
      
      return (
        <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-lg p-3 shadow-lg">
          <div className="text-sm font-semibold text-[var(--text)] mb-1">
            {video?.userHandle ? `@${video.userHandle}` : point.videoId.slice(0, 8)}
          </div>
          {point.mobId && (
            <div className="text-xs text-[var(--text-muted)] mb-1">
              Mob: {mobNames[point.mobId] || point.mobId}
            </div>
          )}
          <div className="text-xs text-[var(--text-soft)]">
            Video ID: {point.videoId.slice(0, 12)}...
          </div>
          <Link
            href={`/videos/${point.videoId}`}
            className="text-xs text-[var(--accent)] hover:underline mt-2 inline-block"
          >
            View details →
          </Link>
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
              
              return (
                <Scatter
                  key={mobId}
                  name={mobNames[mobId] || mobId}
                  data={mobPoints}
                  fill={color}
                  fillOpacity={selectedMob === mobId ? 0.8 : 0.6}
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
            {mobGroups.unassigned.length > 0 && selectedMob === null && (
              <Scatter
                name="Unassigned"
                data={mobGroups.unassigned}
                fill="#9ca3af"
                fillOpacity={0.4}
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

