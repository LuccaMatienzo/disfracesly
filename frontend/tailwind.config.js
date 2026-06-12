/**
 * @file tailwind.config.js
 * @description Configuracion del sistema de diseño "The Curated Tienda — Lime"
 *              implementado sobre Tailwind CSS v3.
 *
 * Estrategia de tokens (CSS-variable driven):
 *   Todos los valores de color y sombra referencian variables CSS declaradas
 *   en globals.css (`:root` para light mode, `[data-theme="dark"]` para dark).
 *   Esto permite cambiar el tema en tiempo de ejecucion sin regenerar el bundle:
 *   Tailwind solo genera las clases utilitarias; el valor real es resuelto por
 *   el navegador en cada render segun el tema activo.
 *
 * Escala de contenido escaneado:
 *   `content` apunta a todos los archivos JSX/JS del src y al index.html para
 *   que el tree-shaker de Tailwind emita unicamente las clases referenciadas.
 */

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      // ── Paleta de colores (Design System "Lime") ──────────────────────────
      // Cada token mapea a una variable CSS definida en globals.css.
      // La jerarquia primary / secondary / tertiary sigue la especificacion
      // Material Design 3 (M3) para garantizar contraste accesible (WCAG AA).
      colors: {
        primary: {
          DEFAULT:          'var(--color-primary)',
          container:        'var(--color-primary-container)',
          fixed:            'var(--color-primary-fixed)',
          'fixed-dim':      'var(--color-primary-fixed-dim)',
          on:               'var(--color-on-primary)',
          'on-container':   'var(--color-on-primary-container)',
          'on-fixed':       'var(--color-on-primary-fixed)',
          'on-fixed-variant':'var(--color-on-primary-fixed-variant)',
        },
        secondary: {
          DEFAULT:          'var(--color-secondary)',
          container:        'var(--color-secondary-container)',
          fixed:            'var(--color-secondary-fixed)',
          'fixed-dim':      'var(--color-secondary-fixed-dim)',
          on:               'var(--color-on-secondary)',
          'on-container':   'var(--color-on-secondary-container)',
        },
        tertiary: {
          DEFAULT:          'var(--color-tertiary)',
          container:        'var(--color-tertiary-container)',
          fixed:            'var(--color-tertiary-fixed)',
          'fixed-dim':      'var(--color-tertiary-fixed-dim)',
          on:               'var(--color-on-tertiary)',
          'on-container':   'var(--color-on-tertiary-container)',
          'on-fixed':       'var(--color-on-tertiary-fixed)',
          'on-fixed-variant':'var(--color-on-tertiary-fixed-variant)',
        },

        // surface agrupa todos los niveles de elevacion de superficie de M3.
        // `tint` y `variant` son alias de conveniencia para evitar repetir
        // la variable completa en componentes de nivel intermedio (cards, modals).
        surface: {
          DEFAULT:              'var(--color-surface)',
          dim:                  'var(--color-surface-dim)',
          bright:               'var(--color-surface-bright)',
          container:            'var(--color-surface-container)',
          'container-low':      'var(--color-surface-container-low)',
          'container-lowest':   'var(--color-surface-container-lowest)',
          'container-high':     'var(--color-surface-container-high)',
          'container-highest':  'var(--color-surface-container-highest)',
          tint:                 'var(--color-primary)',
          variant:              'var(--color-surface-container-highest)',
        },

        // Tokens de texto sobre superficie y sus inversas para componentes
        // de alto contraste (chips, snackbars, tooltips de color inverso).
        'on-surface':          'var(--color-on-surface)',
        'on-surface-variant':  'var(--color-on-surface-variant)',
        'inverse-surface':     'var(--color-inverse-surface)',
        'inverse-on-surface':  'var(--color-inverse-on-surface)',
        'inverse-primary':     'var(--color-inverse-primary)',

        // Tokens de borde: outline para elementos interactivos con foco,
        // outline-variant para separadores y bordes decorativos mas sutiles.
        outline:               'var(--color-outline)',
        'outline-variant':     'var(--color-outline-variant)',
        divider:               'var(--color-divider)',

        background:            'var(--color-background)',
        'on-background':       'var(--color-on-background)',

        // Estados de error alineados con M3: rojo semántico con variante
        // de contenedor para banners o campos de formulario con error.
        error: {
          DEFAULT:             'var(--color-error)',
          container:           'var(--color-error-container)',
          on:                  'var(--color-on-error)',
          'on-container':      'var(--color-on-error-container)',
        },

        warning: {
          DEFAULT:             'var(--color-warning)',
          container:           'var(--color-warning-container)',
          on:                  'var(--color-on-warning)',
          'on-container':      'var(--color-on-warning-container)',
        },

        // Color de acento complementario para badges y elementos decorativos.
        coral: 'var(--color-coral)',

        // Alias semantico para fondos de tarjeta / panel.
        // Centraliza el token en un nombre de negocio en lugar de un nombre
        // de rol de color, facilitando su uso en componentes Card y Modal.
        'card-panel': 'var(--card-panel-bg)',
      },

      // ── Tipografia ────────────────────────────────────────────────────────
      // Manrope se usa para titulos y elementos de display (mayor peso visual).
      // Inter se usa para cuerpo de texto, etiquetas y UI de alta densidad
      // por su legibilidad optima en tamanos pequenos en pantalla.
      fontFamily: {
        display:  ['"Manrope"', 'sans-serif'],
        headline: ['"Manrope"', 'sans-serif'],
        sans:     ['"Inter"',   'sans-serif'],
        body:     ['"Inter"',   'sans-serif'],
        label:    ['"Inter"',   'sans-serif'],
      },

      // ── Escala tipografica personalizada ──────────────────────────────────
      // Sigue la jerarquia display > headline > title > body > label de M3.
      // Cada nivel define [size, { lineHeight, fontWeight }] para garantizar
      // uniformidad sin necesidad de combinar clases text-* y font-* por separado.
      fontSize: {
        'display-lg':  ['3.5rem',   { lineHeight: '1.1',  fontWeight: '800' }],
        'display-md':  ['2.25rem',  { lineHeight: '1.15', fontWeight: '700' }],
        'headline-lg': ['2rem',     { lineHeight: '1.2',  fontWeight: '700' }],
        'headline-md': ['1.5rem',   { lineHeight: '1.25', fontWeight: '700' }],
        'title-lg':    ['1.375rem', { lineHeight: '1.3',  fontWeight: '600' }],
        'title-md':    ['1rem',     { lineHeight: '1.4',  fontWeight: '600' }],
        'body-lg':     ['1rem',     { lineHeight: '1.5',  fontWeight: '400' }],
        'body-md':     ['0.875rem', { lineHeight: '1.5',  fontWeight: '400' }],
        'label-lg':    ['0.75rem',  { lineHeight: '1.4',  fontWeight: '500', letterSpacing: '0.05em' }],
        'label-sm':    ['0.625rem', { lineHeight: '1.4',  fontWeight: '500', letterSpacing: '0.06em' }],
      },

      // ── Radios de borde ───────────────────────────────────────────────────
      // Se reemplaza el DEFAULT de Tailwind (4px) por 8px para una estetica
      // mas suave y moderna. `pill` y `full` son alias de 9999px para
      // elementos tipo badge, chip o boton de accion circular.
      borderRadius: {
        DEFAULT: '0.5rem',
        lg:      '0.75rem',
        xl:      '1.5rem',
        '2xl':   '2rem',
        '3xl':   '3rem',
        pill:    '9999px',
        full:    '9999px',
      },

      // ── Sombras (variable-driven) ─────────────────────────────────────────
      // Al igual que los colores, las sombras referencian variables CSS para
      // permitir adaptacion automatica al tema (luz/oscuro) sin clases adicionales.
      // `glass` y `editorial` son sombras especiales para efectos de glassmorphism
      // y componentes de portada/hero respectivamente.
      boxShadow: {
        ambient:   'var(--shadow-ambient)',
        float:     'var(--shadow-float)',
        card:      'var(--shadow-card)',
        glass:     'var(--shadow-glass)',
        editorial: 'var(--shadow-editorial)',
      },

      // ── Desenfoque de fondo (glassmorphism) ───────────────────────────────
      // 12px es el valor minimo perceptible para el efecto frosted-glass
      // sin impactar significativamente el rendimiento en GPU.
      backdropBlur: {
        glass: '12px',
      },

      // ── Espaciado adicional ───────────────────────────────────────────────
      // Extiende la escala de spacing de Tailwind con valores intermedios y
      // grandes que la escala por defecto (hasta 96 = 24rem) no cubre de
      // forma practica para layouts de sidebars y contenedores principales.
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
