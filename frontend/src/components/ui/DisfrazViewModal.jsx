/**
 * DisfrazViewModal — Modal de solo lectura para un Disfraz del catálogo.
 * Fetches /catalogo/disfraces/:id al abrirse.
 */
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios.instance';
import ViewModal, { Field, Section } from '@/components/ui/ViewModal';
import Badge from '@/components/ui/Badge';

export default function DisfrazViewModal({ id, open, onClose }) {
  const { data, isLoading } = useQuery({
    queryKey: ['disfraces', id, 'detail'],
    queryFn: () => api.get(`/catalogo/disfraces/${id}`).then((r) => r.data),
    enabled: open && !!id,
    staleTime: 30_000,
  });

  const categorias = data?.categorias_derivadas?.length > 0 
    ? data.categorias_derivadas.join(', ') 
    : '—';

  return (
    <ViewModal
      open={open}
      onClose={onClose}
      title="Detalle de Disfraz"
      loading={isLoading}
      size="lg"
    >
      {data && (
        <div className="flex flex-col gap-6">
          {/* Info general */}
          <Section title="Información general">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
              <Field label="Nombre" value={data.nombre} />
              <Field label="Categorías Derivadas" value={categorias} />
              <Field label="Descripción" value={data.descripcion} className="sm:col-span-2" />
            </div>
          </Section>

          {/* Listado de piezas */}
          <Section title="Piezas incluidas">
            <div className="flex flex-col gap-2">
              {data.piezas?.length > 0 ? (
                data.piezas.map((dp, i) => (
                  <div
                    key={dp.id_pieza ?? i}
                    className="flex flex-col gap-1 px-4 py-3 rounded-xl bg-surface-container-low"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-label font-bold text-on-surface">
                        {dp.pieza?.nombre}
                      </span>
                    </div>
                    {dp.pieza?.descripcion && (
                      <span className="text-body-sm text-on-surface-variant">
                        {dp.pieza.descripcion}
                      </span>
                    )}
                  </div>
                ))
              ) : (
                <span className="text-body-md text-on-surface-variant italic">
                  Este disfraz no tiene piezas asignadas.
                </span>
              )}
            </div>
          </Section>
        </div>
      )}
    </ViewModal>
  );
}
