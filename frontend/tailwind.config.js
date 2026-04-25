/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      // ── Design System "The Curated Tienda — Lime" (CSS-variable driven) ──
      colors: {
        primary: {
          DEFAULT: 'var(--color-primary)',
          container: 'var(--color-primary-container)',
          fixed: 'var(--color-primary-fixed)',
          'fixed-dim': 'var(--color-primary-fixed-dim)',
          on: 'var(--color-on-primary)',
          'on-container': 'var(--color-on-primary-container)',
          'on-fixed': 'var(--color-on-primary-fixed)',
          'on-fixed-variant': 'var(--color-on-primary-fixed-variant)',
        },
        secondary: {
          DEFAULT: 'var(--color-secondary)',
          container: 'var(--color-secondary-container)',
          fixed: 'var(--color-secondary-fixed)',
          'fixed-dim': 'var(--color-secondary-fixed-dim)',
          on: 'var(--color-on-secondary)',
          'on-container': 'var(--color-on-secondary-container)',
        },
        tertiary: {
          DEFAULT: 'var(--color-tertiary)',
          container: 'var(--color-tertiary-container)',
          fixed: 'var(--color-tertiary-fixed)',
          'fixed-dim': 'var(--color-tertiary-fixed-dim)',
          on: 'var(--color-on-tertiary)',
          'on-container': 'var(--color-on-tertiary-container)',
          'on-fixed': 'var(--color-on-tertiary-fixed)',
          'on-fixed-variant': 'var(--color-on-tertiary-fixed-variant)',
        },
        surface: {
          DEFAULT: 'var(--color-surface)',
          dim: 'var(--color-surface-dim)',
          bright: 'var(--color-surface-bright)',
          container: 'var(--color-surface-container)',
          'container-low': 'var(--color-surface-container-low)',
          'container-lowest': 'var(--color-surface-container-lowest)',
          'container-high': 'var(--color-surface-container-high)',
          'container-highest': 'var(--color-surface-container-highest)',
          tint: 'var(--color-primary)',
          variant: 'var(--color-surface-container-highest)',
        },
        'on-surface': 'var(--color-on-surface)',
        'on-surface-variant': 'var(--color-on-surface-variant)',
        'inverse-surface': 'var(--color-inverse-surface)',
        'inverse-on-surface': 'var(--color-inverse-on-surface)',
        'inverse-primary': 'var(--color-inverse-primary)',
        outline: 'var(--color-outline)',
        'outline-variant': 'var(--color-outline-variant)',
        background: 'var(--color-background)',
        'on-background': 'var(--color-on-background)',
        error: {
          DEFAULT: 'var(--color-error)',
          container: 'var(--color-error-container)',
          on: 'var(--color-on-error)',
          'on-container': 'var(--color-on-error-container)',
        },
        coral: 'var(--color-coral)',
        /* Semantic alias for card/panel backgrounds */
        'card-panel': 'var(--card-panel-bg)',
      },

      // ── Tipografía ────────────────────────────────────────────────────────
      fontFamily: {
        display: ['"Manrope"', 'sans-serif'],
        headline: ['"Manrope"', 'sans-serif'],
        sans: ['"Inter"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
        label: ['"Inter"', 'sans-serif'],
      },

      // ── Escala tipográfica ────────────────────────────────────────────────
      fontSize: {
        'display-lg': ['3.5rem', { lineHeight: '1.1', fontWeight: '800' }],
        'display-md': ['2.25rem', { lineHeight: '1.15', fontWeight: '700' }],
        'headline-lg': ['2rem', { lineHeight: '1.2', fontWeight: '700' }],
        'headline-md': ['1.5rem', { lineHeight: '1.25', fontWeight: '700' }],
        'title-lg': ['1.375rem', { lineHeight: '1.3', fontWeight: '600' }],
        'title-md': ['1rem', { lineHeight: '1.4', fontWeight: '600' }],
        'body-lg': ['1rem', { lineHeight: '1.5', fontWeight: '400' }],
        'body-md': ['0.875rem', { lineHeight: '1.5', fontWeight: '400' }],
        'label-lg': ['0.75rem', { lineHeight: '1.4', fontWeight: '500', letterSpacing: '0.05em' }],
        'label-sm': ['0.625rem', { lineHeight: '1.4', fontWeight: '500', letterSpacing: '0.06em' }],
      },

      // ── Radios ────────────────────────────────────────────────────────────
      borderRadius: {
        DEFAULT: '0.5rem',
        lg: '0.75rem',
        xl: '1.5rem',
        '2xl': '2rem',
        '3xl': '3rem',
        pill: '9999px',
        full: '9999px',
      },

      // ── Sombras (variable-driven) ─────────────────────────────────────────
      boxShadow: {
        ambient: 'var(--shadow-ambient)',
        float: 'var(--shadow-float)',
        card: 'var(--shadow-card)',
        glass: 'var(--shadow-glass)',
        editorial: 'var(--shadow-editorial)',
      },

      backdropBlur: {
        glass: '12px',
      },

      spacing: {
        18: '4.5rem',
        72: '18rem',
        80: '20rem',
        88: '22rem',
      },
    },
  },
  plugins: [],
};
