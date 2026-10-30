import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export function EmergencyBadge({
  label = 'Break-Glass Emergency Protocol Active',
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-crimson-dim/80 border border-crimson shadow-[0_0_20px_rgba(220,38,38,0.3)] animate-glow-crimson',
        className
      )}
    >
      <AlertTriangle className="w-4 h-4 text-crimson animate-pulse" />
      <span className="text-crimson text-xs font-bold tracking-wide uppercase font-mono">
        {label}
      </span>
    </div>
  );
}
