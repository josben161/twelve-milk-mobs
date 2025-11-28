import { cn } from '@/lib/cn';
import type { HTMLAttributes } from 'react';

type Props = HTMLAttributes<HTMLDivElement>;

export function Card({ className, ...props }: Props) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-slate-800 bg-slate-900/70',
        'shadow-[0_18px_45px_rgba(15,23,42,0.75)]',
        'backdrop-blur-sm',
        className
      )}
      {...props}
    />
  );
}

