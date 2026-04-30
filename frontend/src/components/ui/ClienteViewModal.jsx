/**
 * ClienteViewModal — Modal de solo lectura para un Cliente.
 * Fetches /clientes/:id al abrirse.
 */
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios.instance';
import ViewModal, { Field, Section, ViewModalSkeleton } from '@/components/ui/ViewModal';
import Badge from '@/components/ui/Badge';

function fmt(date) {
  if (!date) return null;
  return new Date(date).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function ClienteViewModal({ id, open, onClose }) {
  const { data, isLoading } = useQuery({
    queryKey: ['clientes', id, 'detail'],
    queryFn: () => api.get(`/clientes/${id}`).then((r) => r.data),
    enabled: open && !!id,
    staleTime: 30_000,
  });

  return (
    <ViewModal
      open={open}
      onClose={onClose}
      title="Detalle del Cliente"
      loading={isLoading}
      size="lg"
    >
      {data && (
        <div className="flex flex-col gap-6">
          {/* Datos personales */}
          <Section title="Datos personales">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
              <Field label="Nombre" value={data.persona?.nombre} />
              <Field label="Apellido" value={data.persona?.apellido} />
              <Field label="Documento" value={data.persona?.documento} />
              <Field label="Teléfono" value={data.telefono} />
              <Field label="Domicilio" value={data.domicilio} className="sm:col-span-2" />
              <Field label="Cliente desde" value={fmt(data.fecha_alta)} />
            </div>
          </Section>

          {/* Historial de operaciones */}
          {data.operaciones?.length > 0 && (
            <Section title="Últimas operaciones">
              <div className="flex flex-col gap-2">
                {data.operaciones.map((op) => {
                  const tipo = op.alquiler ? 'Alquiler' : 'Venta';
                  const etapa = op.alquiler?.etapa ?? op.venta?.etapa;
                  return (
                    <div
                      key={op.id_operacion}
                      className="flex items-center justify-between px-3 py-2 rounded-xl bg-surface-container-low gap-4"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-label-lg font-label text-on-surface-variant shrink-0">
                          #{String(op.id_operacion)}
                        </span>
                        <span
                          className={`font-label font-semibold text-body-md shrink-0 ${
                            op.alquiler ? 'text-primary' : 'text-secondary'
                          }`}
                        >
                          {tipo}
                        </span>
                        <span className="text-body-md text-on-surface-variant truncate">
                          {new Date(op.fecha_constitucion).toLocaleDateString('es-AR', {
                            day: 'numeric',
                            month: 'short',
                            year: '2-digit',
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        {etapa && <Badge value={etapa} />}
                        <span className="text-body-md font-label font-medium text-on-surface">
                          ${parseFloat(op.monto_total).toLocaleString('es-AR')}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Section>
          )}

          {data.operaciones?.length === 0 && (
            <p className="text-body-md text-on-surface-variant italic">Sin operaciones registradas.</p>
          )}
        </div>
      )}
    </ViewModal>
  );
}
