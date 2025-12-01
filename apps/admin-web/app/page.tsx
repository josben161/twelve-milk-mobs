// apps/admin-web/app/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { StatCard, Panel, ValidationFunnelChart, QualityMetricsChart } from '@/components/ui';
import { getDashboardStats } from '@/lib/api';
import type { AdminStats } from '@twelve/core-types';

function formatTime(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  if (mins < 60) return `${mins}m ${secs}s`;
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  return `${hours}h ${remainingMins}m`;
}

export default function AdminHomePage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getDashboardStats();
        setStats(data);
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
        setError(err instanceof Error ? err.message : 'Failed to load dashboard stats.');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  // Calculate derived values
  const approvalRate = stats && stats.totalVideos > 0
    ? ((stats.validated / stats.totalVideos) * 100).toFixed(0)
    : '0';
  const rejectionRate = stats && stats.totalVideos > 0
    ? ((stats.rejected / stats.totalVideos) * 100).toFixed(0)
    : '0';

  const statCards = stats
    ? [
        {
          label: 'Total videos',
          value: stats.totalVideos.toLocaleString(),
          change: stats.totalVideos > 0 ? '+' : '0',
          changeLabel: 'Total count',
          trend: 'neutral' as const,
          icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
        },
        {
          label: 'Validated',
          value: stats.validated.toLocaleString(),
          change: `${approvalRate}%`,
          changeLabel: 'Approval rate',
          trend: 'neutral' as const,
          icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path d="M20 6L9 17l-5-5" />
            </svg>
          ),
        },
        {
          label: 'Rejected',
          value: stats.rejected.toLocaleString(),
          change: `${rejectionRate}%`,
          changeLabel: 'Rejection rate',
          trend: 'down' as const,
          icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          ),
        },
        {
          label: 'Active mobs',
          value: stats.activeMobs.toString(),
          change: stats.activeMobs.toString(),
          changeLabel: 'Communities',
          trend: 'neutral' as const,
          icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 00-3-3.87" />
              <path d="M16 3.13a4 4 0 010 7.75" />
            </svg>
          ),
        },
      ]
    : [];

  // Placeholder chart data (will be enhanced later with time series data)
  const funnelData: Array<{ date: string; uploaded: number; validated: number; rejected: number }> = [];
  const qualityData: Array<{ date: string; avgScore: number; avgTime: number }> = [];

  return (
    <div className="w-full space-y-12">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold mb-3 text-[var(--text)]">Campaign overview</h1>
        <p className="text-sm text-[var(--text-muted)] leading-relaxed">
          Monitor ingestion, validation quality, and engagement across all Milk Mob communities.
        </p>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <p className="text-sm text-[var(--text-muted)]">Loading dashboard...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="text-center py-12">
          <p className="text-sm text-[var(--text-muted)] mb-2">Failed to load dashboard</p>
          <p className="text-xs text-[var(--text-soft)]">{error}</p>
        </div>
      )}

      {/* Stats Content */}
      {!loading && !error && stats && (
        <>
          {/* Stat Cards Grid */}
          <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
            {statCards.map((card) => (
              <StatCard
                key={card.label}
                label={card.label}
                value={card.value}
                change={card.change}
                changeLabel={card.changeLabel}
                trend={card.trend}
                icon={card.icon}
              />
            ))}
          </section>

          {/* Charts & Panels */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Validation Funnel Panel */}
            <Panel title="Validation funnel" description="Daily content ingestion and validation outcomes over time.">
              <ValidationFunnelChart data={funnelData} />
            </Panel>

            {/* Quality Metrics Panel */}
            <Panel title="Quality metrics" description="System performance and processing efficiency.">
              <div className="space-y-8">
                {/* Average Validation Score */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-[var(--text-muted)]">
                      Average validation score
                    </span>
                    <span className="text-base font-semibold text-[var(--text)]">
                      {Math.round(stats.avgValidationScore * 100)}%
                    </span>
                  </div>
                  <div className="h-2 bg-[var(--bg-subtle)] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[var(--accent)] to-indigo-500 rounded-full transition-all"
                      style={{ width: `${Math.min(stats.avgValidationScore * 100, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Processing Time */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-[var(--text-muted)]">
                      Average processing time
                    </span>
                    <span className="text-base font-semibold text-[var(--text)]">
                      {formatTime(stats.avgTimeToValidateSeconds)}
                    </span>
                  </div>
                  <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                    Time from user upload to automated validation decision.
                  </p>
                </div>

                {/* Modalities Covered */}
                <div>
                  <p className="text-sm font-medium text-[var(--text-muted)] mb-4">
                    Modalities covered
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {['Video', 'Audio', 'Text'].map((modality) => (
                      <span
                        key={modality}
                        className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--border-subtle)]"
                      >
                        {modality}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </Panel>
          </section>

          {/* State Machine Visualization Panel */}
          <section>
            <Panel 
              title="Video Analysis Pipeline" 
              description="Step Functions state machine that processes each video upload through Pegasus and Marengo analysis."
            >
              <div className="space-y-4">
                <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-soft)] p-4">
                  <p className="text-sm text-[var(--text-muted)] mb-3">
                    The video analysis pipeline runs automatically when a new video is uploaded. Each execution processes the video through:
                  </p>
                  <ol className="space-y-2 text-sm text-[var(--text)]">
                    <li className="flex items-start gap-2">
                      <span className="font-semibold text-[var(--accent)]">1.</span>
                      <span>Mark video as processing</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-semibold text-[var(--accent)]">2.</span>
                      <span>Run Pegasus (participation analysis) and Marengo (embedding) in parallel</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-semibold text-[var(--accent)]">3.</span>
                      <span>Merge results and write to DynamoDB</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-semibold text-[var(--accent)]">4.</span>
                      <span>Validate video against participation threshold</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-semibold text-[var(--accent)]">5.</span>
                      <span>Cluster video into appropriate Mob</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-semibold text-[var(--accent)]">6.</span>
                      <span>Emit EventBridge event for downstream processing</span>
                    </li>
                  </ol>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <p className="text-xs text-[var(--text-muted)]">
                    View execution graph and details in AWS Step Functions console
                  </p>
                  <a
                    href={`https://${process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1'}.console.aws.amazon.com/states/home?region=${process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1'}#/statemachines`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--border-subtle)] hover:bg-[var(--accent-soft)]/80 transition-colors"
                  >
                    Open Step Functions Console
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              </div>
            </Panel>
          </section>
        </>
      )}
    </div>
  );
}
