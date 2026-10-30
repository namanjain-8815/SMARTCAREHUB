import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class', '[data-theme="dark"]'],
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        emerald:  { DEFAULT: '#10B981', dim: '#064E3B' },
        teal:     { DEFAULT: '#0D9488', dim: '#134E4A' },
        cyan:     { DEFAULT: '#06B6D4', dim: '#083344' },
        indigo:   { DEFAULT: '#6366F1' },
        crimson:  { DEFAULT: '#DC2626', dim: '#450A0A' },
        amber:    { DEFAULT: '#F59E0B', dim: '#451A03' },
        surface:  { base: '#0A0F1E', card: '#111827', elevated: '#1F2937' },
      },
      fontFamily: {
        display: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        mono:    ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      backgroundImage: {
        'gradient-radial':    'radial-gradient(var(--tw-gradient-stops))',
        'gradient-mesh':      'linear-gradient(135deg, #0A0F1E 0%, #0D1B2A 50%, #0A0F1E 100%)',
        'gradient-emerald':   'linear-gradient(135deg, #064E3B, #10B981)',
        'gradient-cyan':      'linear-gradient(135deg, #083344, #06B6D4)',
        'gradient-emergency': 'linear-gradient(135deg, #450A0A, #DC2626)',
      },
      animation: {
        'pulse-slow':    'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow':     'spin 3s linear infinite',
        'glow-emerald':  'glowEmerald 2s ease-in-out infinite alternate',
        'glow-crimson':  'glowCrimson 1.5s ease-in-out infinite alternate',
        'slide-up':      'slideUp 0.4s ease-out',
        'fade-in':       'fadeIn 0.3s ease-out',
      },
      keyframes: {
        glowEmerald: {
          from: { boxShadow: '0 0 8px rgba(16,185,129,0.3)' },
          to:   { boxShadow: '0 0 24px rgba(16,185,129,0.7)' },
        },
        glowCrimson: {
          from: { boxShadow: '0 0 8px rgba(220,38,38,0.4)' },
          to:   { boxShadow: '0 0 28px rgba(220,38,38,0.8)' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
      },
      backdropBlur: { xs: '2px' },
      borderRadius: { xl2: '1.25rem', xl3: '1.5rem' },
    },
  },
  plugins: [],
};

export default config;
