/** @type {import('tailwindcss').Config} */
// Migrado al sistema de tokens v3. Se conservan los nombres de color legacy
// (surface/ink/border/sentiment) re-apuntados a los tokens v3, para no romper
// los ~500 usos de clases en la app; se agregan los nombres v3 (base/card/
// sunken, ink scale, sent, border-subtle/strong) ademas de radios/espaciado/
// sombras/eases del design system.
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        // --- Marca (party-driven) ---
        primary: {
          DEFAULT: 'var(--polaris-primary)',
          dark: 'var(--polaris-primary-dark)',
          light: 'var(--polaris-primary-light)',
        },
        accent: 'var(--polaris-accent)',

        // --- Fondos v3 ---
        base: 'var(--bg-base)',
        card: 'var(--bg-card)',
        sunken: 'var(--bg-sunken)',
        elevated: 'var(--bg-elevated)',
        glass: 'var(--bg-glass)',
        // Legacy: surface -> v3. surface = base, surface-elevated = card.
        surface: {
          DEFAULT: 'var(--bg-base)',
          elevated: 'var(--bg-card)',
        },

        // --- Texto v3 (ink scale legacy re-apuntado) ---
        ink: {
          DEFAULT: 'var(--text-primary)',
          muted: 'var(--text-secondary)',
          subtle: 'var(--text-tertiary)',
          2: 'var(--text-secondary)',
          3: 'var(--text-tertiary)',
          'on-primary': 'var(--text-on-primary)',
        },

        // --- Bordes v3 (border-border legacy = subtle) ---
        border: {
          DEFAULT: 'var(--border-subtle)',
          subtle: 'var(--border-subtle)',
          strong: 'var(--border-strong)',
        },

        // --- Semanticos ---
        success: 'var(--success)',
        warning: 'var(--warning)',
        error: 'var(--error)',
        info: 'var(--info)',
        watch: 'var(--watch)',

        // --- Sentimiento (legacy "sentiment" re-apuntado a --sent-* v3;
        //     incluye sarcastic + unknown que antes faltaban) ---
        sentiment: {
          positive: 'var(--sent-positive)',
          neutral: 'var(--sent-neutral)',
          negative: 'var(--sent-negative)',
          mixed: 'var(--sent-mixed)',
          sarcastic: 'var(--sent-sarcastic)',
          unknown: 'var(--sent-unknown)',
        },
        // Alias corto v3
        sent: {
          pos: 'var(--sent-positive)',
          neg: 'var(--sent-negative)',
          neu: 'var(--sent-neutral)',
          mix: 'var(--sent-mixed)',
          sar: 'var(--sent-sarcastic)',
          unk: 'var(--sent-unknown)',
        },
      },
      fontFamily: {
        // sans = UI (Geist). ui es alias explicito v3.
        sans: ['Geist Variable', 'Geist', 'Inter', 'system-ui', 'sans-serif'],
        ui: ['Geist Variable', 'Geist', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['IBM Plex Mono', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        xs: 'var(--radius-xs)',
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        pill: 'var(--radius-pill)',
      },
      spacing: {
        // escala base-4 v3 como utilidades nombradas (no pisa las numericas
        // de tailwind: usa nombres s1..s9)
        s1: 'var(--space-1)',
        s2: 'var(--space-2)',
        s3: 'var(--space-3)',
        s4: 'var(--space-4)',
        s5: 'var(--space-5)',
        s6: 'var(--space-6)',
        s7: 'var(--space-7)',
        s8: 'var(--space-8)',
        s9: 'var(--space-9)',
      },
      boxShadow: {
        soft: 'var(--shadow-soft)',
        medium: 'var(--shadow-medium)',
        strong: 'var(--shadow-strong)',
        glow: 'var(--glow-primary)',
      },
      transitionTimingFunction: {
        out: 'var(--ease-out)',
        'in-out': 'var(--ease-in-out)',
        spring: 'var(--ease-spring)',
      },
      backgroundImage: {
        'gradient-hero': 'var(--gradient-hero)',
      },
    },
  },
  plugins: [],
}
