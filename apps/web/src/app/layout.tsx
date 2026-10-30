import type { Metadata } from 'next';
import './globals.css';
import { Web3Provider } from '@/providers/Web3Provider';
import { AppNav } from '@/components/layout/AppNav';

export const metadata: Metadata = {
  title: 'SmartCareHub — Patient-Centric Web3 Health Vault',
  description:
    'Own your medical data. Encrypt it with AES-256-GCM. Prove it with Zero-Knowledge. No third-party custodians.',
  keywords: ['health', 'blockchain', 'zero-knowledge', 'HIPAA', 'Web3', 'Sepolia'],
  openGraph: {
    title: 'SmartCareHub',
    description: 'Self-sovereign encrypted medical records on the decentralised web.',
    type: 'website',
  },
};

export const dynamic = 'force-dynamic';


export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@600;700;800&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-surface-base text-gray-100 antialiased min-h-screen flex flex-col selection:bg-emerald/30 selection:text-emerald">
        <Web3Provider>
          <AppNav />
          <div className="flex-1 flex flex-col">
            {children}
          </div>
        </Web3Provider>
      </body>
    </html>
  );
}
