'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Plus, type LucideIcon } from 'lucide-react';

/**
 * Estado vazio padrão: ícone + título + subtítulo + um CTA no meio.
 * Use `onAction` pra abrir um formulário na própria página, ou `href` pra navegar.
 */
export function EmptyState({
  icon: Icon,
  title,
  subtitle,
  actionLabel,
  onAction,
  href,
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  href?: string;
}) {
  const btnClass =
    'inline-flex items-center gap-2 rounded-full bg-[#FF6A00] px-7 py-3 text-xs font-black uppercase tracking-widest text-[#0A0A0A] transition-opacity hover:opacity-90';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="liquid-glass flex flex-col items-center rounded-3xl px-6 py-16 text-center sm:py-20"
    >
      <Icon size={44} className="mb-5 text-[var(--border-color)]" />
      <p className="mb-1 text-sm font-black uppercase tracking-widest text-[var(--foreground)]">{title}</p>
      {subtitle && (
        <p className="mb-7 max-w-sm text-sm text-[var(--text-muted)]">{subtitle}</p>
      )}
      {actionLabel &&
        (href ? (
          <Link href={href} className={btnClass}>
            <Plus size={14} /> {actionLabel}
          </Link>
        ) : (
          <button type="button" onClick={onAction} className={btnClass}>
            <Plus size={14} /> {actionLabel}
          </button>
        ))}
    </motion.div>
  );
}
