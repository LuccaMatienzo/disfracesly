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
import { createPortal } from 'react-dom';

const baseBtn =
  'inline-flex items-center justify-center rounded-lg transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 disabled:opacity-40 disabled:pointer-events-none min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0';

const sizeMap = {
  sm: 'size-10 md:w-8 md:h-8 text-lg md:text-base',
  md: 'size-11 md:w-9 md:h-9 text-xl md:text-lg',
};

export default function ActionButtons({ onView, onEdit, onDelete, onDetail, onPassword, onRestore, onPrint, printOptions, size = 'sm' }) {
  const sz = sizeMap[size] ?? sizeMap.sm;
  const [printMenuOpen, setPrintMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });
  const printMenuRef = useRef(null);
  const printBtnRef = useRef(null);

  const togglePrintMenu = (e) => {
    e.stopPropagation();
    if (!printMenuOpen && printBtnRef.current) {
      const rect = printBtnRef.current.getBoundingClientRect();
      setMenuPos({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right
      });
    }
    setPrintMenuOpen(!printMenuOpen);
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        printMenuRef.current && !printMenuRef.current.contains(event.target) &&
        printBtnRef.current && !printBtnRef.current.contains(event.target)
      ) {
        setPrintMenuOpen(false);
      }
    }
    
    function handleScroll() {
      setPrintMenuOpen(false);
    }

    if (printMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', handleScroll);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('scroll', handleScroll, true);
        window.removeEventListener('resize', handleScroll);
      };
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
        <div className="relative flex items-center">
          <button
            ref={printBtnRef}
            type="button"
            onClick={togglePrintMenu}
            title="Opciones de Impresión"
            className={`${baseBtn} ${sz} text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface ${printMenuOpen ? 'bg-surface-container-high text-on-surface' : ''}`}
          >
            <FiPrinter />
          </button>
          {printMenuOpen && createPortal(
            <div 
              ref={printMenuRef}
              className="fixed w-[240px] sm:w-64 bg-surface-container-high rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.16)] z-[99999] flex flex-col p-1 border border-outline-variant animate-scale-in origin-top-right"
              style={{
                top: `${menuPos.top}px`,
                right: window.innerWidth < 640 ? '16px' : `${menuPos.right}px`
              }}
            >
               {printOptions.map((opt, i) => (
                  <button 
                    key={i} 
                    onClick={(e) => { e.stopPropagation(); opt.onClick(); setPrintMenuOpen(false); }} 
                    disabled={opt.disabled} 
                    className="text-left w-full px-3 py-2.5 hover:bg-surface-container-highest rounded-lg disabled:opacity-40 text-[13px] sm:text-sm font-medium text-on-surface transition-colors flex items-center gap-3"
                  >
                     {opt.icon && <span className="material-symbols-outlined text-[18px]">{opt.icon}</span>}
                     {opt.label}
                  </button>
               ))}
            </div>,
            document.body
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
