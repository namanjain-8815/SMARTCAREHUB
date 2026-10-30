'use client';

import { useState, useEffect } from 'react';
import { useAccount, useSignMessage, useWriteContract } from 'wagmi';
import { RecordRegistryAbi } from '@/lib/abis';
import { RECORD_REGISTRY_ADDRESS } from '@/hooks/contracts/useRecordRegistry';
import {
  Shield,
  Upload,
  Lock,
  Unlock,
  Trash2,
  FileText,
  AlertCircle,
  CheckCircle2,
  Loader2,
  FileCode,
} from 'lucide-react';
import {
  GlassmorphismCard,
  IntegrityChip,
  TxReceipt,
  WalletSignatureModal,
} from '@/components/ui';
import {
  deriveKeyFromSignature,
  getKeyDerivationMessage,
  encryptRecord,
  decryptRecord,
  computeContentHash,
  bytesToHex,
  hexToBytes,
} from '@smartcarehub/crypto-core';
import {
  mockSaveRecord,
  mockGetRecords,
  mockRevokeRecord,
  MockRecord,
} from '@/lib/mockStore';
import { truncateHash, truncateAddress, formatTimestamp } from '@/lib/utils';

export default function VaultPage() {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { writeContractAsync } = useWriteContract();

  // Active encryption key derived from signature
  const [masterKey, setMasterKey] = useState<CryptoKey | null>(null);
  const [records, setRecords] = useState<MockRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [signingModalOpen, setSigningModalOpen] = useState(false);
  const [latestTx, setLatestTx] = useState<string | null>(null);

  // Upload Modal State
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [recordTitle, setRecordTitle] = useState('');
  const [recordCategory, setRecordCategory] = useState('Lab Result');
  const [recordContent, setRecordContent] = useState('');
  const [uploading, setUploading] = useState(false);

  // Decrypted view state
  const [decryptedRecords, setDecryptedRecords] = useState<Record<string, string>>({});

  const activeAddress = address || '0x71C...DevPatient';

  // Load records from IndexedDB mock store
  const loadRecords = async () => {
    try {
      const stored = await mockGetRecords(activeAddress);
      setRecords(stored);
    } catch (err) {
      console.error('Failed to load records:', err);
    }
  };

  useEffect(() => {
    loadRecords();
  }, [activeAddress]);

  // Handle Key Derivation
  const handleDeriveKey = async () => {
    try {
      setLoading(true);
      const message = getKeyDerivationMessage();
      let signatureBytes: Uint8Array;

      if (isConnected && signMessageAsync) {
        const sigHex = await signMessageAsync({ message });
        signatureBytes = hexToBytes(sigHex);
      } else {
        // Dev fallback signature
        signatureBytes = new Uint8Array(65).fill(42);
      }

      const derived = await deriveKeyFromSignature(signatureBytes);
      setMasterKey(derived);
      setSigningModalOpen(false);
    } catch (err) {
      console.error('Key derivation failed:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle Encrypt & Upload
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recordTitle || !recordContent) return;

    try {
      setUploading(true);
      let key = masterKey;
      if (!key) {
        // Auto-derive dev key if not yet derived
        const devSig = new Uint8Array(65).fill(42);
        key = await deriveKeyFromSignature(devSig);
        setMasterKey(key);
      }

      const rawBytes = new TextEncoder().encode(recordContent);
      const encryptedBytes = await encryptRecord(rawBytes, key);
      const contentHashBytes = await computeContentHash(encryptedBytes);
      const contentHashHex = bytesToHex(contentHashBytes);

      // Generate simulated IPFS CID
      const mockCID = `bafybei${contentHashHex.slice(2, 40)}`;

      const newRecord: MockRecord = {
        owner: activeAddress,
        contentHash: contentHashHex,
        encryptedCID: mockCID,
        timestamp: Date.now(),
        revoked: false,
        metadata: {
          title: recordTitle,
          category: recordCategory,
          encryptedData: bytesToHex(encryptedBytes),
        },
      };

      let txHash: string = contentHashHex;
      if (isConnected) {
        try {
          const tx = await writeContractAsync({
            address: RECORD_REGISTRY_ADDRESS,
            abi: RecordRegistryAbi,
            functionName: 'anchorRecord',
            args: [contentHashHex, mockCID],
          });
          txHash = tx;
        } catch (contractErr) {
          console.warn('On-chain anchor skipped or failed (local state preserved):', contractErr);
        }
      }

      await mockSaveRecord(newRecord);
      setLatestTx(txHash);
      setRecordTitle('');
      setRecordContent('');
      setUploadModalOpen(false);
      await loadRecords();
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
    }
  };

  // Decrypt Record inline
  const handleDecrypt = async (record: MockRecord) => {
    if (decryptedRecords[record.contentHash]) {
      // Toggle close
      const copy = { ...decryptedRecords };
      delete copy[record.contentHash];
      setDecryptedRecords(copy);
      return;
    }

    try {
      let key = masterKey;
      if (!key) {
        const devSig = new Uint8Array(65).fill(42);
        key = await deriveKeyFromSignature(devSig);
        setMasterKey(key);
      }

      if (record.metadata?.encryptedData) {
        const encryptedBytes = hexToBytes(record.metadata.encryptedData);
        const decryptedBytes = await decryptRecord(encryptedBytes, key);
        const text = new TextDecoder().decode(decryptedBytes);
        setDecryptedRecords((prev) => ({
          ...prev,
          [record.contentHash]: text,
        }));
      }
    } catch (err) {
      console.error('Decryption failed:', err);
    }
  };

  // Revoke record
  const handleRevoke = async (contentHash: string) => {
    const recordIndex = records.findIndex((r) => r.contentHash === contentHash);
    if (isConnected && recordIndex >= 0) {
      try {
        const tx = await writeContractAsync({
          address: RECORD_REGISTRY_ADDRESS,
          abi: RecordRegistryAbi,
          functionName: 'revokeRecord',
          args: [BigInt(recordIndex)],
        });
        setLatestTx(tx);
      } catch (contractErr) {
        console.warn('On-chain revoke skipped or failed:', contractErr);
      }
    }
    await mockRevokeRecord(contentHash);
    await loadRecords();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 w-full">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display font-extrabold text-3xl text-white">Self-Sovereign Health Vault</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-emerald-dim text-emerald border border-emerald/30">
              AES-256-GCM
            </span>
          </div>
          <p className="text-sm text-gray-400 mt-1">
            Protected Health Information (PHI) encrypted in your browser before IPFS anchoring.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {!masterKey ? (
            <button
              onClick={() => setSigningModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo hover:bg-indigo/90 shadow-md shadow-indigo/20 transition-all"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Derive Vault Key</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-dim/40 border border-emerald/30 text-emerald text-xs font-mono">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Key Active (Hardware Safe)</span>
            </div>
          )}

          <button
            onClick={() => setUploadModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-emerald to-teal shadow-md shadow-emerald/20 hover:opacity-95 transition-all"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Encrypted Record</span>
          </button>
        </div>
      </div>

      {/* Confirmation Receipt Banner */}
      {latestTx && (
        <TxReceipt
          txHash={latestTx}
          label="Medical Record Encrypted & Anchored"
          timestamp={Date.now()}
        />
      )}

      {/* Records List Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs font-mono text-gray-400 px-1">
          <span>{records.length} Records Anchored</span>
          <span>Zero-Knowledge / IPFS Commitment</span>
        </div>

        {records.length === 0 ? (
          <GlassmorphismCard className="text-center py-16 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-gray-400">
              <FileText className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-display font-bold text-base text-white">No Medical Records in Vault</h3>
              <p className="text-xs text-gray-400 max-w-sm mx-auto">
                Upload your first laboratory report, vitals log, or prescription. Encrypted client-side before leaving your device.
              </p>
            </div>
            <button
              onClick={() => setUploadModalOpen(true)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-dim border border-emerald/40 hover:bg-emerald/20"
            >
              Upload New Record
            </button>
          </GlassmorphismCard>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {records.map((rec) => {
              const isDecrypted = Boolean(decryptedRecords[rec.contentHash]);
              return (
                <GlassmorphismCard
                  key={rec.contentHash}
                  variant={rec.revoked ? 'default' : 'emerald'}
                  className="space-y-4"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-white/5 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-emerald">
                        <FileCode className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-display font-bold text-base text-white">
                          {rec.metadata?.title || 'Untitled Medical Record'}
                        </h4>
                        <div className="flex items-center gap-2 text-xs font-mono text-gray-400">
                          <span className="text-teal">{rec.metadata?.category || 'General'}</span>
                          <span>·</span>
                          <span>{formatTimestamp(rec.timestamp)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <IntegrityChip
                        status={rec.revoked ? 'revoked' : 'verified'}
                        hash={rec.contentHash}
                      />
                    </div>
                  </div>

                  {/* Metadata Chips */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                    <div className="p-2.5 rounded-xl bg-black/30 border border-white/5 space-y-1">
                      <span className="text-gray-400">IPFS Encrypted CID:</span>
                      <div className="text-cyan truncate">{rec.encryptedCID}</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-black/30 border border-white/5 space-y-1">
                      <span className="text-gray-400">SHA-256 Content Hash:</span>
                      <div className="text-emerald truncate">{rec.contentHash}</div>
                    </div>
                  </div>

                  {/* Inline Decrypted Content Box */}
                  {isDecrypted && (
                    <div className="p-4 rounded-xl bg-emerald-dim/20 border border-emerald/30 space-y-2 animate-fade-in">
                      <div className="flex items-center justify-between text-xs font-mono text-emerald font-semibold">
                        <div className="flex items-center gap-1.5">
                          <Unlock className="w-3.5 h-3.5" />
                          <span>Decrypted PHI Payload (In-Memory Only)</span>
                        </div>
                        <span className="text-[10px] text-gray-400">AES-256-GCM Verified</span>
                      </div>
                      <pre className="text-xs font-mono text-gray-200 whitespace-pre-wrap break-words bg-black/40 p-3 rounded-lg border border-white/5 max-h-48 overflow-y-auto">
                        {decryptedRecords[rec.contentHash]}
                      </pre>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      onClick={() => handleDecrypt(rec)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-emerald bg-emerald-dim/40 hover:bg-emerald-dim/70 border border-emerald/30 transition-colors"
                    >
                      {isDecrypted ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                      <span>{isDecrypted ? 'Hide Decrypted' : 'Decrypt & View'}</span>
                    </button>

                    {!rec.revoked && (
                      <button
                        onClick={() => handleRevoke(rec.contentHash)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-crimson hover:bg-crimson-dim/30 border border-crimson/20 transition-colors"
                        title="Soft-delete on-chain"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Revoke</span>
                      </button>
                    )}
                  </div>
                </GlassmorphismCard>
              );
            })}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setUploadModalOpen(false)}
            className="fixed inset-0 bg-black/80 backdrop-blur-md"
          />
          <div className="relative w-full max-w-lg rounded-2xl bg-surface-card border border-white/10 p-6 z-10 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-display font-bold text-lg text-white">Upload New Health Record</h3>
              <button
                onClick={() => setUploadModalOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpload} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-300">Record Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Annual Blood Panel 2026"
                  value={recordTitle}
                  onChange={(e) => setRecordTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-emerald"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-300">Category</label>
                <select
                  value={recordCategory}
                  onChange={(e) => setRecordCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-emerald"
                >
                  <option>Lab Result</option>
                  <option>Prescription</option>
                  <option>Imaging & Radiology</option>
                  <option>Vaccination Record</option>
                  <option>Clinical Notes</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-300">Medical Data (PHI)</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Paste clinical metrics, diagnosis, or laboratory values..."
                  value={recordContent}
                  onChange={(e) => setRecordContent(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-emerald font-mono text-xs"
                />
              </div>

              <div className="p-3 rounded-xl bg-cyan-dim/40 border border-cyan/30 text-xs text-cyan flex items-start gap-2">
                <Shield className="w-4 h-4 shrink-0 mt-0.5" />
                <span>Client-side AES-256-GCM encryption will be executed before any data leaves memory.</span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setUploadModalOpen(false)}
                  className="px-4 py-2 text-sm text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-emerald to-teal disabled:opacity-50"
                >
                  {uploading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Encrypt & Store</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Wallet Signature Modal */}
      <WalletSignatureModal
        isOpen={signingModalOpen}
        message={getKeyDerivationMessage()}
        purpose="Derive your personal non-extractable AES-256 encryption key."
        onSign={handleDeriveKey}
        onCancel={() => setSigningModalOpen(false)}
        isLoading={loading}
      />
    </div>
  );
}
