import { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

type Props = ButtonHTMLAttributes<HTMLButtonElement>;

export function PrimaryButton({ className, children, ...props }: Props) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-medium',
        'bg-gradient-to-r from-indigo-500 via-indigo-400 to-violet-500',
        'text-white shadow-[0_10px_30px_rgba(79,70,229,0.6)]',
        'hover:from-indigo-400 hover:via-indigo-300 hover:to-violet-400',
        'transition-all duration-200 hover:-translate-y-[1px] active:translate-y-0 active:shadow-md',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

