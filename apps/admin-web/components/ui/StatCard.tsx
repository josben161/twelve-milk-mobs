// apps/admin-web/components/ui/StatCard.tsx
import { ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  change?: string;
  changeLabel?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon?: ReactNode;
}

export function StatCard({ label, value, change, changeLabel, trend = 'neutral', icon }: StatCardProps) {
  return (
    <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-6 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        {icon && (
          <div className="h-8 w-8 rounded-lg bg-[var(--accent-soft)] flex items-center justify-center flex-shrink-0">
            {icon}
          </div>
        )}
        <div className={`flex-1 ${icon ? 'ml-3' : ''}`}>
          <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">
            {label}
          </p>
        </div>
      </div>
      <p className="text-2xl font-semibold text-[var(--text)] mb-2 leading-tight">
        {value}
      </p>
      {(change || changeLabel) && (
        <div className="flex items-center gap-2">
          {change && (
            <span
              className={`text-xs font-semibold ${
                trend === 'up'
                  ? 'text-[var(--success)]'
                  : trend === 'down'
                  ? 'text-[var(--error)]'
                  : 'text-[var(--text-muted)]'
              }`}
            >
              {change}
            </span>
          )}
          {changeLabel && (
            <span className="text-xs text-[var(--text-muted)]">{changeLabel}</span>
          )}
        </div>
      )}
    </div>
  );
}

