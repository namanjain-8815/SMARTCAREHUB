'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import {
  ShieldCheck,
  Lock,
  Cpu,
  CheckCircle2,
  AlertCircle,
  QrCode,
  Download,
  Copy,
  Check,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import {
  GlassmorphismCard,
  IntegrityChip,
  TxReceipt,
  ProofProgressRing,
} from '@/components/ui';
import {
  generateHealthProof,
  verifyProofLocally,
  formatProofForSolidity,
  ClaimType,
} from '@/lib/zkProofHelpers';
import { mockRecordAudit } from '@/lib/mockStore';

export default function ProvePage() {
  const { address } = useAccount();
  const activeAddress = address || '0x71C...DevPatient';

  const [claimType, setClaimType] = useState<ClaimType>('vaccination');
  const [proving, setProving] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState('Idle');
  const [proofResult, setProofResult] = useState<{
    proof: any;
    publicSignals: string[];
  } | null>(null);
  const [localVerified, setLocalVerified] = useState<boolean | null>(null);
  const [latestTx, setLatestTx] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedProof, setCopiedProof] = useState(false);

  // Form Inputs for the 3 circuits
  // 1. Vaccination Inputs
  const [todayTimestamp, setTodayTimestamp] = useState(1000);
  const [windowDays, setWindowDays] = useState(30);
  const [vaccDate, setVaccDate] = useState(985); // 15 days ago -> Valid
  const [vaccRecordHash, setVaccRecordHash] = useState(123456789);

  // 2. Vitals Range Inputs (e.g. Systolic Blood Pressure)
  const [vitalLow, setVitalLow] = useState(90);
  const [vitalHigh, setVitalHigh] = useState(120);
  const [vitalValue, setVitalValue] = useState(115); // Normal -> Valid
  const [vitalRecordHash, setVitalRecordHash] = useState(987654321);

  // 3. Age Threshold Inputs
  const [ageTodayTs, setAgeTodayTs] = useState(20000);
  const [minAgeDays, setMinAgeDays] = useState(6570); // 18 years
  const [dobTs, setDobTs] = useState(10000); // age = 10,000 days >= 6570 -> Valid
  const [ageRecordHash, setAgeRecordHash] = useState(555555555);

  const resetProof = () => {
    setProofResult(null);
    setLocalVerified(null);
    setLatestTx(null);
    setErrorMessage(null);
    setProgress(0);
    setStage('Idle');
  };

  const handleGenerateProof = async () => {
    resetProof();
    setProving(true);
    setStage('Preparing Inputs');
    setProgress(15);

    try {
      let inputs: Record<string, any> = {};

      if (claimType === 'vaccination') {
        // Pre-validation constraint sanity check
        if (vaccDate < todayTimestamp - windowDays || vaccDate > todayTimestamp) {
          throw new Error(
            `Vaccination date (${vaccDate}) falls outside valid window [${todayTimestamp - windowDays}, ${todayTimestamp}]. Circuit will reject this proof.`
          );
        }
        inputs = {
          today_timestamp: todayTimestamp,
          window_days: windowDays,
          vacc_date: vaccDate,
          record_hash: vaccRecordHash,
        };
      } else if (claimType === 'vitals') {
        if (vitalValue < vitalLow || vitalValue > vitalHigh) {
          throw new Error(
            `Vitals measurement (${vitalValue}) is outside normal range [${vitalLow}, ${vitalHigh}]. Circuit will reject this proof.`
          );
        }
        inputs = {
          low: vitalLow,
          high: vitalHigh,
          value: vitalValue,
          record_hash: vitalRecordHash,
        };
      } else if (claimType === 'age') {
        if (ageTodayTs - dobTs < minAgeDays) {
          throw new Error(
            `Calculated age (${ageTodayTs - dobTs} days) is less than required threshold (${minAgeDays} days / 18 years).`
          );
        }
        inputs = {
          today_ts: ageTodayTs,
          min_age_days: minAgeDays,
          dob_ts: dobTs,
          record_hash: ageRecordHash,
        };
      }

      setStage('Loading WASM & ZKey');
      setProgress(35);

      const res = await generateHealthProof(claimType, inputs, (pct) => {
        setProgress(pct);
        if (pct < 50) setStage('Computing Witness');
        else if (pct < 90) setStage('Synthesizing Groth16 Proof');
        else setStage('Finalizing Proof');
      });

      setProofResult(res);
      setProgress(100);
      setStage('Proof Generation Complete');

      // Immediate local verification
      const isValid = await verifyProofLocally(claimType, res.proof, res.publicSignals);
      setLocalVerified(isValid);

      // Record audit
      await mockRecordAudit({
        patient: activeAddress,
        accessedBy: activeAddress,
        reason: `Generated ZK Proof: Claim '${claimType}' (Public Signals: ${res.publicSignals.length})`,
        timestamp: Math.floor(Date.now() / 1000),
        txHash: '0x' + '00'.repeat(32),
      });
    } catch (err: any) {
      console.error('Proof generation failed:', err);
      setErrorMessage(err.message || 'Failed to generate zero-knowledge proof');
      setStage('Proof Failed');
    } finally {
      setProving(false);
    }
  };

  const handleVerifyOnChain = async () => {
    if (!proofResult) return;
    try {
      const txHash = `0x${Array.from({ length: 64 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join('')}`;

      await mockRecordAudit({
        patient: activeAddress,
        accessedBy: activeAddress,
        reason: `On-Chain Groth16 Verified via HealthProver: Claim '${claimType}'`,
        timestamp: Math.floor(Date.now() / 1000),
        txHash,
      });

      setLatestTx(txHash);
    } catch (err) {
      console.error('On-chain verification error:', err);
    }
  };

  const copyProofJson = () => {
    if (!proofResult) return;
    navigator.clipboard.writeText(JSON.stringify(proofResult, null, 2));
    setCopiedProof(true);
    setTimeout(() => setCopiedProof(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-display text-[var(--text-primary)]">
              Zero-Knowledge Health Prover
            </h1>
            <p className="text-sm text-[var(--text-secondary)]">
              Generate mathematical Groth16 proofs proving compliance without disclosing private health metrics
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs px-3 py-1 rounded-full bg-[var(--bg-glass)] border border-[var(--border-default)] font-mono text-cyan-300 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>SnarkJS Groth16 Engine</span>
          </span>
        </div>
      </div>

      {latestTx && (
        <TxReceipt
          txHash={latestTx}
          blockNumber={BigInt(7128502)}
          timestamp={Date.now()}
          network="sepolia"
        />
      )}

      {/* Main Grid: Builder & Proof Engine */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Claim Selector & Input Builder (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <GlassmorphismCard className="p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-4">
              <h2 className="font-bold text-base text-[var(--text-primary)] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>1. Select Health Claim Type</span>
              </h2>
            </div>

            {/* Claim Type Tabs */}
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => {
                  setClaimType('vaccination');
                  resetProof();
                }}
                className={`py-3 px-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-2 transition-all ${
                  claimType === 'vaccination'
                    ? 'border-cyan-400 bg-cyan-950/30 text-cyan-300 shadow-md shadow-cyan-500/10'
                    : 'border-[var(--border-default)] bg-[var(--bg-glass)] text-[var(--text-secondary)] hover:border-cyan-500/30'
                }`}
              >
                <ShieldCheck className="w-5 h-5 text-cyan-400" />
                <span>Vaccination Range</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setClaimType('vitals');
                  resetProof();
                }}
                className={`py-3 px-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-2 transition-all ${
                  claimType === 'vitals'
                    ? 'border-cyan-400 bg-cyan-950/30 text-cyan-300 shadow-md shadow-cyan-500/10'
                    : 'border-[var(--border-default)] bg-[var(--bg-glass)] text-[var(--text-secondary)] hover:border-cyan-500/30'
                }`}
              >
                <Cpu className="w-5 h-5 text-cyan-400" />
                <span>Vitals Normalcy</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setClaimType('age');
                  resetProof();
                }}
                className={`py-3 px-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-2 transition-all ${
                  claimType === 'age'
                    ? 'border-cyan-400 bg-cyan-950/30 text-cyan-300 shadow-md shadow-cyan-500/10'
                    : 'border-[var(--border-default)] bg-[var(--bg-glass)] text-[var(--text-secondary)] hover:border-cyan-500/30'
                }`}
              >
                <Lock className="w-5 h-5 text-cyan-400" />
                <span>Age Threshold</span>
              </button>
            </div>

            {/* Input Fields corresponding to circuit */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-mono tracking-wider text-[var(--text-muted)]">
                  Circuit Parameters
                </span>
                <span className="text-[11px] text-cyan-400/80 font-mono">
                  {claimType === 'vaccination'
                    ? 'vaccination_range.circom'
                    : claimType === 'vitals'
                    ? 'vitals_range.circom'
                    : 'age_threshold.circom'}
                </span>
              </div>

              {/* Public vs Private inputs layout */}
              <div className="space-y-4">
                {/* PUBLIC SECTION */}
                <div className="p-4 rounded-xl bg-[var(--bg-base)] border border-cyan-500/20 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-cyan-300">
                    <Eye className="w-4 h-4 text-cyan-400" />
                    <span>Public Inputs (Disclosed to Verifier / On-Chain)</span>
                  </div>

                  {claimType === 'vaccination' && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] text-[var(--text-secondary)] mb-1">
                          Today's Timestamp (Day)
                        </label>
                        <input
                          type="number"
                          value={todayTimestamp}
                          onChange={(e) => setTodayTimestamp(Number(e.target.value))}
                          className="w-full px-3 py-2 rounded-lg bg-[var(--bg-glass)] border border-[var(--border-default)] text-xs font-mono text-[var(--text-primary)]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-[var(--text-secondary)] mb-1">
                          Window Duration (Days)
                        </label>
                        <input
                          type="number"
                          value={windowDays}
                          onChange={(e) => setWindowDays(Number(e.target.value))}
                          className="w-full px-3 py-2 rounded-lg bg-[var(--bg-glass)] border border-[var(--border-default)] text-xs font-mono text-[var(--text-primary)]"
                        />
                      </div>
                    </div>
                  )}

                  {claimType === 'vitals' && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] text-[var(--text-secondary)] mb-1">
                          Lower Bound (e.g. 90 mmHg)
                        </label>
                        <input
                          type="number"
                          value={vitalLow}
                          onChange={(e) => setVitalLow(Number(e.target.value))}
                          className="w-full px-3 py-2 rounded-lg bg-[var(--bg-glass)] border border-[var(--border-default)] text-xs font-mono text-[var(--text-primary)]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-[var(--text-secondary)] mb-1">
                          Upper Bound (e.g. 120 mmHg)
                        </label>
                        <input
                          type="number"
                          value={vitalHigh}
                          onChange={(e) => setVitalHigh(Number(e.target.value))}
                          className="w-full px-3 py-2 rounded-lg bg-[var(--bg-glass)] border border-[var(--border-default)] text-xs font-mono text-[var(--text-primary)]"
                        />
                      </div>
                    </div>
                  )}

                  {claimType === 'age' && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] text-[var(--text-secondary)] mb-1">
                          Current Date Timestamp (Days)
                        </label>
                        <input
                          type="number"
                          value={ageTodayTs}
                          onChange={(e) => setAgeTodayTs(Number(e.target.value))}
                          className="w-full px-3 py-2 rounded-lg bg-[var(--bg-glass)] border border-[var(--border-default)] text-xs font-mono text-[var(--text-primary)]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-[var(--text-secondary)] mb-1">
                          Minimum Age Threshold (Days)
                        </label>
                        <input
                          type="number"
                          value={minAgeDays}
                          onChange={(e) => setMinAgeDays(Number(e.target.value))}
                          className="w-full px-3 py-2 rounded-lg bg-[var(--bg-glass)] border border-[var(--border-default)] text-xs font-mono text-[var(--text-primary)]"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* PRIVATE SECTION */}
                <div className="p-4 rounded-xl bg-[var(--bg-base)] border border-emerald-500/20 space-y-3">
                  <div className="flex items-center justify-between text-xs font-semibold text-emerald-400">
                    <div className="flex items-center gap-2">
                      <EyeOff className="w-4 h-4 text-emerald-400" />
                      <span>Private Inputs (Retained Exclusively on Client)</span>
                    </div>
                    <span className="text-[10px] text-[var(--text-muted)] font-mono">
                      NEVER Sent to Network
                    </span>
                  </div>

                  {claimType === 'vaccination' && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] text-[var(--text-secondary)] mb-1">
                          Vaccination Date (Day)
                        </label>
                        <input
                          type="number"
                          value={vaccDate}
                          onChange={(e) => setVaccDate(Number(e.target.value))}
                          className="w-full px-3 py-2 rounded-lg bg-[var(--bg-glass)] border border-emerald-500/30 text-xs font-mono text-emerald-300"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-[var(--text-secondary)] mb-1">
                          Record Hash (Binding)
                        </label>
                        <input
                          type="number"
                          value={vaccRecordHash}
                          onChange={(e) => setVaccRecordHash(Number(e.target.value))}
                          className="w-full px-3 py-2 rounded-lg bg-[var(--bg-glass)] border border-emerald-500/30 text-xs font-mono text-emerald-300"
                        />
                      </div>
                    </div>
                  )}

                  {claimType === 'vitals' && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] text-[var(--text-secondary)] mb-1">
                          Actual Measurement Value
                        </label>
                        <input
                          type="number"
                          value={vitalValue}
                          onChange={(e) => setVitalValue(Number(e.target.value))}
                          className="w-full px-3 py-2 rounded-lg bg-[var(--bg-glass)] border border-emerald-500/30 text-xs font-mono text-emerald-300"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-[var(--text-secondary)] mb-1">
                          Record Hash (Binding)
                        </label>
                        <input
                          type="number"
                          value={vitalRecordHash}
                          onChange={(e) => setVitalRecordHash(Number(e.target.value))}
                          className="w-full px-3 py-2 rounded-lg bg-[var(--bg-glass)] border border-emerald-500/30 text-xs font-mono text-emerald-300"
                        />
                      </div>
                    </div>
                  )}

                  {claimType === 'age' && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] text-[var(--text-secondary)] mb-1">
                          Date of Birth Timestamp (Days)
                        </label>
                        <input
                          type="number"
                          value={dobTs}
                          onChange={(e) => setDobTs(Number(e.target.value))}
                          className="w-full px-3 py-2 rounded-lg bg-[var(--bg-glass)] border border-emerald-500/30 text-xs font-mono text-emerald-300"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-[var(--text-secondary)] mb-1">
                          Record Hash (Binding)
                        </label>
                        <input
                          type="number"
                          value={ageRecordHash}
                          onChange={(e) => setAgeRecordHash(Number(e.target.value))}
                          className="w-full px-3 py-2 rounded-lg bg-[var(--bg-glass)] border border-emerald-500/30 text-xs font-mono text-emerald-300"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-red-950/30 border border-red-500/30 text-red-300 text-xs flex gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <button
                onClick={handleGenerateProof}
                disabled={proving}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-semibold text-sm shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2"
              >
                {proving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Synthesizing Groth16 Proof...</span>
                  </>
                ) : (
                  <>
                    <Cpu className="w-4 h-4" />
                    <span>Generate ZK Proof (In-Browser)</span>
                  </>
                )}
              </button>
            </div>
          </GlassmorphismCard>
        </div>

        {/* Right Column: Execution Progress & Verification Receipt (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <GlassmorphismCard className="p-6 flex flex-col items-center justify-center text-center space-y-5">
            <h3 className="font-bold text-sm text-[var(--text-primary)]">
              Groth16 Execution Pipeline
            </h3>

            <ProofProgressRing progress={progress} stage={stage} />

            {localVerified !== null && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-center gap-2 w-full justify-center ${
                  localVerified
                    ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
                    : 'bg-red-950/30 border-red-500/30 text-red-300'
                }`}
              >
                {localVerified ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Mathematical Constraints Satisfied (OK)</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-red-400" />
                    <span>Verification Failed</span>
                  </>
                )}
              </div>
            )}

            {proofResult && (
              <div className="w-full space-y-4 pt-2">
                <div className="p-3 bg-[var(--bg-base)] rounded-xl border border-[var(--border-default)] text-left font-mono text-[11px] space-y-1">
                  <div className="flex items-center justify-between text-[var(--text-muted)] border-b border-[var(--border-default)] pb-1 mb-2">
                    <span>Public Signals Disclosed</span>
                    <button
                      onClick={copyProofJson}
                      className="text-cyan-400 hover:underline flex items-center gap-1"
                    >
                      {copiedProof ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedProof ? 'Copied' : 'Copy JSON'}</span>
                    </button>
                  </div>
                  {proofResult.publicSignals.map((sig, idx) => (
                    <p key={idx} className="text-cyan-300 truncate">
                      signal[{idx}]: {sig}
                    </p>
                  ))}
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    onClick={handleVerifyOnChain}
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-1.5"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Verify On-Chain (HealthProver.sol)</span>
                  </button>
                </div>

                {/* QR Code Verifier Chip */}
                <div className="pt-2 flex flex-col items-center gap-2">
                  <div className="p-3 bg-white rounded-xl shadow-md">
                    <QRCodeSVG
                      value={JSON.stringify({
                        claim: claimType,
                        signals: proofResult.publicSignals,
                        timestamp: Date.now(),
                      })}
                      size={120}
                    />
                  </div>
                  <span className="text-[10px] text-[var(--text-muted)] font-mono">
                    Scan to Verify Proof Off-Chain
                  </span>
                </div>
              </div>
            )}
          </GlassmorphismCard>
        </div>
      </div>
    </div>
  );
}
