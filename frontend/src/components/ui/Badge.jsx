/**
 * Badge — Status pills para estados de stock, alquiler y venta.
 * Implementa el sistema de colores del design system Stitch.
 */

const config = {
  // Estado pieza_stock
  DISPONIBLE: { label: 'Disponible', cls: 'bg-primary-container text-primary-on-container' },
  RESERVADA: { label: 'Reservada', cls: 'bg-secondary-container/30 text-secondary' },
  ALQUILADA: { label: 'Alquilada', cls: 'bg-secondary-container text-secondary-on-container' },
  VENDIDA: { label: 'Vendida', cls: 'bg-on-surface/10 text-on-surface-variant' },
  FUERA_DE_SERVICIO: { label: 'Fuera de servicio', cls: 'bg-tertiary-container text-tertiary-on-container' },

  // Etapa alquiler
  RESERVADO: { label: 'Reservado', cls: 'bg-secondary-container/30 text-secondary' },
  LISTO_PARA_RETIRO: { label: 'Listo para retiro', cls: 'bg-primary/10 text-primary' },
  RETIRADO: { label: 'Retirado', cls: 'bg-secondary-container text-secondary-on-container' },
  DEVUELTO: { label: 'Devuelto', cls: 'bg-primary-container text-primary-on-container' },
  CANCELADO: { label: 'Cancelado', cls: 'bg-error-container text-error-on-container' },

  // Etapa venta
  LISTO_PARA_ENTREGA: { label: 'Listo para entrega', cls: 'bg-primary/10 text-primary' },
  VENDIDO: { label: 'Vendido', cls: 'bg-on-surface/10 text-on-surface-variant' },
};

export default function Badge({ value, className = '' }) {
  const { label, cls } = config[value] ?? { label: value, cls: 'bg-surface-container text-on-surface-variant' };
  return (
    <span
      className={`
        inline-flex items-center px-2.5 py-0.5 rounded-pill
        text-label-lg font-label font-medium uppercase tracking-wide
        ${cls} ${className}
      `}
    >
      {label}
    </span>
  );
}
