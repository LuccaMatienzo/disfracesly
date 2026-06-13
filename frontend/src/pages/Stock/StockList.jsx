import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/api/axios.instance';
import { useStock } from '@/hooks/useStock';
import { usePagination } from '@/hooks/usePagination';
import { useDebounce } from '@/hooks/useDebounce';
import { useFeedback } from '@/context/FeedbackContext';
import Table, { Pagination } from '@/components/ui/Table';
import Badge, { badgeConfig } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Select } from '@/components/ui/Input';
import ActionButtons from '@/components/ui/ActionButtons';
import ConfirmDeleteModal from '@/components/ui/ConfirmDeleteModal';
import StockViewModal from '@/components/ui/StockViewModal';
import { FiSearch, FiChevronDown } from 'react-icons/fi';
import { useAuth } from '@/context/AuthContext';
import ToggleSwitch from '@/components/ui/ToggleSwitch';

const ESTADOS = ['', 'DISPONIBLE', 'RESERVADA', 'ALQUILADA', 'VENDIDA', 'FUERA_DE_SERVICIO'];

export default function StockList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { page, limit, goToPage, reset } = usePagination();
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [estado, setEstado] = useState('');
  const [talle, setTalle] = useState('');
  const [categoria, setCategoria] = useState('');
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const { showSuccess, showError } = useFeedback();
  const { hasRol } = useAuth();

  const [deleteTarget, setDeleteTarget] = useState(null); // { id, nombre }
  const [viewId, setViewId] = useState(null);             // id de stock en modal Ver

  // ─── Query ────────────────────────────────────────────────────────────────
  const { data, isLoading } = useStock({
    page,
    limit,
    search: debouncedSearchQuery || undefined,
    estado: estado || undefined,
    talle: talle || undefined,
    categoria: categoria || undefined,
    include_deleted: includeDeleted,
  });

  useEffect(() => {
    reset();
  }, [debouncedSearchQuery, estado, talle, categoria, includeDeleted, reset]);

  const { data: categoriasData } = useQuery({
    queryKey: ['categorias', 'all'],
    queryFn: () => api.get('/catalogo/categorias', { params: { limit: 500 } }).then((r) => r.data),
  });
  const categoriasOptions = categoriasData?.data ?? [];

  // ─── Mutación: soft-delete ────────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/stock/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock'] });
      showSuccess('Pieza de stock eliminada correctamente');
      setDeleteTarget(null);
    },
    onError: (err) => {
      showError(err?.response?.data?.message ?? 'Error al eliminar la pieza de stock');
      setDeleteTarget(null);
    },
  });

  // ─── Mutación: restore ────────────────────────────────────────────────────
  const restoreMutation = useMutation({
    mutationFn: (id) => api.patch(`/stock/${id}/restore`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock'] });
      showSuccess('Pieza de stock restaurada correctamente');
    },
    onError: (err) => {
      showError(err?.response?.data?.message ?? 'Error al restaurar la pieza de stock');
    },
  });

  // ─── Columnas ─────────────────────────────────────────────────────────────
  const columns = [
    { key: 'id_pieza_stock', label: '#', width: '60px' },
    { 
      key: 'pieza', 
      label: 'Pieza', 
      render: (_, r) => <span className={r.deleted_at ? 'text-coral font-medium' : ''}>{r.pieza?.nombre ?? '—'}</span>
    },
    { 
      key: 'talle', 
      label: 'Talle', 
      align: 'center', 
      render: (_, r) => <span className={r.deleted_at ? 'text-coral' : ''}>{r.talle ?? '—'}</span>
    },
    {
      key: 'categorias',
      label: 'Categorías',
      render: (_, r) => {
        const cats = r.pieza?.categorias?.map(c => c.categoriaMotivo?.nombre).filter(Boolean).join(', ') || '—';
        return <span className={r.deleted_at ? 'text-coral' : ''}>{cats}</span>;
      }
    },
    {
      key: 'estado_pieza_stock',
      label: 'Estado',
      render: (_, r) => <Badge value={r.deleted_at ? 'DE_BAJA' : r.estado_pieza_stock} />,
    },
    { 
      key: 'descripcion', 
      label: 'Descripción', 
      render: (_, r) => <span className={r.deleted_at ? 'text-coral' : ''}>{r.descripcion ?? '—'}</span>
    },
    {
      key: 'acciones',
      label: 'Acciones',
      width: '160px',
      align: 'center',
      render: (_, r) => {
        const isDeleted = !!r.deleted_at;
        return (
          <ActionButtons
            onView={!isDeleted ? () => setViewId(r.id_pieza_stock) : undefined}
            {...(!hasRol('Empleado') && !isDeleted && {
              onEdit: () => navigate(`/admin/stock/${r.id_pieza_stock}/editar`),
              onDelete: () =>
                setDeleteTarget({
                  id: r.id_pieza_stock,
                  nombre: `${r.pieza?.nombre ?? 'pieza'} (talle: ${r.talle ?? 'único'})`,
                }),
            })}
            {...(hasRol('Administrador') && isDeleted && {
              onRestore: () => restoreMutation.mutate(r.id_pieza_stock)
            })}
          />
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-row items-center justify-between gap-2 md:gap-4 w-full mb-6">
        <div className="min-w-0 overflow-x-auto">
          <div className="inline-flex h-11 bg-surface-container-high border border-transparent dark:border-zinc-800 rounded-xl items-center">
            <div className="relative flex h-full items-center justify-center px-6 rounded-xl text-sm font-medium transition-all duration-200 bg-surface-container-lowest shadow-sm text-primary font-semibold">
              Inventario
            </div>
          </div>
        </div>

        {!hasRol('Empleado') && (
          <Link to="/admin/stock/nuevo">
            <Button className="h-11 px-4 flex items-center justify-center gap-2 whitespace-nowrap flex-shrink-0">
              <span className="material-symbols-outlined text-[18px]">add</span>
              Nuevo
            </Button>
          </Link>
        )}
      </div>

      {/* Filtros */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-card p-3 lg:p-5 flex flex-col gap-4">
        {/* Buscador */}
        <div className="flex flex-row flex-nowrap w-full gap-2 items-center">
          <div className="flex-1 min-w-0 relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10 pointer-events-none text-[20px]">search</span>
            <Input
              placeholder="Buscar por nombre de pieza…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
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
                    id="toggle-inactivos-stock"
                  />
                </div>
                <div className="w-px h-6 bg-divider shrink-0"></div>
              </>
            )}

            {/* Filtro por Categoría */}
            <div className="relative inline-block shrink-0">
              <select
                value={categoria}
                onChange={(e) => {
                  setCategoria(e.target.value);
                  reset();
                }}
                className="appearance-none w-auto px-3 py-1 pr-8 text-sm font-medium rounded-full border border-gray-300 dark:border-gray-600 bg-transparent dark:bg-transparent text-gray-700 dark:text-gray-200 cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary max-w-[200px] truncate"
              >
                <option value="" className="bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-200">Todas las categorías</option>
                {categoriasOptions.map(cat => (
                  <option key={cat.id_categoria_motivo} value={cat.id_categoria_motivo} className="bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-200">
                    {cat.nombre}
                  </option>
                ))}
              </select>
              <FiChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 size-3.5" />
            </div>
            
            {/* Filtro por Etapas (Nativo) */}
            <div className="relative inline-block shrink-0">
              <select
                value={estado}
                onChange={(e) => {
                  setEstado(e.target.value);
                  reset();
                }}
                className="appearance-none w-auto px-3 py-1 pr-8 text-sm font-medium rounded-full border border-gray-300 dark:border-gray-600 bg-transparent dark:bg-transparent text-gray-700 dark:text-gray-200 cursor-pointer focus:outline-none"
              >
                <option value="" className="bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-200">Todos los estados</option>
                {ESTADOS.filter(e => e !== '').map(e => (
                  <option key={e} value={e} className="bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-200">
                    {badgeConfig[e]?.label ?? e}
                  </option>
                ))}
              </select>
              <FiChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 size-3.5" />
            </div>

            <div className="w-px h-6 bg-divider shrink-0 ml-1"></div>

            {/* Filtro por Talle */}
            <div className="relative inline-block shrink-0 ml-1">
              <input
                type="text"
                placeholder="Talle..."
                value={talle}
                onChange={(e) => { setTalle(e.target.value); reset(); }}
                className="w-24 px-3 py-1 text-sm font-medium rounded-full border border-gray-300 dark:border-gray-600 bg-transparent dark:bg-transparent text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-primary placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="md:bg-surface-container-lowest rounded-2xl md:shadow-card md:overflow-hidden">
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

      {/* Modal Ver */}
      <StockViewModal
        id={viewId}
        open={!!viewId}
        onClose={() => setViewId(null)}
      />

      {/* Modal de confirmación */}
      <ConfirmDeleteModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
        entityName={`stock "${deleteTarget?.nombre ?? ''}"`}
        loading={deleteMutation.isPending}
      />


    </div>
  );
}
