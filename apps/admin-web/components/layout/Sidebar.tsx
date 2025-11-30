// apps/admin-web/components/layout/Sidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { OverviewIcon, VideosIcon, MobsIcon, SettingsIcon } from '@/components/ui/Icons';

const navItems = [
  { href: '/', icon: OverviewIcon, label: 'Overview' },
  { href: '/videos', icon: VideosIcon, label: 'Videos' },
  { href: '/mobs', icon: MobsIcon, label: 'Mobs' },
  { href: '/settings', icon: SettingsIcon, label: 'Settings' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden sm:flex w-16 flex-col min-h-screen border-r border-[var(--border-subtle)] bg-[var(--bg-elevated)]">
      {/* Logo Row */}
      <div className="flex items-center justify-center h-12 border-b border-[var(--border-subtle)]">
        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[var(--accent)] to-indigo-600 flex items-center justify-center text-xs font-bold text-white">
          MM
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col items-center py-2 gap-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          const IconComponent = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${
                isActive
                  ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
                  : 'text-[var(--text-muted)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text)]'
              }`}
            >
              <IconComponent className="w-5 h-5" />
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
