import React from 'react';

interface PageHeaderProps {
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-end mb-8 sm:mb-12 border-b border-[var(--border-color)] pb-6 sm:pb-8 no-print">
      <div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tighter text-[var(--foreground)]">{title}</h1>
        <p className="text-[var(--text-muted)] font-semibold text-xs tracking-widest uppercase mt-3">{description}</p>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
