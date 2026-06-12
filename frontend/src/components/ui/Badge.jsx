/**
 * Badge — Status pills para estados de stock, alquiler y venta.
 * Implementa el sistema de colores del design system Stitch.
 */

export const badgeConfig = {
  // Estado pieza_stock
  DISPONIBLE: { label: 'Disponible', cls: 'bg-primary-container text-primary-on-container' },
  RESERVADA: { label: 'Reservada', cls: 'bg-secondary-container text-secondary-on-container' },
  ALQUILADA: { label: 'Alquilada', cls: 'bg-tertiary-container text-tertiary-on-container' },
  VENDIDA: { label: 'Vendida', cls: 'bg-primary-container text-primary-on-container' },
  FUERA_DE_SERVICIO: { label: 'Fuera de servicio', cls: 'bg-error-container text-error-on-container' },
  DE_BAJA: { label: 'De baja', cls: 'bg-transparent border border-coral text-coral' },

  // Etapa alquiler
  RESERVADO: { label: 'Reservado', cls: 'bg-secondary-container text-secondary-on-container' },
  LISTO_PARA_RETIRO: { label: 'Listo para retiro', cls: 'bg-warning-container text-warning-on-container' },
  RETIRADO: { label: 'Retirado', cls: 'bg-tertiary-container text-tertiary-on-container' },
  DEVUELTO: { label: 'Devuelto', cls: 'bg-primary-container text-primary-on-container' },
  CANCELADO: { label: 'Cancelado', cls: 'bg-error-container text-error-on-container' },

  // Etapa venta
  LISTO_PARA_ENTREGA: { label: 'Listo para entrega', cls: 'bg-warning-container text-warning-on-container' },
  VENDIDO: { label: 'Vendido', cls: 'bg-primary-container text-primary-on-container' },

  // Pagos: Tipo
  SENA: { label: 'Seña', cls: 'bg-secondary-container/30 text-secondary' },
  DEPOSITO: { label: 'Depósito', cls: 'bg-primary/10 text-primary' },
  SALDO: { label: 'Saldo', cls: 'bg-primary-container text-primary-on-container' },
  DEVOLUCION_DEPOSITO: { label: 'Dev. Depósito', cls: 'bg-error-container text-error-on-container' },
  AJUSTE: { label: 'Ajuste', cls: 'bg-surface-container text-on-surface-variant' },

  // Pagos: Método
  EFECTIVO: { label: 'Efectivo', cls: 'bg-primary-container text-primary-on-container' },
  TRANSFERENCIA: { label: 'Transferencia', cls: 'bg-tertiary-container text-tertiary-on-container' },
};

const variantClasses = {
  primary: 'bg-primary-container text-primary-on-container',
  secondary: 'bg-secondary-container text-secondary-on-container',
  error: 'bg-error-container text-error-on-container',
  neutral: 'bg-surface-container text-on-surface-variant',
  deleted: 'bg-transparent border border-coral text-coral',
};

export default function Badge({ value, variant, children, className = '' }) {
  if (variant || children) {
    const cls = variantClasses[variant] || variantClasses.neutral;
    return (
      <span
        className={`
          inline-flex items-center px-2.5 py-0.5 rounded-pill
          text-label-lg font-label font-medium uppercase tracking-wide
          ${cls} ${className}
        `}
      >
        {children}
      </span>
    );
  }

  const { label, cls } = badgeConfig[value] ?? { label: value, cls: 'bg-surface-container text-on-surface-variant' };
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
