// apps/admin-web/components/ui/AdminShell.tsx
import { ReactNode } from 'react';

interface AdminShellProps {
  children: ReactNode;
}

export function AdminShell({ children }: AdminShellProps) {
  return (
    <div className="mx-auto max-w-6xl px-6 py-6">
      <div className="space-y-6">
        {children}
      </div>
    </div>
  );
}

