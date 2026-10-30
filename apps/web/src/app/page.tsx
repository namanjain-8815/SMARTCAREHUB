'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Shield,
  Users,
  Bell,
  Sparkles,
  Award,
  Zap,
  ArrowRight,
  Lock,
  Database,
  Cpu,
  CheckCircle2,
} from 'lucide-react';
import { GlassmorphismCard } from '@/components/ui';

const FEATURES = [
  {
    title: 'Self-Sovereign Vault',
    href: '/vault',
    desc: 'Client-side AES-256-GCM encryption with non-extractable keys derived via wallet signature.',
    icon: Shield,
    accent: 'emerald' as const,
    badge: 'Hardware Safe',
  },
  {
    title: 'Family Health Circles',
    href: '/family',
    desc: 'Time-bound, role-scoped delegation using ECDH P-256 key agreements and instant revocation.',
    icon: Users,
    accent: 'emerald' as const,
    badge: 'ECDH P-256',
  },
  {
    title: 'Medicine Reminders',
    href: '/reminders',
    desc: 'Cryptographically proven medication compliance with EIP-712 tamper-proof dosage logs.',
    icon: Bell,
    accent: 'cyan' as const,
    badge: 'EIP-712',
  },
  {
    title: 'Zero-Knowledge Prover',
    href: '/prove',
    desc: 'Groth16 proofs proving vaccination, normal vitals, or age thresholds with ZERO raw data disclosure.',
    icon: Sparkles,
    accent: 'cyan' as const,
    badge: 'Groth16 SnarkJS',
  },
  {
    title: 'Credential Locker',
    href: '/credentials',
    desc: 'Soulbound medical certifications & doctor licenses that cannot be transferred or forged.',
    icon: Award,
    accent: 'emerald' as const,
    badge: 'Soulbound NFT',
  },
  {
    title: 'Emergency Break-Glass',
    href: '/credentials',
    desc: 'Dual-trigger emergency triage unlock with unalterable on-chain audit trail protecting against snooping.',
    icon: Zap,
    accent: 'emergency' as const,
    badge: 'Permanent Audit',
  },
];

const ARCHITECTURE_STEPS = [
  {
    step: '1',
    title: 'Browser Encrypt',
    desc: 'AES-256-GCM client encryption',
    icon: Lock,
    color: 'emerald',
  },
  {
    step: '2',
    title: 'IPFS Storage',
    desc: 'Decentralized encrypted payload',
    icon: Database,
    color: 'teal',
  },
  {
    step: '3',
    title: 'Chain Anchor',
    desc: 'Sepolia immutability & timestamp',
    icon: Cpu,
    color: 'cyan',
  },
  {
    step: '4',
    title: 'ZK Verification',
    desc: 'Groth16 zero-knowledge proof',
    icon: CheckCircle2,
    color: 'emerald',
  },
];

