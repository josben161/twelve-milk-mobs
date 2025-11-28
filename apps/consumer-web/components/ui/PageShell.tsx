import { cn } from '@/lib/cn';
import type { HTMLAttributes } from 'react';

type Props = HTMLAttributes<HTMLElement> & {
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | 'full';
};

const maxWidthMap = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '4xl': 'max-w-4xl',
  full: 'max-w-full',
};

export function PageShell({
  className,
  maxWidth = '4xl',
  children,
  ...props
}: Props) {
  return (
    <main className={cn('py-12', className)} {...props}>
      <div className={cn('mx-auto px-4', maxWidthMap[maxWidth])}>
        {children}
      </div>
    </main>
  );
}

