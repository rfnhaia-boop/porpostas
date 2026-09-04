'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { motion, HTMLMotionProps } from 'framer-motion';

interface NeonButtonProps extends HTMLMotionProps<"button"> {
  children: React.ReactNode;
}

export const NeonButton = React.forwardRef<HTMLButtonElement, NeonButtonProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={cn(
          "relative px-8 py-4 rounded-full font-bold uppercase tracking-widest text-sm text-[#0A0A0A]",
          "bg-gradient-to-r from-[#FF6A00] to-[#FF8A3D] overflow-hidden",
          "shadow-[0_0_40px_rgba(255,106,0,0.35)] hover:shadow-[0_0_60px_rgba(255,106,0,0.55)] transition-shadow duration-300",
          className
        )}
        {...props}
      >
        <span className="relative z-10">{children}</span>
        <div className="absolute inset-0 bg-white/20 blur-md opacity-0 hover:opacity-100 transition-opacity duration-300" />
      </motion.button>
    );
  }
);
NeonButton.displayName = 'NeonButton';
