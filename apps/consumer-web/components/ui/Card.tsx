import { cn } from '@/lib/cn';
import type { HTMLAttributes } from 'react';

type Props = HTMLAttributes<HTMLDivElement>;

export function Card({ className, ...props }: Props) {
  return (
    <div
      className={cn(
        'rounded-2xl border backdrop-blur-sm transition-colors duration-300',
        className
      )}
      style={{
        borderColor: 'var(--border-subtle)',
        backgroundColor: 'var(--bg-card)',
        boxShadow: '0 18px 45px var(--shadow-lg)',
      }}
      {...props}
    />
  );
}

