/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'var(--polaris-primary)',
          dark: 'var(--polaris-primary-dark)',
          light: 'var(--polaris-primary-light)',
        },
        accent: 'var(--polaris-accent)',
        surface: {
          DEFAULT: 'var(--polaris-bg)',
          elevated: 'var(--polaris-surface-elevated)',
        },
        ink: {
          DEFAULT: 'var(--polaris-text)',
          muted: 'var(--polaris-text-muted)',
          subtle: 'var(--polaris-text-subtle)',
        },
        border: 'var(--polaris-border)',
        sentiment: {
          positive: 'var(--polaris-sentiment-positive)',
          neutral: 'var(--polaris-sentiment-neutral)',
          negative: 'var(--polaris-sentiment-negative)',
          mixed: 'var(--polaris-sentiment-mixed)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
