'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/components/auth/UserProvider';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { AppLogo, BellIcon, MessageIcon } from '@/components/ui/Icons';
import { DEMO_USERS } from '@/lib/demoUsers';

export function Header() {
  const { currentUser, login, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const handleUserSelect = (userId: string) => {
    login(userId);
    setIsDropdownOpen(false);
  };

  const getAvatarColor = (color?: string) => {
    const colors: Record<string, string> = {
      indigo: 'bg-indigo-500',
      emerald: 'bg-emerald-500',
      rose: 'bg-rose-500',
    };
    return colors[color || 'indigo'] || colors.indigo;
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex justify-center border-b border-[var(--border-subtle)] bg-[var(--bg-soft)]/95 backdrop-blur-xl transition-colors duration-300">
      <div className="flex w-full max-w-[480px] items-center justify-between px-3 h-11">
        <div className="flex items-center gap-2">
          <AppLogo className="h-6 w-6 flex-shrink-0" />
          <span
            className="text-[#142F62]"
            style={{
              fontFamily: '"Söhne", sans-serif',
              fontWeight: 600,
              letterSpacing: '-0.01em',
            }}
          >
            The Barn Social Platform
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Notifications"
            className="p-2 rounded-full hover:bg-[var(--bg-hover)] transition-colors duration-200"
          >
            <BellIcon className="h-6 w-6 text-[var(--text)]" />
          </button>
          <button
            type="button"
            aria-label="Messages"
            className="p-2 rounded-full hover:bg-[var(--bg-hover)] transition-colors duration-200"
          >
            <MessageIcon className="h-6 w-6 text-[var(--text)]" />
          </button>
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="p-2 rounded-full hover:bg-[var(--bg-hover)] transition-colors duration-200"
              aria-label="User menu"
            >
              {currentUser ? (
                <div
                  className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-semibold text-white ${getAvatarColor(
                    currentUser.avatarColor
                  )}`}
                >
                  {currentUser.handle.charAt(0).toUpperCase()}
                </div>
              ) : (
                <div className="h-6 w-6 rounded-full bg-[var(--border-subtle)] flex items-center justify-center">
                  <span className="text-[10px] text-[var(--text-muted)]">?</span>
                </div>
              )}
            </button>
            {isDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] shadow-lg overflow-hidden">
                {currentUser && (
                  <div className="px-4 py-3 border-b border-[var(--border-subtle)]">
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-semibold text-white ${getAvatarColor(
                          currentUser.avatarColor
                        )}`}
                      >
                        {currentUser.handle.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-[var(--text)] truncate">
                          @{currentUser.handle}
                        </div>
                        <div className="text-xs text-[var(--text-muted)] truncate">
                          {currentUser.displayName}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div className="py-2">
                  <div className="px-2 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-1">
                    Switch User
                  </div>
                  {Object.values(DEMO_USERS).map((user) => (
                    <button
                      key={user.id}
                      onClick={() => handleUserSelect(user.id)}
                      className={`w-full px-4 py-2 text-left text-sm flex items-center gap-3 hover:bg-[var(--bg-hover)] transition-colors ${
                        currentUser?.id === user.id ? 'bg-[var(--accent-soft)]' : ''
                      }`}
                    >
                      <div
                        className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold text-white ${getAvatarColor(
                          user.avatarColor
                        )}`}
                      >
                        {user.handle.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-[var(--text)] truncate">
                          @{user.handle}
                        </div>
                        <div className="text-xs text-[var(--text-muted)] truncate">
                          {user.displayName}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
                {currentUser && (
                  <div className="border-t border-[var(--border-subtle)] py-2">
                    <button
                      onClick={() => {
                        logout();
                        setIsDropdownOpen(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-[var(--text)] hover:bg-[var(--bg-hover)] transition-colors"
                    >
                      Log out
                    </button>
                  </div>
                )}
                <div className="border-t border-[var(--border-subtle)] px-4 py-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[var(--text)]">Theme</span>
                    <ThemeToggle />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

