'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { MobileBar } from './MobileBar';

// Casca do app: gaveta lateral no mobile/tablet, sidebar fixa no desktop.
export function AppChrome({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Fecha a gaveta ao trocar de rota.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Trava o scroll do fundo enquanto a gaveta está aberta.
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [open]);

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--background)] transition-colors">
      <Sidebar open={open} onClose={() => setOpen(false)} />

      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-[99] bg-black/50 backdrop-blur-sm lg:hidden"
          aria-hidden
        />
      )}

      <main className="flex-1 overflow-y-auto bg-[var(--background)] transition-colors lg:ml-64">
        <MobileBar onMenu={() => setOpen(true)} />
        {children}
      </main>
    </div>
  );
}
