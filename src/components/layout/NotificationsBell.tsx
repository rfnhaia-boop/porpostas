'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck } from 'lucide-react';
import { api } from '@/lib/api';

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'agora';
  if (s < 3600) return `${Math.floor(s / 60)} min`;
  if (s < 86400) return `${Math.floor(s / 3600)} h`;
  return `${Math.floor(s / 86400)} d`;
}

export function NotificationsBell() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { data } = useQuery({
    queryKey: ['notifications'],
    queryFn: api.notifications.list,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });

  const markRead = useMutation({
    mutationFn: () => api.notifications.markRead(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const items = data?.items ?? [];
  const unread = data?.unread ?? 0;

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next && unread > 0) markRead.mutate();
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={toggle}
        className="relative p-2 rounded-full hover:bg-[var(--border-color)] transition-colors text-[var(--foreground)]"
        aria-label="Notificações"
      >
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#FF6A00] px-1 text-[9px] font-black text-[#0A0A0A]">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-11 z-[200] w-72 overflow-hidden rounded-2xl border border-[var(--border-color)] bg-[var(--panel-bg)] shadow-2xl">
          <div className="flex items-center justify-between border-b border-[var(--border-color)] px-4 py-3">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Notificações</span>
            {items.length > 0 && (
              <button
                onClick={() => markRead.mutate()}
                className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)] hover:text-[#FF6A00]"
              >
                <CheckCheck size={12} /> Lidas
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-8 text-center text-xs text-[var(--text-muted)]">Nada por aqui ainda.</p>
            ) : (
              items.map((n) => (
                <button
                  key={n.id}
                  onClick={() => {
                    setOpen(false);
                    router.push('/proposals');
                  }}
                  className={`block w-full border-b border-[var(--border-color)] px-4 py-3 text-left text-xs transition-colors hover:bg-[var(--background)] ${
                    n.readAt ? 'text-[var(--text-muted)]' : 'text-[var(--foreground)]'
                  }`}
                >
                  <span className="block leading-snug">{n.message}</span>
                  <span className="mt-1 block text-[9px] uppercase tracking-widest text-[var(--text-muted)]">
                    há {timeAgo(n.createdAt)}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