export default function HomePage() {
  return (
    <div className="relative overflow-hidden flex flex-col space-y-24 py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      {/* Background radial glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -z-10 w-[700px] h-[500px] bg-gradient-to-b from-emerald/15 via-cyan/10 to-transparent blur-3xl pointer-events-none" />

      {/* Hero Section */}
      <section className="text-center pt-8 sm:pt-16 max-w-4xl mx-auto space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-dim/40 border border-emerald/30 text-emerald text-xs font-mono font-medium shadow-lg shadow-emerald/10"
        >
          <Shield className="w-3.5 h-3.5 animate-pulse" />
          <span>Patient-Owned · Zero Cleartext PHI · Cryptographically Verifiable</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="font-display font-black text-4xl sm:text-7xl text-white tracking-tight leading-[1.1]"
        >
          Own Your Health Data.{' '}
          <span className="bg-gradient-to-r from-emerald via-teal to-cyan bg-clip-text text-transparent">
            Forever.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-base sm:text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed"
        >
          Decentralized medical records encrypted client-side with AES-256-GCM. Prove vaccination status, vitals, and eligibility without ever exposing sensitive health records.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-wrap items-center justify-center gap-4 pt-4"
        >
          <Link
            href="/vault"
            className="flex items-center gap-2.5 px-6 py-3.5 rounded-xl font-semibold text-white bg-gradient-to-r from-emerald via-teal to-cyan shadow-lg shadow-emerald/25 hover:shadow-emerald/40 hover:scale-[1.02] transition-all"
          >
            <span>Open Medical Vault</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/prove"
            className="flex items-center gap-2.5 px-6 py-3.5 rounded-xl font-semibold text-gray-200 bg-surface-card hover:bg-surface-elevated border border-white/10 hover:border-white/20 transition-all"
          >
            <Sparkles className="w-4 h-4 text-cyan" />
            <span>Generate ZK Proof</span>
          </Link>
        </motion.div>
      </section>

      {/* Floating Mini Previews */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        <GlassmorphismCard variant="emerald" className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-emerald uppercase font-bold tracking-wider">Vault Status</span>
            <span className="w-2 h-2 rounded-full bg-emerald animate-pulse" />
          </div>
          <div className="text-2xl font-display font-bold text-white">Client Key Derived</div>
          <p className="text-xs text-gray-400">
            HKDF derived from wallet signature. Keys never touch disk or network in unencrypted form.
          </p>
        </GlassmorphismCard>

        <GlassmorphismCard variant="cyan" className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-cyan uppercase font-bold tracking-wider">ZK Prover</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-dim text-cyan">Groth16 WASM</span>
          </div>
          <div className="text-2xl font-display font-bold text-white">In-Browser Proving</div>
          <p className="text-xs text-gray-400">
            Three custom Circom circuits compiled to WASM. Generates mathematical proofs in seconds.
          </p>
        </GlassmorphismCard>

        <GlassmorphismCard variant="emergency" className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-crimson uppercase font-bold tracking-wider">Break-Glass</span>
            <span className="w-2 h-2 rounded-full bg-crimson animate-pulse" />
          </div>
          <div className="text-2xl font-display font-bold text-white">Emergency Triage</div>
          <p className="text-xs text-gray-400">
            Dual-trigger unlock for verified paramedics and guardians with immutable on-chain logs.
          </p>
        </GlassmorphismCard>
      </section>

      {/* Feature Showcase Grid */}
      <section className="space-y-8">
        <div className="text-center space-y-3">
          <h2 className="font-display font-bold text-3xl sm:text-4xl text-white">
            Architecture Features
          </h2>
          <p className="text-sm text-gray-400 max-w-lg mx-auto">
            Six interconnected sovereign components designed for strict regulatory privacy and zero-trust verification.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <Link key={i} href={f.href}>
                <GlassmorphismCard
                  variant={f.accent}
                  className="h-full flex flex-col justify-between space-y-4 group hover:scale-[1.01]"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                        <Icon className="w-5 h-5 text-emerald" />
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-medium bg-white/5 text-gray-300 border border-white/5">
                        {f.badge}
                      </span>
                    </div>

                    <h3 className="font-display font-bold text-lg text-white group-hover:text-emerald transition-colors">
                      {f.title}
                    </h3>

                    <p className="text-xs text-gray-400 leading-relaxed">
                      {f.desc}
                    </p>
                  </div>

                  <div className="pt-2 flex items-center gap-1.5 text-xs font-semibold text-emerald group-hover:translate-x-1 transition-transform">
                    <span>Explore module</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </GlassmorphismCard>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Architecture Flow Diagram */}
      <section className="p-8 rounded-3xl bg-surface-card/40 border border-white/10 space-y-8">
        <div className="text-center space-y-2">
          <h3 className="font-display font-bold text-2xl text-white">End-to-End Privacy Pipeline</h3>
          <p className="text-xs text-gray-400">Zero cleartext data in transit or at rest</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
          {ARCHITECTURE_STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <div
                key={i}
                className="relative p-5 rounded-2xl bg-surface-elevated/60 border border-white/5 flex flex-col items-center text-center space-y-3"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-dim/40 border border-emerald/30 text-emerald flex items-center justify-center font-bold">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-display font-bold text-sm text-white">{step.title}</div>
                  <div className="text-[11px] text-gray-400">{step.desc}</div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 pt-8 pb-4 text-center text-xs font-mono text-gray-500">
        Built on Ethereum Sepolia · SnarkJS Groth16 · Viem v2 · Wagmi v2 · OpenZeppelin v5
      </footer>
    </div>
  );
}
