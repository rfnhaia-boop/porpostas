'use client';

import { Menu } from 'lucide-react';
import { NotificationsBell } from './NotificationsBell';
import { ThemeToggle } from './ThemeToggle';

// Barra fixa no topo só em telas pequenas (o Sidebar vira gaveta).
export function MobileBar({ onMenu }: { onMenu: () => void }) {
  return (
    <header className="lg:hidden sticky top-0 z-[90] flex items-center justify-between gap-2 border-b border-[var(--border-color)] bg-[var(--background)]/90 px-4 py-3 backdrop-blur-md no-print">
      <button
        onClick={onMenu}
        aria-label="Abrir menu"
        className="rounded-lg p-1 text-[var(--foreground)] transition-colors hover:text-[#FF6A00]"
      >
        <Menu size={22} />
      </button>
      <h1 className="text-xl font-black uppercase tracking-tighter text-[var(--foreground)]">
        NE<span className="text-[#FF6A00]">X</span>
      </h1>
      <div className="flex items-center gap-1">
        <NotificationsBell />
        <ThemeToggle />
      </div>
    </header>
  );
}
