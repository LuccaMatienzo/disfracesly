import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/api/axios.instance';
import { usePagination } from '@/hooks/usePagination';
import { useFeedback } from '@/context/FeedbackContext';
import Table, { Pagination } from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Input, { Select } from '@/components/ui/Input';
import ActionButtons from '@/components/ui/ActionButtons';
import ConfirmDeleteModal from '@/components/ui/ConfirmDeleteModal';
import PiezaViewModal from '@/components/ui/PiezaViewModal';
import DisfrazViewModal from '@/components/ui/DisfrazViewModal';
import { FiSearch, FiChevronDown } from 'react-icons/fi';
import { useAuth } from '@/context/AuthContext';
import ToggleSwitch from '@/components/ui/ToggleSwitch';


export default function CatalogoList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { page, limit, goToPage, reset } = usePagination();
  const [search, setSearch] = useState('');
  const [categoria, setCategoria] = useState('');
  const [tempSearch, setTempSearch] = useState('');
  const [tempCategoria, setTempCategoria] = useState('');
  const [includeDeleted, setIncludeDeleted] = useState(false);
  
  
  const [tab, setTab] = useState('piezas');
  const { showSuccess, showError } = useFeedback();
  const { hasRol } = useAuth();

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
    queryKey: ['piezas', { page, limit, search, categoria, include_deleted: includeDeleted }],
    queryFn: () =>
      api.get('/catalogo/piezas', { params: { page, limit, search: search || undefined, categoria: categoria || undefined, include_deleted: includeDeleted } }).then((r) => r.data),
    enabled: tab === 'piezas',
  });

  const { data: disfraces, isLoading: loadingDisfraces } = useQuery({
    queryKey: ['disfraces', { page, limit, search, categoria, include_deleted: includeDeleted }],
    queryFn: () =>
      api.get('/catalogo/disfraces', { params: { page, limit, search: search || undefined, categoria: categoria || undefined, include_deleted: includeDeleted } }).then((r) => r.data),
    enabled: tab === 'disfraces',
  });

  // ─── Mutaciones ───────────────────────────────────────────────────────────
  const deletePiezaMutation = useMutation({
    mutationFn: (id) => api.delete(`/catalogo/piezas/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['piezas'] });
      showSuccess('Pieza eliminada correctamente');
      setDeleteTarget(null);
    },
    onError: (err) => {
      showError(err?.response?.data?.message ?? 'Error al eliminar la pieza');
      setDeleteTarget(null);
    },
  });

  const deleteDisfrazMutation = useMutation({
    mutationFn: (id) => api.delete(`/catalogo/disfraces/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['disfraces'] });
      showSuccess('Disfraz eliminado correctamente');
      setDeleteTarget(null);
    },
    onError: (err) => {
      showError(err?.response?.data?.message ?? 'Error al eliminar el disfraz');
      setDeleteTarget(null);
    },
  });

  const restorePiezaMutation = useMutation({
    mutationFn: (id) => api.patch(`/catalogo/piezas/${id}/restore`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['piezas'] });
      showSuccess('Pieza restaurada correctamente');
    },
    onError: (err) => {
      showError(err?.response?.data?.message ?? 'Error al restaurar la pieza');
    },
  });

  const restoreDisfrazMutation = useMutation({
    mutationFn: (id) => api.patch(`/catalogo/disfraces/${id}/restore`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['disfraces'] });
      showSuccess('Disfraz restaurado correctamente');
    },
    onError: (err) => {
      showError(err?.response?.data?.message ?? 'Error al restaurar el disfraz');
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
      render: (_, r) => {
        const isDeleted = !!r.deleted_at;
        return (
          <ActionButtons
            onView={() => setViewId(r.id_pieza)}
            {...(!hasRol('Empleado') && !isDeleted && {
              onEdit: () => navigate(`/admin/catalogo/piezas/${r.id_pieza}/editar`),
              onDelete: () => setDeleteTarget({ id: r.id_pieza, nombre: r.nombre, tipo: 'pieza' }),
            })}
            {...(hasRol('Administrador') && isDeleted && {
              onRestore: () => restorePiezaMutation.mutate(r.id_pieza)
            })}
          />
        );
      },
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
      render: (_, r) => {
        const isDeleted = !!r.deleted_at;
        return (
          <ActionButtons
            onView={() => setViewDisfrazId(r.id_disfraz)}
            {...(!hasRol('Empleado') && !isDeleted && {
              onEdit: () => navigate(`/admin/catalogo/disfraces/${r.id_disfraz}/editar`),
              onDelete: () => setDeleteTarget({ id: r.id_disfraz, nombre: r.nombre, tipo: 'disfraz' }),
            })}
            {...(hasRol('Administrador') && isDeleted && {
              onRestore: () => restoreDisfrazMutation.mutate(r.id_disfraz)
            })}
          />
        );
      },
    },
  ];

  const activeData = tab === 'piezas' ? piezas : disfraces;
  const activeLoading = tab === 'piezas' ? loadingPiezas : loadingDisfraces;
  const activeCols = tab === 'piezas' ? piezasCols : disfrazCols;

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-row items-center justify-between gap-2 md:gap-4 w-full mb-6">
        {/* Segmented Control */}
        <div className="min-w-0 overflow-x-auto">
          <div className="inline-flex h-11 bg-surface-container-high border border-transparent dark:border-zinc-800 rounded-xl items-center">
            <button
              type="button"
              onClick={() => {
                setTab('piezas');
                reset();
                setViewId(null);
                setViewDisfrazId(null);
                setSearch('');
                setTempSearch('');
                setCategoria('');
                setTempCategoria('');
              }}
              className={[
                'relative flex h-full items-center justify-center px-6 rounded-xl text-sm font-medium transition-all duration-200',
                tab === 'piezas'
                  ? 'bg-surface-container-lowest shadow-sm text-primary font-semibold'
                  : 'bg-transparent text-gray-500 hover:text-gray-700 dark:text-zinc-400 dark:hover:text-zinc-200',
              ].join(' ')}
            >
              Piezas
            </button>
            <button
              type="button"
              onClick={() => {
                setTab('disfraces');
                reset();
                setViewId(null);
                setViewDisfrazId(null);
                setSearch('');
                setTempSearch('');
                setCategoria('');
                setTempCategoria('');
              }}
              className={[
                'relative flex h-full items-center justify-center px-6 rounded-xl text-sm font-medium transition-all duration-200',
                tab === 'disfraces'
                  ? 'bg-surface-container-lowest shadow-sm text-primary font-semibold'
                  : 'bg-transparent text-gray-500 hover:text-gray-700 dark:text-zinc-400 dark:hover:text-zinc-200',
              ].join(' ')}
            >
              Disfraces
            </button>
          </div>
        </div>

        {/* CTA */}
        {!hasRol('Empleado') && (
          <Link to={tab === 'piezas' ? '/admin/catalogo/piezas/nueva' : '/admin/catalogo/disfraces/nuevo'}>
            <Button className="h-11 px-4 flex items-center justify-center gap-2 whitespace-nowrap flex-shrink-0">
              <span className="material-symbols-outlined text-[18px]">add</span>
              Nuevo
            </Button>
          </Link>
        )}
      </div>

      {/* Buscador y Filtros */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-card p-3 lg:p-5 flex flex-col gap-4">
        {/* Buscador */}
        <div className="flex flex-row flex-nowrap w-full gap-2 items-center">
          <div className="flex-1 min-w-0">
            <Input
              placeholder={`Buscar ${tab}…`}
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
          <Button
            onClick={() => {
              setSearch(tempSearch);
              setCategoria(tempCategoria);
              reset();
            }}
            className="h-[48px] shrink-0 px-4 lg:px-6"
          >
            <span className="material-symbols-outlined text-[20px] sm:mr-2">search</span>
            <span className="hidden sm:inline">Buscar</span>
          </Button>
        </div>

        {/* Barra inferior */}
        <div className="flex flex-row flex-nowrap overflow-x-auto whitespace-nowrap gap-3 pb-2 w-full pt-3 border-t border-divider items-center min-w-0 lg:overflow-visible lg:pb-0 lg:justify-start">
          <div className="flex flex-row items-center gap-3 shrink-0">
            {hasRol('Administrador') && (
              <>
                <div className="shrink-0">
                  <ToggleSwitch
                    checked={includeDeleted}
                    onChange={(val) => { setIncludeDeleted(val); reset(); }}
                    label="Ver inactivos"
                    id={`toggle-inactivos-${tab}`}
                  />
                </div>
                <div className="w-px h-6 bg-divider shrink-0"></div>
              </>
            )}

            {/* Filtro por Categoría (Nativo) */}
            <div className="relative inline-block shrink-0">
              <select
                value={tempCategoria}
                onChange={(e) => {
                  setTempCategoria(e.target.value);
                  setCategoria(e.target.value);
                  reset();
                }}
                className="appearance-none w-auto px-3 py-1 pr-8 text-sm font-medium rounded-full border border-gray-300 dark:border-gray-600 bg-transparent dark:bg-transparent text-gray-700 dark:text-gray-200 cursor-pointer focus:outline-none"
              >
                <option value="" className="bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-200">Todas las categorías</option>
                {categorias.map((c) => (
                  <option key={c.id_categoria_motivo} value={c.id_categoria_motivo} className="bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-200">
                    {c.nombre}
                  </option>
                ))}
              </select>
              <FiChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 size-3.5" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabla — cards en móvil, tabla clásica en md+ */}
      <div className="md:bg-surface-container-lowest rounded-2xl md:shadow-card md:overflow-hidden">
        <Table
          columns={activeCols}
          data={activeData?.data}
          loading={activeLoading}
          emptyMessage={`Sin ${tab}`}
        />
        <div className="px-1 md:px-4 pb-3 md:pb-4">
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
    </div>
  );
}
