import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios.instance';
import { usePagination } from '@/hooks/usePagination';
import Table, { Pagination } from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function CatalogoList() {
  const { page, limit, goToPage, reset } = usePagination();
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('piezas');

  const { data: piezas, isLoading: loadingPiezas } = useQuery({
    queryKey: ['piezas', { page, limit, search }],
    queryFn: () => api.get('/catalogo/piezas', { params: { page, limit, search: search || undefined } }).then((r) => r.data),
    enabled: tab === 'piezas',
  });

  const { data: disfraces, isLoading: loadingDisfraces } = useQuery({
    queryKey: ['disfraces', { page, limit, search }],
    queryFn: () => api.get('/catalogo/disfraces', { params: { page, limit, search: search || undefined } }).then((r) => r.data),
    enabled: tab === 'disfraces',
  });

  const piezasCols = [
    { key: 'id_pieza', label: '#', width: '60px' },
    { key: 'nombre', label: 'Nombre' },
    { key: 'descripcion', label: 'Descripción', render: (v) => v ?? '—' },
    { key: 'categorias', label: 'Categorías', render: (_, r) => r.categorias?.map?.((c) => c.categoriaMotivo?.nombre).join(', ') || '—' },
    {
      key: 'stock', label: 'Stock', width: '80px',
      render: (_, r) => <span className="font-label font-bold text-primary">{r.stocks?.length ?? 0}</span>,
    },
    {
      key: 'acciones', label: '', width: '100px',
      render: (_, r) => (
        <Link to={`/admin/catalogo/piezas/${r.id_pieza}/editar`}><Button variant="ghost" size="sm">Editar</Button></Link>
      ),
    },
  ];

  const activeData = tab === 'piezas' ? piezas : disfraces;
  const activeLoading = tab === 'piezas' ? loadingPiezas : loadingDisfraces;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-headline-md font-bold text-on-surface">Catálogo</h1>
          <p className="text-body-md text-on-surface-variant mt-0.5">Piezas y disfraces del sistema</p>
        </div>
        {tab === 'piezas' && (
          <Link to="/admin/catalogo/piezas/nueva"><Button>+ Nueva pieza</Button></Link>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-outline-variant/20">
        {['piezas', 'disfraces'].map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); reset(); }}
            className={`px-4 py-2.5 text-body-md font-label font-medium capitalize transition-all border-b-2 -mb-px ${
              tab === t ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="bg-surface-container-lowest rounded-2xl shadow-card p-5">
        <Input
          placeholder={`Buscar ${tab}...`}
          value={search}
          onChange={(e) => { setSearch(e.target.value); reset(); }}
          className="max-w-sm"
        />
      </div>

      <div className="bg-surface-container-lowest rounded-2xl shadow-card overflow-hidden">
        <Table
          columns={piezasCols}
          data={activeData?.data}
          loading={activeLoading}
          emptyMessage={`Sin ${tab}`}
        />
        <div className="px-4 pb-4">
          <Pagination meta={activeData?.meta} page={page} onPageChange={goToPage} />
        </div>
      </div>
    </div>
  );
}
