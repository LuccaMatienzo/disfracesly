import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios.instance';
import { useCreateVenta } from '@/hooks/useOperaciones';
import { useToast } from '@/hooks/useToast';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Select } from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import ToastContainer from '@/components/ui/Toast';
import { useState } from 'react';

/* ─── Modal de éxito ────────────────────────────────────────────────── */
function SuccessModal({ open }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/30 backdrop-blur-sm animate-fade-in">
      <div className="glass border border-outline-variant/20 rounded-2xl shadow-float w-full max-w-sm p-8 flex flex-col items-center gap-5 animate-scale-in">
        {/* Círculo animado con tilde */}
        <div className="relative flex items-center justify-center">
          <svg className="w-24 h-24" viewBox="0 0 96 96" fill="none">
            {/* Círculo exterior */}
            <circle
              cx="48" cy="48" r="44"
              stroke="var(--color-primary)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray="276"
              strokeDashoffset="0"
              style={{ animation: 'dash-circle 0.6s ease-out forwards' }}
            />
            {/* Tilde */}
            <path
              d="M28 50 L42 64 L68 36"
              stroke="var(--color-primary)"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="60"
              strokeDashoffset="60"
              style={{ animation: 'dash-check 0.4s 0.5s ease-out forwards' }}
            />
          </svg>
        </div>
        <div className="text-center">
          <h2 className="font-display text-headline-md font-bold text-on-surface">¡Venta creada!</h2>
          <p className="text-body-md text-on-surface-variant mt-1">La operación se registró correctamente.</p>
        </div>
        <div className="text-label-lg text-on-surface-variant animate-pulse">Redirigiendo...</div>
      </div>

      <style>{`
        @keyframes dash-circle {
          from { stroke-dashoffset: 276; }
          to   { stroke-dashoffset: 0; }
        }
        @keyframes dash-check {
          from { stroke-dashoffset: 60; }
          to   { stroke-dashoffset: 0; }
        }
      `}</style>
    </div>
  );
}

