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
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var origError = console.error;
                console.error = function() {
                  var msg = Array.prototype.slice.call(arguments).map(function(a) {
                    return typeof a === 'string' ? a : (a && a.message) || '';
                  }).join(' ');
                  if (
                    msg.indexOf('cloud.reown.com') !== -1 ||
                    msg.indexOf('Allowlist') !== -1 ||
                    msg.indexOf('Reown Config') !== -1 ||
                    msg.indexOf('hydrated') !== -1 ||
                    msg.indexOf('hydration') !== -1 ||
                    msg.indexOf("didn't match") !== -1
                  ) {
                    console.warn.apply(console, arguments);
                    return;
                  }
                  return origError.apply(console, arguments);
                };
              })();
            `,
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@600;700;800&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning className="bg-surface-base text-gray-100 antialiased min-h-screen flex flex-col selection:bg-emerald/30 selection:text-emerald">
        {/* Web3Provider wraps AppNav and children inside body */}
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
