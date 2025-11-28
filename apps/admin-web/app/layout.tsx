// apps/admin-web/app/layout.tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'Milk Mobs Admin',
  description: 'Brand & campaign control center for Milk Mobs',
};

const navItems = [
  { href: '/', label: 'Overview' },
  { href: '/videos', label: 'Videos' },
  { href: '/mobs', label: 'Mobs' },
  { href: '/settings', label: 'Settings' },
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
        <div className="flex min-h-screen">
          {/* Sidebar */}
          <aside className="hidden sm:flex w-60 flex-col border-r border-[var(--border-subtle)] bg-[var(--bg-soft)]">
            <div className="flex items-center gap-2 px-4 py-4 border-b border-[var(--border-subtle)]">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-xs font-semibold text-white">
                MM
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold">Milk Mobs</span>
                <span className="text-[11px] text-[var(--text-muted)]">
                  Admin dashboard
                </span>
              </div>
            </div>

            <nav className="flex-1 px-2 py-3 space-y-1 text-sm text-[var(--text-muted)]">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-[var(--accent-soft)] hover:text-white transition-colors"
                >
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>

            <div className="px-4 py-3 border-t border-[var(--border-subtle)] text-[11px] text-[var(--text-muted)]">
              Powered by TwelveLabs · v0.1
            </div>
          </aside>

          {/* Main area */}
          <div className="flex flex-1 flex-col">
            {/* Top bar */}
            <header className="flex items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--bg-soft)] px-4 py-3">
              <div className="sm:hidden flex items-center gap-2">
                <div className="h-7 w-7 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-[10px] font-semibold text-white">
                  MM
                </div>
                <span className="text-sm font-semibold">Milk Mobs Admin</span>
              </div>
              <div className="ml-auto flex items-center gap-4 text-xs text-[var(--text-muted)]">
                <span>Campaign: Got Milk · Gen Z</span>
                <div className="h-6 w-px bg-[var(--border-subtle)]" />
                <div className="flex items-center gap-2">
                  <span className="h-7 w-7 rounded-full bg-slate-700 flex items-center justify-center text-[11px] text-white">
                    JB
                  </span>
                  <span className="hidden sm:inline">joseph@milkco.com</span>
                </div>
              </div>
            </header>

            {/* Page content */}
            <main className="flex-1 bg-[var(--bg)] px-4 py-6 sm:px-8">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}

