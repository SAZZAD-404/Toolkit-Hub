'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider, type ThemeProviderProps } from 'next-themes';

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      themes={['dark']}
      disableTransitionOnChange={false}
      storageKey="toolkithub-theme"
      enableColorScheme={false}
      forcedTheme="dark"
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
