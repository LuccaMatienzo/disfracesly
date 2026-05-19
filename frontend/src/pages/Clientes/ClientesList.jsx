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
import ClienteViewModal from '@/components/ui/ClienteViewModal';
import ToastContainer from '@/components/ui/Toast';
import { FiSearch } from 'react-icons/fi';

export default function ClientesList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { page, limit, goToPage, reset } = usePagination();
  const [search, setSearch] = useState('');
  const { toasts, success, error, remove } = useToast();

  const [deleteTarget, setDeleteTarget] = useState(null); // { id, nombre }
  const [viewId, setViewId] = useState(null);             // id de cliente en modal Ver

  // ─── Query ────────────────────────────────────────────────────────────────
  const { data, isLoading } = useQuery({
    queryKey: ['clientes', { page, limit, search }],
    queryFn: () =>
      api.get('/clientes', { params: { page, limit, search: search || undefined } }).then((r) => r.data),
  });

  // ─── Mutación: soft-delete ────────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/clientes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      success('Cliente eliminado correctamente');
      setDeleteTarget(null);
    },
    onError: (err) => {
      error(err?.response?.data?.message ?? 'Error al eliminar el cliente');
      setDeleteTarget(null);
    },
  });

  // ─── Columnas ─────────────────────────────────────────────────────────────
  const columns = [
    { key: 'id_cliente', label: '#', width: '60px' },
    {
      key: 'persona',
      label: 'Nombre',
      render: (_, r) => `${r.persona?.nombre ?? ''} ${r.persona?.apellido ?? ''}`,
    },
    { key: 'documento', label: 'Documento', render: (_, r) => r.persona?.documento ?? '—' },
    { key: 'telefono', label: 'Teléfono' },
    {
      key: 'fecha_alta',
      label: 'Alta',
      render: (v) => new Date(v).toLocaleDateString('es-AR'),
    },
    {
      key: 'acciones',
      label: 'Acciones',
      width: '140px',
      align: 'center',
      render: (_, r) => {
        const nombreCompleto = `${r.persona?.nombre ?? ''} ${r.persona?.apellido ?? ''}`.trim();
        return (
          <ActionButtons
            onView={() => setViewId(r.id_cliente)}
            onEdit={() => navigate(`/admin/clientes/${r.id_cliente}/editar`)}
            onDelete={() => setDeleteTarget({ id: r.id_cliente, nombre: nombreCompleto })}
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

      {/* Buscador */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-card p-3 md:p-5">
        <div className="flex flex-col md:flex-row gap-3 md:gap-4">
          <div className="flex-1">
            <Input
              placeholder="Buscar por nombre o documento…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); reset(); }}
            />
          </div>
          <Button
            onClick={() => reset()}
            className="h-[48px] w-full md:w-auto px-6 shrink-0 self-end md:self-auto"
          >
            <FiSearch className="size-5 mr-2" />
            Buscar
          </Button>
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

      {/* Modal de confirmación */}
      <ConfirmDeleteModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
        entityName={`cliente "${deleteTarget?.nombre ?? ''}"`}
        loading={deleteMutation.isPending}
      />

      {/* Toasts */}
      <ToastContainer toasts={toasts} onRemove={remove} />
    </div>
  );
}
