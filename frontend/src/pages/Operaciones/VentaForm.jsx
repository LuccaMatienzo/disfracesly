import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios.instance';
import { useCreateVenta } from '@/hooks/useOperaciones';
import { useToast } from '@/hooks/useToast';
import { useFeedback } from '@/context/FeedbackContext';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Select } from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import ToastContainer from '@/components/ui/Toast';
import { useState } from 'react';

const handlePositiveNumbersOnly = (e) => {
  if (['-', '+', 'e', 'E'].includes(e.key)) {
    e.preventDefault();
  }
};

export default function VentaForm() {
  const navigate = useNavigate();
  const createVenta = useCreateVenta();
  const toast = useToast();
  const { showSuccess, showError } = useFeedback();
  const [stockSearch, setStockSearch] = useState('');

  const { data: clientesData } = useQuery({
    queryKey: ['clientes-all'],
    queryFn: () => api.get('/clientes', { params: { limit: 200 } }).then((r) => r.data),
  });

  const { data: stockData } = useQuery({
    queryKey: ['stock-disponible', stockSearch],
    queryFn: () =>
      api.get('/stock', { params: { estado: 'DISPONIBLE', search: stockSearch, limit: 30 } }).then((r) => r.data),
  });

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm({
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
      showSuccess('La operación se registró correctamente.', () => {
        navigate('/admin/operaciones');
      });
    } catch (err) {
      const msg = err?.response?.data?.details?.[0]?.message ?? err?.response?.data?.error ?? 'Ocurrió un error al crear la venta.';
      showError(msg);
    }
  };

  const clientes = clientesData?.data ?? [];
  const stockItems = stockData?.data ?? [];

  return (
    <>
      <ToastContainer toasts={toast.toasts} onRemove={toast.remove} />

      <div className="max-w-3xl">
        <div className="mb-6">
          <button onClick={() => navigate(-1)} className="text-body-md text-primary hover:underline font-label mb-2">← Volver</button>
          <h1 className="font-display text-headline-md font-semibold text-on-surface">Nueva venta</h1>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
          <div className="bg-surface-container-lowest rounded-2xl shadow-card p-5">
            <h2 className="font-headline text-title-md text-on-surface mb-4">Cliente</h2>
            <Select label="Cliente" error={errors.id_cliente?.message} {...register('id_cliente', { required: 'Seleccioná un cliente' })}>
              <option value="">Seleccionar cliente…</option>
              {clientes.map((c) => (
                <option key={c.id_cliente} value={c.id_cliente}>{c.persona?.nombre} {c.persona?.apellido} — {c.persona?.documento}</option>
              ))}
            </Select>
          </div>

          <div className="bg-surface-container-lowest rounded-2xl shadow-card p-5">
            <h2 className="font-headline text-title-md text-on-surface mb-4">Piezas disponibles</h2>
            <Input placeholder="Buscar pieza…" value={stockSearch} onChange={(e) => setStockSearch(e.target.value)} className="mb-4" />
            
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
              <Input 
                label="Monto total ($)" 
                type="number" 
                min="0" 
                step="0.01" 
                error={errors.monto_total?.message}
                onKeyDown={handlePositiveNumbersOnly}
                {...register('monto_total', {
                  validate: (val) => parseFloat(val) >= parseFloat(watch('sena_monto') || 0) || 'El monto total no puede ser menor que la seña'
                })} 
              />
              <Input 
                label="Seña ($)" 
                type="number" 
                min="0" 
                step="0.01" 
                error={errors.sena_monto?.message}
                onKeyDown={handlePositiveNumbersOnly}
                {...register('sena_monto', {
                  validate: (val) => parseFloat(val) <= parseFloat(watch('monto_total') || 0) || 'La seña no puede superar el monto total'
                })} 
              />
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
