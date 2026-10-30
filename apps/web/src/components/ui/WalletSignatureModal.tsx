'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { KeyRound, ShieldAlert, X, Loader2 } from 'lucide-react';

export interface WalletSignatureModalProps {
  isOpen: boolean;
  message: string;
  purpose: string;
  onSign: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function WalletSignatureModal({
  isOpen,
  message,
  purpose,
  onSign,
  onCancel,
  isLoading = false,
}: WalletSignatureModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={isLoading ? undefined : onCancel}
            className="fixed inset-0 bg-black/80 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 16 }}
            className="relative w-full max-w-lg rounded-2xl bg-surface-card border border-white/10 p-6 shadow-2xl shadow-emerald/5 z-10 space-y-5"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo/10 border border-indigo/30 flex items-center justify-center text-indigo">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-white">Wallet Cryptographic Signature</h3>
                  <p className="text-xs text-gray-400">{purpose}</p>
                </div>
              </div>

              {!isLoading && (
                <button
                  onClick={onCancel}
                  className="p-1 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Message Block */}
            <div className="space-y-2">
              <label className="text-xs font-mono font-medium text-gray-300">Message to Sign (EIP-191):</label>
              <pre className="p-3 rounded-xl bg-black/50 border border-white/5 font-mono text-xs text-emerald/90 whitespace-pre-wrap break-all max-h-40 overflow-y-auto">
                {message}
              </pre>
            </div>

            {/* Security Guarantee Notice */}
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-cyan-dim/40 border border-cyan/30 text-xs text-cyan">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                <strong>Privacy Guarantee:</strong> This signature is processed strictly in your browser using Web Cryptography HKDF to derive your non-extractable AES-256 key. It never leaves your machine.
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onCancel}
                disabled={isLoading}
                className="px-4 py-2 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onSign}
                disabled={isLoading}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-emerald to-teal shadow-lg shadow-emerald/20 hover:opacity-95 transition-all disabled:opacity-50"
              >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Authorize & Derive Key</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
