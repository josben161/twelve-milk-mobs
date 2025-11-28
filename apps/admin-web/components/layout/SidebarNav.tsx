// apps/admin-web/components/layout/SidebarNav.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/', label: 'Overview', icon: '🏠' },
  { href: '/videos', label: 'Videos', icon: '🎬' },
  { href: '/mobs', label: 'Mobs', icon: '👥' },
  { href: '/settings', label: 'Settings', icon: '⚙️' },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
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
  );
}

