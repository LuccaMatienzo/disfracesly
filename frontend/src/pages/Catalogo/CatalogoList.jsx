import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/api/axios.instance';
import { usePagination } from '@/hooks/usePagination';
import { useToast } from '@/hooks/useToast';
import Table, { Pagination } from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import ActionButtons from '@/components/ui/ActionButtons';
import ConfirmDeleteModal from '@/components/ui/ConfirmDeleteModal';
import PiezaViewModal from '@/components/ui/PiezaViewModal';
import ToastContainer from '@/components/ui/Toast';

export default function CatalogoList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { page, limit, goToPage, reset } = usePagination();
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('piezas');
  const { toasts, success, error, remove } = useToast();

  const [deleteTarget, setDeleteTarget] = useState(null); // { id, nombre, tipo }
  const [viewId, setViewId] = useState(null);             // id de pieza en modal Ver

  // ─── Queries ──────────────────────────────────────────────────────────────
  const { data: piezas, isLoading: loadingPiezas } = useQuery({
    queryKey: ['piezas', { page, limit, search }],
    queryFn: () =>
      api.get('/catalogo/piezas', { params: { page, limit, search: search || undefined } }).then((r) => r.data),
    enabled: tab === 'piezas',
  });

  const { data: disfraces, isLoading: loadingDisfraces } = useQuery({
    queryKey: ['disfraces', { page, limit, search }],
    queryFn: () =>
      api.get('/catalogo/disfraces', { params: { page, limit, search: search || undefined } }).then((r) => r.data),
    enabled: tab === 'disfraces',
  });

  // ─── Mutaciones ───────────────────────────────────────────────────────────
  const deletePiezaMutation = useMutation({
    mutationFn: (id) => api.delete(`/catalogo/piezas/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['piezas'] });
      success('Pieza eliminada correctamente');
      setDeleteTarget(null);
    },
    onError: (err) => {
      error(err?.response?.data?.message ?? 'Error al eliminar la pieza');
      setDeleteTarget(null);
    },
  });

  const deleteDisfrazMutation = useMutation({
    mutationFn: (id) => api.delete(`/catalogo/disfraces/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['disfraces'] });
      success('Disfraz eliminado correctamente');
      setDeleteTarget(null);
    },
    onError: (err) => {
      error(err?.response?.data?.message ?? 'Error al eliminar el disfraz');
      setDeleteTarget(null);
    },
  });

  const activeMutation = tab === 'piezas' ? deletePiezaMutation : deleteDisfrazMutation;

  // ─── Columnas: Piezas ─────────────────────────────────────────────────────
  const piezasCols = [
    { key: 'id_pieza', label: '#', width: '60px' },
    { key: 'nombre', label: 'Nombre' },
    { key: 'descripcion', label: 'Descripción', render: (v) => v ?? '—' },
    {
      key: 'categorias',
      label: 'Categorías',
      render: (_, r) => r.categorias?.map?.((c) => c.categoriaMotivo?.nombre).join(', ') || '—',
    },
    {
      key: 'stock',
      label: 'Stock',
      width: '80px',
      align: 'center',
      render: (_, r) => <span className="font-label font-bold text-primary">{r.stocks?.length ?? 0}</span>,
    },
    {
      key: 'acciones',
      label: 'Acciones',
      width: '140px',
      align: 'center',
      render: (_, r) => (
        <ActionButtons
          onView={() => setViewId(r.id_pieza)}
          onEdit={() => navigate(`/admin/catalogo/piezas/${r.id_pieza}/editar`)}
          onDelete={() => setDeleteTarget({ id: r.id_pieza, nombre: r.nombre, tipo: 'pieza' })}
        />
      ),
    },
  ];

  // ─── Columnas: Disfraces ──────────────────────────────────────────────────
  const disfrazCols = [
    { key: 'id_disfraz', label: '#', width: '60px' },
    { key: 'nombre', label: 'Nombre' },
    { key: 'descripcion', label: 'Descripción', render: (v) => v ?? '—' },
    {
      key: 'piezas',
      label: 'Piezas',
      width: '80px',
      align: 'center',
      render: (_, r) => (
        <span className="font-label font-bold text-primary">{r.piezas?.length ?? 0}</span>
      ),
    },
    {
      key: 'acciones',
      label: 'Acciones',
      width: '120px',
      align: 'center',
      render: (_, r) => (
        <ActionButtons
          onDelete={() => setDeleteTarget({ id: r.id_disfraz, nombre: r.nombre, tipo: 'disfraz' })}
        />
      ),
    },
  ];

  const activeData = tab === 'piezas' ? piezas : disfraces;
  const activeLoading = tab === 'piezas' ? loadingPiezas : loadingDisfraces;
  const activeCols = tab === 'piezas' ? piezasCols : disfrazCols;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-headline-md font-bold text-on-surface">Catálogo</h1>
          <p className="text-body-md text-on-surface-variant mt-0.5">Piezas y disfraces del sistema</p>
        </div>
        {tab === 'piezas' && (
          <Link to="/admin/catalogo/piezas/nueva">
            <Button>+ Nueva pieza</Button>
          </Link>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-outline-variant/20">
        {['piezas', 'disfraces'].map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); reset(); setViewId(null); }}
            className={`px-4 py-2.5 text-body-md font-label font-medium capitalize transition-all border-b-2 -mb-px ${
              tab === t
                ? 'border-primary text-primary'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Buscador */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-card p-5">
        <Input
          placeholder={`Buscar ${tab}...`}
          value={search}
          onChange={(e) => { setSearch(e.target.value); reset(); }}
          className="max-w-sm"
        />
      </div>

      {/* Tabla */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-card overflow-hidden">
        <Table
          columns={activeCols}
          data={activeData?.data}
          loading={activeLoading}
          emptyMessage={`Sin ${tab}`}
        />
        <div className="px-4 pb-4">
          <Pagination meta={activeData?.meta} page={page} onPageChange={goToPage} />
        </div>
      </div>

      {/* Modal Ver (pieza) */}
      <PiezaViewModal
        id={viewId}
        open={!!viewId}
        onClose={() => setViewId(null)}
      />

      {/* Modal de confirmación */}
      <ConfirmDeleteModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => activeMutation.mutate(deleteTarget.id)}
        entityName={`${deleteTarget?.tipo ?? 'registro'} "${deleteTarget?.nombre ?? ''}"`}
        loading={activeMutation.isPending}
      />

      {/* Toasts */}
      <ToastContainer toasts={toasts} onRemove={remove} />
    </div>
  );
}
