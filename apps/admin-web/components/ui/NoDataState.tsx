// apps/admin-web/components/ui/NoDataState.tsx
import { ReactNode } from 'react';

interface NoDataStateProps {
  message: string;
  icon?: ReactNode;
}

export function NoDataState({ message, icon }: NoDataStateProps) {
  return (
    <div className="h-56 rounded-xl bg-[var(--bg-subtle)] flex items-center justify-center">
      <div className="text-center">
        {icon && <div className="mb-2 flex justify-center">{icon}</div>}
        <p className="text-sm text-[var(--text-muted)] mb-2">{message}</p>
        <p className="text-xs text-[var(--text-soft)]">Data will appear here when available</p>
      </div>
    </div>
  );
}

