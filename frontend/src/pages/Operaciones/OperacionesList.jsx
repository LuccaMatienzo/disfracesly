import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useOperaciones } from '@/hooks/useOperaciones';
import { usePagination } from '@/hooks/usePagination';
import Table, { Pagination } from '@/components/ui/Table';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { Select } from '@/components/ui/Input';

export default function OperacionesList() {
  const { page, limit, goToPage, reset } = usePagination();
  const [tipo, setTipo] = useState('');

  const { data, isLoading } = useOperaciones({ page, limit, tipo: tipo || undefined });

  const columns = [
    { key: 'id_operacion', label: '#', width: '60px' },
    {
      key: 'cliente',
      label: 'Cliente',
      render: (_, r) => `${r.cliente?.persona?.nombre ?? ''} ${r.cliente?.persona?.apellido ?? ''}`,
    },
    {
      key: 'tipo',
      label: 'Tipo',
      render: (_, r) => (
        <span className={`font-label font-semibold text-body-md ${r.alquiler ? 'text-primary' : 'text-secondary'}`}>
          {r.alquiler ? 'Alquiler' : 'Venta'}
        </span>
      ),
    },
    {
      key: 'etapa',
      label: 'Etapa',
      render: (_, r) => {
        const etapa = r.alquiler?.etapa ?? r.venta?.etapa;
        return etapa ? <Badge value={etapa} /> : '—';
      },
    },
    {
      key: 'monto_total',
      label: 'Monto',
      render: (v) => `$${parseFloat(v).toLocaleString('es-AR')}`,
    },
    {
      key: 'fecha_constitucion',
      label: 'Fecha',
      render: (v) => new Date(v).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: '2-digit' }),
    },
    {
      key: 'acciones',
      label: '',
      width: '80px',
      render: (_, r) => (
        <Link to={`/operaciones/${r.id_operacion}`}>
          <Button variant="ghost" size="sm">Ver</Button>
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-headline-md font-bold text-on-surface">Operaciones</h1>
          <p className="text-body-md text-on-surface-variant mt-0.5">
            Alquileres y ventas del sistema
          </p>
        </div>
        <div className="flex gap-3">
          <Link to="/operaciones/alquiler/nuevo">
            <Button variant="outline">+ Alquiler</Button>
          </Link>
          <Link to="/operaciones/venta/nuevo">
            <Button variant="secondary">+ Venta</Button>
          </Link>
        </div>
      </div>

      {/* Filtro */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-card p-5">
        <Select value={tipo} onChange={(e) => { setTipo(e.target.value); reset(); }} className="max-w-xs">
          <option value="">Todos los tipos</option>
          <option value="alquiler">Solo alquileres</option>
          <option value="venta">Solo ventas</option>
        </Select>
      </div>

      {/* Tabla */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-card overflow-hidden">
        <Table columns={columns} data={data?.data} loading={isLoading} emptyMessage="Sin operaciones" />
        <div className="px-4 pb-4">
          <Pagination meta={data?.meta} page={page} onPageChange={goToPage} />
        </div>
      </div>
    </div>
  );
}
