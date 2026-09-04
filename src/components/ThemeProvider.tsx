'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  setTheme: () => null,
});

const STORAGE_KEY = 'nex-theme';

function applyClass(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark');
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // O script inline no <head> (layout.tsx) já aplicou a classe antes do React hidratar.
  // Aqui só lemos o estado atual — no servidor cai no default 'dark'.
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof document === 'undefined') return 'dark';
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  });

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
      const next: Theme = stored ?? 'dark';
      setThemeState(next);
      applyClass(next);
      if (!stored) localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* localStorage indisponível */
    }
  }, []);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    applyClass(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
