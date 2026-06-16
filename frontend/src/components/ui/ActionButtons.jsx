/**
 * ActionButtons — Botonera de íconos para filas de tabla.
 *
 * Props:
 *  - onView   : () => void  (opcional – si no se pasa, no se renderiza)
 *  - onEdit   : () => void  (opcional)
 *  - onDelete : () => void  (opcional)
 *  - size     : 'sm' | 'md' (default 'sm')
 */

import { FiEye, FiEdit2, FiTrash2, FiArrowRight, FiRotateCcw, FiKey, FiPrinter } from 'react-icons/fi';
import { useState, useRef, useEffect } from 'react';

const baseBtn =
  'inline-flex items-center justify-center rounded-lg transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 disabled:opacity-40 disabled:pointer-events-none min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0';

const sizeMap = {
  sm: 'size-10 md:w-8 md:h-8 text-lg md:text-base',
  md: 'size-11 md:w-9 md:h-9 text-xl md:text-lg',
};

export default function ActionButtons({ onView, onEdit, onDelete, onDetail, onPassword, onRestore, onPrint, printOptions, size = 'sm' }) {
  const sz = sizeMap[size] ?? sizeMap.sm;
  const [printMenuOpen, setPrintMenuOpen] = useState(false);
  const printMenuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (printMenuRef.current && !printMenuRef.current.contains(event.target)) {
        setPrintMenuOpen(false);
      }
    }
    if (printMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [printMenuOpen]);

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

      {printOptions && printOptions.length > 0 ? (
        <div className="relative flex items-center" ref={printMenuRef}>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setPrintMenuOpen(!printMenuOpen); }}
            title="Opciones de Impresión"
            className={`${baseBtn} ${sz} text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface`}
          >
            <FiPrinter />
          </button>
          {printMenuOpen && (
            <div className="absolute top-full right-0 mt-2 w-64 bg-surface-container-high rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] z-[300] flex flex-col p-1 border border-outline-variant animate-scale-in origin-top-right">
               {printOptions.map((opt, i) => (
                  <button 
                    key={i} 
                    onClick={(e) => { e.stopPropagation(); opt.onClick(); setPrintMenuOpen(false); }} 
                    disabled={opt.disabled} 
                    className="text-left w-full px-3 py-2.5 hover:bg-surface-container-highest rounded-lg disabled:opacity-40 text-sm text-on-surface transition-colors flex items-center gap-3"
                  >
                     {opt.icon && <span className="material-symbols-outlined text-[18px]">{opt.icon}</span>}
                     {opt.label}
                  </button>
               ))}
            </div>
          )}
        </div>
      ) : onPrint && (
        <button
          type="button"
          onClick={onPrint}
          title="Imprimir"
          className={`${baseBtn} ${sz} text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface`}
        >
          <FiPrinter />
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

      {onPassword && (
        <button
          type="button"
          onClick={onPassword}
          title="Restablecer Contraseña"
          className={`${baseBtn} ${sz} text-on-surface-variant hover:bg-tertiary/10 hover:text-tertiary`}
        >
          <FiKey />
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

      {onRestore && (
        <button
          type="button"
          onClick={onRestore}
          title="Restaurar"
          className={`${baseBtn} ${sz} text-on-surface-variant hover:bg-success/10 hover:text-success`}
        >
          <FiRotateCcw />
        </button>
      )}
    </div>
  );
}
