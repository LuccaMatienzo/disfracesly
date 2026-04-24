/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      // ── Design System "The Curated Tienda — Lime" (Stitch tokens) ───────
      colors: {
        primary: {
          DEFAULT: '#65a30dff',
          container: '#a3e635',
          fixed: '#d9f99d',
          'fixed-dim': '#a3e635',
          on: '#ffffff',
          'on-container': '#1a2e05',
          'on-fixed': '#1a2e05',
          'on-fixed-variant': '#4d7c0f',
        },
        secondary: {
          DEFAULT: '#a43c12',
          container: '#fe7e4f',
          fixed: '#ffdbcf',
          'fixed-dim': '#ffb59c',
          on: '#ffffff',
          'on-container': '#6b1f00',
        },
        tertiary: {
          DEFAULT: '#50606f',
          container: '#abbbcc',
          fixed: '#d4e4f6',
          'fixed-dim': '#b8c8da',
          on: '#ffffff',
          'on-container': '#3c4b5a',
          'on-fixed': '#0d1d2a',
          'on-fixed-variant': '#394857',
        },
        surface: {
          DEFAULT: '#fafaeb',
          dim: '#dbdbcd',
          bright: '#fafaeb',
          container: '#efefe0',
          'container-low': '#f4f5e6',
          'container-lowest': '#ffffff',
          'container-high': '#e9e9db',
          'container-highest': '#e3e3d5',
          tint: '#65a30d',
          variant: '#e3e3d5',
        },
        'on-surface': '#1b1c14',
        'on-surface-variant': '#3b4949',
        'inverse-surface': '#2f3128',
        'inverse-on-surface': '#f1f2e3',
        'inverse-primary': '#a3e635',
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
        coral: '#fe7e4f',
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

      // ── Sombras ───────────────────────────────────────────────────────────
      boxShadow: {
        ambient: '0 2px 24px 0 rgba(27,28,20,0.04)',
        float: '0 8px 32px 0 rgba(27,28,20,0.08)',
        card: '0 2px 16px 0 rgba(27,28,20,0.06)',
        glass: '0 4px 30px 0 rgba(27,28,20,0.05)',
        editorial: '0 24px 48px -12px rgba(27,28,20,0.10)',
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
