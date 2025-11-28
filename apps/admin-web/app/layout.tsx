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
          <aside className="hidden sm:flex w-64 flex-col border-r border-[var(--border-subtle)] bg-[var(--bg-soft)]">
            <div className="flex items-center gap-3 px-5 py-5 border-b border-[var(--border-subtle)]">
              <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-[var(--accent)] to-[#42a5f5] flex items-center justify-center text-sm font-bold text-white shadow-sm">
                MM
              </div>
              <div className="flex flex-col">
                <span className="text-[15px] font-semibold text-[var(--text-primary)]">Milk Mobs</span>
                <span className="text-xs text-[var(--text-secondary)]">
                  Campaign Manager
                </span>
              </div>
            </div>

            <nav className="flex-1 px-2 py-4 space-y-0.5">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-all duration-150"
                >
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>

            <div className="px-5 py-4 border-t border-[var(--border-subtle)]">
              <p className="text-[11px] text-[var(--text-tertiary)] leading-relaxed">
                Powered by <span className="font-medium text-[var(--text-secondary)]">TwelveLabs</span>
                <br />
                <span className="text-[10px]">v0.1.0</span>
              </p>
            </div>
          </aside>

          {/* Main area */}
          <div className="flex flex-1 flex-col">
            {/* Top bar */}
            <header className="flex items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--bg-soft)] px-6 py-4">
              <div className="sm:hidden flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[var(--accent)] to-[#42a5f5] flex items-center justify-center text-xs font-bold text-white">
                  MM
                </div>
                <span className="text-[15px] font-semibold text-[var(--text-primary)]">Milk Mobs</span>
              </div>
              <div className="ml-auto flex items-center gap-5 text-sm">
                <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                  <span className="font-medium text-[var(--text-primary)]">Got Milk</span>
                  <span className="text-[var(--text-tertiary)]">·</span>
                  <span>Gen Z Campaign</span>
                </div>
                <div className="h-6 w-px bg-[var(--border-subtle)]" />
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-full bg-[var(--accent)] flex items-center justify-center text-xs font-semibold text-white">
                    JB
                  </div>
                  <span className="hidden sm:inline text-[var(--text-secondary)]">joseph@milkco.com</span>
                </div>
              </div>
            </header>

            {/* Page content */}
            <main className="flex-1 bg-[var(--bg)] px-6 py-8">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}

