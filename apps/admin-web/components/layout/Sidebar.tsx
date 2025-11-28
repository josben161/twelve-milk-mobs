// apps/admin-web/components/layout/Sidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/', label: 'Overview', icon: '🏠' },
  { href: '/videos', label: 'Videos', icon: '🎬' },
  { href: '/mobs', label: 'Mobs', icon: '👥' },
  { href: '/settings', label: 'Settings', icon: '⚙️' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden sm:flex w-60 flex-col border-r border-[var(--border-subtle)] bg-[var(--bg)]">
      {/* Brand Row */}
      <div className="flex items-center gap-2 px-4 h-12 border-b border-[var(--border-subtle)]">
        <div className="h-6 w-6 rounded-full bg-gradient-to-br from-[var(--accent)] to-indigo-600 flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
          MM
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-bold text-[var(--text)] leading-tight truncate">Milk Mobs</span>
          <span className="text-[11px] text-[var(--text-muted)] leading-tight truncate">
            Campaign Manager
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                isActive
                  ? 'bg-[var(--bg-subtle)] text-[var(--text)] font-medium border border-[var(--border-subtle)]'
                  : 'text-[var(--text-muted)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text)]'
              }`}
            >
              <span className="text-base leading-none">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-[var(--border-subtle)]">
        <p className="text-[10px] text-[var(--text-muted)]">
          Powered by <span className="font-medium">TwelveLabs</span>
        </p>
      </div>
    </aside>
  );
}

