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
        <div className="px-8 pt-8 pb-6 border-b border-[var(--border-subtle)]">
          {title && (
            <h3 className="text-base font-semibold text-[var(--text)] mb-2">
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
      <div className={title || description ? 'p-8' : 'p-8'}>
        {children}
      </div>
    </div>
  );
}

