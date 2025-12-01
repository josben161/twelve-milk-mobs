// apps/admin-web/components/ui/QualityMetricsChart.tsx
'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { NoDataState } from './NoDataState';

interface QualityMetricsDataPoint {
  date: string;
  avgScore: number;
  avgTime: number;
}

interface QualityMetricsChartProps {
  data: QualityMetricsDataPoint[];
}

export function QualityMetricsChart({ data }: QualityMetricsChartProps) {
  if (!data || data.length === 0) {
    return <NoDataState message="Awaiting data..." />;
  }

  // Transform data to show score as percentage and time in seconds
  const chartData = data.map((point) => ({
    ...point,
    avgScorePercent: point.avgScore * 100,
    avgTimeSeconds: point.avgTime,
  }));

  return (
    <ResponsiveContainer width="100%" height={224}>
      <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
        <XAxis
          dataKey="date"
          stroke="var(--text-muted)"
          style={{ fontSize: '12px' }}
          tick={{ fill: 'var(--text-muted)' }}
        />
        <YAxis
          yAxisId="left"
          stroke="var(--text-muted)"
          style={{ fontSize: '12px' }}
          tick={{ fill: 'var(--text-muted)' }}
          label={{ value: 'Score %', angle: -90, position: 'insideLeft', style: { fill: 'var(--text-muted)' } }}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          stroke="var(--text-muted)"
          style={{ fontSize: '12px' }}
          tick={{ fill: 'var(--text-muted)' }}
          label={{ value: 'Time (s)', angle: 90, position: 'insideRight', style: { fill: 'var(--text-muted)' } }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '8px',
          }}
          labelStyle={{ color: 'var(--text)' }}
          formatter={(value: number, name: string) => {
            if (name === 'avgScorePercent') return [`${value.toFixed(1)}%`, 'Avg Score'];
            if (name === 'avgTimeSeconds') return [`${value.toFixed(1)}s`, 'Avg Time'];
            return [value, name];
          }}
        />
        <Legend
          wrapperStyle={{ paddingTop: '20px' }}
          iconType="line"
          formatter={(value) => <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{value}</span>}
        />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="avgScorePercent"
          stroke="var(--accent)"
          strokeWidth={2}
          dot={{ fill: 'var(--accent)', r: 4 }}
          name="Avg Score"
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="avgTimeSeconds"
          stroke="#8b5cf6"
          strokeWidth={2}
          dot={{ fill: '#8b5cf6', r: 4 }}
          name="Avg Time"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

