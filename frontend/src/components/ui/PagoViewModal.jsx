import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios.instance';
import ViewModal, { Field, Section } from '@/components/ui/ViewModal';
import Badge from '@/components/ui/Badge';

export default function PagoViewModal({ id, open, onClose }) {
  const { data, isLoading } = useQuery({
    queryKey: ['pagos', id, 'detail'],
    queryFn: () => api.get(`/pagos/${id}`).then((r) => r.data),
    enabled: open && !!id,
    staleTime: 30_000,
  });

  return (
    <ViewModal
      open={open}
      onClose={onClose}
      title="Detalle del Pago"
      loading={isLoading}
    >
      {data && (
        <div className="flex flex-col gap-6">
          <Section title="Información General">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
              <Field label="ID" value={`#${data.id_pago_operacion}`} />
              <Field label="Fecha" value={new Date(data.fecha).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })} />
              <Field label="Tipo" value={<Badge value={data.tipo} />} />
              <Field label="Método" value={<Badge value={data.metodo} />} />
              <Field 
                label="Monto" 
                value={`$${Math.abs(Number(data.monto)).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`} 
                className={(data.tipo === 'DEVOLUCION_DEPOSITO' || (data.tipo === 'AJUSTE' && Number(data.monto) < 0)) ? 'text-error font-semibold' : 'text-success font-semibold'}
              />
              <Field label="Registrado por" value={data.persona ? `${data.persona.nombre} ${data.persona.apellido}`.trim() : '—'} />
            </div>
          </Section>
          
          {data.operacion && (
            <Section title="Operación Asociada">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                <Field label="ID Operación" value={`#${data.id_operacion}`} />
                <Field label="Cliente" value={data.operacion.cliente?.persona ? `${data.operacion.cliente.persona.nombre} ${data.operacion.cliente.persona.apellido}`.trim() : '—'} />
              </div>
            </Section>
          )}

          {data.observaciones && (
            <Section title="Observaciones">
              <p className="text-body-md text-on-surface">{data.observaciones}</p>
            </Section>
          )}
        </div>
      )}
    </ViewModal>
  );
}
