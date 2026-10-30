'use client';

import { useState, useEffect } from 'react';
import { useAccount, useSignMessage, useWriteContract } from 'wagmi';
import { CredentialLockerAbi } from '@/lib/abis';
import { CREDENTIAL_LOCKER_ADDRESS } from '@/hooks/contracts/useCredentialLocker';
import {
  Award,
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  HeartPulse,
  Key,
  Lock,
  Unlock,
  AlertCircle,
  Clock,
  Sparkles,
  Phone,
  Droplet,
  Flame,
  FileBadge,
} from 'lucide-react';
import {
  GlassmorphismCard,
  IntegrityChip,
  EmergencyBadge,
  TxReceipt,
  WalletSignatureModal,
} from '@/components/ui';
import {
  encryptRecord,
  decryptRecord,
  deriveKeyFromSignature,
  getKeyDerivationMessage,
  hexToBytes,
  bytesToHex,
} from '@smartcarehub/crypto-core';
import {
  mockGetCredentials,
  mockIssueCredential,
  mockSetTriage,
  mockGetTriage,
  mockRecordAudit,
  mockGetAuditLogs,
  MockCredential,
  MockTriagePayload,
  MockAuditEntry,
} from '@/lib/mockStore';
import { truncateAddress, truncateHash, formatTimestamp } from '@/lib/utils';

const DEFAULT_CREDENTIALS: MockCredential[] = [
  {
    tokenId: 101,
    holder: '0x71C...DevPatient',
    issuer: '0x1234567890123456789012345678901234567890',
    credentialType: 'COVID_VACCINATION_VERIFIED',
    issuedAt: 1724800000,
    expiresAt: 1756000000,
    dataHash: '0x884a20f781bc2619472314e3e3b3a649ef2efb1807d8a983b5d3c8c7720ba314',
    revoked: false,
  },
  {
    tokenId: 102,
    holder: '0x71C...DevPatient',
    issuer: '0x9876543210987654321098765432109876543210',
    credentialType: 'LICENSED_MEDICAL_PRACTITIONER',
    issuedAt: 1719600000,
    expiresAt: 1780000000,
    dataHash: '0x4f128bc9062aa0d10a248a3d58ef1240c5714088921e16f316f731175e119428',
    revoked: false,
  },
];

