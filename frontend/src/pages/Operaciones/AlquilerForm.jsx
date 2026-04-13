import { useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios.instance';
import { useCreateAlquiler } from '@/hooks/useOperaciones';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Select } from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import { useState } from 'react';

export default function AlquilerForm() {
  const navigate = useNavigate();
  const createAlquiler = useCreateAlquiler();
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

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      id_cliente: '',
      pieza_stock_ids: [],
      deposito_monto: 0,
      monto_total: 0,
      fecha_devolucion: '',
      observaciones: '',
    },
  });

  // Selección manual de piezas (sin useFieldArray para simplificar)
  const [selectedIds, setSelectedIds] = useState([]);

  const togglePieza = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const onSubmit = async (data) => {
    await createAlquiler.mutateAsync({
      ...data,
      id_cliente: Number(data.id_cliente),
      pieza_stock_ids: selectedIds,
      deposito_monto: Number(data.deposito_monto),
      monto_total: Number(data.monto_total),
    });
    navigate('/operaciones');
  };

  const clientes = clientesData?.data ?? [];
  const stockItems = stockData?.data ?? [];

  return (
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
                const item = stockItems.find((s) => s.id_pieza_stock === id) ??
                  stockData?.data?.find((s) => String(s.id_pieza_stock) === String(id));
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
          <Button type="submit" loading={isSubmitting} disabled={selectedIds.length === 0}>
            Crear alquiler
          </Button>
        </div>
      </form>
    </div>
  );
}
