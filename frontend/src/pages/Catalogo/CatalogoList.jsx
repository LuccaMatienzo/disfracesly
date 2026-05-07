import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/api/axios.instance';
import { usePagination } from '@/hooks/usePagination';
import { useToast } from '@/hooks/useToast';
import Table, { Pagination } from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Input, { Select } from '@/components/ui/Input';
import ActionButtons from '@/components/ui/ActionButtons';
import ConfirmDeleteModal from '@/components/ui/ConfirmDeleteModal';
import PiezaViewModal from '@/components/ui/PiezaViewModal';
import DisfrazViewModal from '@/components/ui/DisfrazViewModal';
import ToastContainer from '@/components/ui/Toast';
import { FiSearch } from 'react-icons/fi';


export default function CatalogoList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { page, limit, goToPage, reset } = usePagination();
  const [search, setSearch] = useState('');
  const [categoria, setCategoria] = useState('');
  const [tempSearch, setTempSearch] = useState('');
  const [tempCategoria, setTempCategoria] = useState('');
  
  const [tab, setTab] = useState('piezas');
  const { toasts, success, error, remove } = useToast();

  const [deleteTarget, setDeleteTarget] = useState(null); // { id, nombre, tipo }
  const [viewId, setViewId] = useState(null);             // id de pieza en modal Ver
  const [viewDisfrazId, setViewDisfrazId] = useState(null); // id de disfraz en modal Ver

  // ─── Queries ──────────────────────────────────────────────────────────────
  const { data: categoriasData } = useQuery({
    queryKey: ['categorias-list'],
    queryFn: () => api.get('/catalogo/categorias', { params: { limit: 100 } }).then((r) => r.data),
  });
  const categorias = categoriasData?.data || [];

  const { data: piezas, isLoading: loadingPiezas } = useQuery({
    queryKey: ['piezas', { page, limit, search, categoria }],
    queryFn: () =>
      api.get('/catalogo/piezas', { params: { page, limit, search: search || undefined, categoria: categoria || undefined } }).then((r) => r.data),
    enabled: tab === 'piezas',
  });

  const { data: disfraces, isLoading: loadingDisfraces } = useQuery({
    queryKey: ['disfraces', { page, limit, search, categoria }],
    queryFn: () =>
      api.get('/catalogo/disfraces', { params: { page, limit, search: search || undefined, categoria: categoria || undefined } }).then((r) => r.data),
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
      key: 'categorias',
      label: 'Categorías',
      render: (_, r) => r.categorias_derivadas?.length > 0 ? r.categorias_derivadas.join(', ') : '—',
    },
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
      width: '140px',
      align: 'center',
      render: (_, r) => (
        <ActionButtons
          onView={() => setViewDisfrazId(r.id_disfraz)}
          onEdit={() => navigate(`/admin/catalogo/disfraces/${r.id_disfraz}/editar`)}
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
        <div>
          {tab === 'piezas' ? (
            <Link to="/admin/catalogo/piezas/nueva">
              <Button>+ Nueva pieza</Button>
            </Link>
          ) : (
            <Link to="/admin/catalogo/disfraces/nuevo">
              <Button>+ Nuevo disfraz</Button>
            </Link>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-outline-variant/20">
        {['piezas', 'disfraces'].map((t) => (
          <button
            key={t}
            onClick={() => { 
              setTab(t); 
              reset(); 
              setViewId(null); 
              setViewDisfrazId(null); 
              setSearch('');
              setTempSearch('');
              setCategoria('');
              setTempCategoria('');
            }}
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

      {/* Buscador y Filtros */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-card p-5">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full max-w-sm">
            <Input
              placeholder={`Buscar ${tab}...`}
              value={tempSearch}
              onChange={(e) => setTempSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setSearch(tempSearch);
                  setCategoria(tempCategoria);
                  reset();
                }
              }}
            />
          </div>
          <div className="flex-1 w-full md:max-w-[200px]">
            <Select
              value={tempCategoria}
              onChange={(e) => setTempCategoria(e.target.value)}
            >
              <option value="">Todas las categorías</option>
              {categorias.map((c) => (
                <option key={c.id_categoria_motivo} value={c.id_categoria_motivo}>
                  {c.nombre}
                </option>
              ))}
            </Select>
          </div>
          <Button
            onClick={() => {
              setSearch(tempSearch);
              setCategoria(tempCategoria);
              reset();
            }}
            className="h-[48px] px-6"
          >
            <FiSearch className="w-5 h-5 mr-2" />
            Buscar
          </Button>
        </div>
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

      {/* Modal Ver (disfraz) */}
      <DisfrazViewModal
        id={viewDisfrazId}
        open={!!viewDisfrazId}
        onClose={() => setViewDisfrazId(null)}
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
