import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
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
import ClienteCombobox from '@/components/ui/ClienteCombobox';

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

  const { data: stockData } = useQuery({
    queryKey: ['stock-disponible', stockSearch],
    queryFn: () =>
      api.get('/stock', { params: { estado: 'DISPONIBLE', search: stockSearch, limit: 30 } }).then((r) => r.data),
  });

  const { register, control, handleSubmit, watch, formState: { errors, isSubmitting, isValid } } = useForm({
    mode: 'onChange',
    defaultValues: { id_cliente: '', sena_monto: 0, monto_total: 0, fecha_retiro: '', especificaciones_medidas: '', observaciones: '' },
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
        ...(data.fecha_retiro ? { fecha_retiro: new Date(data.fecha_retiro).toISOString() } : {}),
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

  const stockItems = stockData?.data ?? [];

  return (
    <>
      <ToastContainer toasts={toast.toasts} onRemove={toast.remove} />

      <div className="w-full">
        <div className="mb-6">
          <button onClick={() => navigate(-1)} className="text-body-md text-primary hover:underline font-label mb-2">← Volver</button>
          <h1 className="font-display text-headline-md font-semibold text-on-surface">Nueva venta</h1>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Columna Izquierda (Cliente y Piezas) */}
          <div className="xl:col-span-2 flex flex-col gap-6">
            <div className="bg-surface-container-lowest rounded-2xl shadow-card p-5">
              <h2 className="font-headline text-title-md text-on-surface mb-4">Cliente</h2>
              <Controller
                name="id_cliente"
                control={control}
                rules={{ required: 'Seleccioná un cliente' }}
                render={({ field: { onChange, value }, fieldState: { error } }) => (
                  <ClienteCombobox value={value} onChange={onChange} error={error?.message} />
                )}
              />
            </div>

            <div className="bg-surface-container-lowest rounded-2xl shadow-card p-5 flex flex-col h-full">
              <h2 className="font-headline text-title-md text-on-surface mb-4">Piezas disponibles</h2>
              <Input placeholder="Buscar pieza…" value={stockSearch} onChange={(e) => setStockSearch(e.target.value)} className="mb-4" />
              
              {selectedPiezas.size > 0 && (
                <div className="mb-3 flex gap-2 flex-wrap">
                  <span className="text-label-lg text-on-surface-variant flex items-center">Seleccionadas:</span>
                  {[...selectedPiezas.values()].map((pieza) => (
                    <button
                      key={pieza.id_pieza_stock}
                      type="button"
                      onClick={() => togglePieza(pieza)}
                      className="bg-primary/10 text-primary text-label-lg rounded-pill px-3 py-1 hover:bg-error/10 hover:text-error transition-colors flex items-center gap-1"
                    >
                      {pieza.pieza?.nombre ?? `#${pieza.id_pieza_stock}`}
                      {pieza.talle ? ` (${pieza.talle})` : ''} ✕
                    </button>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2 2xl:grid-cols-3 gap-3 overflow-y-auto pr-1" style={{ maxHeight: '400px' }}>
                {stockItems.map((s) => (
                  <button key={s.id_pieza_stock} type="button" onClick={() => togglePieza(s)}
                    className={`flex flex-col items-start gap-2 p-3 rounded-xl border-2 text-left transition-all ${selectedPiezas.has(s.id_pieza_stock) ? 'border-primary bg-primary/5 shadow-sm' : 'border-divider hover:border-primary/30 hover:bg-surface-container-low'}`}
                  >
                    <div className="flex justify-between items-start w-full">
                      <div className="flex-1 min-w-0 pr-2">
                        <p className="text-body-md font-medium text-on-surface truncate">{s.pieza?.nombre}</p>
                        <p className="text-label-lg text-on-surface-variant truncate">{s.talle ?? 'Sin talle'}</p>
                      </div>
                      <Badge value={s.estado_pieza_stock} />
                    </div>
                  </button>
                ))}
              </div>
              {selectedPiezas.size === 0 && (
                <p className="text-label-lg text-error mt-4 font-medium flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">error</span> Seleccioná al menos una pieza
                </p>
              )}
            </div>
          </div>

          {/* Columna Derecha (Detalles y Acciones) */}
          <div className="xl:col-span-1 flex flex-col gap-6">
            <div className="bg-surface-container-lowest rounded-2xl shadow-card p-5">
              <h2 className="font-headline text-title-md text-on-surface mb-4">Detalles de la venta</h2>
              <div className="flex flex-col gap-4">
                <Input
                  label="Fecha de entrega"
                  type="datetime-local"
                  error={errors.fecha_retiro?.message}
                  {...register('fecha_retiro')}
                />
                <Input 
                  label="Monto total ($)" 
                  type="number" 
                  min="0" 
                  step="1" 
                  error={errors.monto_total?.message}
                  onKeyDown={handlePositiveNumbersOnly}
                  {...register('monto_total', {
                    required: 'El monto total es obligatorio',
                    min: { value: 0, message: 'El monto no puede ser negativo' },
                    validate: (val) => parseFloat(val) >= parseFloat(watch('sena_monto') || 0) || 'El monto total no puede ser menor que la seña'
                  })} 
                />
                <Input 
                  label="Seña ($)" 
                  type="number" 
                  min="0" 
                  step="1" 
                  error={errors.sena_monto?.message}
                  onKeyDown={handlePositiveNumbersOnly}
                  {...register('sena_monto', {
                    required: 'La seña es obligatoria (puede ser 0)',
                    min: { value: 0, message: 'La seña no puede ser negativa' },
                    validate: (val) => parseFloat(val) <= parseFloat(watch('monto_total') || 0) || 'La seña no puede superar el monto total'
                  })} 
                />
                <Input label="Especificaciones de medidas" placeholder="Ej: 90cm busto, 70cm cintura" {...register('especificaciones_medidas')} />
                <Input label="Observaciones" {...register('observaciones')} />
              </div>
            </div>

            {/* Acciones */}
            <div className="bg-surface-container-lowest rounded-2xl shadow-card p-5 flex flex-col sm:flex-row xl:flex-col gap-3">
              <Button type="submit" variant="primary" className="w-full justify-center" loading={isSubmitting} disabled={!isValid || selectedPiezas.size === 0 || isSubmitting}>
                <span className="material-symbols-outlined mr-2">check_circle</span>
                Confirmar venta
              </Button>
              <Button type="button" variant="secondary" className="w-full justify-center" onClick={() => navigate(-1)}>
                Cancelar
              </Button>
            </div>
          </div>
        </form>
      </div>
    </>
  );
}
