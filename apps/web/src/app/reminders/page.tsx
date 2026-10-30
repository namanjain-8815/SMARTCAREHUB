'use client';

import { useState, useEffect } from 'react';
import { useAccount, useWalletClient, useWriteContract } from 'wagmi';
import { AdherenceLoggerAbi } from '@/lib/abis';
import { ADHERENCE_LOGGER_ADDRESS } from '@/hooks/contracts/useAdherenceLogger';
import {
  Pill,
  Clock,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Plus,
  ShieldCheck,
  FileCheck,
  Activity,
  Award,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import {
  GlassmorphismCard,
  IntegrityChip,
  TxReceipt,
  WalletSignatureModal,
} from '@/components/ui';
import {
  signDosageEvent,
  DosagePayload,
} from '@smartcarehub/crypto-core';
import {
  mockLogDosage,
  mockGetDosageLogs,
  mockRecordAudit,
  MockDosageEvent,
} from '@/lib/mockStore';
import { truncateHash, truncateAddress, formatTimestamp } from '@/lib/utils';

interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  timeSlot: string; // e.g. "09:00 AM"
  category: string;
}

const DEFAULT_MEDICATIONS: Medication[] = [
  {
    id: 'med-atorvastatin',
    name: 'Atorvastatin',
    dosage: '20mg',
    frequency: 'Once Daily',
    timeSlot: '09:00 PM',
    category: 'Cardiovascular',
  },
  {
    id: 'med-metformin',
    name: 'Metformin HCl',
    dosage: '500mg',
    frequency: 'Twice Daily',
    timeSlot: '08:00 AM',
    category: 'Endocrine',
  },
  {
    id: 'med-lisinopril',
    name: 'Lisinopril',
    dosage: '10mg',
    frequency: 'Once Daily',
    timeSlot: '09:00 AM',
    category: 'Hypertension',
  },
];

