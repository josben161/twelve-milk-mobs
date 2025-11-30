'use client';

import { ReactNode } from 'react';
import Link from 'next/link';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  subtitle: string;
  action?: {
    label: string;
    href: string;
  };
}

export function EmptyState({ icon, title, subtitle, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {icon && (
        <div className="mb-4" style={{ color: 'var(--text-subtle)' }}>
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold mb-2" style={{ color: 'var(--text)' }}>
        {title}
      </h3>
      <p className="text-sm mb-6 max-w-xs" style={{ color: 'var(--text-muted)' }}>
        {subtitle}
      </p>
      {action && (
        <Link
          href={action.href}
          className="inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 hover:opacity-90 active:scale-95"
          style={{
            backgroundColor: 'var(--accent)',
            color: 'white',
          }}
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}

