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
      <body className="min-h-screen bg-[var(--bg)] text-[var(--text-primary)] antialiased">
        <div className="flex min-h-screen">
          {/* Sidebar */}
          <aside className="hidden sm:flex w-[240px] flex-col border-r border-[var(--border)] bg-[var(--bg-elevated)] backdrop-blur-xl">
            {/* Logo Section */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-[var(--border)]">
              <div className="h-10 w-10 rounded-[10px] bg-gradient-to-br from-[var(--accent)] via-[#0084ff] to-[#0066cc] flex items-center justify-center text-sm font-bold text-white shadow-[var(--shadow-sm)]">
                MM
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[15px] font-semibold text-[var(--text-primary)] leading-tight">Milk Mobs</span>
                <span className="text-[12px] text-[var(--text-tertiary)] leading-tight mt-0.5">
                  Campaign Manager
                </span>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-2 py-3 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-[14px] font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)] transition-all duration-[var(--transition-base)]"
                >
                  <span className="relative">{item.label}</span>
                </Link>
              ))}
            </nav>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-[var(--border)]">
              <p className="text-[11px] text-[var(--text-tertiary)] leading-relaxed">
                Powered by <span className="font-semibold text-[var(--text-secondary)]">TwelveLabs</span>
                <br />
                <span className="text-[10px] opacity-75">v0.1.0</span>
              </p>
            </div>
          </aside>

          {/* Main Content Area */}
          <div className="flex flex-1 flex-col min-w-0">
            {/* Top Bar */}
            <header className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--border)] bg-[var(--bg-elevated)]/80 backdrop-blur-xl px-6 py-3.5">
              <div className="sm:hidden flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-[8px] bg-gradient-to-br from-[var(--accent)] to-[#0066cc] flex items-center justify-center text-xs font-bold text-white">
                  MM
                </div>
                <span className="text-[15px] font-semibold text-[var(--text-primary)]">Milk Mobs</span>
              </div>
              <div className="ml-auto flex items-center gap-4 text-[13px]">
                <div className="flex items-center gap-2.5 text-[var(--text-secondary)]">
                  <span className="font-semibold text-[var(--text-primary)]">Got Milk</span>
                  <span className="text-[var(--text-tertiary)]">·</span>
                  <span>Gen Z Campaign</span>
                </div>
                <div className="h-5 w-px bg-[var(--border)]" />
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-full bg-[var(--accent)] flex items-center justify-center text-xs font-semibold text-white shadow-[var(--shadow-sm)]">
                    JB
                  </div>
                  <span className="hidden sm:inline text-[var(--text-secondary)]">joseph@milkco.com</span>
                </div>
              </div>
            </header>

            {/* Page Content */}
            <main className="flex-1 bg-[var(--bg)] px-6 py-8 overflow-y-auto">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
