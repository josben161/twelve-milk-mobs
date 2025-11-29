'use client';

import { useState } from 'react';
import { useAuth } from './UserProvider';
import { DEMO_USERS } from '@/lib/demoUsers';

export function UserSwitch() {
  const { currentUser, login } = useAuth();
  const [userIdInput, setUserIdInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmed = userIdInput.trim();
    if (!trimmed) {
      return;
    }

    try {
      login(trimmed);
      setUserIdInput('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown demo user');
    }
  };

  return (
    <div className="flex items-center gap-2">
      {currentUser ? (
        <>
          {/* Avatar circle */}
          <div
            className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold text-white flex-shrink-0"
            style={{
              backgroundColor:
                currentUser.avatarColor === 'indigo'
                  ? '#6366f1'
                  : currentUser.avatarColor === 'emerald'
                  ? '#10b981'
                  : '#f43f5e',
            }}
          >
            {currentUser.handle.charAt(0).toUpperCase()}
          </div>
          {/* Handle label */}
          <span
            className="text-xs font-medium hidden sm:inline transition-colors duration-300"
            style={{ color: 'var(--text-muted)' }}
          >
            @{currentUser.handle}
          </span>
        </>
      ) : null}

      {/* Switch form */}
      <form onSubmit={handleSubmit} className="flex items-center gap-1.5">
        <input
          type="text"
          value={userIdInput}
          onChange={(e) => {
            setUserIdInput(e.target.value);
            setError(null);
          }}
          placeholder="user_1"
          className="w-20 px-2 py-1 text-xs rounded border transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
          style={{
            borderColor: 'var(--border-subtle)',
            backgroundColor: 'var(--bg)',
            color: 'var(--text)',
          }}
        />
        <button
          type="submit"
          className="px-2 py-1 text-xs font-medium rounded border transition-all duration-200 hover:opacity-80 active:scale-95"
          style={{
            borderColor: 'var(--border-subtle)',
            backgroundColor: 'var(--bg-soft)',
            color: 'var(--text)',
          }}
        >
          Switch
        </button>
      </form>

      {error && (
        <span className="text-xs text-rose-500 whitespace-nowrap">{error}</span>
      )}
    </div>
  );
}

