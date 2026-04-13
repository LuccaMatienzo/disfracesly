import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios.instance';
import { usePagination } from '@/hooks/usePagination';
import Table, { Pagination } from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function ClientesList() {
  const { page, limit, goToPage, reset } = usePagination();
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['clientes', { page, limit, search }],
    queryFn: () => api.get('/clientes', { params: { page, limit, search: search || undefined } }).then((r) => r.data),
  });

  const columns = [
    { key: 'id_cliente', label: '#', width: '60px' },
    { key: 'persona', label: 'Nombre', render: (_, r) => `${r.persona?.nombre} ${r.persona?.apellido}` },
    { key: 'documento', label: 'Documento', render: (_, r) => r.persona?.documento ?? '—' },
    { key: 'telefono', label: 'Teléfono' },
    { key: 'fecha_alta', label: 'Alta', render: (v) => new Date(v).toLocaleDateString('es-AR') },
    {
      key: 'acciones', label: '', width: '100px',
      render: (_, r) => (
        <Link to={`/clientes/${r.id_cliente}/editar`}><Button variant="ghost" size="sm">Editar</Button></Link>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-headline-md font-bold text-on-surface">Clientes</h1>
          <p className="text-body-md text-on-surface-variant mt-0.5">Registro de clientes activos</p>
        </div>
        <Link to="/clientes/nuevo"><Button>+ Nuevo cliente</Button></Link>
      </div>
      <div className="bg-surface-container-lowest rounded-2xl shadow-card p-5">
        <Input
          placeholder="Buscar por nombre o documento..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); reset(); }}
          className="max-w-sm"
        />
      </div>
      <div className="bg-surface-container-lowest rounded-2xl shadow-card overflow-hidden">
        <Table columns={columns} data={data?.data} loading={isLoading} emptyMessage="Sin clientes" />
        <div className="px-4 pb-4">
          <Pagination meta={data?.meta} page={page} onPageChange={goToPage} />
        </div>
      </div>
    </div>
  );
}