export default function VentaForm() {
  const navigate = useNavigate();
  const createVenta = useCreateVenta();
  const toast = useToast();
  const [stockSearch, setStockSearch] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const { data: clientesData } = useQuery({
    queryKey: ['clientes-all'],
    queryFn: () => api.get('/clientes', { params: { limit: 200 } }).then((r) => r.data),
  });

  const { data: stockData } = useQuery({
    queryKey: ['stock-disponible', stockSearch],
    queryFn: () =>
      api.get('/stock', { params: { estado: 'DISPONIBLE', search: stockSearch, limit: 30 } }).then((r) => r.data),
  });

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { id_cliente: '', sena_monto: 0, monto_total: 0, especificaciones_medidas: '', observaciones: '' },
  });

  // Mapa de piezas seleccionadas: id → objeto pieza completo
  const [selectedPiezas, setSelectedPiezas] = useState(new Map());

  const togglePieza = (pieza) => {
    const id = pieza.id_pieza_stock;
    setSelectedPiezas((prev) => {
      const next = new Map(prev);
      next.has(id) ? next.delete(id) : next.set(id, pieza);
      return next;
    });
  };

  const onSubmit = async (data) => {
    if (selectedPiezas.size === 0) {
      toast.error('Seleccioná al menos una pieza antes de continuar.');
      return;
    }

    try {
      await createVenta.mutateAsync({
        ...data,
        id_cliente: Number(data.id_cliente),
        pieza_stock_ids: [...selectedPiezas.keys()].map(Number),
        sena_monto: Number(data.sena_monto),
        monto_total: Number(data.monto_total),
        especificaciones_medidas: data.especificaciones_medidas || undefined,
        observaciones: data.observaciones || undefined,
      });

      // Mostrar modal de éxito y redirigir
      setShowSuccess(true);
      setTimeout(() => navigate('/admin/operaciones'), 1800);
    } catch (err) {
      const msg = err?.response?.data?.details?.[0]?.message ?? err?.response?.data?.error ?? 'Ocurrió un error al crear la venta.';
      toast.error(msg, 'No se pudo crear la venta');
    }
  };

  const clientes = clientesData?.data ?? [];
  const stockItems = stockData?.data ?? [];

  return (
    <>
      <SuccessModal open={showSuccess} />
      <ToastContainer toasts={toast.toasts} onRemove={toast.remove} />

      <div className="max-w-3xl">
        <div className="mb-6">
          <button onClick={() => navigate(-1)} className="text-body-md text-primary hover:underline font-label mb-2">← Volver</button>
          <h1 className="font-display text-headline-md font-bold text-on-surface">Nueva venta</h1>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
          <div className="bg-surface-container-lowest rounded-2xl shadow-card p-5">
            <h2 className="font-headline text-title-md text-on-surface mb-4">Cliente</h2>
            <Select label="Cliente" error={errors.id_cliente?.message} {...register('id_cliente', { required: 'Seleccioná un cliente' })}>
              <option value="">Seleccionar cliente...</option>
              {clientes.map((c) => (
                <option key={c.id_cliente} value={c.id_cliente}>{c.persona?.nombre} {c.persona?.apellido} — {c.persona?.documento}</option>
              ))}
            </Select>
          </div>

          <div className="bg-surface-container-lowest rounded-2xl shadow-card p-5">
            <h2 className="font-headline text-title-md text-on-surface mb-4">Piezas disponibles</h2>
            <Input placeholder="Buscar pieza..." value={stockSearch} onChange={(e) => setStockSearch(e.target.value)} className="mb-4" />
            
            {selectedPiezas.size > 0 && (
              <div className="mb-3 flex gap-2 flex-wrap">
                <span className="text-label-lg text-on-surface-variant">Seleccionadas:</span>
                {[...selectedPiezas.values()].map((pieza) => (
                  <button
                    key={pieza.id_pieza_stock}
                    type="button"
                    onClick={() => togglePieza(pieza)}
                    className="bg-primary/10 text-primary text-label-lg rounded-pill px-3 py-1 hover:bg-error/10 hover:text-error transition-colors"
                  >
                    {pieza.pieza?.nombre ?? `#${pieza.id_pieza_stock}`}
                    {pieza.talle ? ` (${pieza.talle})` : ''} ✕
                  </button>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto">
              {stockItems.map((s) => (
                <button key={s.id_pieza_stock} type="button" onClick={() => togglePieza(s)}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${selectedPiezas.has(s.id_pieza_stock) ? 'border-primary bg-primary/5' : 'border-outline-variant/20 hover:border-primary/30'}`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-body-md font-medium text-on-surface truncate">{s.pieza?.nombre}</p>
                    <p className="text-label-lg text-on-surface-variant">{s.talle ?? 'Sin talle'}</p>
                  </div>
                  <Badge value={s.estado_pieza_stock} />
                </button>
              ))}
            </div>
            {selectedPiezas.size === 0 && (
              <p className="text-label-lg text-error mt-2">Seleccioná al menos una pieza</p>
            )}
          </div>

          <div className="bg-surface-container-lowest rounded-2xl shadow-card p-5">
            <h2 className="font-headline text-title-md text-on-surface mb-4">Detalles de la venta</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Monto total ($)" type="number" min="0" step="0.01" {...register('monto_total')} />
              <Input label="Seña ($)" type="number" min="0" step="0.01" {...register('sena_monto')} />
              <Input label="Especificaciones de medidas" placeholder="Ej: 90cm busto, 70cm cintura" {...register('especificaciones_medidas')} className="col-span-2" />
              <Input label="Observaciones" {...register('observaciones')} className="col-span-2" />
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <Button type="button" variant="secondary" onClick={() => navigate(-1)}>Cancelar</Button>
            <Button type="submit" variant="primary" loading={isSubmitting} disabled={selectedPiezas.size === 0 || isSubmitting}>Crear venta</Button>
          </div>
        </form>
      </div>
    </>
  );
}
