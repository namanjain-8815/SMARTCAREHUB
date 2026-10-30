import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  turbopack: {},
  transpilePackages: ['@smartcarehub/crypto-core'],
  webpack: (config, { isServer, webpack }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      wagmi: path.resolve(__dirname, '../../node_modules/wagmi'),
      '@wagmi/core': path.resolve(__dirname, '../../node_modules/@wagmi/core'),
      '@tanstack/react-query': path.resolve(__dirname, '../../node_modules/@tanstack/react-query'),
      '@smartcarehub/crypto-core': path.resolve(__dirname, '../../packages/crypto-core/src/index.ts'),
      '@react-native-async-storage/async-storage': false,
    };
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^@x402/,
      })
    );
    if (!isServer) {
      // Prevent Node.js built-ins leaking into client bundles
      config.resolve.fallback = {
        ...config.resolve.fallback,
        '@react-native-async-storage/async-storage': false,
        fs: false,
        path: false,
        crypto: false,
        buffer: false,
        stream: false,
        os: false,
      };
    }
    // Allow WASM for SnarkJS circuits
    config.experiments = { ...config.experiments, asyncWebAssembly: true };
    return config;
  },
};

export default nextConfig;
