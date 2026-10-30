'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  FileText,
  Users,
  Bell,
  Sparkles,
  Award,
  History,
  Menu,
  X,
  Radio,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_LINKS = [
  { href: '/vault', label: 'Vault', icon: FileText, desc: 'Medical Records' },
  { href: '/family', label: 'Family Circles', icon: Users, desc: 'Delegation' },
  { href: '/reminders', label: 'Reminders', icon: Bell, desc: 'Adherence' },
  { href: '/prove', label: 'ZK Prover', icon: Sparkles, desc: 'Zero-Knowledge' },
  { href: '/credentials', label: 'Credentials', icon: Award, desc: 'Break-Glass' },
  { href: '/audit', label: 'Audit Trail', icon: History, desc: 'Immutable Log' },
];

export function AppNav() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // Guard wallet button rendering to prevent SSR hydration mismatches
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-xl bg-surface-base/80 border-b border-white/10 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-emerald flex items-center justify-center shadow-lg shadow-emerald/20 transition-transform group-hover:scale-105">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-display font-extrabold text-lg tracking-tight text-white group-hover:text-emerald transition-colors">
                SmartCareHub
              </span>
              <span className="text-[10px] font-mono text-gray-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald animate-pulse"></span>
                Web3 Health Vault
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'relative px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2',
                    isActive
                      ? 'text-white bg-white/10 shadow-sm border border-white/10'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  )}
                >
                  <Icon className={cn('w-4 h-4', isActive ? 'text-emerald' : 'text-gray-400')} />
                  <span>{link.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="activeNav"
                      className="absolute bottom-0 left-2 right-2 h-0.5 bg-emerald rounded-full"
                    />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Right Side: Wallet & Network Indicator */}
          <div className="hidden sm:flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-card border border-white/5 text-[11px] font-mono text-gray-400">
              <Radio className="w-3 h-3 text-emerald animate-pulse" />
              <span>Sepolia</span>
            </div>
            {mounted ? (
              <ConnectButton
                showBalance={false}
                chainStatus="icon"
                accountStatus={{
                  smallScreen: 'avatar',
                  largeScreen: 'full',
                }}
              />
            ) : (
              <div className="h-9 w-28 rounded-xl bg-white/5 animate-pulse" />
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            {mounted ? (
              <ConnectButton showBalance={false} accountStatus="avatar" chainStatus="none" />
            ) : (
              <div className="h-8 w-8 rounded-full bg-white/5 animate-pulse" />
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg bg-surface-card border border-white/10 text-gray-300 hover:text-white"
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-b border-white/10 bg-surface-card/95 backdrop-blur-2xl px-4 pt-2 pb-6 space-y-1"
          >
            {NAV_LINKS.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center justify-between px-3 py-3 rounded-xl text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-emerald-dim/40 text-emerald border border-emerald/30'
                      : 'text-gray-300 hover:bg-white/5 hover:text-white'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5" />
                    <div>
                      <div className="font-semibold">{link.label}</div>
                      <div className="text-xs text-gray-400">{link.desc}</div>
                    </div>
                  </div>
                  {isActive && <div className="w-2 h-2 rounded-full bg-emerald" />}
                </Link>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
