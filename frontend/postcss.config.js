/**
 * @file postcss.config.js
 * @description Configuracion del pipeline de transformacion de CSS.
 *
 * PostCSS actua como preprocesador de CSS en el proceso de build de Vite.
 * Los plugins se ejecutan en orden de declaracion sobre cada archivo .css
 * antes de que Vite empaquete el resultado final.
 *
 * Plugins registrados:
 *  - tailwindcss   : Genera las clases utilitarias a partir de las directivas
 *                    @tailwind y de las referencias encontradas en `content`
 *                    (definido en tailwind.config.js). Realiza tree-shaking
 *                    automatico: solo se emiten las clases realmente usadas.
 *  - autoprefixer  : Agrega prefijos de vendor (-webkit-, -moz-, etc.) segun
 *                    los targets de navegadores definidos en browserslist,
 *                    garantizando compatibilidad sin escritura manual.
 */
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
