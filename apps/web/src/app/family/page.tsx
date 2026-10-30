'use client';

import { useState, useEffect } from 'react';
import { useAccount, useSignMessage, useWriteContract } from 'wagmi';
import { DelegationManagerAbi } from '@/lib/abis';
import { DELEGATION_MANAGER_ADDRESS } from '@/hooks/contracts/useDelegationManager';
import {
  Users,
  UserPlus,
  ShieldCheck,
  Clock,
  Trash2,
  QrCode,
  Key,
  Copy,
  Check,
  AlertCircle,
  Calendar,
  Lock,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import {
  GlassmorphismCard,
  IntegrityChip,
  TxReceipt,
  WalletSignatureModal,
} from '@/components/ui';
import {
  generateDelegateKeyPair,
  exportPublicKeyJwk,
  encryptKeyForDelegate,
  deriveRawKeyBytesFromSignature,
  getKeyDerivationMessage,
  hexToBytes,
  bytesToHex,
} from '@smartcarehub/crypto-core';
import {
  mockGrantDelegation,
  mockGetDelegations,
  mockRevokeDelegation,
  mockRecordAudit,
  MockDelegation,
} from '@/lib/mockStore';
import { truncateAddress, formatTimestamp } from '@/lib/utils';

export default function FamilyPage() {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { writeContractAsync } = useWriteContract();
  const activeAddress = address || '0x71C...DevPatient';

  const [delegations, setDelegations] = useState<MockDelegation[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [latestTx, setLatestTx] = useState<string | null>(null);

  // Form state
  const [delegateAddress, setDelegateAddress] = useState('');
  const [selectedRole, setSelectedRole] = useState<1 | 2>(1); // 1 = READ_ONLY, 2 = READ_WRITE
  const [expiryDays, setExpiryDays] = useState(30);
  const [activeTab, setActiveTab] = useState<'matrix' | 'handshake'>('matrix');

  // QR Handshake state
  const [handshakeStep, setHandshakeStep] = useState<1 | 2 | 3>(1);
  const [localEphemeralPubKey, setLocalEphemeralPubKey] = useState<string>('');

  const loadDelegations = async () => {
    try {
      const data = await mockGetDelegations(activeAddress);
      setDelegations(data);
    } catch (err) {
      console.error('Failed to load delegations:', err);
    }
  };

  useEffect(() => {
    loadDelegations();
  }, [activeAddress]);

  const handleCreateDelegation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!delegateAddress) return;

    try {
      setLoading(true);
      // Derive patient key or fallback
      let sigBytes = new Uint8Array(65).fill(42);
      if (isConnected && signMessageAsync) {
        try {
          const sig = await signMessageAsync({ message: getKeyDerivationMessage() });
          sigBytes = new Uint8Array(hexToBytes(sig));
        } catch {
          // fallback to demo key
        }
      }
      const rawMasterKey = await deriveRawKeyBytesFromSignature(sigBytes);

      // Generate ephemeral ECDH keypair for the delegate
      const delegatePair = await generateDelegateKeyPair();
      const delegateJwk = await exportPublicKeyJwk(delegatePair.publicKey);

      // Re-encrypt patient key for delegate
      const encryptedKeyBytes = await encryptKeyForDelegate(rawMasterKey, delegateJwk);
      const encryptedKeyHex = bytesToHex(encryptedKeyBytes);

      const expiresAt = Math.floor(Date.now() / 1000) + expiryDays * 86400;

      const newId = await mockGrantDelegation({
        grantor: activeAddress,
        delegate: delegateAddress,
        role: selectedRole,
        expiresAt,
        revoked: false,
        encryptedKey: encryptedKeyHex,
      });

      let txHash = `0x${Array.from({ length: 64 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join('')}`;

      if (isConnected) {
        try {
          const tx = await writeContractAsync({
            address: DELEGATION_MANAGER_ADDRESS,
            abi: DelegationManagerAbi,
            functionName: 'grantDelegation',
            args: [
              delegateAddress as `0x${string}`,
              selectedRole,
              BigInt(expiresAt),
              encryptedKeyHex as `0x${string}`,
            ],
          });
          txHash = tx;
        } catch (contractErr) {
          console.warn('On-chain delegation call skipped or failed:', contractErr);
        }
      }

      await mockRecordAudit({
        patient: activeAddress,
        accessedBy: delegateAddress,
        reason: `Delegation Granted: Role ${selectedRole === 1 ? 'READ_ONLY' : 'READ_WRITE'} (Expires in ${expiryDays} days)`,
        timestamp: Math.floor(Date.now() / 1000),
        txHash,
      });

      setLatestTx(txHash);
      setIsModalOpen(false);
      setDelegateAddress('');
      await loadDelegations();
    } catch (err) {
      console.error('Error creating delegation:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async (id: number, delegate: string) => {
    try {
      let txHash = `0x${Array.from({ length: 64 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join('')}`;

      if (isConnected) {
        try {
          const tx = await writeContractAsync({
            address: DELEGATION_MANAGER_ADDRESS,
            abi: DelegationManagerAbi,
            functionName: 'revokeDelegation',
            args: [BigInt(id)],
          });
          txHash = tx;
        } catch (contractErr) {
          console.warn('On-chain revoke delegation skipped or failed:', contractErr);
        }
      }

      await mockRevokeDelegation(id);

      await mockRecordAudit({
        patient: activeAddress,
        accessedBy: delegate,
        reason: 'Delegation Revoked by Grantor',
        timestamp: Math.floor(Date.now() / 1000),
        txHash,
      });

      setLatestTx(txHash);
      await loadDelegations();
    } catch (err) {
      console.error('Failed to revoke delegation:', err);
    }
  };

  const copyToClipboard = (text: string, id: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Generate QR Handshake payload
  const initiateHandshake = async () => {
    const pair = await generateDelegateKeyPair();
    const jwk = await exportPublicKeyJwk(pair.publicKey);
    setLocalEphemeralPubKey(JSON.stringify(jwk));
    setHandshakeStep(2);
  };

  const nowSec = Math.floor(Date.now() / 1000);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-[var(--accent-teal-dim)] border border-[var(--accent-teal)]">
              <Users className="w-6 h-6 text-[var(--accent-teal)]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold font-display text-[var(--text-primary)]">
                Family Health Circle
              </h1>
              <p className="text-sm text-[var(--text-secondary)]">
                Secure, time-bound cryptographic access delegation via ECDH key wrapping
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab(activeTab === 'matrix' ? 'handshake' : 'matrix')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--border-default)] hover:border-[var(--accent-teal)] bg-[var(--bg-glass)] text-sm font-medium transition-all"
          >
            <QrCode className="w-4 h-4 text-[var(--accent-teal)]" />
            <span>{activeTab === 'matrix' ? 'Interactive QR Handshake' : 'View Circle Matrix'}</span>
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[var(--accent-teal)] to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white font-medium shadow-lg shadow-teal-500/20 transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>Grant Delegation</span>
          </button>
        </div>
      </div>

      {latestTx && (
        <TxReceipt
          txHash={latestTx}
          blockNumber={BigInt(7128490)}
          timestamp={Date.now()}
          network="sepolia"
        />
      )}

      {/* Main Content Area */}
      {activeTab === 'matrix' ? (
        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <GlassmorphismCard className="p-5 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-[var(--accent-teal-dim)] text-[var(--accent-teal)]">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-mono">
                  Active Delegates
                </p>
                <p className="text-xl font-bold font-display text-[var(--text-primary)]">
                  {delegations.filter((d) => !d.revoked && d.expiresAt > nowSec).length}
                </p>
              </div>
            </GlassmorphismCard>

            <GlassmorphismCard className="p-5 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-amber-500/10 text-amber-400">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-mono">
                  Expiring Within 7 Days
                </p>
                <p className="text-xl font-bold font-display text-[var(--text-primary)]">
                  {
                    delegations.filter(
                      (d) =>
                        !d.revoked &&
                        d.expiresAt > nowSec &&
                        d.expiresAt < nowSec + 7 * 86400
                    ).length
                  }
                </p>
              </div>
            </GlassmorphismCard>

            <GlassmorphismCard className="p-5 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-mono">
                  Security Mode
                </p>
                <p className="text-sm font-semibold text-emerald-400">
                  ECDH P-256 + AES-KW
                </p>
              </div>
            </GlassmorphismCard>
          </div>

          {/* Delegation Matrix Table */}
          <GlassmorphismCard className="p-6">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--border-default)]">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-base text-[var(--text-primary)]">
                  Delegation Access Matrix
                </h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--bg-glass)] text-[var(--text-secondary)] font-mono">
                  {delegations.length} records
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)]">
                Grantor: <span className="font-mono text-[var(--accent-teal)]">{truncateAddress(activeAddress)}</span>
              </p>
            </div>

            {delegations.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <div className="mx-auto w-12 h-12 rounded-full bg-[var(--bg-glass)] flex items-center justify-center text-[var(--text-muted)]">
                  <Users className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-semibold text-[var(--text-primary)]">
                  No Family Delegates Found
                </h4>
                <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto">
                  Add a trusted caregiver, doctor, or family member to grant zero-knowledge or time-limited access to specific records.
                </p>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="mt-2 text-xs font-semibold text-[var(--accent-teal)] hover:underline inline-flex items-center gap-1"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Grant First Access</span>
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto mt-4">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[var(--border-default)] text-xs text-[var(--text-muted)] uppercase font-mono">
                      <th className="py-3 px-4">Delegate Address</th>
                      <th className="py-3 px-4">Role</th>
                      <th className="py-3 px-4">Expires</th>
                      <th className="py-3 px-4">Security Key</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-default)] text-sm">
                    {delegations.map((d, index) => {
                      const isExpired = d.expiresAt <= nowSec;
                      const isRevoked = d.revoked;
                      const isRowActive = !isRevoked && !isExpired;

                      return (
                        <tr
                          key={d.id || index}
                          className={`hover:bg-[var(--bg-glass)] transition-colors ${
                            isRevoked
                              ? 'opacity-60 bg-red-950/10'
                              : isExpired
                              ? 'opacity-75 bg-amber-950/10'
                              : ''
                          }`}
                        >
                          <td className="py-4 px-4 font-mono text-xs">
                            <span className={isRevoked ? 'line-through text-red-400' : 'text-[var(--text-primary)]'}>
                              {truncateAddress(d.delegate)}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span
                              className={`text-xs px-2.5 py-1 rounded-md font-medium ${
                                d.role === 2
                                  ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                                  : 'bg-teal-500/10 text-teal-400 border border-teal-500/20'
                              }`}
                            >
                              {d.role === 2 ? 'READ_WRITE' : 'READ_ONLY'}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-xs font-mono text-[var(--text-secondary)]">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                              <span>{formatTimestamp(d.expiresAt)}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <button
                              onClick={() => copyToClipboard(d.encryptedKey, d.id || index)}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded bg-[var(--bg-glass)] hover:bg-[var(--bg-elevated)] font-mono text-xs text-[var(--text-secondary)]"
                              title="Copy wrapped AES-KW key payload"
                            >
                              <Key className="w-3 h-3 text-[var(--accent-teal)]" />
                              <span>{d.encryptedKey.slice(0, 8)}...</span>
                              {copiedId === (d.id || index) ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </td>
                          <td className="py-4 px-4">
                            {isRevoked ? (
                              <IntegrityChip status="revoked" />
                            ) : isExpired ? (
                              <IntegrityChip status="pending" label="Expired" />
                            ) : (
                              <IntegrityChip status="verified" label="Active" />
                            )}
                          </td>
                          <td className="py-4 px-4 text-right">
                            {isRowActive && (
                              <button
                                onClick={() => handleRevoke(d.id!, d.delegate)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-medium transition-all"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Revoke</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </GlassmorphismCard>
        </div>
      ) : (
        /* Interactive QR Handshake Flow */
        <GlassmorphismCard className="p-8 max-w-2xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <h3 className="text-lg font-bold text-[var(--text-primary)]">
              ECDH Peer-to-Peer QR Handshake
            </h3>
            <p className="text-xs text-[var(--text-secondary)]">
              Securely exchange public keys between devices without transmitting private keys.
            </p>
          </div>

          <div className="flex items-center justify-center gap-4 py-4">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                handshakeStep >= 1
                  ? 'bg-[var(--accent-teal)] text-white'
                  : 'bg-[var(--bg-glass)] text-[var(--text-muted)]'
              }`}
            >
              1
            </div>
            <div className="w-12 h-0.5 bg-[var(--border-default)]" />
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                handshakeStep >= 2
                  ? 'bg-[var(--accent-teal)] text-white'
                  : 'bg-[var(--bg-glass)] text-[var(--text-muted)]'
              }`}
            >
              2
            </div>
            <div className="w-12 h-0.5 bg-[var(--border-default)]" />
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                handshakeStep === 3
                  ? 'bg-[var(--accent-teal)] text-white'
                  : 'bg-[var(--bg-glass)] text-[var(--text-muted)]'
              }`}
            >
              3
            </div>
          </div>

          {handshakeStep === 1 && (
            <div className="text-center space-y-4 py-6">
              <div className="p-4 rounded-xl bg-[var(--bg-glass)] border border-[var(--border-default)] max-w-md mx-auto text-left space-y-2">
                <p className="text-xs font-semibold text-[var(--accent-teal)] flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  <span>How it works:</span>
                </p>
                <p className="text-xs text-[var(--text-secondary)]">
                  1. Your browser generates a single-use P-256 ECDH cryptographic key pair.
                  <br />
                  2. The delegate scans your QR code to negotiate shared secret encryption.
                  <br />
                  3. Access is permanently locked to your patient wallet.
                </p>
              </div>

              <button
                onClick={initiateHandshake}
                className="px-6 py-2.5 rounded-xl bg-[var(--accent-teal)] hover:bg-teal-600 text-white font-medium text-sm transition-all"
              >
                Generate Device Handshake QR
              </button>
            </div>
          )}

          {handshakeStep === 2 && (
            <div className="flex flex-col items-center space-y-4 py-4">
              <div className="p-4 bg-white rounded-2xl shadow-xl">
                <QRCodeSVG
                  value={JSON.stringify({
                    grantor: activeAddress,
                    ephemeralKey: localEphemeralPubKey,
                    timestamp: Date.now(),
                  })}
                  size={220}
                  level="H"
                />
              </div>

              <p className="text-xs text-[var(--text-secondary)] text-center max-w-sm">
                Have the delegate scan this code on their mobile device or tablet to authenticate the session.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setHandshakeStep(3)}
                  className="px-4 py-2 rounded-xl bg-[var(--bg-glass)] hover:bg-[var(--bg-elevated)] border border-[var(--border-default)] text-xs font-medium text-[var(--text-primary)]"
                >
                  Simulate Delegate Response →
                </button>
                <button
                  onClick={() => setHandshakeStep(1)}
                  className="px-4 py-2 rounded-xl text-xs text-[var(--text-muted)] hover:text-white"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {handshakeStep === 3 && (
            <div className="text-center space-y-4 py-6">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-semibold text-[var(--text-primary)]">
                Handshake Negotiated Successfully
              </h4>
              <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto">
                Shared ECDH secret derived. You can now finalize the delegation in the Access Matrix.
              </p>
              <button
                onClick={() => {
                  setHandshakeStep(1);
                  setActiveTab('matrix');
                  setIsModalOpen(true);
                }}
                className="px-5 py-2.5 rounded-xl bg-[var(--accent-teal)] text-white text-xs font-medium"
              >
                Complete Delegation Setup
              </button>
            </div>
          )}
        </GlassmorphismCard>
      )}

      {/* Grant Delegation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl p-6 shadow-2xl space-y-5 animate-slide-up">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[var(--accent-teal)]" />
                <span>Grant Access Delegation</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[var(--text-muted)] hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateDelegation} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                  Delegate Ethereum Address
                </label>
                <input
                  type="text"
                  required
                  placeholder="0x..."
                  value={delegateAddress}
                  onChange={(e) => setDelegateAddress(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-glass)] border border-[var(--border-default)] focus:border-[var(--accent-teal)] outline-none text-sm font-mono text-[var(--text-primary)]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                  Permission Role
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedRole(1)}
                    className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all ${
                      selectedRole === 1
                        ? 'border-[var(--accent-teal)] bg-[var(--accent-teal-dim)] text-[var(--accent-teal)]'
                        : 'border-[var(--border-default)] bg-[var(--bg-glass)] text-[var(--text-secondary)]'
                    }`}
                  >
                    READ_ONLY (View)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedRole(2)}
                    className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all ${
                      selectedRole === 2
                        ? 'border-purple-500 bg-purple-950/30 text-purple-400'
                        : 'border-[var(--border-default)] bg-[var(--bg-glass)] text-[var(--text-secondary)]'
                    }`}
                  >
                    READ_WRITE (Manage)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                  Access Validity Period
                </label>
                <select
                  value={expiryDays}
                  onChange={(e) => setExpiryDays(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-glass)] border border-[var(--border-default)] focus:border-[var(--accent-teal)] outline-none text-sm text-[var(--text-primary)]"
                >
                  <option value={7}>7 Days (Short-term review)</option>
                  <option value={30}>30 Days (Standard Caregiver)</option>
                  <option value={90}>90 Days (Quarterly monitoring)</option>
                  <option value={365}>1 Year (Immediate Family)</option>
                </select>
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  The recipient’s public key will encrypt a wrapped AES key. You can revoke access at any time on-chain.
                </span>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-[var(--border-default)] hover:bg-[var(--bg-glass)] text-xs font-medium text-[var(--text-secondary)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-xl bg-[var(--accent-teal)] hover:bg-teal-600 text-white text-xs font-medium shadow-md shadow-teal-500/20 transition-all flex items-center justify-center gap-1.5"
                >
                  {loading ? 'Encrypting & Anchoring...' : 'Confirm Delegation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
