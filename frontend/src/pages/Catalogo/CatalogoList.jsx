import { useState, useEffect } from 'react';
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
import CategoriaFormModal from '@/components/ui/CategoriaFormModal';
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
  const [editCategoria, setEditCategoria] = useState(null);
  const [isCategoriaModalOpen, setIsCategoriaModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Bloquear scroll en mobile cuando el bottom sheet está abierto
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  // ─── Queries ──────────────────────────────────────────────────────────────
  const { data: categoriasData } = useQuery({
    queryKey: ['categorias', 'list'],
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

  const { data: categoriasTab, isLoading: loadingCategorias } = useQuery({
    queryKey: ['categorias', 'tab', { page, limit, search, include_deleted: includeDeleted }],
    queryFn: () =>
      api.get('/catalogo/categorias', { params: { page, limit, search: search || undefined, include_deleted: includeDeleted } }).then((r) => r.data),
    enabled: tab === 'categorias',
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

  const createCategoriaMutation = useMutation({
    mutationFn: (data) => api.post('/catalogo/categorias', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categorias'] });
      showSuccess('Categoría creada correctamente');
      setIsCategoriaModalOpen(false);
    },
    onError: (err) => {
      showError(err?.response?.data?.message ?? 'Error al crear categoría');
    },
  });

  const updateCategoriaMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/catalogo/categorias/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categorias'] });
      showSuccess('Categoría actualizada correctamente');
      setIsCategoriaModalOpen(false);
    },
    onError: (err) => {
      showError(err?.response?.data?.message ?? 'Error al actualizar categoría');
    },
  });

  const deleteCategoriaMutation = useMutation({
    mutationFn: (id) => api.delete(`/catalogo/categorias/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categorias'] });
      showSuccess('Categoría eliminada correctamente');
      setDeleteTarget(null);
    },
    onError: (err) => {
      showError(err?.response?.data?.message ?? 'Error al eliminar categoría');
      setDeleteTarget(null);
    },
  });

  const restoreCategoriaMutation = useMutation({
    mutationFn: (id) => api.patch(`/catalogo/categorias/${id}/restore`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categorias'] });
      showSuccess('Categoría restaurada correctamente');
    },
    onError: (err) => {
      showError(err?.response?.data?.message ?? 'Error al restaurar categoría');
    },
  });

  const activeMutation = tab === 'piezas' ? deletePiezaMutation : tab === 'disfraces' ? deleteDisfrazMutation : deleteCategoriaMutation;

  // ─── Columnas: Piezas ─────────────────────────────────────────────────────
  const piezasCols = [
    { key: 'id_pieza', label: '#', width: '60px' },
    { key: 'nombre', label: 'Nombre', render: (_, r) => <span className={r.deleted_at ? 'text-coral font-medium' : ''}>{r.nombre}</span> },
    { key: 'descripcion', label: 'Descripción', render: (_, r) => <span className={r.deleted_at ? 'text-coral' : ''}>{r.descripcion ?? '—'}</span> },
    {
      key: 'categorias',
      label: 'Categorías',
      render: (_, r) => {
        const cats = r.categorias?.map?.((c) => c.categoriaMotivo?.nombre).join(', ') || '—';
        return <span className={r.deleted_at ? 'text-coral' : ''}>{cats}</span>;
      }
    },
    {
      key: 'stock',
      label: 'Stock',
      width: '80px',
      align: 'center',
      render: (_, r) => <span className={r.deleted_at ? 'text-coral font-label font-bold' : 'font-label font-bold text-primary'}>{r.stocks?.length ?? 0}</span>,
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
            onView={!isDeleted ? () => setViewId(r.id_pieza) : undefined}
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
    { key: 'nombre', label: 'Nombre', render: (_, r) => <span className={r.deleted_at ? 'text-coral font-medium' : ''}>{r.nombre}</span> },
    { key: 'descripcion', label: 'Descripción', render: (_, r) => <span className={r.deleted_at ? 'text-coral' : ''}>{r.descripcion ?? '—'}</span> },
    {
      key: 'categorias',
      label: 'Categorías',
      render: (_, r) => {
        const cats = r.categorias_derivadas?.length > 0 ? r.categorias_derivadas.join(', ') : '—';
        return <span className={r.deleted_at ? 'text-coral' : ''}>{cats}</span>;
      }
    },
    {
      key: 'piezas',
      label: 'Piezas',
      width: '80px',
      align: 'center',
      render: (_, r) => (
        <span className={r.deleted_at ? 'text-coral font-label font-bold' : 'font-label font-bold text-primary'}>{r.piezas?.length ?? 0}</span>
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
            onView={!isDeleted ? () => setViewDisfrazId(r.id_disfraz) : undefined}
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

  // ─── Columnas: Categorías ──────────────────────────────────────────────────
  const categoriaCols = [
    { key: 'id_categoria_motivo', label: '#', width: '60px' },
    { key: 'nombre', label: 'Nombre', render: (_, r) => <span className={r.deleted_at ? 'text-coral font-medium' : ''}>{r.nombre}</span> },
    { key: 'descripcion', label: 'Descripción', render: (_, r) => <span className={r.deleted_at ? 'text-coral' : ''}>{r.descripcion ?? '—'}</span> },
    {
      key: 'acciones',
      label: 'Acciones',
      width: '140px',
      align: 'center',
      render: (_, r) => {
        const isDeleted = !!r.deleted_at;
        return (
          <ActionButtons
            {...(!hasRol('Empleado') && !isDeleted && {
              onEdit: () => {
                setEditCategoria(r);
                setIsCategoriaModalOpen(true);
              },
              onDelete: () => setDeleteTarget({ id: r.id_categoria_motivo, nombre: r.nombre, tipo: 'categoría' }),
            })}
            {...(hasRol('Administrador') && isDeleted && {
              onRestore: () => restoreCategoriaMutation.mutate(r.id_categoria_motivo)
            })}
          />
        );
      },
    },
  ];

  const activeData = tab === 'piezas' ? piezas : tab === 'disfraces' ? disfraces : categoriasTab;
  const activeLoading = tab === 'piezas' ? loadingPiezas : tab === 'disfraces' ? loadingDisfraces : loadingCategorias;
  const activeCols = tab === 'piezas' ? piezasCols : tab === 'disfraces' ? disfrazCols : categoriaCols;

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-row items-center justify-between gap-2 md:gap-4 w-full mb-6">
        {/* Botón Selector en Mobile */}
        <div className="md:hidden flex-shrink-0">
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(true)}
            className="flex items-center justify-center gap-2 h-11 px-5 rounded-xl bg-surface-container-lowest shadow-sm text-sm font-semibold text-primary transition-all duration-200"
          >
            <span className="capitalize">{tab}</span>
            <FiChevronDown className="size-4" />
          </button>
        </div>

        {/* Segmented Control (Desktop) */}
        <div className="hidden md:block min-w-0 overflow-x-auto">
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
            <button
              type="button"
              onClick={() => {
                setTab('categorias');
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
                tab === 'categorias'
                  ? 'bg-surface-container-lowest shadow-sm text-primary font-semibold'
                  : 'bg-transparent text-gray-500 hover:text-gray-700 dark:text-zinc-400 dark:hover:text-zinc-200',
              ].join(' ')}
            >
              Categorías
            </button>
          </div>
        </div>

        {/* CTA */}
        {!hasRol('Empleado') && (
          tab === 'categorias' ? (
            <Button className="h-11 px-4 flex items-center justify-center gap-2 whitespace-nowrap flex-shrink-0" onClick={() => { setEditCategoria(null); setIsCategoriaModalOpen(true); }}>
              <span className="material-symbols-outlined text-[18px]">add</span>
              Nuevo
            </Button>
          ) : (
            <Link to={tab === 'piezas' ? '/admin/catalogo/piezas/nueva' : '/admin/catalogo/disfraces/nuevo'}>
              <Button className="h-11 px-4 flex items-center justify-center gap-2 whitespace-nowrap flex-shrink-0">
                <span className="material-symbols-outlined text-[18px]">add</span>
                Nuevo
              </Button>
            </Link>
          )
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

            {/* Filtro por Categoría (Nativo) - Oculto si estamos en tab de categorias */}
            {tab !== 'categorias' && (
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
            )}
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

      {/* Modal de Categoría */}
      <CategoriaFormModal
        open={isCategoriaModalOpen}
        onClose={() => { setIsCategoriaModalOpen(false); setEditCategoria(null); }}
        initialData={editCategoria}
        onSubmit={(data) => {
          if (editCategoria) {
            updateCategoriaMutation.mutate({ id: editCategoria.id_categoria_motivo, data });
          } else {
            createCategoriaMutation.mutate(data);
          }
        }}
        loading={createCategoriaMutation.isPending || updateCategoriaMutation.isPending}
      />

      {/* Bottom Sheet Selector (Mobile) */}
      <div className="md:hidden">
        {/* Backdrop */}
        <div
          className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300 ${
            isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
          onClick={() => setIsMobileMenuOpen(false)}
        />
        
        {/* Bottom Sheet */}
        <div
          className={`fixed inset-x-0 bottom-0 z-50 bg-surface rounded-t-2xl shadow-[0_-8px_30px_rgb(0,0,0,0.12)] transform transition-transform duration-300 ease-in-out flex flex-col max-h-[85vh] ${
            isMobileMenuOpen ? 'translate-y-0' : 'translate-y-full'
          }`}
        >
          {/* Pill / Handle */}
          <div 
            className="w-full flex justify-center py-3 shrink-0 cursor-pointer" 
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <div className="w-12 h-1.5 bg-gray-300 dark:bg-zinc-700 rounded-full" />
          </div>
          
          {/* Content */}
          <div className="px-5 pb-8 overflow-y-auto flex-1 flex flex-col gap-2">
            <h3 className="text-lg font-bold text-on-surface mb-2">Seleccionar Vista</h3>
            
            <button
              onClick={() => {
                setTab('piezas');
                reset(); setViewId(null); setViewDisfrazId(null); setSearch(''); setTempSearch(''); setCategoria(''); setTempCategoria('');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-left font-medium transition-colors ${
                tab === 'piezas' 
                  ? 'bg-primary/10 text-primary' 
                  : 'text-on-surface hover:bg-surface-container-high'
              }`}
            >
              <span>Piezas</span>
              {tab === 'piezas' && <span className="material-symbols-outlined text-[20px]">check</span>}
            </button>
            
            <button
              onClick={() => {
                setTab('disfraces');
                reset(); setViewId(null); setViewDisfrazId(null); setSearch(''); setTempSearch(''); setCategoria(''); setTempCategoria('');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-left font-medium transition-colors ${
                tab === 'disfraces' 
                  ? 'bg-primary/10 text-primary' 
                  : 'text-on-surface hover:bg-surface-container-high'
              }`}
            >
              <span>Disfraces</span>
              {tab === 'disfraces' && <span className="material-symbols-outlined text-[20px]">check</span>}
            </button>
            
            <button
              onClick={() => {
                setTab('categorias');
                reset(); setViewId(null); setViewDisfrazId(null); setSearch(''); setTempSearch(''); setCategoria(''); setTempCategoria('');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-left font-medium transition-colors ${
                tab === 'categorias' 
                  ? 'bg-primary/10 text-primary' 
                  : 'text-on-surface hover:bg-surface-container-high'
              }`}
            >
              <span>Categorías</span>
              {tab === 'categorias' && <span className="material-symbols-outlined text-[20px]">check</span>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
