import { FiChevronUp, FiChevronDown, FiChevronsUp } from 'react-icons/fi';

/**
 * SortToggle -- Boton de alternancia para ordenamiento de columnas de tabla.
 *
 * Ciclo de estados: null -> 'asc' -> 'desc' -> null
 *
 * @param {string}   label        - Texto visible del boton.
 * @param {string}   field        - Nombre del campo sobre el que aplica el sort.
 * @param {{ field: string|null, direction: 'asc'|'desc'|null }} currentSort
 *   Estado actual de ordenamiento del componente padre.
 * @param {(field: string|null, direction: 'asc'|'desc'|null) => void} onSortChange
 *   Callback que recibe el nuevo campo y direccion al cambiar.
 */
export default function SortToggle({ label, field, currentSort, onSortChange, className = '' }) {
  const isActive = currentSort?.field === field && currentSort?.direction !== null;
  const direction = isActive ? currentSort.direction : null;

  const handleClick = () => {
    if (direction === null) {
      onSortChange(field, 'asc');
    } else if (direction === 'asc') {
      onSortChange(field, 'desc');
    } else {
      onSortChange(null, null);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={[
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg shrink-0',
        'text-label-lg font-label font-medium uppercase tracking-wide',
        'transition-all duration-150 select-none',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        isActive
          ? 'bg-primary/10 text-primary'
          : 'bg-transparent text-on-surface-variant hover:bg-surface-container-high',
        className,
      ].join(' ')}
      aria-label={`Ordenar por ${label}`}
    >
      <span>{label}</span>
      <SortIcon direction={direction} />
    </button>
  );
}

/**
 * SortIcon -- Renderiza el indicador de direccion correspondiente.
 * Cuando no hay ordenamiento activo muestra un icono neutral (doble chevron).
 *
 * @param {'asc'|'desc'|null} direction
 */
function SortIcon({ direction }) {
  const baseClass = 'size-3.5 transition-transform duration-150';

  if (direction === 'asc') {
    return <FiChevronUp className={`${baseClass} text-primary`} />;
  }
  if (direction === 'desc') {
    return <FiChevronDown className={`${baseClass} text-primary`} />;
  }
  return <FiChevronsUp className={`${baseClass} opacity-40`} />;
}
