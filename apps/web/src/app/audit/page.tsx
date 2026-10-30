'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import {
  FileText,
  Shield,
  Clock,
  Filter,
  ExternalLink,
  Download,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Users,
  Pill,
  Award,
  Search,
  Copy,
  Check,
} from 'lucide-react';
import { GlassmorphismCard, IntegrityChip } from '@/components/ui';
import {
  mockGetAuditLogs,
  mockGetAllAuditLogs,
  MockAuditEntry,
} from '@/lib/mockStore';
import { truncateAddress, truncateHash, formatTimestamp } from '@/lib/utils';

export default function AuditPage() {
  const { address } = useAccount();
  const activeAddress = address || '0x71C...DevPatient';

  const [logs, setLogs] = useState<MockAuditEntry[]>([]);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const loadAuditLogs = async () => {
    try {
      const allLogs = await mockGetAllAuditLogs();
      // If mock store is empty initially, seed with realistic cryptographic audit entries
      if (allLogs.length === 0) {
        const seedLogs: MockAuditEntry[] = [
          {
            id: 1,
            patient: activeAddress,
            accessedBy: activeAddress,
            reason: 'Record Anchored: Comprehensive Metabolic Panel (AES-256-GCM)',
            timestamp: Math.floor(Date.now() / 1000) - 3600 * 24 * 3,
            txHash: '0x3a4b9c1d2e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b',
          },
          {
            id: 2,
            patient: activeAddress,
            accessedBy: '0x8ba1f109551bD432803012645Ac136ddd64DBA72',
            reason: 'Delegation Granted: Role READ_ONLY via ECDH P-256 (Expires in 30 days)',
            timestamp: Math.floor(Date.now() / 1000) - 3600 * 24 * 2,
            txHash: '0x7f8e9d0c1b2a3f4e5d6c7b8a9f0e1d2c3b4a5f6e7d8c9b0a1f2e3d4c5b6a7f8e',
          },
          {
            id: 3,
            patient: activeAddress,
            accessedBy: activeAddress,
            reason: 'Dosage Confirmed via EIP-712: Atorvastatin (20mg)',
            timestamp: Math.floor(Date.now() / 1000) - 3600 * 18,
            txHash: '0x9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b',
          },
          {
            id: 4,
            patient: activeAddress,
            accessedBy: activeAddress,
            reason: "Generated ZK Proof: Claim 'vaccination_range' (Groth16 Validated)",
            timestamp: Math.floor(Date.now() / 1000) - 3600 * 4,
            txHash: '0x1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d',
          },
          {
            id: 5,
            patient: activeAddress,
            accessedBy: '0xMedicER_HospitalSanRafaele',
            reason: 'EMERGENCY BREAK-GLASS TRIGGERED: Unlocked via Licensed ER Medic',
            timestamp: Math.floor(Date.now() / 1000) - 1800,
            txHash: '0xbeefdead000000000000000000000000000000000000000000000000cafebabe',
          },
        ];
        setLogs(seedLogs.reverse());
      } else {
        setLogs(allLogs.reverse());
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    }
  };

  useEffect(() => {
    loadAuditLogs();
  }, [activeAddress]);

  const copyTx = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const getEventBadge = (reason: string) => {
    if (reason.includes('BREAK-GLASS')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-crimson-dim border border-crimson text-crimson animate-pulse">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>BREAK-GLASS</span>
        </span>
      );
    }
    if (reason.includes('Delegation')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium bg-teal-500/10 border border-teal-500/30 text-teal-300">
          <Users className="w-3.5 h-3.5 text-teal-400" />
          <span>DELEGATION</span>
        </span>
      );
    }
    if (reason.includes('Dosage') || reason.includes('EIP-712')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium bg-cyan-500/10 border border-cyan-500/30 text-cyan-300">
          <Pill className="w-3.5 h-3.5 text-cyan-400" />
          <span>ADHERENCE</span>
        </span>
      );
    }
    if (reason.includes('ZK') || reason.includes('Groth16')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium bg-purple-500/10 border border-purple-500/30 text-purple-300">
          <Lock className="w-3.5 h-3.5 text-purple-400" />
          <span>ZK PROOF</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
        <Shield className="w-3.5 h-3.5 text-emerald-400" />
        <span>RECORD VAULT</span>
      </span>
    );
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.accessedBy.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.txHash.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filterType === 'emergency') return log.reason.includes('BREAK-GLASS');
    if (filterType === 'delegation') return log.reason.includes('Delegation');
    if (filterType === 'adherence') return log.reason.includes('Dosage');
    if (filterType === 'zk') return log.reason.includes('ZK') || log.reason.includes('Groth16');
    if (filterType === 'vault') return log.reason.includes('Record');
    return true;
  });

  const exportCsv = () => {
    const headers = ['Timestamp', 'Date', 'Patient', 'Accessed By', 'Reason', 'TxHash'];
    const rows = filteredLogs.map((l) => [
      l.timestamp,
      new Date(l.timestamp * 1000).toISOString(),
      l.patient,
      l.accessedBy,
      `"${l.reason.replace(/"/g, '""')}"`,
      l.txHash,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `smartcarehub-audit-trail-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-display text-[var(--text-primary)]">
              Cryptographic Audit Trail
            </h1>
            <p className="text-sm text-[var(--text-secondary)]">
              Immutable, chronological log of all record accesses, cryptographic delegations, and emergency break-glass events
            </p>
          </div>
        </div>

        <button
          onClick={exportCsv}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--border-default)] hover:border-[var(--accent-emerald)] bg-[var(--bg-glass)] text-xs font-semibold text-[var(--text-primary)] transition-all self-start md:self-auto"
        >
          <Download className="w-4 h-4 text-[var(--accent-emerald)]" />
          <span>Export Audit Log (CSV)</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <GlassmorphismCard className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          {[
            { id: 'all', label: 'All Events' },
            { id: 'emergency', label: 'Emergency Break-Glass' },
            { id: 'vault', label: 'Medical Records' },
            { id: 'delegation', label: 'Delegations' },
            { id: 'adherence', label: 'Adherence' },
            { id: 'zk', label: 'ZK Proofs' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                filterType === tab.id
                  ? 'bg-[var(--accent-emerald)] text-white shadow-sm'
                  : 'bg-[var(--bg-glass)] text-[var(--text-secondary)] hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search address or tx..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border-default)] focus:border-[var(--accent-emerald)] outline-none text-xs text-[var(--text-primary)]"
          />
        </div>
      </GlassmorphismCard>

      {/* Audit Log Table */}
      <GlassmorphismCard className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--border-default)] text-xs text-[var(--text-muted)] uppercase font-mono">
                <th className="py-3 px-4">Event Type</th>
                <th className="py-3 px-4">Description / Purpose</th>
                <th className="py-3 px-4">Accessor / Signer</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4 text-right">Etherscan Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-default)] text-sm">
              {filteredLogs.map((log, index) => {
                const isBreakGlass = log.reason.includes('BREAK-GLASS');

                return (
                  <tr
                    key={log.id || index}
                    className={`hover:bg-[var(--bg-glass)] transition-colors ${
                      isBreakGlass ? 'bg-red-950/20' : ''
                    }`}
                  >
                    <td className="py-4 px-4 whitespace-nowrap">
                      {getEventBadge(log.reason)}
                    </td>

                    <td className="py-4 px-4">
                      <p
                        className={`text-xs ${
                          isBreakGlass
                            ? 'font-bold text-red-200'
                            : 'text-[var(--text-primary)]'
                        }`}
                      >
                        {log.reason}
                      </p>
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className="font-mono text-xs text-[var(--text-secondary)]">
                        {truncateAddress(log.accessedBy)}
                      </span>
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap text-xs font-mono text-[var(--text-muted)]">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{formatTimestamp(log.timestamp)}</span>
                      </div>
                    </td>

                    <td className="py-4 px-4 text-right whitespace-nowrap font-mono text-xs">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => copyTx(log.txHash)}
                          className="p-1 rounded hover:bg-[var(--bg-glass)] text-[var(--text-muted)] hover:text-white"
                          title="Copy transaction hash"
                        >
                          {copiedHash === log.txHash ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <a
                          href={`https://sepolia.etherscan.io/tx/${log.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-cyan-400 hover:underline"
                        >
                          <span>{truncateHash(log.txHash)}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </GlassmorphismCard>
    </div>
  );
}
