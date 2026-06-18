import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/api/axios.instance';
import { useStock } from '@/hooks/useStock';
import { useUrlFilters } from '@/hooks/useUrlFilters';
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
  const { filters, updateFilters, goToPage, reset } = useUrlFilters();
  const { search, include_deleted: includeDeleted, page, limit, estado = '', talle = '', categoria = '' } = filters;

  const [localSearch, setLocalSearch] = useState(search);
  const debouncedSearch = useDebounce(localSearch, 300);

  useEffect(() => {
    if (debouncedSearch !== search) {
      updateFilters({ search: debouncedSearch, page: 1 }, { replace: true });
    }
  }, [debouncedSearch, search, updateFilters]);

  const [showFilters, setShowFilters] = useState(false);
  const { showSuccess, showError } = useFeedback();
  const { hasRol } = useAuth();

  const [deleteTarget, setDeleteTarget] = useState(null); // { id, nombre }
  const [viewId, setViewId] = useState(null);             // id de stock en modal Ver

  // Bloquear scroll en mobile cuando el bottom sheet está abierto
  useEffect(() => {
    if (showFilters) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showFilters]);

  // ─── Query ────────────────────────────────────────────────────────────────
  const { data, isLoading } = useStock(filters);

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
      render: (_, r) => <span className={r.deleted_at ? 'text-coral font-medium' : ''}>{r.pieza?.nombre || '—'}</span>
    },
    {
      key: 'talle',
      label: 'Talle',
      align: 'center',
      render: (_, r) => <span className={r.deleted_at ? 'text-coral' : ''}>{r.talle || '—'}</span>
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
      render: (_, r) => <span className={r.deleted_at ? 'text-coral whitespace-normal text-[13px] md:text-sm leading-relaxed' : 'whitespace-normal text-[13px] md:text-sm leading-relaxed'}>{r.descripcion || ''}</span>
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
        {/* Buscador y Toggle */}
        <div className="flex flex-row flex-nowrap w-full gap-2 items-center">
          <div className="flex-1 min-w-0 relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10 pointer-events-none text-[20px]">search</span>
            <Input
              placeholder="Buscar por Nombre de pieza…"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`md:hidden flex-shrink-0 h-11 w-11 flex items-center justify-center rounded-xl transition-colors border ${showFilters || includeDeleted || categoria || estado || talle
                ? 'bg-primary/10 text-primary border-primary/20'
                : 'bg-surface-container-high text-on-surface-variant border-transparent dark:border-zinc-800 hover:bg-surface-container-highest'
              }`}
            title="Filtros"
          >
            <span className="material-symbols-outlined text-[20px]">
              {showFilters ? 'close' : 'tune'}
            </span>
          </button>
        </div>

        {/* Barra inferior (Desktop) */}
        <div className="hidden md:flex flex-row flex-nowrap overflow-x-auto whitespace-nowrap gap-3 pb-2 w-full pt-3 border-t border-divider items-center min-w-0 overflow-visible justify-start">
          <div className="flex flex-row items-center gap-3 shrink-0">
            {hasRol('Administrador') && (
              <>
                <div className="shrink-0">
                  <ToggleSwitch
                    checked={includeDeleted}
                    onChange={(val) => updateFilters({ include_deleted: val, page: 1 })}
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
                onChange={(e) => updateFilters({ categoria: e.target.value, page: 1 })}
                className="appearance-none w-auto px-3 py-1 pr-8 text-sm font-medium rounded-full border border-outline-variant bg-surface-container text-on-surface cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary max-w-[200px] truncate"
              >
                <option value="" className="bg-surface-container text-on-surface">Todas las categorías</option>
                {categoriasOptions.map(cat => (
                  <option key={cat.id_categoria_motivo} value={cat.id_categoria_motivo} className="bg-surface-container text-on-surface">
                    {cat.nombre}
                  </option>
                ))}
              </select>
              <FiChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant size-3.5" />
            </div>

            {/* Filtro por Etapas (Nativo) */}
            <div className="relative inline-block shrink-0">
              <select
                value={estado}
                onChange={(e) => updateFilters({ estado: e.target.value, page: 1 })}
                className="appearance-none w-auto px-3 py-1 pr-8 text-sm font-medium rounded-full border border-outline-variant bg-surface-container text-on-surface cursor-pointer focus:outline-none"
              >
                <option value="" className="bg-surface-container text-on-surface">Todos los estados</option>
                {ESTADOS.filter(e => e !== '').map(e => (
                  <option key={e} value={e} className="bg-surface-container text-on-surface">
                    {badgeConfig[e]?.label ?? e}
                  </option>
                ))}
              </select>
              <FiChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant size-3.5" />
            </div>

            <div className="w-px h-6 bg-divider shrink-0 ml-1"></div>

            {/* Filtro por Talle */}
            <div className="relative inline-block shrink-0 ml-1">
              <input
                type="text"
                placeholder="Talle..."
                value={talle}
                onChange={(e) => updateFilters({ talle: e.target.value, page: 1 })}
                className="w-24 px-3 py-1 text-sm font-medium rounded-full border border-outline-variant bg-surface-container text-on-surface focus:outline-none focus:ring-1 focus:ring-primary placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>
          </div>

          <div className="ml-auto shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                updateFilters({ categoria: null, estado: null, talle: null, include_deleted: false, page: 1 });
              }}
              className="text-on-surface-variant hover:text-on-surface"
            >
              Limpiar Filtros
            </Button>
          </div>
        </div>
      </div>

      {/* Bottom Sheet de Filtros (Mobile) */}
      {showFilters && createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 md:hidden animate-fade-in"
          onClick={() => setShowFilters(false)}
        >
          <div
            className="bg-surface-container-lowest w-full rounded-t-3xl shadow-elevated p-5 sm:p-6 flex flex-col animate-slide-up relative h-auto max-h-[80vh] overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Handle visual */}
            <div className="w-10 h-1.5 bg-surface-container-highest rounded-full mx-auto mb-5 shrink-0" />

            <div className="flex items-center justify-between mb-6 shrink-0">
              <h3 className="text-title-lg font-bold text-on-surface">Filtros</h3>
              <button
                onClick={() => setShowFilters(false)}
                className="text-on-surface-variant hover:text-on-surface flex items-center justify-center w-8 h-8 rounded-full bg-surface-container-high transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="flex flex-col gap-6 overflow-y-auto pb-4">
              {hasRol('Administrador') && (
                <div className="flex flex-col gap-3">
                  <span className="text-label-lg font-bold text-on-surface-variant uppercase tracking-wide">
                    Estado del Inventario
                  </span>
                  <div className="bg-surface-container-low border border-divider rounded-2xl p-4 flex items-center justify-between">
                    <span className="text-body-lg font-medium text-on-surface">Ver inactivos</span>
                    <ToggleSwitch
                      checked={includeDeleted}
                      onChange={(val) => updateFilters({ include_deleted: val, page: 1 })}
                      id="toggle-inactivos-stock-mobile"
                    />
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-3">
                <span className="text-label-lg font-bold text-on-surface-variant uppercase tracking-wide">
                  Categoría
                </span>
                <div className="relative inline-block w-full">
                  <select
                    value={categoria}
                    onChange={(e) => updateFilters({ categoria: e.target.value, page: 1 })}
                    className="appearance-none w-full px-4 py-3 text-body-lg rounded-2xl border border-divider bg-surface-container-low text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Todas las categorías</option>
                    {categoriasOptions.map(cat => (
                      <option key={cat.id_categoria_motivo} value={cat.id_categoria_motivo}>
                        {cat.nombre}
                      </option>
                    ))}
                  </select>
                  <FiChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant" />
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <span className="text-label-lg font-bold text-on-surface-variant uppercase tracking-wide">
                  Estado
                </span>
                <div className="relative inline-block w-full">
                  <select
                    value={estado}
                    onChange={(e) => updateFilters({ estado: e.target.value, page: 1 })}
                    className="appearance-none w-full px-4 py-3 text-body-lg rounded-2xl border border-divider bg-surface-container-low text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Todos los estados</option>
                    {ESTADOS.filter(e => e !== '').map(e => (
                      <option key={e} value={e}>
                        {badgeConfig[e]?.label ?? e}
                      </option>
                    ))}
                  </select>
                  <FiChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant" />
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <span className="text-label-lg font-bold text-on-surface-variant uppercase tracking-wide">
                  Talle
                </span>
                <input
                  type="text"
                  placeholder="Ej: M, L, Único"
                  value={talle}
                  onChange={(e) => updateFilters({ talle: e.target.value, page: 1 })}
                  className="w-full px-4 py-3 text-body-lg rounded-2xl border border-divider bg-surface-container-low text-on-surface focus:outline-none focus:ring-2 focus:ring-primary placeholder-on-surface-variant/50"
                />
              </div>
            </div>

            <div className="pt-5 mt-2 border-t border-divider flex gap-3 shrink-0">
              <Button
                onClick={() => {
                  updateFilters({ categoria: null, estado: null, talle: null, include_deleted: false, page: 1 });
                }}
                className="flex-1 h-12 flex justify-center items-center bg-surface-container-high text-on-surface hover:bg-surface-container-highest"
              >
                Limpiar
              </Button>
              <Button onClick={() => setShowFilters(false)} className="flex-1 h-12 flex justify-center items-center">
                Aplicar
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}

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

