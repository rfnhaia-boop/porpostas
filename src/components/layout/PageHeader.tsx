import React from 'react';

interface PageHeaderProps {
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex justify-between items-end mb-12 border-b border-[var(--border-color)] pb-8 no-print">
      <div>
        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-[var(--foreground)]">{title}</h1>
        <p className="text-[var(--text-muted)] font-semibold text-xs tracking-widest uppercase mt-3">{description}</p>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
