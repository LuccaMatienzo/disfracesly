/**
 * Table — Tabla de datos con "No-Line Rule" (sin bordes 1px, alternación de fondo).
 */
export default function Table({ columns, data, loading, emptyMessage = 'Sin resultados' }) {
  return (
    <div className="w-full overflow-x-auto rounded-xl">
      <table className="w-full border-collapse text-body-md">
        {/* Header */}
        <thead>
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
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={columns.length} className="py-12 text-center">
                <div className="inline-flex items-center gap-2 text-on-surface-variant">
                  <div className="w-5 h-5 border-2 border-primary-container border-t-primary rounded-full animate-spin" />
                  <span>Cargando...</span>
                </div>
              </td>
            </tr>
          ) : data?.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="py-12 text-center text-on-surface-variant">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data?.map((row, i) => (
              <tr
                key={row.id ?? i}
                className={`
                  border-0 transition-colors duration-75
                  ${i % 2 === 0 ? 'bg-background' : 'bg-surface-container-low'}
                  hover:bg-primary/5
                `}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`px-4 py-3.5 text-on-surface ${
                      col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : ''
                    }`}
                  >
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
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
    <div className="flex items-center justify-between text-body-md text-on-surface-variant mt-4">
      <span>
        Mostrando {(page - 1) * meta.limit + 1}–{Math.min(page * meta.limit, meta.total)} de {meta.total}
      </span>
      <div className="flex gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={!meta.hasPrevPage}
          className="px-3 py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-container-highest disabled:opacity-40 transition-colors"
        >
          ← Anterior
        </button>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={!meta.hasNextPage}
          className="px-3 py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-container-highest disabled:opacity-40 transition-colors"
        >
          Siguiente →
        </button>
      </div>
    </div>
  );
}
