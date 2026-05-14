import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        nebula: {
          black: '#0a0a0f',
          purple: '#8B5CF6',
          cyan: '#06B6D4',
          pink: '#EC4899',
          surface: 'rgba(139, 92, 246, 0.15)',
          text: '#e2e8f0',
        },
        matrix: {
          primary: '#22c55e',
          secondary: '#16a34a',
          accent: '#4ade80',
          bg: '#000000',
          surface: 'rgba(34, 197, 94, 0.1)',
        },
        aurora: {
          primary: '#6366f1',
          secondary: '#8b5cf6',
          accent: '#06b6d4',
          bg: '#0f172a',
          surface: 'rgba(99, 102, 241, 0.12)',
        },
      },
      fontFamily: {
        primary: ['"Space Grotesk"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        accent: ['"Orbitron"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      backdropBlur: {
        glass: '12px',
      },
      transitionDuration: {
        'micro': '200ms',   // hover, focus, micro-interactions
        'state': '300ms',   // state changes (expand, collapse, modal)
        'page': '500ms',    // page transitions, boot sequence
      },
      animation: {
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        'glow-pulse': {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config
