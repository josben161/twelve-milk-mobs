// apps/admin-web/components/layout/TopBar.tsx
import { AdminThemeToggle } from '@/components/theme/AdminThemeToggle';

export function TopBar() {
  return (
    <header className="h-12 flex items-center justify-between px-6 border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)]">
      <div className="sm:hidden flex items-center gap-2.5">
        <div className="h-6 w-6 rounded-full bg-gradient-to-br from-[var(--accent)] to-indigo-600 flex items-center justify-center text-[10px] font-bold text-white">
          MM
        </div>
        <span className="text-sm font-bold text-[var(--text)]">Milk Mobs</span>
      </div>
      <div className="ml-auto flex items-center gap-3">
        <div className="flex flex-col">
          <span className="text-sm font-medium text-[var(--text)]">Got Milk · Gen Z Campaign</span>
          <span className="text-[11px] text-[var(--text-muted)]">Campaign environment</span>
        </div>
        <div className="h-4 w-px bg-[var(--border-subtle)]" />
        <AdminThemeToggle />
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-[var(--accent)] flex items-center justify-center text-[10px] font-semibold text-white">
            JB
          </div>
          <span className="hidden sm:inline text-xs text-[var(--text-muted)]">joseph@milkco.com</span>
        </div>
      </div>
    </header>
  );
}

