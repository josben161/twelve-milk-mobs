// apps/admin-web/components/ui/ValidationFunnelChart.tsx
'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { NoDataState } from './NoDataState';

interface ValidationFunnelDataPoint {
  date: string;
  uploaded: number;
  validated: number;
  rejected: number;
}

interface ValidationFunnelChartProps {
  data: ValidationFunnelDataPoint[];
}

export function ValidationFunnelChart({ data }: ValidationFunnelChartProps) {
  if (!data || data.length === 0) {
    return <NoDataState message="Awaiting data..." />;
  }

  return (
    <ResponsiveContainer width="100%" height={224}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorUploaded" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3} />
            <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorValidated" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorRejected" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
        <XAxis
          dataKey="date"
          stroke="var(--text-muted)"
          style={{ fontSize: '12px' }}
          tick={{ fill: 'var(--text-muted)' }}
        />
        <YAxis
          stroke="var(--text-muted)"
          style={{ fontSize: '12px' }}
          tick={{ fill: 'var(--text-muted)' }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '8px',
          }}
          labelStyle={{ color: 'var(--text)' }}
        />
        <Legend
          wrapperStyle={{ paddingTop: '20px' }}
          iconType="line"
          formatter={(value) => <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{value}</span>}
        />
        <Area
          type="monotone"
          dataKey="uploaded"
          stroke="var(--accent)"
          fillOpacity={1}
          fill="url(#colorUploaded)"
          name="Uploaded"
        />
        <Area
          type="monotone"
          dataKey="validated"
          stroke="#10b981"
          fillOpacity={1}
          fill="url(#colorValidated)"
          name="Validated"
        />
        <Area
          type="monotone"
          dataKey="rejected"
          stroke="#ef4444"
          fillOpacity={1}
          fill="url(#colorRejected)"
          name="Rejected"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

