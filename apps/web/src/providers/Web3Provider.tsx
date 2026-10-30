'use client';

import React, { useState } from 'react';
import { RainbowKitProvider, getDefaultConfig, darkTheme } from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import '@rainbow-me/rainbowkit/styles.css';

const config = getDefaultConfig({
  appName: 'SmartCareHub',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '3fcc6bba2f1de962d911bb5b5c3dba68',
  chains: [sepolia],
  ssr: false,
});

export function Web3Provider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
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

  React.useEffect(() => {
    setMounted(true);
  }, []);

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
          {mounted ? children : <div className="min-h-screen bg-surface-base" />}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
