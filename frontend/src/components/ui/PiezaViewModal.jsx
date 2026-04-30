/**
 * PiezaViewModal — Modal de solo lectura para una Pieza del catálogo.
 * Fetches /catalogo/piezas/:id al abrirse.
 */
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios.instance';
import ViewModal, { Field, Section } from '@/components/ui/ViewModal';
import Badge from '@/components/ui/Badge';

export default function PiezaViewModal({ id, open, onClose }) {
  const { data, isLoading } = useQuery({
    queryKey: ['piezas', id, 'detail'],
    queryFn: () => api.get(`/catalogo/piezas/${id}`).then((r) => r.data),
    enabled: open && !!id,
    staleTime: 30_000,
  });

  const categorias =
    data?.categorias?.map((c) => c.categoriaMotivo?.nombre).filter(Boolean).join(', ') || '—';

  const stockDisponible = data?.stocks?.filter((s) => s.estado_pieza_stock === 'DISPONIBLE').length ?? 0;
  const stockTotal = data?.stocks?.length ?? 0;

  return (
    <ViewModal
      open={open}
      onClose={onClose}
      title="Detalle de Pieza"
      loading={isLoading}
      size="lg"
    >
      {data && (
        <div className="flex flex-col gap-6">
          {/* Info general */}
          <Section title="Información general">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
              <Field label="Nombre" value={data.nombre} />
              <Field label="Categorías" value={categorias} />
              <Field label="Descripción" value={data.descripcion} className="sm:col-span-2" />
            </div>
          </Section>

          {/* Resumen de stock */}
          <Section title="Stock">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="flex flex-col items-center justify-center px-4 py-3 rounded-xl bg-surface-container-low gap-1">
                <span className="text-2xl font-bold text-primary">{stockTotal}</span>
                <span className="text-label-lg text-on-surface-variant">Total</span>
              </div>
              <div className="flex flex-col items-center justify-center px-4 py-3 rounded-xl bg-surface-container-low gap-1">
                <span className="text-2xl font-bold text-primary">{stockDisponible}</span>
                <span className="text-label-lg text-on-surface-variant">Disponibles</span>
              </div>
            </div>

            {/* Listado de unidades */}
            {data.stocks?.length > 0 && (
              <div className="flex flex-col gap-2 mt-2">
                {data.stocks.map((s, i) => (
                  <div
                    key={s.id_pieza_stock ?? i}
                    className="flex items-center justify-between px-3 py-2 rounded-xl bg-surface-container-low"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-on-surface-variant text-label-lg">#{String(s.id_pieza_stock)}</span>
                      <span className="text-body-md text-on-surface">
                        {s.talle ? `Talle ${s.talle}` : 'Sin talle'}
                      </span>
                      {s.descripcion && (
                        <span className="text-body-md text-on-surface-variant truncate max-w-xs">
                          — {s.descripcion}
                        </span>
                      )}
                    </div>
                    <Badge value={s.estado_pieza_stock} />
                  </div>
                ))}
              </div>
            )}
          </Section>
        </div>
      )}
    </ViewModal>
  );
}
