import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStock } from '@/hooks/useStock';
import { usePagination } from '@/hooks/usePagination';
import Table, { Pagination } from '@/components/ui/Table';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Select } from '@/components/ui/Input';

const ESTADOS = ['', 'DISPONIBLE', 'RESERVADA', 'ALQUILADA', 'VENDIDA', 'FUERA_DE_SERVICIO'];

export default function StockList() {
  const { page, limit, goToPage, reset } = usePagination();
  const [search, setSearch] = useState('');
  const [estado, setEstado] = useState('');

  const { data, isLoading } = useStock({ page, limit, search: search || undefined, estado: estado || undefined });

  const columns = [
    { key: 'id_pieza_stock', label: '#', width: '60px' },
    { key: 'pieza', label: 'Pieza', render: (_, r) => r.pieza?.nombre ?? '—' },
    { key: 'talle', label: 'Talle', render: (v) => v ?? '—' },
    {
      key: 'estado_pieza_stock',
      label: 'Estado',
      render: (v) => <Badge value={v} />,
    },
    { key: 'descripcion', label: 'Descripción', render: (v) => v ?? '—' },
    {
      key: 'acciones',
      label: '',
      width: '100px',
      render: (_, r) => (
        <Link to={`/stock/${r.id_pieza_stock}/editar`}>
          <Button variant="ghost" size="sm">Editar</Button>
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-headline-md font-bold text-on-surface">Inventario</h1>
          <p className="text-body-md text-on-surface-variant mt-0.5">
            Gestión de piezas individuales de stock
          </p>
        </div>
        <Link to="/stock/nuevo">
          <Button>+ Agregar pieza</Button>
        </Link>
      </div>

      {/* Filtros */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-card p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            placeholder="Buscar por nombre de pieza..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); reset(); }}
          />
          <Select
            value={estado}
            onChange={(e) => { setEstado(e.target.value); reset(); }}
          >
            {ESTADOS.map((e) => (
              <option key={e} value={e}>{e || 'Todos los estados'}</option>
            ))}
          </Select>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-card overflow-hidden">
        <Table
          columns={columns}
          data={data?.data}
          loading={isLoading}
          emptyMessage="Sin piezas de stock que coincidan con la búsqueda"
        />
        <div className="px-4 pb-4">
          <Pagination meta={data?.meta} page={page} onPageChange={goToPage} />
        </div>
      </div>
    </div>
  );
}
