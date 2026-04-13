/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      // ── Design System "The Curated Atelier" (Stitch tokens) ──────────────
      colors: {
        primary: {
          DEFAULT: '#00696b',       // Deep Turquoise — acciones principales
          container: '#00ced1',    // Turquesa vibrante — badges DISPONIBLE
          fixed: '#5af8fb',
          'fixed-dim': '#2ddbde',
          on: '#ffffff',
          'on-container': '#005354',
        },
        secondary: {
          DEFAULT: '#a43c12',      // Deep Coral — branding crítico, alertas
          container: '#fe7e4f',    // Coral vibrante — badges ALQUILADA, CTAs
          fixed: '#ffdbcf',
          'fixed-dim': '#ffb59c',
          on: '#ffffff',
          'on-container': '#6b1f00',
        },
        tertiary: {
          DEFAULT: '#50606f',      // Slate Gray — neutral, FUERA_DE_SERVICIO
          container: '#abbbcc',
          fixed: '#d4e4f6',
          on: '#ffffff',
          'on-container': '#3c4b5a',
        },
        surface: {
          DEFAULT: '#fafaeb',      // Ivory — canvas principal
          dim: '#dbdbcd',
          bright: '#fafaeb',
          container: '#efefe0',
          'container-low': '#f4f5e6',
          'container-lowest': '#ffffff',
          'container-high': '#e9e9db',
          'container-highest': '#e3e3d5',
          tint: '#00696b',
          variant: '#e3e3d5',
        },
        'on-surface': '#1b1c14',   // "Not pure black" — tipografía cálida
        'on-surface-variant': '#3b4949',
        outline: '#6b7a7a',
        'outline-variant': '#bac9c9',
        background: '#fafaeb',
        'on-background': '#1b1c14',
        error: {
          DEFAULT: '#ba1a1a',
          container: '#ffdad6',
          on: '#ffffff',
          'on-container': '#93000a',
        },
      },

      // ── Tipografía: Manrope (display/headline) + Inter (body/label) ──────
      fontFamily: {
        display:  ['"Manrope"', 'sans-serif'],
        headline: ['"Manrope"', 'sans-serif'],
        sans:     ['"Inter"', 'sans-serif'],
        body:     ['"Inter"', 'sans-serif'],
        label:    ['"Inter"', 'sans-serif'],
      },

      // ── Escala tipográfica editorial ──────────────────────────────────────
      fontSize: {
        'display-lg': ['3.5rem',   { lineHeight: '1.1',  fontWeight: '700', fontFamily: '"Manrope"' }],
        'display-md': ['2.25rem',  { lineHeight: '1.15', fontWeight: '700', fontFamily: '"Manrope"' }],
        'headline-lg': ['2rem',    { lineHeight: '1.2',  fontWeight: '700', fontFamily: '"Manrope"' }],
        'headline-md': ['1.5rem',  { lineHeight: '1.25', fontWeight: '700', fontFamily: '"Manrope"' }],
        'title-lg':    ['1.375rem',{ lineHeight: '1.3',  fontWeight: '600' }],
        'title-md':    ['1rem',    { lineHeight: '1.4',  fontWeight: '600' }],
        'body-lg':     ['1rem',    { lineHeight: '1.5',  fontWeight: '400' }],
        'body-md':     ['0.875rem',{ lineHeight: '1.5',  fontWeight: '400' }],
        'label-lg':    ['0.75rem', { lineHeight: '1.4',  fontWeight: '500', letterSpacing: '0.05em' }],
        'label-sm':    ['0.625rem',{ lineHeight: '1.4',  fontWeight: '500', letterSpacing: '0.06em' }],
      },

      // ── Radios: base 8px, botones xl (1.5rem) ───────────────────────────
      borderRadius: {
        DEFAULT: '0.5rem',
        lg:  '0.75rem',
        xl:  '1.5rem',
        '2xl': '2rem',
        pill: '9999px',
      },

      // ── Sombras ambientales (cálidas, sin hard shadows) ──────────────────
      boxShadow: {
        ambient: '0 2px 24px 0 rgba(27,28,20,0.04)',
        float:   '0 8px 32px 0 rgba(27,28,20,0.08)',
        card:    '0 2px 16px 0 rgba(27,28,20,0.06)',
        glass:   '0 4px 30px 0 rgba(27,28,20,0.05)',
      },

      // ── Glassmorfismo (modales, sticky header, sidebar) ──────────────────
      backdropBlur: {
        glass: '12px',
      },

      // ── Spacing scale ─────────────────────────────────────────────────────
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
