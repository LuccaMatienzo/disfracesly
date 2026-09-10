import { Helmet } from 'react-helmet-async';
import PropTypes from 'prop-types';

/**
 * Componente SEO para gestionar metaetiquetas dinámicas en el `<head>`.
 * Implementa las mejores prácticas para SEO y Open Graph (Redes Sociales).
 */
export default function SEO({ 
  title = 'Disfracesly | Alquiler y Venta de Disfraces en Tucumán',
  description = 'Encuentra el disfraz perfecto para actos escolares, fiestas temáticas y eventos en San Miguel de Tucumán. Calidad artesanal y atención personalizada.',
  name = 'Disfracesly',
  type = 'website',
  image = 'https://disfracesly.com.ar/og-image.jpg', // Imagen genérica por defecto
  url = 'https://disfracesly.com.ar'
}) {
  return (
    <Helmet>
      {/* Etiquetas Estándar */}
      <title>{title}</title>
      <meta name="description" content={description} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={url} />
      <meta property="og:site_name" content={name} />

      {/* Twitter */}
      <meta name="twitter:creator" content={name} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
    </Helmet>
  );
}

SEO.propTypes = {
  title: PropTypes.string,
  description: PropTypes.string,
  name: PropTypes.string,
  type: PropTypes.string,
  image: PropTypes.string,
  url: PropTypes.string,
};
