/**
 * Card — Superficie elevada ("The Layering Principle" del design system).
 * Usa surface-container-lowest sobre surface como fondo para efecto "lift".
 */
export default function Card({ title, subtitle, children, className = '', actions }) {
  return (
    <div
      className={`
        bg-surface-container-lowest rounded-2xl shadow-card
        p-6 flex flex-col gap-4 ${className}
      `}
    >
      {(title || actions) && (
        <div className="flex items-start justify-between gap-4">
          <div>
            {title && (
              <h3 className="font-headline text-title-lg text-on-surface">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-body-md text-on-surface-variant mt-0.5">{subtitle}</p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
        </div>
      )}
      {children}
    </div>
  );
}

/**
 * KPICard — Tarjeta numérica para el Dashboard.
 */
export function KPICard({ label, value, icon, accent = 'primary', trend }) {
  const accents = {
    primary:   'from-primary to-primary-container',
    secondary: 'from-secondary to-secondary-container',
    tertiary:  'from-tertiary to-tertiary-container',
  };

  return (
    <div className="bg-surface-container-lowest rounded-2xl shadow-card p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-label-lg text-on-surface-variant uppercase tracking-wide font-label">
          {label}
        </span>
        {icon && (
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${accents[accent]} flex items-center justify-center text-white text-lg`}>
            {icon}
          </div>
        )}
      </div>
      <p className={`font-display text-display-md bg-gradient-to-r ${accents[accent]} bg-clip-text text-transparent leading-none`}>
        {value}
      </p>
      {trend && <p className="text-label-lg text-on-surface-variant">{trend}</p>}
    </div>
  );
}
