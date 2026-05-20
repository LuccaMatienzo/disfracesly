import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/api/axios.instance';
import { usePagination } from '@/hooks/usePagination';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/context/AuthContext';
import Table, { Pagination } from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import ActionButtons from '@/components/ui/ActionButtons';
import ConfirmDeleteModal from '@/components/ui/ConfirmDeleteModal';
import ToastContainer from '@/components/ui/Toast';
import Badge from '@/components/ui/Badge';
import { FiSearch } from 'react-icons/fi';

export default function UsuariosList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { page, limit, goToPage, reset } = usePagination();
  const [search, setSearch] = useState('');
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const { toasts, success, error, remove } = useToast();

  const [deleteTarget, setDeleteTarget] = useState(null); // { id, nombre }

  // ─── Query ────────────────────────────────────────────────────────────────
  const { data, isLoading } = useQuery({
    queryKey: ['usuarios', { page, limit, search, includeDeleted }],
    queryFn: () =>
      api.get('/usuarios', { params: { page, limit, search: search || undefined, include_deleted: includeDeleted } }).then((r) => r.data),
  });

  // ─── Mutación: soft-delete ────────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/usuarios/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      success('Usuario eliminado correctamente');
      setDeleteTarget(null);
    },
    onError: (err) => {
      error(err?.response?.data?.message ?? 'Error al eliminar el usuario');
      setDeleteTarget(null);
    },
  });

  // ─── Mutación: restore ────────────────────────────────────────────────────
  const restoreMutation = useMutation({
    mutationFn: (id) => api.patch(`/usuarios/${id}/restore`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      success('Usuario restaurado correctamente');
    },
    onError: (err) => {
      error(err?.response?.data?.message ?? 'Error al restaurar el usuario');
    },
  });

  // ─── Columnas ─────────────────────────────────────────────────────────────
  const columns = [
    { key: 'id_usuario', label: '#', width: '60px' },
    {
      key: 'persona',
      label: 'Nombre',
      render: (_, r) => (
        <div className="flex items-center gap-2">
          <span>{`${r.persona?.nombre ?? ''} ${r.persona?.apellido ?? ''}`.trim()}</span>
          {r.deleted_at && <Badge variant="error">Inactivo</Badge>}
        </div>
      ),
    },
    { key: 'correo', label: 'Correo' },
    { key: 'documento', label: 'Documento', render: (_, r) => r.persona?.documento ?? '—' },
    {
      key: 'rol',
      label: 'Rol',
      render: (_, r) => {
        const rol = r.rol?.nombre;
        if (rol === 'Superadministrador') return <Badge variant="primary">{rol}</Badge>;
        if (rol === 'Jefe') return <Badge variant="secondary">{rol}</Badge>;
        return <Badge variant="neutral">{rol}</Badge>;
      },
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
            onEdit={!isDeleted ? () => navigate(`/admin/usuarios/${r.id_usuario}/editar`) : undefined}
            onDelete={!isDeleted ? () => setDeleteTarget({ id: r.id_usuario, nombre: nombreCompleto }) : undefined}
            onRestore={isDeleted ? () => restoreMutation.mutate(r.id_usuario) : undefined}
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
              Usuarios
            </div>
          </div>
        </div>

        <Link to="/admin/usuarios/nuevo">
          <Button className="h-11 px-4 flex items-center justify-center gap-2 whitespace-nowrap flex-shrink-0">
            <span className="material-symbols-outlined text-[18px]">add</span>
            Nuevo
          </Button>
        </Link>
      </div>

      {/* Buscador */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-card p-3 md:p-5">
        <div className="flex flex-col md:flex-row gap-3 md:gap-4 items-center">
          <div className="flex-1 w-full">
            <Input
              placeholder="Buscar por nombre, apellido o correo…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); reset(); }}
            />
          </div>
          {user?.rol === 'Superadministrador' && (
            <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-on-surface-variant min-w-max">
              <input
                type="checkbox"
                className="w-4 h-4 text-primary bg-surface-container-high border-outline-variant/30 rounded focus:ring-primary"
                checked={includeDeleted}
                onChange={(e) => { setIncludeDeleted(e.target.checked); reset(); }}
              />
              Ver inactivos
            </label>
          )}
          <Button
            onClick={() => reset()}
            className="h-[48px] w-full md:w-auto px-6 shrink-0"
          >
            <FiSearch className="size-5 mr-2" />
            Buscar
          </Button>
        </div>
      </div>

      {/* Tabla */}
      <div className="md:bg-surface-container-lowest rounded-2xl md:shadow-card md:overflow-hidden">
        <Table columns={columns} data={data?.data} loading={isLoading} emptyMessage="Sin usuarios" />
        <div className="px-4 pb-4">
          <Pagination meta={data?.meta} page={page} onPageChange={goToPage} />
        </div>
      </div>

      {/* Modal de confirmación */}
      <ConfirmDeleteModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
        entityName={`usuario "${deleteTarget?.nombre ?? ''}"`}
        loading={deleteMutation.isPending}
      />

      {/* Toasts */}
      <ToastContainer toasts={toasts} onRemove={remove} />
    </div>
  );
}
