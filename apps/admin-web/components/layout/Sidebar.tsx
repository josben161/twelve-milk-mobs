// apps/admin-web/components/layout/Sidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/', icon: '📊', label: 'Overview' },
  { href: '/videos', icon: '🎬', label: 'Videos' },
  { href: '/mobs', icon: '👥', label: 'Mobs' },
  { href: '/settings', icon: '⚙️', label: 'Settings' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden sm:flex w-16 flex-col min-h-screen border-r border-[var(--border-subtle)] bg-[var(--bg-elevated)]">
      {/* Logo Row */}
      <div className="flex items-center justify-center h-14 border-b border-[var(--border-subtle)]">
        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[var(--accent)] to-indigo-600 flex items-center justify-center text-[10px] font-bold text-white border border-[var(--border-subtle)]">
          MM
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col items-center py-3 gap-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={`flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 transition ${
                isActive
                  ? 'bg-[var(--accent-soft)] text-[var(--accent)] shadow-sm'
                  : 'hover:bg-slate-100 hover:text-slate-700'
              }`}
            >
              <span className="text-lg leading-none">{item.icon}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
