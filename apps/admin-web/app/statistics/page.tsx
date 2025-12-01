// apps/admin-web/app/statistics/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { Panel, NoDataState } from '@/components/ui';
import { getUsageStats } from '@/lib/api';

interface UsageStats {
  timeRange: string;
  bedrock: {
    invocations: number;
    estimatedCost: number;
    byModel: Array<{ modelId: string; invocations: number }>;
  };
  lambda: { invocations: number; duration: number; errors: number; estimatedCost: number };
  apiGateway: { requests: number; errors: number; dataTransfer: number; estimatedCost: number };
  dynamodb: { readUnits: number; writeUnits: number; storage: number; estimatedCost: number };
  s3: { storage: number; requests: number; dataTransfer: number; estimatedCost: number };
  opensearch: { instanceHours: number; storage: number; estimatedCost: number };
  stepFunctions: { executions: number; duration: number; estimatedCost: number };
  cloudfront: { requests: number; dataTransfer: number; estimatedCost: number };
}

function formatCost(cost: number): string {
  if (cost < 0.01) return '< $0.01';
  return `$${cost.toFixed(2)}`;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export default function StatisticsPage() {
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('24h');

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getUsageStats(timeRange);
        setStats(data);
      } catch (err) {
        console.error('Error fetching usage stats:', err);
        setError(err instanceof Error ? err.message : 'Failed to load usage statistics.');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [timeRange]);

  return (
    <div className="w-full space-y-12">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold mb-3 text-[var(--text)]">Usage Statistics</h1>
          <p className="text-sm text-[var(--text-muted)] leading-relaxed">
            Track AWS service consumption and costs across the Milk Mobs platform.
          </p>
        </div>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="px-4 py-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text)] text-sm"
        >
          <option value="1h">Last hour</option>
          <option value="24h">Last 24 hours</option>
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
        </select>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <p className="text-sm text-[var(--text-muted)]">Loading statistics...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="text-center py-12">
          <p className="text-sm text-[var(--text-muted)] mb-2">Failed to load statistics</p>
          <p className="text-xs text-[var(--text-soft)]">{error}</p>
        </div>
      )}

      {/* Stats Content */}
      {!loading && !error && stats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bedrock Usage */}
          <Panel title="Bedrock Usage" description="AI model invocations and costs">
            {stats.bedrock.invocations > 0 ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[var(--text-muted)]">Invocations</span>
                  <span className="text-base font-semibold text-[var(--text)]">
                    {stats.bedrock.invocations.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[var(--text-muted)]">Estimated Cost</span>
                  <span className="text-base font-semibold text-[var(--text)]">
                    {formatCost(stats.bedrock.estimatedCost)}
                  </span>
                </div>
              </div>
            ) : (
              <NoDataState message="No Bedrock usage data available" />
            )}
          </Panel>

          {/* Lambda Usage */}
          <Panel title="Lambda Usage" description="Function invocations, duration, and errors">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-[var(--text-muted)]">Invocations</span>
                <span className="text-base font-semibold text-[var(--text)]">
                  {stats.lambda.invocations.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[var(--text-muted)]">Avg Duration (ms)</span>
                <span className="text-base font-semibold text-[var(--text)]">
                  {stats.lambda.duration.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[var(--text-muted)]">Errors</span>
                <span className="text-base font-semibold text-[var(--text)]">
                  {stats.lambda.errors.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[var(--text-muted)]">Estimated Cost</span>
                <span className="text-base font-semibold text-[var(--text)]">
                  {formatCost(stats.lambda.estimatedCost)}
                </span>
              </div>
            </div>
          </Panel>

          {/* API Gateway Usage */}
          <Panel title="API Gateway Usage" description="Request count, errors, and data transfer">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-[var(--text-muted)]">Requests</span>
                <span className="text-base font-semibold text-[var(--text)]">
                  {stats.apiGateway.requests.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[var(--text-muted)]">Errors</span>
                <span className="text-base font-semibold text-[var(--text)]">
                  {stats.apiGateway.errors.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[var(--text-muted)]">Estimated Cost</span>
                <span className="text-base font-semibold text-[var(--text)]">
                  {formatCost(stats.apiGateway.estimatedCost)}
                </span>
              </div>
            </div>
          </Panel>

          {/* DynamoDB Usage */}
          <Panel title="DynamoDB Usage" description="Read/write capacity and storage">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-[var(--text-muted)]">Read Units</span>
                <span className="text-base font-semibold text-[var(--text)]">
                  {stats.dynamodb.readUnits.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[var(--text-muted)]">Write Units</span>
                <span className="text-base font-semibold text-[var(--text)]">
                  {stats.dynamodb.writeUnits.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[var(--text-muted)]">Estimated Cost</span>
                <span className="text-base font-semibold text-[var(--text)]">
                  {formatCost(stats.dynamodb.estimatedCost)}
                </span>
              </div>
            </div>
          </Panel>

          {/* S3 Usage */}
          <Panel title="S3 Usage" description="Storage, requests, and data transfer">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-[var(--text-muted)]">Storage</span>
                <span className="text-base font-semibold text-[var(--text)]">
                  {formatBytes(stats.s3.storage * 1024 * 1024)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[var(--text-muted)]">Requests</span>
                <span className="text-base font-semibold text-[var(--text)]">
                  {stats.s3.requests.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[var(--text-muted)]">Estimated Cost</span>
                <span className="text-base font-semibold text-[var(--text)]">
                  {formatCost(stats.s3.estimatedCost)}
                </span>
              </div>
            </div>
          </Panel>

          {/* Step Functions Usage */}
          <Panel title="Step Functions Usage" description="State machine executions and duration">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-[var(--text-muted)]">Executions</span>
                <span className="text-base font-semibold text-[var(--text)]">
                  {stats.stepFunctions.executions.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[var(--text-muted)]">Avg Duration (ms)</span>
                <span className="text-base font-semibold text-[var(--text)]">
                  {stats.stepFunctions.duration.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[var(--text-muted)]">Estimated Cost</span>
                <span className="text-base font-semibold text-[var(--text)]">
                  {formatCost(stats.stepFunctions.estimatedCost)}
                </span>
              </div>
            </div>
          </Panel>

          {/* CloudFront Usage */}
          <Panel title="CloudFront Usage" description="Requests and data transfer">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-[var(--text-muted)]">Requests</span>
                <span className="text-base font-semibold text-[var(--text)]">
                  {stats.cloudfront.requests.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[var(--text-muted)]">Data Transfer</span>
                <span className="text-base font-semibold text-[var(--text)]">
                  {formatBytes(stats.cloudfront.dataTransfer * 1024 * 1024)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[var(--text-muted)]">Estimated Cost</span>
                <span className="text-base font-semibold text-[var(--text)]">
                  {formatCost(stats.cloudfront.estimatedCost)}
                </span>
              </div>
            </div>
          </Panel>

          {/* OpenSearch Usage */}
          <Panel title="OpenSearch Usage" description="Instance hours and storage">
            {stats.opensearch.instanceHours > 0 ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[var(--text-muted)]">Instance Hours</span>
                  <span className="text-base font-semibold text-[var(--text)]">
                    {stats.opensearch.instanceHours.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[var(--text-muted)]">Estimated Cost</span>
                  <span className="text-base font-semibold text-[var(--text)]">
                    {formatCost(stats.opensearch.estimatedCost)}
                  </span>
                </div>
              </div>
            ) : (
              <NoDataState message="No OpenSearch usage data available" />
            )}
          </Panel>
        </div>
      )}
    </div>
  );
}

