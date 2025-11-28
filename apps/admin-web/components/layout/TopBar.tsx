// apps/admin-web/components/layout/TopBar.tsx

export function TopBar() {
  return (
    <header className="h-14 flex items-center justify-between px-6 border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)] shadow-sm">
      <div className="flex flex-col">
        <span className="text-sm font-medium text-[var(--text)]">Got Milk · Gen Z Campaign</span>
        <span className="text-xs text-[var(--text-muted)]">Campaign environment</span>
      </div>
      <div className="flex items-center gap-3">
        {/* Notification Bell */}
        <button
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          aria-label="Notifications"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
        </button>
        {/* User Chip */}
        <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer">
          <div className="h-7 w-7 rounded-full bg-[var(--accent)] flex items-center justify-center text-[10px] font-semibold text-white">
            JB
          </div>
          <svg
            className="h-4 w-4 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>
    </header>
  );
}
