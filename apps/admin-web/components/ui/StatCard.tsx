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
    <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-8 shadow-sm">
      <div className="flex flex-col items-center text-center mb-4">
        {icon && (
          <div className="h-10 w-10 rounded-lg bg-[var(--accent-soft)] flex items-center justify-center flex-shrink-0 mb-3">
            {icon}
          </div>
        )}
        <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide mb-3">
          {label}
        </p>
      </div>
      <p className="text-3xl font-semibold text-[var(--text)] mb-3 leading-tight text-center">
        {value}
      </p>
      {(change || changeLabel) && (
        <div className="flex items-center justify-center gap-2">
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

