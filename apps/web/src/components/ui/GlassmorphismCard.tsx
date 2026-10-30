'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export type CardVariant = 'default' | 'emerald' | 'cyan' | 'emergency';

const variants: Record<CardVariant, string> = {
  default:   'border-white/10 bg-surface-card/60 hover:border-white/20',
  emerald:   'border-emerald/40 bg-surface-card/80 shadow-[0_0_24px_rgba(16,185,129,0.2)]',
  cyan:      'border-cyan/40 bg-surface-card/80 shadow-[0_0_20px_rgba(6,182,212,0.2)]',
  emergency: 'border-crimson/50 bg-crimson-dim/30 shadow-[0_0_28px_rgba(220,38,38,0.3)] animate-glow-crimson',
};

export function GlassmorphismCard({
  children,
  variant = 'default',
  className,
  animate = false,
  onClick,
}: {
  children: React.ReactNode;
  variant?: CardVariant;
  className?: string;
  animate?: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'backdrop-blur-xl rounded-2xl p-6 border transition-all duration-300',
        variants[variant],
        animate && 'animate-slide-up',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  );
}
