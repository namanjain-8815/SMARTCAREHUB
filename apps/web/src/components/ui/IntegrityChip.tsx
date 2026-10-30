import { ShieldCheck, Clock, XCircle, HelpCircle } from 'lucide-react';
import { cn, truncateHash } from '@/lib/utils';

export type IntegrityStatus = 'verified' | 'pending' | 'revoked' | 'unknown';

interface StatusConfig {
  bg: string;
  border: string;
  text: string;
  label: string;
  icon: typeof ShieldCheck;
}

const statusConfig: Record<IntegrityStatus, StatusConfig> = {
  verified: {
    bg: 'bg-emerald-dim/60',
    border: 'border-emerald/40',
    text: 'text-emerald',
    label: 'Cryptographically Verified',
    icon: ShieldCheck,
  },
  pending: {
    bg: 'bg-amber-dim/60',
    border: 'border-amber/40',
    text: 'text-amber',
    label: 'Pending Confirmation',
    icon: Clock,
  },
  revoked: {
    bg: 'bg-crimson-dim/60',
    border: 'border-crimson/40',
    text: 'text-crimson',
    label: 'Record Revoked',
    icon: XCircle,
  },
  unknown: {
    bg: 'bg-surface-elevated',
    border: 'border-white/10',
    text: 'text-gray-400',
    label: 'Unverified',
    icon: HelpCircle,
  },
};

export function IntegrityChip({
  status,
  label,
  hash,
  className,
}: {
  status: IntegrityStatus;
  label?: string;
  hash?: string;
  className?: string;
}) {
  const config = statusConfig[status] || statusConfig.unknown;
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 px-2.5 py-1 rounded-full border text-xs font-mono',
        config.bg,
        config.border,
        config.text,
        className
      )}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span className="font-medium">{label || config.label}</span>
      {hash && (
        <span className="opacity-70 text-[10px] border-l border-white/10 pl-1.5">
          {truncateHash(hash, 6)}
        </span>
      )}
    </div>
  );
}

