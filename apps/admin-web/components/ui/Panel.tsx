// apps/admin-web/components/ui/Panel.tsx
import { ReactNode } from 'react';

interface PanelProps {
  children: ReactNode;
  className?: string;
}

export function Panel({ children, className = '' }: PanelProps) {
  return (
    <div className={`rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] shadow-sm ${className}`}>
      {children}
    </div>
  );
}

