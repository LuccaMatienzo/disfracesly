/**
 * ActionButtons — Botonera de íconos para filas de tabla.
 *
 * Props:
 *  - onView   : () => void  (opcional – si no se pasa, no se renderiza)
 *  - onEdit   : () => void  (opcional)
 *  - onDelete : () => void  (opcional)
 *  - size     : 'sm' | 'md' (default 'sm')
 */

import { FiEye, FiEdit2, FiTrash2 } from 'react-icons/fi';

const baseBtn =
  'inline-flex items-center justify-center rounded-lg transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 disabled:opacity-40 disabled:pointer-events-none';

const sizeMap = {
  sm: 'w-8 h-8 text-base',
  md: 'w-9 h-9 text-lg',
};

export default function ActionButtons({ onView, onEdit, onDelete, size = 'sm' }) {
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
