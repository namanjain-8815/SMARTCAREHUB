'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, ExternalLink, Copy, Check } from 'lucide-react';
import { truncateHash, formatTimestamp } from '@/lib/utils';

export interface TxReceiptProps {
  txHash: string;
  blockNumber?: bigint | number;
  timestamp?: number;
  network?: string;
  label?: string;
}

export function TxReceipt({
  txHash,
  blockNumber,
  timestamp = Date.now(),
  network = 'Sepolia',
  label = 'Transaction Confirmed',
}: TxReceiptProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(txHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isMock = txHash.startsWith('0xmock') || txHash.includes('mock');

  return (
    <div className="flex items-start gap-3.5 p-4 rounded-xl bg-surface-elevated/70 border border-emerald/30 shadow-lg shadow-emerald/5">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className="w-7 h-7 rounded-full bg-emerald-dim/80 text-emerald flex items-center justify-center shrink-0 border border-emerald/50"
      >
        <CheckCircle2 className="w-4 h-4" />
      </motion.div>

      <div className="space-y-1.5 flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-emerald tracking-wide uppercase font-mono">
            {label}
          </span>
          <span className="text-[11px] font-mono text-gray-400">
            {formatTimestamp(timestamp)}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 font-mono text-xs text-gray-300">
          <span className="text-gray-400">Tx:</span>
          <button
            onClick={copyToClipboard}
            className="group flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/30 hover:bg-black/50 text-emerald transition-colors"
            title="Click to copy full transaction hash"
          >
            <span>{truncateHash(txHash, 8)}</span>
            {copied ? (
              <Check className="w-3 h-3 text-emerald" />
            ) : (
              <Copy className="w-3 h-3 opacity-60 group-hover:opacity-100" />
            )}
          </button>

          {blockNumber && (
            <span className="text-gray-400">
              · Block <span className="text-gray-200">#{blockNumber.toString()}</span>
            </span>
          )}

          {!isMock && (
            <a
              href={`https://sepolia.etherscan.io/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-cyan hover:underline ml-auto"
            >
              <span>{network}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
