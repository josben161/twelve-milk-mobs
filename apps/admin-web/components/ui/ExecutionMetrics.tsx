'use client';

import { useMemo } from 'react';
import type { ExecutionGraph } from '@/lib/api';

interface ExecutionMetricsProps {
  execution: ExecutionGraph | null;
}

export function ExecutionMetrics({ execution }: ExecutionMetricsProps) {
  const metrics = useMemo(() => {
    if (!execution || !execution.steps || execution.steps.length === 0) {
      return null;
    }

    const steps = execution.steps;
    
    // Calculate total execution time
    let totalDuration = 0;
    if (execution.startDate && execution.stopDate) {
      const start = new Date(execution.startDate).getTime();
      const stop = new Date(execution.stopDate).getTime();
      totalDuration = Math.round((stop - start) / 1000);
    }

    // Count TwelveLabs API calls
    const twelveLabsSteps = steps.filter(s => s.id === 'PegasusTask' || s.id === 'MarengoTask');
    const twelveLabsCalls = twelveLabsSteps.length;

    // Calculate step durations
    const stepDurations = steps
      .filter(s => s.startTime && s.endTime)
      .map(s => {
        const start = new Date(s.startTime!).getTime();
        const end = new Date(s.endTime!).getTime();
        return {
          name: s.name,
          duration: Math.round((end - start) / 1000),
          id: s.id,
        };
      })
      .sort((a, b) => b.duration - a.duration);

    // Count success/failure
    const succeeded = steps.filter(s => s.status === 'succeeded').length;
    const failed = steps.filter(s => s.status === 'failed').length;
    const successRate = steps.length > 0 ? (succeeded / steps.length) * 100 : 0;

    // Find longest step
    const longestStep = stepDurations.length > 0 ? stepDurations[0] : null;

    // Extract TwelveLabs-specific metrics
    const pegasusStep = steps.find(s => s.id === 'PegasusTask');
    const marengoStep = steps.find(s => s.id === 'MarengoTask');
    const validateStep = steps.find(s => s.id === 'ValidateTask');
    const clusterStep = steps.find(s => s.id === 'ClusterTask');

    // Pegasus metrics
    const pegasusDuration = pegasusStep?.startTime && pegasusStep?.endTime
      ? Math.round((new Date(pegasusStep.endTime).getTime() - new Date(pegasusStep.startTime).getTime()) / 1000)
      : null;
    const participationScore = pegasusStep?.twelveLabsData?.participation?.participationScore;
    const modalitiesDetected = {
      visual: pegasusStep?.twelveLabsData?.participation?.showsMilkObject || false,
      audio: pegasusStep?.twelveLabsData?.participation?.mentionsMilk || false,
      ocr: false, // OCR detection would be in participation data if available
    };
    const modalitiesCount = Object.values(modalitiesDetected).filter(Boolean).length;

    // Marengo metrics
    const marengoDuration = marengoStep?.startTime && marengoStep?.endTime
      ? Math.round((new Date(marengoStep.endTime).getTime() - new Date(marengoStep.startTime).getTime()) / 1000)
      : null;
    const embeddingDim = marengoStep?.twelveLabsData?.embedding?.dim;

    // Clustering metrics
    const clusteringMethod = clusterStep?.twelveLabsData?.clustering?.method;
    const similarityScore = clusterStep?.twelveLabsData?.clustering?.similarityScore;

    return {
      totalDuration,
      twelveLabsCalls,
      stepDurations,
      succeeded,
      failed,
      successRate,
      longestStep,
      totalSteps: steps.length,
      // TwelveLabs-specific metrics
      pegasusDuration,
      participationScore,
      modalitiesCount,
      marengoDuration,
      embeddingDim,
      clusteringMethod,
      similarityScore,
    };
  }, [execution]);

  if (!metrics) {
    return null;
  }

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins < 60) return `${mins}m ${secs}s`;
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return `${hours}h ${remainingMins}m`;
  };

  return (
    <div className="space-y-6">
      {/* Primary Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Execution Time */}
        <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-soft)] p-4">
          <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
            Total Execution Time
          </p>
          <p className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
            {formatDuration(metrics.totalDuration)}
          </p>
        </div>

        {/* TwelveLabs API Calls */}
        <div className="rounded-lg border border-[var(--border-subtle)] bg-gradient-to-br from-indigo-50 to-indigo-100 p-4">
          <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
            TwelveLabs API Calls
          </p>
          <p className="text-lg font-semibold text-indigo-700">
            {metrics.twelveLabsCalls}
          </p>
          <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>
            Pegasus + Marengo
          </p>
        </div>

        {/* Success Rate */}
        <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-soft)] p-4">
          <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
            Success Rate
          </p>
          <p className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
            {metrics.successRate.toFixed(0)}%
          </p>
          <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>
            {metrics.succeeded}/{metrics.totalSteps} steps succeeded
          </p>
        </div>

        {/* Longest Step */}
        {metrics.longestStep && (
          <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-soft)] p-4">
            <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
              Longest Step
            </p>
            <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text)' }}>
              {metrics.longestStep.name}
            </p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {formatDuration(metrics.longestStep.duration)}
            </p>
          </div>
        )}
      </div>

      {/* TwelveLabs-Specific Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pegasus Participation Score */}
        {metrics.participationScore !== undefined && (
          <div className="rounded-lg border border-indigo-200 bg-gradient-to-br from-indigo-50 to-indigo-100 p-4">
            <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
              Pegasus Participation
            </p>
            <p className="text-lg font-semibold text-indigo-700">
              {Math.round(metrics.participationScore * 100)}%
            </p>
            <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>
              Campaign validation score
            </p>
          </div>
        )}

        {/* Modalities Analyzed */}
        {metrics.modalitiesCount !== undefined && metrics.modalitiesCount > 0 && (
          <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-soft)] p-4">
            <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
              Modalities Analyzed
            </p>
            <p className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
              {metrics.modalitiesCount}
            </p>
            <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>
              Visual, Audio, OCR
            </p>
          </div>
        )}

        {/* Marengo Embedding Generation */}
        {metrics.marengoDuration !== null && (
          <div className="rounded-lg border border-violet-200 bg-gradient-to-br from-violet-50 to-violet-100 p-4">
            <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
              Marengo Embedding
            </p>
            <p className="text-lg font-semibold text-violet-700">
              {formatDuration(metrics.marengoDuration)}
            </p>
            {metrics.embeddingDim && (
              <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>
                {metrics.embeddingDim}D vector generated
              </p>
            )}
          </div>
        )}

        {/* Clustering Similarity */}
        {metrics.similarityScore !== undefined && (
          <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-soft)] p-4">
            <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
              Clustering Similarity
            </p>
            <p className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
              {Math.round(metrics.similarityScore * 100)}%
            </p>
            <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>
              {metrics.clusteringMethod === 'embedding' ? 'Embedding-based' : 'Keyword-based'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

