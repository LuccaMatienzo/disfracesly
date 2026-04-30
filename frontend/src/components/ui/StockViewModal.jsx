/**
 * StockViewModal — Modal de solo lectura para una pieza de Stock.
 * Fetches /stock/:id al abrirse.
 */
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios.instance';
import ViewModal, { Field, Section } from '@/components/ui/ViewModal';
import Badge from '@/components/ui/Badge';

export default function StockViewModal({ id, open, onClose }) {
  const { data, isLoading } = useQuery({
    queryKey: ['stock', id, 'detail'],
    queryFn: () => api.get(`/stock/${id}`).then((r) => r.data),
    enabled: open && !!id,
    staleTime: 30_000,
  });

  const categorias =
    data?.pieza?.categorias?.map((c) => c.categoriaMotivo?.nombre).filter(Boolean).join(', ') || '—';

  return (
    <ViewModal
      open={open}
      onClose={onClose}
      title="Detalle de Stock"
      loading={isLoading}
      size="md"
    >
      {data && (
        <div className="flex flex-col gap-6">
          {/* Pieza */}
          <Section title="Pieza base">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
              <Field label="Nombre de pieza" value={data.pieza?.nombre} />
              <Field label="Categorías" value={categorias} />
            </div>
          </Section>

          {/* Unidad de stock */}
          <Section title="Unidad de inventario">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
              <Field label="Talle" value={data.talle} />
              <div className="flex flex-col gap-0.5">
                <span className="text-label-lg font-label font-medium uppercase tracking-wide text-on-surface-variant text-xs">
                  Estado
                </span>
                <Badge value={data.estado_pieza_stock} />
              </div>
              <Field label="Medidas" value={data.medidas} />
              <Field label="Descripción" value={data.descripcion} className="sm:col-span-2" />
            </div>
          </Section>

          {/* Imágenes (si las hay) */}
          {data.imagenes?.length > 0 && (
            <Section title="Imágenes">
              <div className="flex flex-wrap gap-2">
                {data.imagenes.map((img, i) => (
                  <img
                    key={img.id_imagen ?? i}
                    src={img.imagen?.url}
                    alt={`Imagen ${i + 1}`}
                    className="w-24 h-24 object-cover rounded-xl border border-outline-variant/20"
                  />
                ))}
              </div>
            </Section>
          )}
        </div>
      )}
    </ViewModal>
  );
}
