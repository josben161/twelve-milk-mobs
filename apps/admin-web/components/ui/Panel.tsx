// apps/admin-web/components/ui/Panel.tsx
import { ReactNode } from 'react';

interface PanelProps {
  children: ReactNode;
  className?: string;
  title?: string;
  description?: string;
}

export function Panel({ children, className = '', title, description }: PanelProps) {
  return (
    <div className={`rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] shadow-sm ${className}`}>
      {(title || description) && (
        <div className="px-6 pt-6 pb-4 border-b border-[var(--border-subtle)]">
          {title && (
            <h3 className="text-base font-semibold text-[var(--text)] mb-1">
              {title}
            </h3>
          )}
          {description && (
            <p className="text-sm text-[var(--text-muted)] leading-relaxed">
              {description}
            </p>
          )}
        </div>
      )}
      <div className={title || description ? 'p-6' : 'p-6'}>
        {children}
      </div>
    </div>
  );
}

