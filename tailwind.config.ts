import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // DEUS QUANT Primary Colors
        'deus-white': '#ffffff',
        'deus-gray': '#54585f',

        // Backgrounds
        'bg-primary': '#ffffff',
        'bg-secondary': '#fafafa',
        'bg-tertiary': '#f5f5f5',

        // Text
        'text-primary': '#54585f',
        'text-secondary': '#7a7d84',
        'text-muted': '#a0a3a9',

        // Accent Colors for Data
        'accent-profit': '#16a34a',
        'accent-loss': '#dc2626',
        'accent-info': '#3b82f6',
        'accent-warning': '#f59e0b',

        // Profit/Loss Color Gradients (for monthly returns table)
        'profit': {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a', // accent-profit
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        'loss': {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626', // accent-loss
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },

        // Borders & Dividers
        'border-light': '#e5e7eb',
        'border-default': '#d1d5db',
      },
      fontFamily: {
        display: ['var(--font-display)', 'sans-serif'],
        body: ['var(--font-body)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      boxShadow: {
        'deus-sm': '0 1px 2px 0 rgb(84 88 95 / 0.05)',
        'deus-md': '0 4px 6px -1px rgb(84 88 95 / 0.1)',
        'deus-lg': '0 10px 15px -3px rgb(84 88 95 / 0.1)',
      },
    },
  },
  plugins: [],
}

export default config
