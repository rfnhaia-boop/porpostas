'use client';

import { useEffect } from 'react';

/** Avisa o servidor que o cliente abriu a proposta (uma vez por sessão do navegador). */
export function ViewPing({ token }: { token: string }) {
  useEffect(() => {
    const key = `nexq:viewed:${token}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, '1');
    } catch {
      /* modo privado — segue mesmo assim */
    }
    fetch(`/api/p/${token}/view`, { method: 'POST' }).catch(() => {});
  }, [token]);

  return null;
}
