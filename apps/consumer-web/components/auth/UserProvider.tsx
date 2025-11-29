'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { DEMO_USERS, type DemoUser } from '@/lib/demoUsers';

interface AuthContextValue {
  currentUser: DemoUser | null;
  login: (userId: string) => void;
  logout: () => void;
}

const defaultContextValue: AuthContextValue = {
  currentUser: null,
  login: () => {
    throw new Error('UserProvider not initialized');
  },
  logout: () => {
    throw new Error('UserProvider not initialized');
  },
};

const AuthContext = createContext<AuthContextValue>(defaultContextValue);

const STORAGE_KEY = 'milk-mobs-demo-user-id';

export function UserProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<DemoUser | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  // Hydrate from localStorage on mount
  useEffect(() => {
    const storedUserId = localStorage.getItem(STORAGE_KEY);
    if (storedUserId && DEMO_USERS[storedUserId]) {
      setCurrentUser(DEMO_USERS[storedUserId]);
    }
    setIsHydrated(true);
  }, []);

  const login = (userId: string) => {
    const user = DEMO_USERS[userId];
    if (user) {
      setCurrentUser(user);
      localStorage.setItem(STORAGE_KEY, userId);
    } else {
      throw new Error(`Unknown demo user: ${userId}`);
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  // Don't render children until hydrated to avoid hydration mismatch
  if (!isHydrated) {
    return <>{children}</>;
  }

  return (
    <AuthContext.Provider value={{ currentUser, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}

