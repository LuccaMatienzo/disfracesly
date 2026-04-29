import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios.instance';
import { useCreateAlquiler } from '@/hooks/useOperaciones';
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
          <h2 className="font-display text-headline-md font-bold text-on-surface">¡Alquiler creado!</h2>
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

/* ─── Formulario principal ──────────────────────────────────────────── */
export default function AlquilerForm() {
  const navigate = useNavigate();
  const createAlquiler = useCreateAlquiler();
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

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      id_cliente: '',
      deposito_monto: 0,
      monto_total: 0,
      fecha_devolucion: '',
      observaciones: '',
    },
  });

  // Selección manual de piezas
  const [selectedIds, setSelectedIds] = useState([]);

  const togglePieza = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const onSubmit = async (data) => {
    if (selectedIds.length === 0) {
      toast.error('Seleccioná al menos una pieza antes de continuar.');
      return;
    }

    // Convertir datetime-local a ISO 8601 con timezone (lo que exige el backend)
    let fechaISO = undefined;
    if (data.fecha_devolucion) {
      const d = new Date(data.fecha_devolucion);
      if (!isNaN(d.getTime())) {
        fechaISO = d.toISOString(); // → "2026-04-30T16:39:00.000Z"
      }
    }

    try {
      await createAlquiler.mutateAsync({
        id_cliente: Number(data.id_cliente),
        pieza_stock_ids: selectedIds.map(Number),   // BigInt → string en JSON, forzar a number
        deposito_monto: Number(data.deposito_monto),
        monto_total: Number(data.monto_total),
        fecha_devolucion: fechaISO,
        observaciones: data.observaciones || undefined,
      });

      // Mostrar modal de éxito y redirigir tras 1.8 s
      setShowSuccess(true);
      setTimeout(() => navigate('/admin/operaciones'), 1800);
    } catch (err) {
      const msg =
        err?.response?.data?.details?.[0]?.message ??
        err?.response?.data?.error ??
        'Ocurrió un error al crear el alquiler.';
      toast.error(msg, 'No se pudo crear el alquiler');
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
          <button onClick={() => navigate(-1)} className="text-body-md text-primary hover:underline font-label mb-2">
            ← Volver
          </button>
          <h1 className="font-display text-headline-md font-bold text-on-surface">Nuevo alquiler</h1>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
          {/* Cliente */}
          <div className="bg-surface-container-lowest rounded-2xl shadow-card p-5">
            <h2 className="font-headline text-title-md text-on-surface mb-4">Cliente</h2>
            <Select
              label="Cliente"
              error={errors.id_cliente?.message}
              {...register('id_cliente', { required: 'Seleccioná un cliente' })}
            >
              <option value="">Seleccionar cliente...</option>
              {clientes.map((c) => (
                <option key={c.id_cliente} value={c.id_cliente}>
                  {c.persona?.nombre} {c.persona?.apellido} — {c.persona?.documento}
                </option>
              ))}
            </Select>
          </div>

          {/* Piezas */}
          <div className="bg-surface-container-lowest rounded-2xl shadow-card p-5">
            <h2 className="font-headline text-title-md text-on-surface mb-4">Piezas disponibles</h2>
            <Input
              placeholder="Buscar pieza..."
              value={stockSearch}
              onChange={(e) => setStockSearch(e.target.value)}
              className="mb-4"
            />
            {selectedIds.length > 0 && (
              <div className="mb-3 flex gap-2 flex-wrap">
                <span className="text-label-lg text-on-surface-variant">Seleccionadas:</span>
                {selectedIds.map((id) => {
                  const item = stockItems.find((s) => s.id_pieza_stock === id);
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => togglePieza(id)}
                      className="bg-primary/10 text-primary text-label-lg rounded-pill px-3 py-1 hover:bg-error/10 hover:text-error transition-colors"
                    >
                      {item?.pieza?.nombre ?? `#${id}`} ✕
                    </button>
                  );
                })}
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto">
              {stockItems.map((s) => (
                <button
                  key={s.id_pieza_stock}
                  type="button"
                  onClick={() => togglePieza(s.id_pieza_stock)}
                  className={`
                    flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all
                    ${selectedIds.includes(s.id_pieza_stock)
                      ? 'border-primary bg-primary/5'
                      : 'border-outline-variant/20 hover:border-primary/30'
                    }
                  `}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-body-md font-medium text-on-surface truncate">{s.pieza?.nombre}</p>
                    <p className="text-label-lg text-on-surface-variant">{s.talle ?? 'Sin talle'}</p>
                  </div>
                  <Badge value={s.estado_pieza_stock} />
                </button>
              ))}
            </div>
            {selectedIds.length === 0 && (
              <p className="text-label-lg text-error mt-2">Seleccioná al menos una pieza</p>
            )}
          </div>

          {/* Montos y fechas */}
          <div className="bg-surface-container-lowest rounded-2xl shadow-card p-5">
            <h2 className="font-headline text-title-md text-on-surface mb-4">Detalles del alquiler</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Monto total ($)"
                type="number"
                min="0"
                step="0.01"
                {...register('monto_total')}
              />
              <Input
                label="Depósito ($)"
                type="number"
                min="0"
                step="0.01"
                {...register('deposito_monto')}
              />
              <Input
                label="Fecha de devolución"
                type="datetime-local"
                {...register('fecha_devolucion')}
                className="col-span-2 sm:col-span-1"
              />
            </div>
            <div className="mt-4">
              <Input
                label="Observaciones"
                placeholder="Notas adicionales..."
                {...register('observaciones')}
              />
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <Button type="button" variant="secondary" onClick={() => navigate(-1)}>Cancelar</Button>
            <Button type="submit" loading={isSubmitting} disabled={selectedIds.length === 0 || isSubmitting}>
              Crear alquiler
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}
