'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface InputExpansivoProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const InputExpansivo = React.forwardRef<HTMLInputElement, InputExpansivoProps>(
  ({ className, label, ...props }, ref) => {
    return (
      <div className="relative w-full group">
        {label && (
          <label className="text-[var(--text-muted)] text-xs font-bold tracking-widest uppercase mb-1 block">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={cn(
            "w-full bg-transparent border-b-2 border-[var(--border-color)] text-3xl md:text-4xl font-black tracking-wide text-[var(--foreground)]",
            "focus:outline-none focus:border-[#FF6A00] transition-colors duration-300 placeholder:text-[var(--text-muted)] placeholder:opacity-50",
            className
          )}
          {...props}
        />
        <motion.div 
          className="absolute bottom-0 left-0 h-[2px] bg-[#FF6A00]"
          initial={{ width: 0 }}
          whileHover={{ width: '100%' }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          style={{ originX: 0 }}
        />
      </div>
    );
  }
);
InputExpansivo.displayName = 'InputExpansivo';
