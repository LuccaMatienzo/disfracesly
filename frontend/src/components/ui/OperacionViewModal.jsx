/**
 * OperacionViewModal — Modal de solo lectura para una Operación.
 * Fetches /operaciones/:id al abrirse.
 */
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios.instance';
import ViewModal, { Field, Section } from '@/components/ui/ViewModal';
import Badge from '@/components/ui/Badge';

function fmt(date) {
  if (!date) return null;
  return new Date(date).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function currency(v) {
  if (v === null || v === undefined) return null;
  return `$${parseFloat(v).toLocaleString('es-AR')}`;
}

export default function OperacionViewModal({ id, open, onClose }) {
  const { data, isLoading } = useQuery({
    queryKey: ['operaciones', id, 'detail'],
    queryFn: () => api.get(`/operaciones/${id}`).then((r) => r.data),
    enabled: open && !!id,
    staleTime: 30_000,
  });

  const esAlquiler = !!data?.alquiler;
  const etapa = data?.alquiler?.etapa ?? data?.venta?.etapa;
  const clienteNombre = data
    ? `${data.cliente?.persona?.nombre ?? ''} ${data.cliente?.persona?.apellido ?? ''}`.trim()
    : '';

  return (
    <ViewModal
      open={open}
      onClose={onClose}
      title={`Operación #${id ?? ''}`}
      loading={isLoading}
      size="lg"
    >
      {data && (
        <div className="flex flex-col gap-6">
          {/* Resumen */}
          <Section title="Resumen">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
              <Field label="Tipo" value={esAlquiler ? 'Alquiler' : 'Venta'} />
              <div className="flex flex-col gap-0.5">
                <span className="text-label-lg font-label font-medium uppercase tracking-wide text-on-surface-variant text-xs">
                  Etapa
                </span>
                {etapa ? <Badge value={etapa} /> : <span className="text-on-surface-variant italic">—</span>}
              </div>
              <Field label="Cliente" value={clienteNombre} />
              <Field label="Documento" value={data.cliente?.persona?.documento} />
              <Field label="Monto total" value={currency(data.monto_total)} />
              <Field label="Fecha" value={fmt(data.fecha_constitucion)} />
              <Field label="Observaciones" value={data.observaciones} className="sm:col-span-2" />
            </div>
          </Section>

          {/* Datos de alquiler */}
          {esAlquiler && (
            <Section title="Detalles del alquiler">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                <Field label="Fecha devolución" value={fmt(data.alquiler?.fecha_devolucion)} />
                <Field label="Depósito" value={currency(data.alquiler?.deposito_monto)} />
                {data.alquiler?.deposito_devuelto_monto != null && (
                  <Field label="Depósito devuelto" value={currency(data.alquiler.deposito_devuelto_monto)} />
                )}
                {data.alquiler?.deposito_motivo_retencion && (
                  <Field
                    label="Motivo retención"
                    value={data.alquiler.deposito_motivo_retencion}
                    className="sm:col-span-2"
                  />
                )}
              </div>
            </Section>
          )}

          {/* Datos de venta */}
          {!esAlquiler && data?.venta && (
            <Section title="Detalles de la venta">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                <Field label="Fecha entrega estimada" value={fmt(data.venta?.fecha_entrega_estimada)} />
                <Field label="Seña" value={currency(data.venta?.sena_monto)} />
                <Field
                  label="Especificaciones / Medidas"
                  value={data.venta?.especificaciones_medidas}
                  className="sm:col-span-2"
                />
              </div>
            </Section>
          )}

          {/* Piezas */}
          {data.detalles?.length > 0 && (
            <Section title="Piezas incluidas">
              <div className="flex flex-col gap-2">
                {data.detalles.map((det, i) => {
                  const pieza = det.piezaStock?.pieza;
                  return (
                    <div
                      key={det.id_operacion_detalle ?? i}
                      className="flex items-center gap-3 px-3 py-2 rounded-xl bg-surface-container-low"
                    >
                      <span className="text-on-surface-variant text-label-lg">#</span>
                      <span className="text-body-md text-on-surface font-medium flex-1">{pieza?.nombre ?? '—'}</span>
                      {det.piezaStock?.talle && (
                        <span className="text-body-md text-on-surface-variant">
                          Talle: {det.piezaStock.talle}
                        </span>
                      )}
                      <Badge value={det.piezaStock?.estado_pieza_stock} />
                    </div>
                  );
                })}
              </div>
            </Section>
          )}

          {/* Pagos */}
          {data.pagos?.length > 0 && (
            <Section title="Pagos registrados">
              <div className="flex flex-col gap-2">
                {data.pagos.map((pago, i) => (
                  <div
                    key={pago.id_pago ?? i}
                    className="flex items-center justify-between px-3 py-2 rounded-xl bg-surface-container-low"
                  >
                    <div className="flex flex-col">
                      <span className="text-body-md text-on-surface font-medium">
                        {currency(pago.monto)}
                      </span>
                      <span className="text-label-lg text-on-surface-variant">
                        {fmt(pago.fecha)} — {pago.medio_pago ?? 'Sin especificar'}
                      </span>
                    </div>
                    {pago.persona && (
                      <span className="text-body-md text-on-surface-variant text-right">
                        {pago.persona.nombre} {pago.persona.apellido}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </Section>
          )}
        </div>
      )}
    </ViewModal>
  );
}
