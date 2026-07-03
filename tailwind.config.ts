import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#0f1117',
        surface: '#1a1d27',
        border: '#2d3147',
        primary: '#6366f1',
        'fan-on': '#38bdf8',
        'light-on': '#fbbf24',
        alert: '#f59e0b',
        critical: '#ef4444',
        'text-primary': '#f1f5f9',
        'text-muted': '#64748b',
        success: '#22c55e',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
