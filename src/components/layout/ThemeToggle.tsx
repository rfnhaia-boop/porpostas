'use client';

import * as React from 'react';
import { useTheme } from '@/components/ThemeProvider';
import { Moon, Sun } from 'lucide-react';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="p-2 rounded-full hover:bg-[var(--border-color)] transition-colors flex items-center justify-center text-[var(--foreground)]"
      aria-label="Alternar tema"
      suppressHydrationWarning
    >
      {/* Evita mismatch: só decide o ícone depois de montar no cliente. */}
      {mounted ? theme === 'dark' ? <Sun size={20} /> : <Moon size={20} /> : <Sun size={20} />}
    </button>
  );
}
