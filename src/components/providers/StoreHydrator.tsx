'use client';

import { useEffect } from 'react';
import { usePlatformStore } from '@/store/usePlatformStore';

/** Carrega empresa, clientes e serviços do banco quando o app monta. */
export function StoreHydrator() {
  const hydrate = usePlatformStore((s) => s.hydrate);

  useEffect(() => {
    hydrate().catch((err) => console.error('Falha ao carregar dados:', err));
  }, [hydrate]);

  return null;
}
