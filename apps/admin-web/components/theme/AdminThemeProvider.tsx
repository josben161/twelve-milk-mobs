// apps/admin-web/components/theme/AdminThemeProvider.tsx
'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import type { ComponentProps } from 'react';

type AdminThemeProviderProps = ComponentProps<typeof NextThemesProvider>;

export function AdminThemeProvider({ children, ...props }: AdminThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem={true}
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}

