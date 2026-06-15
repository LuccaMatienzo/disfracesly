import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/api/axios.instance';
import { useOperaciones } from '@/hooks/useOperaciones';
import { useUrlFilters } from '@/hooks/useUrlFilters';
import { useDebounce } from '@/hooks/useDebounce';
import { useFeedback } from '@/context/FeedbackContext';
import Table, { Pagination } from '@/components/ui/Table';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input, { Select } from '@/components/ui/Input';
import ActionButtons from '@/components/ui/ActionButtons';
import ConfirmDeleteModal from '@/components/ui/ConfirmDeleteModal';
import OperacionViewModal from '@/components/ui/OperacionViewModal';
import { useAuth } from '@/context/AuthContext';
import ToggleSwitch from '@/components/ui/ToggleSwitch';
import SortToggle from '@/components/ui/SortToggle';
import { FiChevronDown } from 'react-icons/fi';

export default function OperacionesList() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { filters, updateFilters, goToPage, reset } = useUrlFilters();
  const { search, include_deleted: includeDeleted, sort_field: sortField, sort_direction: sortDirection, page, limit, tipo = 'alquiler', etapa = '' } = filters;
  const sort = { field: sortField, direction: sortDirection };

  const [localSearch, setLocalSearch] = useState(search);
  const debouncedSearch = useDebounce(localSearch, 300);

  useEffect(() => {
    if (debouncedSearch !== search) {
      updateFilters({ search: debouncedSearch, page: 1 }, { replace: true });
    }
  }, [debouncedSearch, search, updateFilters]);

  const [showFilters, setShowFilters] = useState(false);

  const handleSortChange = (field, direction) => {
    updateFilters({ sort_field: field, sort_direction: direction, page: 1 });
  };

  const { showSuccess, showError } = useFeedback();
  const { hasRol } = useAuth();

  const [deleteTarget, setDeleteTarget] = useState(null); // { id, label }
  const [viewId, setViewId] = useState(null);             // id de operación en modal Ver

  // ─── Query ────────────────────────────────────────────────────────────────
  const queryFilters = { ...filters, tipo };
  const { data, isLoading } = useOperaciones(queryFilters);

  // ─── Mutación: soft-delete ────────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/operaciones/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operaciones'] });
      showSuccess('Operación eliminada correctamente');
      setDeleteTarget(null);
    },
    onError: (err) => {
      showError(err?.response?.data?.message ?? 'Error al eliminar la operación');
      setDeleteTarget(null);
    },
  });

  // ─── Mutación: restore ────────────────────────────────────────────────────
  const restoreMutation = useMutation({
    mutationFn: (id) => api.patch(`/operaciones/${id}/restore`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operaciones'] });
      showSuccess('Operación restaurada correctamente');
    },
    onError: (err) => {
      showError(err?.response?.data?.message ?? 'Error al restaurar la operación');
    },
  });

  const handlePrint = (operacion) => {
    const newWin = window.open('', '_blank');
    if (!newWin) return;
    const isAlquiler = !!operacion.alquiler;
    const details = operacion.alquiler || operacion.venta || {};
    
    newWin.document.write(`
      <html>
        <head>
          <title>Imprimir Operación #${operacion.id_operacion}</title>
          <style>
            @media print {
              @page { margin: 0; }
              body { padding: 1.5cm; }
            }
            body { font-family: sans-serif; padding: 20px; color: #333; }
            .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #ccc; padding-bottom: 10px; margin-bottom: 20px; }
            .header-left { display: flex; align-items: center; gap: 10px; }
            .logo { height: 40px; }
            h1 { margin: 0; color: #65a30d; font-size: 24px; }
            .print-date { font-size: 18px; font-weight: bold; color: #666; }
            .info { margin-bottom: 10px; line-height: 1.5; font-size: 14px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f5f5f5; }
            h2, h3 { margin-bottom: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="header-left">
              <img src="${window.location.origin}/logo_svg_verdelima.svg" class="logo" alt="Logo" />
              <h1>DisfracesLy</h1>
            </div>
            <div class="print-date">${new Date().toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })}</div>
          </div>
          <h2>Operación de ${isAlquiler ? 'Alquiler' : 'Venta'} #${operacion.id_operacion}</h2>
          <div class="info"><strong>Cliente:</strong> ${operacion.cliente?.persona?.nombre ?? ''} ${operacion.cliente?.persona?.apellido ?? ''}</div>
          <div class="info"><strong>Monto Total:</strong> $${operacion.monto_total}</div>
          ${isAlquiler ? `<div class="info"><strong>Depósito:</strong> $${details.deposito_monto ?? 0}</div>` : ''}
          <div class="info">
            <strong>Fechas:</strong><br/>
            Constitución: ${new Date(operacion.fecha_constitucion).toLocaleDateString()}<br/>
            ${isAlquiler && details.fecha_retiro ? `Retiro: ${new Date(details.fecha_retiro).toLocaleDateString()}<br/>` : ''} 
            ${isAlquiler && details.fecha_devolucion ? `Devolución: ${new Date(details.fecha_devolucion).toLocaleDateString()}` : ''}
            ${!isAlquiler && operacion.fecha_retiro ? `Entrega: ${new Date(operacion.fecha_retiro).toLocaleDateString()}` : ''}
          </div>
          <div class="info"><strong>Observaciones:</strong> ${operacion.observaciones || 'Sin observaciones'}</div>
          
          <h3>Piezas</h3>
          ${operacion.detalles && operacion.detalles.length > 0 ? `
          <table>
            <tr><th>Pieza</th><th>Talle</th><th>Descripción</th></tr>
            ${operacion.detalles.map(d => {
              const nombre = d.piezaStock?.pieza?.nombre ?? 'Desconocida';
              const talle = d.piezaStock?.talle ?? 'Único';
              const desc = d.piezaStock?.descripcion ?? '-';
              return `<tr><td>${nombre}</td><td>${talle}</td><td>${desc}</td></tr>`;
            }).join('')}
          </table>
          ` : '<p>Sin piezas registradas</p>'}
          
          <script>
            window.onload = () => { window.print(); };
          </script>
        </body>
      </html>
    `);
    newWin.document.close();
  };

  // ─── Columnas ─────────────────────────────────────────────────────────────
  const columns = [
    { key: 'id_operacion', label: '#', width: '60px' },
    {
      key: 'cliente',
      label: 'Cliente',
      render: (_, r) => <span className={r.deleted_at ? 'text-coral font-medium' : ''}>{`${r.cliente?.persona?.nombre ?? ''} ${r.cliente?.persona?.apellido ?? ''}`}</span>,
    },
    {
      key: 'tipo',
      label: 'Tipo',
      render: (_, r) => (
        <span className={`font-label font-semibold text-body-md ${r.deleted_at ? 'text-coral' : r.alquiler ? 'text-primary' : 'text-secondary'}`}>
          {r.alquiler ? 'Alquiler' : 'Venta'}
        </span>
      ),
    },
    {
      key: 'etapa',
      label: 'Etapa',
      render: (_, r) => {
        const etapa = r.alquiler?.etapa ?? r.venta?.etapa;
        if (r.deleted_at) return <Badge variant="deleted">DE BAJA</Badge>;
        return etapa ? <Badge value={etapa} /> : '—';
      },
    },
    {
      key: 'monto_total',
      label: 'Monto',
      render: (v, r) => <span className={r.deleted_at ? 'text-coral' : ''}>${parseFloat(v).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>,
    },
    {
      key: 'fecha_constitucion',
      label: 'Fecha',
      render: (v, r) =>
        <span className={r.deleted_at ? 'text-coral' : ''}>{new Date(v).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: '2-digit' })}</span>,
    },
    {
      key: 'acciones',
      label: 'Acciones',
      width: '120px',
      align: 'center',
      render: (_, r) => {
        const tipoLabel = r.alquiler ? 'alquiler' : 'venta';
        const clienteNombre = `${r.cliente?.persona?.nombre ?? ''} ${r.cliente?.persona?.apellido ?? ''}`.trim();
        const isDeleted = !!r.deleted_at;
        return (
          <ActionButtons
            onView={!isDeleted ? () => setViewId(r.id_operacion) : undefined}
            {...(!isDeleted && {
              onDetail: () => navigate(`/admin/operaciones/${r.id_operacion}`),
              onPrint: () => handlePrint(r),
            })}
            {...(!hasRol('Empleado') && !isDeleted && {
              onDelete: () =>
                setDeleteTarget({
                  id: r.id_operacion,
                  label: `${tipoLabel} de ${clienteNombre}`,
                }),
            })}
            {...(hasRol('Administrador') && isDeleted && {
              onRestore: () => restoreMutation.mutate(r.id_operacion)
            })}
          />
        );
      },
    },
  ];

  /* ─── Tab state ─────────────────────────────────────────────────────────── */
  const handleTabChange = (newTipo) => {
    updateFilters({ tipo: newTipo, etapa: null, search: null, page: 1 });
    setLocalSearch('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-row items-center justify-between gap-2 md:gap-4 w-full mb-6">
        {/* Segmented Control */}
        <div className="min-w-0 overflow-x-auto">
          <div className="inline-flex h-11 bg-surface-container-high border border-transparent dark:border-zinc-800 rounded-xl items-center">
            <button
              type="button"
              onClick={() => handleTabChange('alquiler')}
              className={[
                'relative flex h-full items-center justify-center px-6 rounded-xl text-sm font-medium transition-all duration-200',
                tipo === 'alquiler'
                  ? 'bg-surface-container-lowest shadow-sm text-primary font-semibold'
                  : 'bg-transparent text-gray-500 hover:text-gray-700 dark:text-zinc-400 dark:hover:text-zinc-200',
              ].join(' ')}
            >
              Alquileres
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('venta')}
              className={[
                'relative flex h-full items-center justify-center px-6 rounded-xl text-sm font-medium transition-all duration-200',
                tipo === 'venta'
                  ? 'bg-surface-container-lowest shadow-sm text-primary font-semibold'
                  : 'bg-transparent text-gray-500 hover:text-gray-700 dark:text-zinc-400 dark:hover:text-zinc-200',
              ].join(' ')}
            >
              Ventas
            </button>
          </div>
        </div>

        {/* CTA */}
        {!hasRol('Empleado') && (
          <Link to={`/admin/operaciones/${tipo === 'alquiler' ? 'alquiler' : 'venta'}/nuevo`}>
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
              placeholder="Buscar por ID o Nombre de cliente…"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`md:hidden flex-shrink-0 h-11 w-11 flex items-center justify-center rounded-xl transition-colors border ${
              showFilters || includeDeleted || etapa || sort.field
                ? 'bg-primary/10 text-primary border-primary/20'
                : 'bg-surface-container-high text-on-surface-variant border-transparent dark:border-zinc-800 hover:bg-surface-container-highest'
            }`}
            title="Filtros y Orden"
          >
            <span className="material-symbols-outlined text-[20px]">
              {showFilters ? 'close' : 'tune'}
            </span>
          </button>
        </div>

        {/* Barra de ordenamiento y toggle (Desktop) */}
        <div className="hidden md:flex flex-row flex-nowrap overflow-x-auto whitespace-nowrap gap-3 pb-2 w-full pt-3 border-t border-divider items-center min-w-0 overflow-visible justify-start">
          <div className="flex flex-row items-center gap-3 shrink-0">
            {hasRol('Administrador') && (
              <>
                <div className="shrink-0">
                  <ToggleSwitch
                    checked={includeDeleted}
                    onChange={(val) => updateFilters({ include_deleted: val, page: 1 })}
                    label="Ver inactivos"
                    id="toggle-inactivos-operaciones"
                  />
                </div>
                <div className="w-px h-6 bg-divider shrink-0"></div>
              </>
            )}

            {/* Filtro por Etapas (Nativo) */}
            <div className="relative inline-block shrink-0">
              <select
                value={etapa}
                onChange={(e) => updateFilters({ etapa: e.target.value, page: 1 })}
                className="appearance-none w-auto px-3 py-1 pr-8 text-sm font-medium rounded-full border border-outline-variant bg-surface-container text-on-surface cursor-pointer focus:outline-none"
              >
                <option value="" className="bg-surface-container text-on-surface">Todas las etapas</option>
                <option value="RESERVADO" className="bg-surface-container text-on-surface">Reservado</option>
                {tipo === 'alquiler' ? (
                  <>
                    <option value="LISTO_PARA_RETIRO" className="bg-surface-container text-on-surface">Listo para retiro</option>
                    <option value="RETIRADO" className="bg-surface-container text-on-surface">Retirado</option>
                    <option value="DEVUELTO" className="bg-surface-container text-on-surface">Devuelto</option>
                  </>
                ) : (
                  <>
                    <option value="LISTO_PARA_ENTREGA" className="bg-surface-container text-on-surface">Listo para entrega</option>
                    <option value="VENDIDO" className="bg-surface-container text-on-surface">Vendido</option>
                  </>
                )}
                <option value="CANCELADO" className="bg-surface-container text-on-surface">Cancelado</option>
              </select>
              <FiChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant size-3.5" />
            </div>

            <div className="w-px h-6 bg-divider shrink-0 ml-1"></div>

            <span className="text-label-lg font-label font-medium text-on-surface-variant uppercase tracking-wide shrink-0 ml-1">
              Ordenar:
            </span>
          </div>
          
          <div className="flex flex-row items-center gap-2 shrink-0 lg:flex-nowrap">
            <SortToggle
              label="Fecha Const."
              field="fecha_constitucion"
              currentSort={sort}
              onSortChange={handleSortChange}
            />
            <SortToggle
              label={tipo === 'alquiler' ? "Fecha Retiro" : "Fecha Entrega"}
              field="fecha_retiro"
              currentSort={sort}
              onSortChange={handleSortChange}
            />
            {tipo === 'alquiler' && (
              <SortToggle
                label="Fecha Devolución"
                field="fecha_devolucion"
                currentSort={sort}
                onSortChange={handleSortChange}
              />
            )}
          </div>

          <div className="ml-auto shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                updateFilters({ etapa: null, include_deleted: false, sort_field: null, sort_direction: null, page: 1 });
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
            className="bg-surface-container-lowest w-full rounded-t-3xl shadow-elevated p-5 sm:p-6 flex flex-col animate-slide-up relative max-h-[90vh] overflow-hidden" 
            onClick={e => e.stopPropagation()}
          >
            {/* Handle visual */}
            <div className="w-10 h-1.5 bg-surface-container-highest rounded-full mx-auto mb-5 shrink-0" />

            <div className="flex items-center justify-between mb-6 shrink-0">
              <h3 className="text-title-lg font-bold text-on-surface">Filtros y Orden</h3>
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
                    Estado
                  </span>
                  <div className="bg-surface-container-low border border-divider rounded-2xl p-4 flex items-center justify-between">
                    <span className="text-body-lg font-medium text-on-surface">Ver inactivos</span>
                    <ToggleSwitch
                      checked={includeDeleted}
                      onChange={(val) => updateFilters({ include_deleted: val, page: 1 })}
                      id="toggle-inactivos-operaciones-mobile"
                    />
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-3">
                <span className="text-label-lg font-bold text-on-surface-variant uppercase tracking-wide">
                  Etapa
                </span>
                <div className="relative inline-block w-full">
                  <select
                    value={etapa}
                    onChange={(e) => updateFilters({ etapa: e.target.value, page: 1 })}
                    className="appearance-none w-full px-4 py-3 text-body-lg rounded-2xl border border-divider bg-surface-container-low text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Todas las etapas</option>
                    <option value="RESERVADO">Reservado</option>
                    {tipo === 'alquiler' ? (
                      <>
                        <option value="LISTO_PARA_RETIRO">Listo para retiro</option>
                        <option value="RETIRADO">Retirado</option>
                        <option value="DEVUELTO">Devuelto</option>
                      </>
                    ) : (
                      <>
                        <option value="LISTO_PARA_ENTREGA">Listo para entrega</option>
                        <option value="VENDIDO">Vendido</option>
                      </>
                    )}
                    <option value="CANCELADO">Cancelado</option>
                  </select>
                  <FiChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant" />
                </div>
              </div>

              {/* Ordenamiento */}
              <div className="flex flex-col gap-3 mt-2">
                <span className="text-label-lg font-bold text-on-surface-variant uppercase tracking-wide">
                  Ordenar por
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <SortToggle
                    label="Fecha Const."
                    field="fecha_constitucion"
                    currentSort={sort}
                    onSortChange={handleSortChange}
                    className="w-full justify-center bg-surface-container-low py-3"
                  />
                  <SortToggle
                    label={tipo === 'alquiler' ? "Fecha Retiro" : "Fecha Entrega"}
                    field="fecha_retiro"
                    currentSort={sort}
                    onSortChange={handleSortChange}
                    className="w-full justify-center bg-surface-container-low py-3"
                  />
                  {tipo === 'alquiler' && (
                    <SortToggle
                      label="Fecha Devolución"
                      field="fecha_devolucion"
                      currentSort={sort}
                      onSortChange={handleSortChange}
                      className="w-full justify-center bg-surface-container-low col-span-2"
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="pt-5 mt-2 border-t border-divider flex gap-3 shrink-0">
              <Button 
                onClick={() => {
                  updateFilters({ etapa: null, include_deleted: false, sort_field: null, sort_direction: null, page: 1 });
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
        <Table columns={columns} data={data?.data} loading={isLoading} emptyMessage="Sin operaciones" />
        <div className="px-4 pb-4">
          <Pagination meta={data?.meta} page={page} onPageChange={goToPage} />
        </div>
      </div>

      {/* Modal Ver */}
      <OperacionViewModal
        id={viewId}
        open={!!viewId}
        onClose={() => setViewId(null)}
      />

      {/* Modal de confirmación */}
      <ConfirmDeleteModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
        entityName={`operación (${deleteTarget?.label ?? ''})`}
        loading={deleteMutation.isPending}
      />


    </div>
  );
}

