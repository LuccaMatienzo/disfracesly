import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/api/axios.instance';
import { usePagination } from '@/hooks/usePagination';
import { useFeedback } from '@/context/FeedbackContext';
import { useAuth } from '@/context/AuthContext';
import Table, { Pagination } from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import ActionButtons from '@/components/ui/ActionButtons';
import ConfirmDeleteModal from '@/components/ui/ConfirmDeleteModal';
import ClienteViewModal from '@/components/ui/ClienteViewModal';
import SortToggle from '@/components/ui/SortToggle';
import ToggleSwitch from '@/components/ui/ToggleSwitch';

/**
 * ClientesList -- Vista principal del modulo Clientes.
 *
 * Integra el componente SortToggle para permitir ordenamiento dinamico
 * por columna. El estado de sort se eleva a este componente y se propaga
 * como query params a la API de backend para un ordenamiento server-side.
 */
export default function ClientesList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { page, limit, goToPage, reset } = usePagination();
  const [search, setSearch] = useState('');
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const { showSuccess, showError } = useFeedback();

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [viewId, setViewId] = useState(null);

  const [sort, setSort] = useState({ field: null, direction: null });

  /**
   * Callback para SortToggle. Actualiza el estado de ordenamiento
   * y reinicia la paginacion a la primera pagina para reflejar
   * el nuevo orden desde el inicio del dataset.
   */
  const handleSortChange = (field, direction) => {
    setSort({ field, direction });
    reset();
  };

  // -- Query ----------------------------------------------------------------
  const { data, isLoading } = useQuery({
    queryKey: ['clientes', { page, limit, search, includeDeleted, sort }],
    queryFn: () =>
      api
        .get('/clientes', {
          params: {
            page,
            limit,
            search: search || undefined,
            include_deleted: includeDeleted,
            sort_field: sort.field ?? undefined,
            sort_direction: sort.direction ?? undefined,
          },
        })
        .then((r) => r.data),
  });

  // -- Mutacion: soft-delete -------------------------------------------------
  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/clientes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      showSuccess('Cliente eliminado correctamente');
      setDeleteTarget(null);
    },
    onError: (err) => {
      showError(err?.response?.data?.message ?? 'Error al eliminar el cliente');
      setDeleteTarget(null);
    },
  });

  // -- Mutacion: restore -----------------------------------------------------
  const restoreMutation = useMutation({
    mutationFn: (id) => api.patch(`/clientes/${id}/restore`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      showSuccess('Cliente restaurado correctamente');
    },
    onError: (err) => {
      showError(err?.response?.data?.message ?? 'Error al restaurar el cliente');
    },
  });

  // -- Columnas --------------------------------------------------------------
  const columns = [
    { key: 'id_cliente', label: '#', width: '60px' },
    {
      key: 'persona',
      label: 'Nombre',
      render: (_, r) => (
        <div className={`flex items-center gap-2 ${r.deleted_at ? 'text-coral font-medium' : ''}`}>
          <span>{`${r.persona?.nombre ?? ''} ${r.persona?.apellido ?? ''}`.trim()}</span>
        </div>
      ),
    },
    { key: 'documento', label: 'Documento', render: (_, r) => <span className={r.deleted_at ? 'text-coral' : ''}>{r.persona?.documento ?? '—'}</span> },
    { key: 'telefono', label: 'Telefono', render: (_, r) => <span className={r.deleted_at ? 'text-coral' : ''}>{r.telefono}</span> },
    {
      key: 'fecha_alta',
      label: 'Alta',
      render: (v, r) => <span className={r.deleted_at ? 'text-coral' : ''}>{new Date(v).toLocaleDateString('es-AR')}</span>,
    },
    {
      key: 'acciones',
      label: 'Acciones',
      width: '140px',
      align: 'center',
      render: (_, r) => {
        const nombreCompleto = `${r.persona?.nombre ?? ''} ${r.persona?.apellido ?? ''}`.trim();
        const isDeleted = !!r.deleted_at;
        return (
          <ActionButtons
            onView={!isDeleted ? () => setViewId(r.id_cliente) : undefined}
            onEdit={!isDeleted ? () => navigate(`/admin/clientes/${r.id_cliente}/editar`) : undefined}
            onDelete={!isDeleted ? () => setDeleteTarget({ id: r.id_cliente, nombre: nombreCompleto }) : undefined}
            onRestore={isDeleted ? () => restoreMutation.mutate(r.id_cliente) : undefined}
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
              Clientes
            </div>
          </div>
        </div>

        <Link to="/admin/clientes/nuevo">
          <Button className="h-11 px-4 flex items-center justify-center gap-2 whitespace-nowrap flex-shrink-0">
            <span className="material-symbols-outlined text-[18px]">add</span>
            Nuevo
          </Button>
        </Link>
      </div>

      {/* Toolbar */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-card p-3 lg:p-5 flex flex-col gap-4">
        {/* Buscador */}
        <div className="flex flex-row flex-nowrap w-full gap-2 items-center">
          <div className="flex-1 min-w-0">
            <Input
              placeholder="Buscar por nombre o documento..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); reset(); }}
            />
          </div>
          <Button
            onClick={() => reset()}
            className="h-[48px] shrink-0 px-4 lg:px-6"
          >
            <span className="material-symbols-outlined text-[20px] sm:mr-2">search</span>
            <span className="hidden sm:inline">Buscar</span>
          </Button>
        </div>

        {/* Barra de ordenamiento (Cinta Deslizable) */}
        <div className="flex flex-row flex-nowrap overflow-x-auto whitespace-nowrap gap-3 pb-2 w-full pt-3 border-t border-divider items-center min-w-0 lg:overflow-visible lg:pb-0 lg:justify-start">
          <div className="flex flex-row items-center gap-3 shrink-0">
            {user?.rol === 'Administrador' && (
              <>
                <div className="shrink-0">
                  <ToggleSwitch
                    checked={includeDeleted}
                    onChange={(val) => { setIncludeDeleted(val); reset(); }}
                    label="Ver inactivos"
                    id="toggle-inactivos-clientes"
                  />
                </div>
                <div className="w-px h-6 bg-divider shrink-0"></div>
              </>
            )}
            <span className="text-label-lg font-label font-medium text-on-surface-variant uppercase tracking-wide shrink-0">
              Ordenar:
            </span>
          </div>
          
          <div className="flex flex-row items-center gap-2 shrink-0 lg:flex-nowrap">
            <SortToggle
              label="Nombre"
              field="nombre"
              currentSort={sort}
              onSortChange={handleSortChange}
            />
            <SortToggle
              label="Apellido"
              field="apellido"
              currentSort={sort}
              onSortChange={handleSortChange}
            />
            <SortToggle
              label="Fecha de Alta"
              field="fecha_alta"
              currentSort={sort}
              onSortChange={handleSortChange}
            />
            <SortToggle
              label="Documento"
              field="documento"
              currentSort={sort}
              onSortChange={handleSortChange}
            />
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="md:bg-surface-container-lowest rounded-2xl md:shadow-card md:overflow-hidden">
        <Table columns={columns} data={data?.data} loading={isLoading} emptyMessage="Sin clientes" />
        <div className="px-4 pb-4">
          <Pagination meta={data?.meta} page={page} onPageChange={goToPage} />
        </div>
      </div>

      {/* Modal Ver */}
      <ClienteViewModal
        id={viewId}
        open={!!viewId}
        onClose={() => setViewId(null)}
      />

      {/* Modal de confirmacion */}
      <ConfirmDeleteModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
        entityName={`cliente "${deleteTarget?.nombre ?? ''}"`}
        loading={deleteMutation.isPending}
      />


    </div>
  );
}
