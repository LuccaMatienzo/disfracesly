/**
 * ActionButtons — Botonera de íconos para filas de tabla.
 *
 * Props:
 *  - onView   : () => void  (opcional – si no se pasa, no se renderiza)
 *  - onEdit   : () => void  (opcional)
 *  - onDelete : () => void  (opcional)
 *  - size     : 'sm' | 'md' (default 'sm')
 */

import { FiEye, FiEdit2, FiTrash2, FiArrowRight } from 'react-icons/fi';

const baseBtn =
  'inline-flex items-center justify-center rounded-lg transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 disabled:opacity-40 disabled:pointer-events-none min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0';

const sizeMap = {
  sm: 'w-10 h-10 md:w-8 md:h-8 text-lg md:text-base',
  md: 'w-11 h-11 md:w-9 md:h-9 text-xl md:text-lg',
};

export default function ActionButtons({ onView, onEdit, onDelete, onDetail, size = 'sm' }) {
  const sz = sizeMap[size] ?? sizeMap.sm;

  return (
    <div className="flex items-center gap-1 w-fit mx-auto">
      {onView && (
        <button
          type="button"
          onClick={onView}
          title="Ver detalle"
          className={`${baseBtn} ${sz} text-on-surface-variant hover:bg-primary/10 hover:text-primary`}
        >
          <FiEye />
        </button>
      )}

      {onDetail && (
        <button
          type="button"
          onClick={onDetail}
          title="Ir a la operación"
          className={`${baseBtn} ${sz} text-on-surface-variant hover:bg-primary/10 hover:text-primary`}
        >
          <FiArrowRight />
        </button>
      )}

      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          title="Editar"
          className={`${baseBtn} ${sz} text-on-surface-variant hover:bg-secondary/10 hover:text-secondary`}
        >
          <FiEdit2 />
        </button>
      )}

      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          title="Eliminar"
          className={`${baseBtn} ${sz} text-on-surface-variant hover:bg-error/10 hover:text-error`}
        >
          <FiTrash2 />
        </button>
      )}
    </div>
  );
}