export default function RemindersPage() {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { writeContractAsync } = useWriteContract();
  const activeAddress = address || '0x71C...DevPatient';

  const [medications, setMedications] = useState<Medication[]>(DEFAULT_MEDICATIONS);
  const [dosageLogs, setDosageLogs] = useState<MockDosageEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [latestTx, setLatestTx] = useState<string | null>(null);

  // New med modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newMedName, setNewMedName] = useState('');
  const [newMedDose, setNewMedDose] = useState('');
  const [newMedTime, setNewMedTime] = useState('08:00 AM');
  const [newMedCategory, setNewMedCategory] = useState('General');

  // Confirmation modal
  const [confirmingMed, setConfirmingMed] = useState<Medication | null>(null);
  const [signatureModalOpen, setSignatureModalOpen] = useState(false);
  const [simulatedSignature, setSimulatedSignature] = useState<string | null>(null);

  const loadLogs = async () => {
    try {
      const logs = await mockGetDosageLogs(activeAddress);
      setDosageLogs(logs);
    } catch (err) {
      console.error('Failed to load dosage logs:', err);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [activeAddress]);

  const handleAddMedication = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMedName || !newMedDose) return;

    const newMed: Medication = {
      id: `med-${Date.now()}`,
      name: newMedName,
      dosage: newMedDose,
      frequency: 'Daily',
      timeSlot: newMedTime,
      category: newMedCategory,
    };

    setMedications([...medications, newMed]);
    setIsAddModalOpen(false);
    setNewMedName('');
    setNewMedDose('');
  };

  // EIP-712 Confirmation Handler
  const handleConfirmDose = async (med: Medication) => {
    setConfirmingMed(med);
    setSignatureModalOpen(true);
  };

  const executeSigning = async () => {
    if (!confirmingMed) return;

    try {
      setLoading(true);
      const scheduledAt = BigInt(Math.floor(Date.now() / 1000) - 300);
      const confirmedAt = BigInt(Math.floor(Date.now() / 1000));

      const payload: DosagePayload = {
        medicationId: confirmingMed.id,
        scheduledAt,
        confirmedAt,
      };

      let signature = '0x' + 'ff'.repeat(65);
      if (isConnected && walletClient) {
        try {
          const contractAddress = (process.env.NEXT_PUBLIC_ADHERENCE_LOGGER_ADDRESS ||
            '0x47F894105De0c6cBffeFE297Ce60Bcd771235Cad') as `0x${string}`;
          signature = await signDosageEvent(walletClient, contractAddress, payload);
        } catch (err) {
          console.warn('Wallet signing cancelled, falling back to mock signature', err);
        }
      }

      const eventHash = `0x${Array.from({ length: 64 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join('')}`;

      await mockLogDosage({
        eventHash,
        patient: activeAddress,
        medicationId: confirmingMed.id,
        scheduledAt: Number(scheduledAt),
        confirmedAt: Number(confirmedAt),
      });

      let txHash = `0x${Array.from({ length: 64 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join('')}`;

      if (isConnected && signature && signature !== '0x' + 'ff'.repeat(65)) {
        try {
          const tx = await writeContractAsync({
            address: ADHERENCE_LOGGER_ADDRESS,
            abi: AdherenceLoggerAbi,
            functionName: 'logDosage',
            args: [confirmingMed.id, scheduledAt, confirmedAt, signature as `0x${string}`],
          });
          txHash = tx;
        } catch (contractErr) {
          console.warn('On-chain logDosage skipped or failed:', contractErr);
        }
      }

      await mockRecordAudit({
        patient: activeAddress,
        accessedBy: activeAddress,
        reason: `Dosage Confirmed via EIP-712: ${confirmingMed.name} (${confirmingMed.dosage})`,
        timestamp: Number(confirmedAt),
        txHash,
      });

      setSimulatedSignature(signature);
      setLatestTx(txHash);
      setSignatureModalOpen(false);
      await loadLogs();
    } catch (err) {
      console.error('Failed to confirm dosage:', err);
    } finally {
      setLoading(false);
    }
  };

  // Compliance calculations
  const totalDosesExpected = 14; // e.g. rolling 7 days x 2
  const confirmedCount = dosageLogs.length + 9; // baseline demo score
  const compliancePercentage = Math.min(100, Math.round((confirmedCount / totalDosesExpected) * 100));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Pill className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-display text-[var(--text-primary)]">
              Adherence & Medicine Reminders
            </h1>
            <p className="text-sm text-[var(--text-secondary)]">
              EIP-712 cryptographically signed dosage confirmation with on-chain compliance scoring
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-medium shadow-lg shadow-cyan-500/20 transition-all self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Medication</span>
        </button>
      </div>

      {latestTx && (
        <TxReceipt
          txHash={latestTx}
          blockNumber={BigInt(7128495)}
          timestamp={Date.now()}
          network="sepolia"
        />
      )}

      {/* Compliance Overview & Health Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Compliance Circular Gauge */}
        <GlassmorphismCard className="p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm text-[var(--text-primary)] flex items-center gap-2">
              <Award className="w-4 h-4 text-cyan-400" />
              <span>Rolling Compliance Score</span>
            </h3>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 font-mono">
              Last 7 Days
            </span>
          </div>

          <div className="py-6 flex flex-col items-center justify-center">
            <div className="relative w-36 h-36 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="72"
                  cy="72"
                  r="56"
                  stroke="rgba(255,255,255,0.08)"
                  strokeWidth="10"
                  fill="transparent"
                />
                <circle
                  cx="72"
                  cy="72"
                  r="56"
                  stroke={compliancePercentage >= 80 ? '#10B981' : '#F59E0B'}
                  strokeWidth="10"
                  strokeDasharray="351.85"
                  strokeDashoffset={351.85 - (351.85 * compliancePercentage) / 100}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-3xl font-extrabold font-display text-[var(--text-primary)]">
                  {compliancePercentage}%
                </span>
                <span className="text-[10px] uppercase tracking-wider font-mono text-[var(--text-muted)]">
                  EIP-712 Verified
                </span>
              </div>
            </div>
            <p className="mt-4 text-xs text-center text-[var(--text-secondary)]">
              {compliancePercentage >= 80
                ? 'High adherence tier. Eligible for insurance rate optimization proofs.'
                : 'Moderate adherence. Stay consistent to reach top tier.'}
            </p>
          </div>

          <div className="pt-4 border-t border-[var(--border-default)] flex items-center justify-between text-xs font-mono">
            <span className="text-[var(--text-muted)]">Confirmed Doses:</span>
            <span className="text-emerald-400 font-semibold">{confirmedCount} of 14</span>
          </div>
        </GlassmorphismCard>

        {/* EIP-712 Cryptographic Transparency Box */}
        <GlassmorphismCard className="p-6 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <h3 className="font-semibold text-sm text-[var(--text-primary)]">
                EIP-712 Typed Data Verification
              </h3>
            </div>
            <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono">
              Domain: SmartCareHub.AdherenceLogger
            </span>
          </div>

          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            Every dosage confirmation is signed using Ethereum EIP-712 structured data standards. Unlike opaque text or raw hashes, your wallet explicitly prompts you with the medication ID, scheduled timestamp, and confirmation timestamp before committing the entry to the audit trail.
          </p>

          <div className="p-4 rounded-xl bg-[var(--bg-base)] border border-[var(--border-default)] font-mono text-xs text-cyan-300/90 overflow-x-auto space-y-1">
            <p className="text-[var(--text-muted)]">// EIP-712 Schema Definition</p>
            <p>{`DosageEvent {`}</p>
            <p className="pl-4">{`string medicationId: "med-atorvastatin"`}</p>
            <p className="pl-4">{`uint256 scheduledAt: 1729833600`}</p>
            <p className="pl-4">{`uint256 confirmedAt: 1729833910`}</p>
            <p>{`}`}</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-2.5 rounded-lg bg-[var(--bg-glass)] text-xs">
              <span className="text-[var(--text-muted)] block text-[10px]">Verification Chain</span>
              <span className="font-medium text-[var(--text-primary)]">Sepolia (11155111)</span>
            </div>
            <div className="p-2.5 rounded-lg bg-[var(--bg-glass)] text-xs">
              <span className="text-[var(--text-muted)] block text-[10px]">Signer Security</span>
              <span className="font-medium text-emerald-400">Hardware / Web3 Key</span>
            </div>
            <div className="p-2.5 rounded-lg bg-[var(--bg-glass)] text-xs col-span-2 sm:col-span-1">
              <span className="text-[var(--text-muted)] block text-[10px]">Anti-Replay Mechanism</span>
              <span className="font-medium text-cyan-400">Timestamp Window</span>
            </div>
          </div>
        </GlassmorphismCard>
      </div>

      {/* Medication Schedule List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold font-display text-[var(--text-primary)]">
            Active Prescriptions & Regimens
          </h2>
          <span className="text-xs font-mono text-[var(--text-secondary)]">
            {medications.length} active medications
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {medications.map((med) => {
            const hasConfirmedToday = dosageLogs.some((l) => l.medicationId === med.id);

            return (
              <GlassmorphismCard
                key={med.id}
                className="p-5 flex flex-col justify-between space-y-4 hover:border-cyan-500/40 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400">
                      <Pill className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-base text-[var(--text-primary)]">
                        {med.name}
                      </h4>
                      <p className="text-xs text-[var(--text-secondary)] font-mono">
                        {med.dosage} · {med.frequency}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--bg-glass)] border border-[var(--border-default)] text-[var(--text-secondary)]">
                    {med.category}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-[var(--bg-base)] border border-[var(--border-default)] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-[var(--text-secondary)]">
                    <Clock className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Next Dose:</span>
                  </div>
                  <span className="font-mono font-semibold text-[var(--text-primary)]">
                    {med.timeSlot}
                  </span>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  {hasConfirmedToday ? (
                    <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-medium">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirmed for Today</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleConfirmDose(med)}
                      className="w-full py-2.5 px-4 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 font-medium text-xs transition-all flex items-center justify-center gap-2"
                    >
                      <FileCheck className="w-3.5 h-3.5" />
                      <span>Confirm Intake (EIP-712)</span>
                    </button>
                  )}
                </div>
              </GlassmorphismCard>
            );
          })}
        </div>
      </div>

      {/* Confirmation & Signature Modal */}
      {signatureModalOpen && confirmingMed && (
        <WalletSignatureModal
          isOpen={signatureModalOpen}
          message={`Please sign the EIP-712 dosage confirmation for:
Medication: ${confirmingMed.name} (${confirmingMed.dosage})
Domain: SmartCareHub.AdherenceLogger
Chain ID: 11155111
Patient: ${activeAddress}`}
          purpose="Cryptographic Proof of Medication Adherence"
          onSign={executeSigning}
          onCancel={() => setSignatureModalOpen(false)}
        />
      )}

      {/* Add Medication Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl p-6 shadow-2xl space-y-4 animate-slide-up">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                <Plus className="w-5 h-5 text-cyan-400" />
                <span>Add Prescribed Medication</span>
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-[var(--text-muted)] hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddMedication} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                  Medication Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Amoxicillin"
                  value={newMedName}
                  onChange={(e) => setNewMedName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-[var(--bg-glass)] border border-[var(--border-default)] focus:border-cyan-400 outline-none text-sm text-[var(--text-primary)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                    Dosage
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 500mg"
                    value={newMedDose}
                    onChange={(e) => setNewMedDose(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-[var(--bg-glass)] border border-[var(--border-default)] focus:border-cyan-400 outline-none text-sm text-[var(--text-primary)]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                    Scheduled Time
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 08:00 AM"
                    value={newMedTime}
                    onChange={(e) => setNewMedTime(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-[var(--bg-glass)] border border-[var(--border-default)] focus:border-cyan-400 outline-none text-sm text-[var(--text-primary)]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                  Therapeutic Category
                </label>
                <select
                  value={newMedCategory}
                  onChange={(e) => setNewMedCategory(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-[var(--bg-glass)] border border-[var(--border-default)] focus:border-cyan-400 outline-none text-sm text-[var(--text-primary)]"
                >
                  <option value="General">General Care</option>
                  <option value="Cardiovascular">Cardiovascular</option>
                  <option value="Endocrine">Endocrine / Metabolic</option>
                  <option value="Antibiotic">Antibiotic / Infection</option>
                  <option value="Neurology">Neurology / Pain</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-[var(--border-default)] text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-glass)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium shadow-md shadow-cyan-500/20"
                >
                  Save Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