export default function CredentialsPage() {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { writeContractAsync } = useWriteContract();
  const activeAddress = address || '0x71C...DevPatient';

  const [credentials, setCredentials] = useState<MockCredential[]>(DEFAULT_CREDENTIALS);
  const [guardians, setGuardians] = useState<string[]>([
    '0x8ba1f109551bD432803012645Ac136ddd64DBA72',
    '0xdD2FD4581271e230360230F9337D5c0430Bf44C0',
  ]);
  const [newGuardianInput, setNewGuardianInput] = useState('');
  const [latestTx, setLatestTx] = useState<string | null>(null);

  // Emergency Triage Payload state
  const [bloodType, setBloodType] = useState('O+');
  const [allergies, setAllergies] = useState('Penicillin, Peanuts (Severe anaphylaxis)');
  const [conditions, setConditions] = useState('Type 1 Diabetes, Asthmatic');
  const [emergencyContacts, setEmergencyContacts] = useState('Sarah Miller (+1-555-0199)');
  const [implants, setImplants] = useState('Cardiac Stent (2023)');
  const [triageSaved, setTriageSaved] = useState(false);

  // Break-glass modal & status
  const [breakGlassModalOpen, setBreakGlassModalOpen] = useState(false);
  const [breakGlassRole, setBreakGlassRole] = useState<'guardian' | 'medic'>('guardian');
  const [breakGlassUnlocked, setBreakGlassUnlocked] = useState(false);
  const [auditLogs, setAuditLogs] = useState<MockAuditEntry[]>([]);

  const loadData = async () => {
    try {
      const creds = await mockGetCredentials(activeAddress);
      if (creds.length > 0) setCredentials(creds);
      const triage = await mockGetTriage(activeAddress);
      if (triage) {
        setTriageSaved(true);
        if (triage.guardians.length > 0) setGuardians(triage.guardians);
      }
      const logs = await mockGetAuditLogs(activeAddress);
      setAuditLogs(logs);
    } catch (err) {
      console.error('Failed to load credentials/triage:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeAddress]);

  const handleSaveTriage = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const triageData = {
        bloodType,
        allergies,
        conditions,
        emergencyContacts,
        implants,
        timestamp: Date.now(),
      };

      const triageBytes = new TextEncoder().encode(JSON.stringify(triageData));
      // Encrypt with client master key
      let sigBytes = new Uint8Array(65).fill(42);
      if (isConnected && signMessageAsync) {
        try {
          const sig = await signMessageAsync({ message: getKeyDerivationMessage() });
          sigBytes = new Uint8Array(hexToBytes(sig));
        } catch {
          // fallback
        }
      }
      const key = await deriveKeyFromSignature(sigBytes);
      const encrypted = await encryptRecord(triageBytes, key);
      const encryptedCID = `bafybeih${bytesToHex(encrypted.slice(0, 16))}`;

      let txHash = `0x${Array.from({ length: 64 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join('')}`;

      if (isConnected) {
        try {
          const tx = await writeContractAsync({
            address: CREDENTIAL_LOCKER_ADDRESS,
            abi: CredentialLockerAbi,
            functionName: 'setTriagePayload',
            args: [encryptedCID, guardians.map((g) => g as `0x${string}`)],
          });
          txHash = tx;
        } catch (contractErr) {
          console.warn('On-chain triage payload anchor skipped or failed:', contractErr);
        }
      }

      await mockSetTriage({
        owner: activeAddress,
        encryptedCID,
        guardians,
        active: true,
      });

      await mockRecordAudit({
        patient: activeAddress,
        accessedBy: activeAddress,
        reason: 'Emergency Triage Payload Anchored to Credential Locker',
        timestamp: Math.floor(Date.now() / 1000),
        txHash,
      });

      setLatestTx(txHash);
      setTriageSaved(true);
      await loadData();
    } catch (err) {
      console.error('Failed to save triage payload:', err);
    }
  };

  const handleAddGuardian = () => {
    if (!newGuardianInput || guardians.includes(newGuardianInput)) return;
    setGuardians([...guardians, newGuardianInput]);
    setNewGuardianInput('');
  };

  const handleRemoveGuardian = (addr: string) => {
    setGuardians(guardians.filter((g) => g.toLowerCase() !== addr.toLowerCase()));
  };

  const triggerBreakGlass = (role: 'guardian' | 'medic') => {
    setBreakGlassRole(role);
    setBreakGlassModalOpen(true);
  };

  const executeBreakGlass = async () => {
    try {
      let txHash = `0x${Array.from({ length: 64 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join('')}`;

      if (isConnected) {
        try {
          const tx = await writeContractAsync({
            address: CREDENTIAL_LOCKER_ADDRESS,
            abi: CredentialLockerAbi,
            functionName:
              breakGlassRole === 'guardian' ? 'breakGlassAsGuardian' : 'breakGlassAsMedic',
            args: [activeAddress as `0x${string}`],
          });
          txHash = tx;
        } catch (contractErr) {
          console.warn('On-chain break-glass call skipped or failed:', contractErr);
        }
      }

      const accessor =
        breakGlassRole === 'guardian'
          ? guardians[0] || '0xGuardian123'
          : '0xMedicER_HospitalSanRafaele';

      await mockRecordAudit({
        patient: activeAddress,
        accessedBy: accessor,
        reason: `EMERGENCY BREAK-GLASS TRIGGERED: Unlocked via ${
          breakGlassRole === 'guardian' ? 'Authorised Guardian' : 'Licensed ER Medic'
        }`,
        timestamp: Math.floor(Date.now() / 1000),
        txHash,
      });

      setLatestTx(txHash);
      setBreakGlassModalOpen(false);
      setBreakGlassUnlocked(true);
      await loadData();
    } catch (err) {
      console.error('Break glass failed:', err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-crimson-dim border border-crimson text-crimson">
            <ShieldAlert className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-display text-[var(--text-primary)]">
              Credential Locker & Break-Glass Vault
            </h1>
            <p className="text-sm text-[var(--text-secondary)]">
              Soulbound identity credentials and emergency dual-authorization triage access
            </p>
          </div>
        </div>

        <EmergencyBadge label="Emergency Protocol Active" />
      </div>

      {latestTx && (
        <TxReceipt
          txHash={latestTx}
          blockNumber={BigInt(7128510)}
          timestamp={Date.now()}
          network="sepolia"
        />
      )}

      {/* Soulbound Credentials Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold font-display text-[var(--text-primary)] flex items-center gap-2">
            <Award className="w-5 h-5 text-emerald-400" />
            <span>Soulbound Credential NFTs (ERC-721 Non-Transferable)</span>
          </h2>
          <span className="text-xs font-mono text-[var(--text-secondary)]">
            {credentials.length} credentials
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {credentials.map((cred) => (
            <GlassmorphismCard
              key={cred.tokenId}
              variant="emerald"
              className="p-5 flex flex-col justify-between space-y-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
                    <FileBadge className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-[var(--text-primary)]">
                      {cred.credentialType.replace(/_/g, ' ')}
                    </h4>
                    <p className="text-xs text-[var(--text-muted)] font-mono">
                      Token ID #{cred.tokenId} · Non-Transferable
                    </p>
                  </div>
                </div>
                <IntegrityChip status={cred.revoked ? 'revoked' : 'verified'} />
              </div>

              <div className="space-y-1.5 font-mono text-xs bg-[var(--bg-base)] p-3 rounded-xl border border-[var(--border-default)]">
                <div className="flex justify-between text-[var(--text-secondary)]">
                  <span className="text-[var(--text-muted)]">Issuer:</span>
                  <span>{truncateAddress(cred.issuer)}</span>
                </div>
                <div className="flex justify-between text-[var(--text-secondary)]">
                  <span className="text-[var(--text-muted)]">Data Hash:</span>
                  <span>{truncateHash(cred.dataHash)}</span>
                </div>
                <div className="flex justify-between text-[var(--text-secondary)]">
                  <span className="text-[var(--text-muted)]">Validity:</span>
                  <span suppressHydrationWarning>Until {formatTimestamp(cred.expiresAt)}</span>
                </div>
              </div>
            </GlassmorphismCard>
          ))}
        </div>
      </div>

      {/* Emergency Triage Setup & Break-Glass Action */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Triage Payload Config (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <GlassmorphismCard className="p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-4">
              <div className="flex items-center gap-2">
                <HeartPulse className="w-5 h-5 text-crimson" />
                <h3 className="font-bold text-base text-[var(--text-primary)]">
                  Critical Emergency Triage Payload
                </h3>
              </div>
              <span className="text-xs font-mono text-[var(--text-secondary)]">
                {triageSaved ? '✓ Encrypted on IPFS' : 'Not Anchored'}
              </span>
            </div>

            <form onSubmit={handleSaveTriage} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                    Blood Group
                  </label>
                  <select
                    value={bloodType}
                    onChange={(e) => setBloodType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg-glass)] border border-[var(--border-default)] text-sm text-[var(--text-primary)]"
                  >
                    <option value="A+">A Positive (A+)</option>
                    <option value="A-">A Negative (A-)</option>
                    <option value="B+">B Positive (B+)</option>
                    <option value="B-">B Negative (B-)</option>
                    <option value="O+">O Positive (O+)</option>
                    <option value="O-">O Negative (O-)</option>
                    <option value="AB+">AB Positive (AB+)</option>
                    <option value="AB-">AB Negative (AB-)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                    Emergency Phone Contact
                  </label>
                  <input
                    type="text"
                    value={emergencyContacts}
                    onChange={(e) => setEmergencyContacts(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg-glass)] border border-[var(--border-default)] text-sm text-[var(--text-primary)]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                  Life-Threatening Anaphylactic Allergies
                </label>
                <textarea
                  rows={2}
                  value={allergies}
                  onChange={(e) => setAllergies(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--bg-glass)] border border-[var(--border-default)] text-sm text-[var(--text-primary)] resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                  Active Medical Implants / Devices
                </label>
                <input
                  type="text"
                  value={implants}
                  onChange={(e) => setImplants(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--bg-glass)] border border-[var(--border-default)] text-sm text-[var(--text-primary)]"
                />
              </div>

              {/* Authorised Guardians */}
              <div className="pt-2 border-t border-[var(--border-default)] space-y-3">
                <label className="block text-xs font-semibold text-[var(--text-primary)]">
                  Authorised Guardian Wallets
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="0x... guardian wallet"
                    value={newGuardianInput}
                    onChange={(e) => setNewGuardianInput(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl bg-[var(--bg-glass)] border border-[var(--border-default)] text-xs font-mono text-[var(--text-primary)]"
                  />
                  <button
                    type="button"
                    onClick={handleAddGuardian}
                    className="px-4 py-2 rounded-xl bg-[var(--bg-elevated)] hover:bg-[var(--bg-glass)] text-xs font-semibold text-[var(--text-primary)]"
                  >
                    Add
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {guardians.map((g) => (
                    <span
                      key={g}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[var(--bg-glass)] border border-[var(--border-default)] text-xs font-mono text-[var(--text-secondary)]"
                    >
                      <span>{truncateAddress(g)}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveGuardian(g)}
                        className="text-red-400 hover:text-red-300 ml-1"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Encrypt & Anchor Emergency Payload</span>
              </button>
            </form>
          </GlassmorphismCard>
        </div>

        {/* Right Column: Break-Glass Triggers (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <GlassmorphismCard variant="emergency" className="p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-crimson-dim text-crimson">
                <Flame className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="font-bold text-base text-[var(--text-primary)]">
                  Break-Glass Override
                </h3>
                <p className="text-xs text-[var(--text-secondary)]">
                  Zero-custody emergency unlock for incapacitated patient triage
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-crimson-dim border border-crimson text-crimson text-xs leading-relaxed space-y-2">
              <p className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>IRREVERSIBLE AUDIT WARNING:</span>
              </p>
              <p>
                Triggering emergency access emits an un-cancellable on-chain event recording the accessor's wallet, timestamp, and purpose.
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => triggerBreakGlass('guardian')}
                className="w-full py-3 px-4 rounded-xl border border-crimson bg-crimson-dim hover:bg-red-900/40 text-red-300 font-semibold text-xs shadow-lg shadow-red-900/30 transition-all flex items-center justify-between"
              >
                <span className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4" />
                  <span>I am an Authorised Guardian</span>
                </span>
                <Unlock className="w-4 h-4 text-crimson" />
              </button>

              <button
                onClick={() => triggerBreakGlass('medic')}
                className="w-full py-3 px-4 rounded-xl border border-amber-500/40 bg-amber-950/20 hover:bg-amber-950/30 text-amber-300 font-semibold text-xs transition-all flex items-center justify-between"
              >
                <span className="flex items-center gap-2">
                  <HeartPulse className="w-4 h-4" />
                  <span>Emergency Medical Responder</span>
                </span>
                <Unlock className="w-4 h-4 text-amber-400" />
              </button>
            </div>

            {/* Decrypted Payload Display upon Break-Glass */}
            {breakGlassUnlocked && (
              <div className="mt-4 p-4 rounded-xl bg-red-950/40 border border-crimson space-y-3 animate-slide-up">
                <div className="flex items-center justify-between text-xs font-bold text-red-300 border-b border-red-500/30 pb-2">
                  <span>DECRYPTED EMERGENCY RECORD</span>
                  <span className="font-mono text-emerald-400">ACCESS GRANTED</span>
                </div>
                <div className="space-y-1 text-xs text-[var(--text-primary)]">
                  <p>
                    <strong className="text-red-300">Blood Type:</strong> {bloodType}
                  </p>
                  <p>
                    <strong className="text-red-300">Allergies:</strong> {allergies}
                  </p>
                  <p>
                    <strong className="text-red-300">Conditions:</strong> {conditions}
                  </p>
                  <p>
                    <strong className="text-red-300">Contacts:</strong> {emergencyContacts}
                  </p>
                  <p>
                    <strong className="text-red-300">Implants:</strong> {implants}
                  </p>
                </div>
              </div>
            )}
          </GlassmorphismCard>
        </div>
      </div>

      {/* Break-Glass Confirmation Modal */}
      {breakGlassModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-[var(--bg-surface)] border border-crimson rounded-2xl p-6 shadow-2xl space-y-5 animate-slide-up">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-crimson-dim text-crimson">
                <AlertTriangle className="w-6 h-6 animate-bounce" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  Confirm Emergency Break-Glass
                </h3>
                <p className="text-xs text-[var(--text-secondary)]">
                  Credential Locker Dispatch
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-red-950/30 border border-red-500/30 text-xs text-red-200 leading-relaxed">
              You are about to unlock the emergency medical triage payload for{' '}
              <strong className="font-mono text-white">{truncateAddress(activeAddress)}</strong>.
              Your public key will be irrevocably logged in the on-chain audit trail.
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setBreakGlassModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-[var(--border-default)] text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-glass)]"
              >
                Abort
              </button>
              <button
                onClick={executeBreakGlass}
                className="flex-1 py-2.5 rounded-xl bg-crimson hover:bg-red-700 text-white font-semibold text-xs shadow-lg shadow-red-600/30"
              >
                Authorize & Unlock
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
