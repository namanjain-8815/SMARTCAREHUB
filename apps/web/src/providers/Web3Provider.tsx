'use client';

import React, { useState } from 'react';
import { RainbowKitProvider, getDefaultConfig, darkTheme } from '@rainbow-me/rainbowkit';
import {
  injectedWallet,
  metaMaskWallet,
  coinbaseWallet,
  rabbyWallet,
} from '@rainbow-me/rainbowkit/wallets';
import { WagmiProvider } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import '@rainbow-me/rainbowkit/styles.css';

// Intercept Reown / WalletConnect domain allowlist and hydration warnings so they don't trigger Next.js dev error overlay
if (typeof window !== 'undefined') {
  const originalConsoleError = window.console.error;
  window.console.error = function (...args: any[]) {
    const text = args
      .map((a) => (typeof a === 'string' ? a : a?.message || ''))
      .join(' ');
    if (
      text.includes('cloud.reown.com') ||
      text.includes('not found on Allowlist') ||
      text.includes('Allowlist') ||
      text.includes('hydration') ||
      text.includes('hydrated') ||
      text.includes("didn't match") ||
      text.includes('server rendered HTML')
    ) {
      console.warn('[Hydration / Reown notice]:', ...args);
      return;
    }
    return originalConsoleError.apply(this, args);
  };
}

const config = getDefaultConfig({
  appName: 'SmartCareHub',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '3fcc6bba2f1de962d911bb5b5c3dba68',
  chains: [sepolia],
  wallets: [
    {
      groupName: 'Recommended',
      wallets: [injectedWallet, metaMaskWallet, coinbaseWallet, rabbyWallet],
    },
  ],
  ssr: false,
});

export function Web3Provider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <WagmiProvider config={config as any}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: '#10B981',
            accentColorForeground: 'white',
            borderRadius: 'medium',
            fontStack: 'system',
            overlayBlur: 'small',
          })}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
