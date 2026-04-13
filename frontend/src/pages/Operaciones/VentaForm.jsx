// VentaForm.jsx — igual estructura que AlquilerForm pero para ventas
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios.instance';
import { useCreateVenta } from '@/hooks/useOperaciones';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Select } from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import { useState } from 'react';

export default function VentaForm() {
  const navigate = useNavigate();
  const createVenta = useCreateVenta();
  const [stockSearch, setStockSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);

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

  const togglePieza = (id) =>
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);

  const onSubmit = async (data) => {
    await createVenta.mutateAsync({
      ...data,
      id_cliente: Number(data.id_cliente),
      pieza_stock_ids: selectedIds,
      sena_monto: Number(data.sena_monto),
      monto_total: Number(data.monto_total),
    });
    navigate('/operaciones');
  };

  const clientes = clientesData?.data ?? [];
  const stockItems = stockData?.data ?? [];

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <button onClick={() => navigate(-1)} className="text-body-md text-secondary hover:underline font-label mb-2">← Volver</button>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto">
            {stockItems.map((s) => (
              <button key={s.id_pieza_stock} type="button" onClick={() => togglePieza(s.id_pieza_stock)}
                className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${selectedIds.includes(s.id_pieza_stock) ? 'border-secondary bg-secondary/5' : 'border-outline-variant/20 hover:border-secondary/30'}`}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-body-md font-medium text-on-surface truncate">{s.pieza?.nombre}</p>
                  <p className="text-label-lg text-on-surface-variant">{s.talle ?? 'Sin talle'}</p>
                </div>
                <Badge value={s.estado_pieza_stock} />
              </button>
            ))}
          </div>
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
          <Button type="submit" variant="primary" loading={isSubmitting} disabled={selectedIds.length === 0}>Crear venta</Button>
        </div>
      </form>
    </div>
  );
}
