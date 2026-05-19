/**
 * Table — Tabla de datos con "No-Line Rule" (sin bordes 1px, alternación de fondo).
 *
 * En móvil (<md) se transforma en tarjetas apiladas: el <thead> se oculta y cada
 * <tr> se convierte en un bloque card con data-label pseudo-elements.
 * En desktop (≥md) mantiene el layout clásico de tabla.
 */
export default function Table({ columns, data, loading, emptyMessage = 'Sin resultados' }) {
  return (
    <div className="w-full md:overflow-x-auto md:rounded-xl" style={{ WebkitOverflowScrolling: 'touch' }}>
      <table className="w-full md:border-collapse text-body-md md:min-w-[540px]">
        {/* Header — visible solo en md+ */}
        <thead className="hidden md:table-header-group">
          <tr className="bg-surface-container">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-4 py-3 text-label-lg font-label font-medium uppercase tracking-wide text-on-surface-variant ${
                  col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'
                }`}
                style={{ width: col.width }}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>

        {/* Body */}
        <tbody className="block md:table-row-group">
          {loading ? (
            <tr className="block md:table-row">
              <td colSpan={columns.length} className="block md:table-cell py-12 text-center">
                <div className="inline-flex items-center gap-2 text-on-surface-variant">
                  <div className="size-5 border-2 border-primary-container border-t-primary rounded-full animate-spin" />
                  <span>Cargando…</span>
                </div>
              </td>
            </tr>
          ) : data?.length === 0 ? (
            <tr className="block md:table-row">
              <td colSpan={columns.length} className="block md:table-cell py-12 text-center text-on-surface-variant">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data?.map((row, i) => (
              <tr
                key={row.id ?? i}
                className={`
                  block mb-3 last:mb-0 p-4 rounded-xl border border-outline-variant/20
                  bg-surface-container-lowest shadow-sm
                  md:table-row md:mb-0 md:p-0 md:rounded-none md:border-0 md:shadow-none
                  ${i % 2 === 0 ? 'md:bg-background' : 'md:bg-surface-container-low'}
                  md:hover:bg-primary/5 transition-colors duration-75
                `}
              >
                {columns.map((col) => {
                  const isActions = col.key === 'acciones';
                  const mdAlign =
                    col.align === 'center'
                      ? 'md:text-center'
                      : col.align === 'right'
                        ? 'md:text-right'
                        : 'md:text-left';

                  return (
                    <td
                      key={col.key}
                      data-label={col.label}
                      className={`
                        text-on-surface
                        ${isActions
                          ? 'block pt-3 mt-2 border-t border-outline-variant/10 text-center md:table-cell md:border-t-0 md:mt-0 md:pt-0'
                          : `flex justify-between items-center gap-4 py-1.5 text-right
                             before:content-[attr(data-label)] before:font-semibold
                             before:text-on-surface-variant before:uppercase before:text-xs before:tracking-wide
                             md:table-cell md:before:content-none`
                        }
                        md:px-4 md:py-3.5 ${mdAlign}
                      `}
                    >
                      {col.render ? col.render(row[col.key], row) : row[col.key]}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Pagination — complemento para Table.
 */
export function Pagination({ meta, page, onPageChange }) {
  if (!meta || meta.totalPages <= 1) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between text-body-md text-on-surface-variant mt-4 gap-3">
      <span className="text-xs md:text-sm">
        Mostrando {(page - 1) * meta.limit + 1}–{Math.min(page * meta.limit, meta.total)} de {meta.total}
      </span>
      <div className="flex gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={!meta.hasPrevPage}
          className="px-3 py-2 min-h-[44px] rounded-lg bg-surface-container-high hover:bg-surface-container-highest disabled:opacity-40 transition-colors text-sm"
        >
          ← Anterior
        </button>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={!meta.hasNextPage}
          className="px-3 py-2 min-h-[44px] rounded-lg bg-surface-container-high hover:bg-surface-container-highest disabled:opacity-40 transition-colors text-sm"
        >
          Siguiente →
        </button>
      </div>
    </div>
  );
}
