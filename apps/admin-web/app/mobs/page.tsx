'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Panel, EmptyState, ClusterMap } from '@/components/ui';
import { getApiBase, getEmbeddings, triggerRecluster, type VideoEmbedding } from '@/lib/api';
import type { MobSummary } from '@twelve/core-types';

export default function MobsPage() {
  const [mobs, setMobs] = useState<MobSummary[]>([]);
  const [embeddings, setEmbeddings] = useState<VideoEmbedding[]>([]);
  const [mobNames, setMobNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [loadingEmbeddings, setLoadingEmbeddings] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clustering, setClustering] = useState(false);
  const [clusterMessage, setClusterMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const fetchMobs = async () => {
      setLoading(true);
      setError(null);
      try {
        const apiBase = getApiBase();
        const res = await fetch(`${apiBase}/mobs`);
        if (!res.ok) {
          throw new Error(`Failed to fetch mobs (${res.status})`);
        }
        const data = await res.json();
        setMobs(data.mobs || []);
        
        // Build mob names map
        const names: Record<string, string> = {};
        (data.mobs || []).forEach((mob: MobSummary) => {
          names[mob.id] = mob.name;
        });
        setMobNames(names);
      } catch (err) {
        console.error('Error fetching mobs:', err);
        setError(err instanceof Error ? err.message : 'Failed to load mobs.');
      } finally {
        setLoading(false);
      }
    };

    fetchMobs();
  }, []);

  useEffect(() => {
    const fetchEmbeddings = async () => {
      setLoadingEmbeddings(true);
      try {
        const data = await getEmbeddings(undefined, 500); // Fetch up to 500 videos
        setEmbeddings(data.videos || []);
      } catch (err) {
        console.error('Error fetching embeddings:', err);
        // Don't set error state, just log - visualization is optional
      } finally {
        setLoadingEmbeddings(false);
      }
    };

    fetchEmbeddings();
  }, []);

  const handleRecluster = async () => {
    if (clustering) return;
    
    setClustering(true);
    setClusterMessage(null);
    
    try {
      const result = await triggerRecluster();
      setClusterMessage({ type: 'success', text: result.message || 'Batch clustering job triggered successfully. This may take a few minutes to complete.' });
      
      // Refresh data after a short delay to allow clustering to start
      setTimeout(() => {
        // Refresh mobs
        const fetchMobs = async () => {
          try {
            const apiBase = getApiBase();
            const res = await fetch(`${apiBase}/mobs`);
            if (res.ok) {
              const data = await res.json();
              setMobs(data.mobs || []);
              
              // Build mob names map
              const names: Record<string, string> = {};
              (data.mobs || []).forEach((mob: MobSummary) => {
                names[mob.id] = mob.name;
              });
              setMobNames(names);
            }
          } catch (err) {
            console.error('Error refreshing mobs:', err);
          }
        };
        
        // Refresh embeddings
        const fetchEmbeddings = async () => {
          try {
            const data = await getEmbeddings(undefined, 500);
            setEmbeddings(data.videos || []);
          } catch (err) {
            console.error('Error refreshing embeddings:', err);
          }
        };
        
        fetchMobs();
        fetchEmbeddings();
      }, 2000);
    } catch (err) {
      console.error('Error triggering clustering:', err);
      setClusterMessage({ 
        type: 'error', 
        text: err instanceof Error ? err.message : 'Failed to trigger clustering job' 
      });
    } finally {
      setClustering(false);
    }
  };

  // Calculate summary stats
  const totalVideos = mobs.reduce((sum, mob) => sum + mob.videoCount, 0);
  const totalMobs = mobs.length;
  const avgVideosPerMob = totalMobs > 0 ? Math.round(totalVideos / totalMobs) : 0;
  const largestMob = mobs.length > 0 ? mobs.reduce((max, mob) => mob.videoCount > max.videoCount ? mob : max, mobs[0]) : null;

  return (
    <div className="w-full space-y-10">
      {/* Page Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold mb-3 text-[var(--text)]">Milk Mobs</h1>
          <p className="text-sm text-[var(--text-muted)] leading-relaxed">
            Video clusters segmented by activity, location, and vibe using TwelveLabs Marengo embeddings. Users can explore similar videos within each mob.
          </p>
        </div>
        <button
          onClick={handleRecluster}
          disabled={clustering}
          className="px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md hover:shadow-lg disabled:shadow-md flex items-center gap-2"
        >
          {clustering ? (
            <>
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Re-clustering...</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Re-cluster Videos</span>
            </>
          )}
        </button>
      </div>

      {/* Clustering Status Message */}
      {clusterMessage && (
        <div className={`p-4 rounded-lg border ${
          clusterMessage.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-start gap-2">
            {clusterMessage.type === 'success' ? (
              <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            )}
            <p className="text-sm font-medium">{clusterMessage.text}</p>
          </div>
        </div>
      )}

      {/* Clustering Visualization */}
      {!loadingEmbeddings && embeddings.length > 0 && (
        <Panel 
          title="Clustering Visualization" 
          description="Interactive 2D projection of video embeddings showing how TwelveLabs Marengo groups similar content into mobs"
        >
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-indigo-500/20">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <svg className="w-5 h-5 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-[var(--text)] mb-1">How it works</h4>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                    Each point represents a video positioned by its semantic embedding. Videos with similar content cluster together, 
                    forming distinct "Mob" groups. Click on legend items to filter by mob, or hover over points to see video details.
                    This visualization demonstrates the power of TwelveLabs Marengo embeddings for content discovery and segmentation.
                  </p>
                </div>
              </div>
            </div>
            <ClusterMap videos={embeddings} mobNames={mobNames} height={600} />
          </div>
        </Panel>
      )}

      {/* Stats Overview */}
      {!loading && !error && mobs.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-soft)] p-4">
            <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
              Total Mobs
            </p>
            <p className="text-2xl font-semibold" style={{ color: 'var(--text)' }}>
              {totalMobs}
            </p>
          </div>
          <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-soft)] p-4">
            <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
              Total Videos
            </p>
            <p className="text-2xl font-semibold" style={{ color: 'var(--text)' }}>
              {totalVideos}
            </p>
          </div>
          <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-soft)] p-4">
            <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
              Avg Videos/Mob
            </p>
            <p className="text-2xl font-semibold" style={{ color: 'var(--text)' }}>
              {avgVideosPerMob}
            </p>
          </div>
          {largestMob && (
            <div className="rounded-lg border border-[var(--border-subtle)] bg-gradient-to-br from-indigo-50 to-indigo-100 p-4">
              <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
                Largest Mob
              </p>
              <p className="text-lg font-semibold mb-0.5 text-indigo-700">
                {largestMob.name}
              </p>
              <p className="text-xs text-indigo-600">
                {largestMob.videoCount} videos
              </p>
            </div>
          )}
        </div>
      )}

      {/* Mobs Grid */}
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
            description="Mobs will appear here once videos are clustered and grouped using TwelveLabs Marengo embeddings."
          />
        </Panel>
      ) : (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {mobs.map((mob) => (
            <Link key={mob.id} href={`/mobs/${mob.id}`}>
              <div className="group relative rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-soft)] hover:border-[var(--accent)]/50 hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden">
                {/* Card Header with Gradient */}
                <div className="relative h-32 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 border-b border-[var(--border-subtle)]">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-4xl font-bold mb-1" style={{ color: 'var(--text)' }}>
                        {mob.videoCount}
                      </div>
                      <div className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                        Videos
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-6 space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2 text-[var(--text)] group-hover:text-[var(--accent)] transition-colors">
                      {mob.name}
                    </h3>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                      {mob.description}
                    </p>
                  </div>

                  {/* Hashtags */}
                  {mob.exampleHashtags && mob.exampleHashtags.length > 0 && (
                    <div>
                      <p className="text-xs font-medium mb-2 uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                        Top Hashtags
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {mob.exampleHashtags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--border-subtle)] hover:bg-[var(--accent-soft)]/80 transition-colors"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* View Details Link */}
                  <div className="flex items-center justify-between pt-2 border-t border-[var(--border-subtle)]">
                    <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                      View details
                    </span>
                    <svg 
                      className="w-4 h-4 transition-transform group-hover:translate-x-1" 
                      style={{ color: 'var(--accent)' }}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
