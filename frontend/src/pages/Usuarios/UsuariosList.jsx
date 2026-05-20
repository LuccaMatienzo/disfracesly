import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/api/axios.instance';
import { usePagination } from '@/hooks/usePagination';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/context/AuthContext';
import Table, { Pagination } from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Input, { Select } from '@/components/ui/Input';
import ActionButtons from '@/components/ui/ActionButtons';
import ConfirmDeleteModal from '@/components/ui/ConfirmDeleteModal';
import ToastContainer from '@/components/ui/Toast';
import Badge from '@/components/ui/Badge';
import ToggleSwitch from '@/components/ui/ToggleSwitch';
import { FiSearch, FiEye, FiEyeOff } from 'react-icons/fi';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Modal from '@/components/ui/Modal';

const resetPasswordSchema = z.object({
  nuevaContrasena: z.string().min(8, 'Mínimo 8 caracteres'),
  confirmarContrasena: z.string().min(8, 'Mínimo 8 caracteres'),
}).refine(data => data.nuevaContrasena === data.confirmarContrasena, {
  message: "Las contraseñas no coinciden",
  path: ["confirmarContrasena"],
});

export default function UsuariosList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { page, limit, goToPage, reset } = usePagination();
  const [search, setSearch] = useState('');
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const { toasts, success, error, remove } = useToast();

  const [deleteTarget, setDeleteTarget] = useState(null); // { id, nombre }
  const [roleFilter, setRoleFilter] = useState('');
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetTarget, setResetTarget] = useState(null);

  // ─── Query Roles ──────────────────────────────────────────────────────────
  const { data: roles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: () => api.get('/usuarios/roles').then((r) => r.data),
  });

  // ─── Query ────────────────────────────────────────────────────────────────
  const { data, isLoading } = useQuery({
    queryKey: ['usuarios', { page, limit, search, includeDeleted, roleFilter }],
    queryFn: () =>
      api.get('/usuarios', { params: { page, limit, search: search || undefined, include_deleted: includeDeleted, id_rol: roleFilter || undefined } }).then((r) => r.data),
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
        <div className={`flex items-center gap-2 ${r.deleted_at ? 'text-coral font-medium' : ''}`}>
          <span>{`${r.persona?.nombre ?? ''} ${r.persona?.apellido ?? ''}`.trim()}</span>
        </div>
      ),
    },
    { key: 'correo', label: 'Correo', render: (_, r) => <span className={r.deleted_at ? 'text-coral' : ''}>{r.correo}</span> },
    { key: 'documento', label: 'Documento', render: (_, r) => <span className={r.deleted_at ? 'text-coral' : ''}>{r.persona?.documento ?? '—'}</span> },
    {
      key: 'rol',
      label: 'Rol',
      render: (_, r) => {
        const rol = r.rol?.nombre;
        if (r.deleted_at) return <span className="text-coral font-medium uppercase text-xs tracking-wider">{rol}</span>;
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
            onPassword={!isDeleted ? () => { setResetTarget(r.id_usuario); setResetModalOpen(true); } : undefined}
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
          <div className="flex-1 w-full flex flex-col md:flex-row gap-3">
            <div className="flex-1">
              <Input
                placeholder="Buscar por nombre, apellido o correo…"
                value={search}
                onChange={(e) => { setSearch(e.target.value); reset(); }}
              />
            </div>
            <Select
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value); reset(); }}
              className="w-full md:w-auto"
            >
              <option value="">Todos los roles</option>
              {roles.map(rol => (
                <option key={rol.id_rol} value={rol.id_rol}>{rol.nombre}</option>
              ))}
            </Select>
          </div>
          {user?.rol === 'Superadministrador' && (
            <ToggleSwitch
              checked={includeDeleted}
              onChange={(val) => { setIncludeDeleted(val); reset(); }}
              label="Ver inactivos"
              id="toggle-inactivos-usuarios"
            />
          )}
          <Button
            onClick={() => reset()}
            className="h-[48px] w-full md:w-auto px-6 shrink-0"
          >
            <span className="material-symbols-outlined text-[20px] mr-2">search</span>
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

      {/* Modal de Restablecer Contraseña */}
      {resetTarget && (
        <ResetPasswordModal
          open={resetModalOpen}
          onClose={() => { setResetModalOpen(false); setResetTarget(null); }}
          userId={resetTarget}
        />
      )}
    </div>
  );
}

function ResetPasswordModal({ open, onClose, userId }) {
  const { success, error } = useToast();
  const [showP1, setShowP1] = useState(false);
  const [showP2, setShowP2] = useState(false);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting, isValid } } = useForm({
    resolver: zodResolver(resetPasswordSchema),
    mode: 'onChange',
    defaultValues: { nuevaContrasena: '', confirmarContrasena: '' },
  });

  const mutation = useMutation({
    mutationFn: (data) => api.put(`/usuarios/${userId}`, { contrasena: data.nuevaContrasena }),
    onSuccess: () => {
      success('Contraseña restablecida correctamente');
      reset();
      onClose();
    },
    onError: (err) => {
      error(err?.response?.data?.message || 'Error al restablecer contraseña');
    }
  });

  const onSubmit = (data) => {
    mutation.mutate(data);
  };

  return (
    <Modal open={open} onClose={onClose} title="Restablecer Contraseña"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="button" onClick={handleSubmit(onSubmit)} loading={isSubmitting} disabled={!isValid || isSubmitting}>
            Restablecer
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="relative">
          <Input
            label="Nueva Contraseña"
            type={showP1 ? 'text' : 'password'}
            error={errors.nuevaContrasena?.message}
            autoComplete="new-password"
            {...register('nuevaContrasena')}
          />
          <button
            type="button"
            onClick={() => setShowP1((p) => !p)}
            className="absolute right-4 top-[38px] text-on-surface-variant hover:text-primary transition-colors"
          >
            {showP1 ? <FiEyeOff size={20} /> : <FiEye size={20} />}
          </button>
        </div>

        <div className="relative">
          <Input
            label="Confirmar Nueva Contraseña"
            type={showP2 ? 'text' : 'password'}
            error={errors.confirmarContrasena?.message}
            autoComplete="new-password"
            {...register('confirmarContrasena')}
          />
          <button
            type="button"
            onClick={() => setShowP2((p) => !p)}
            className="absolute right-4 top-[38px] text-on-surface-variant hover:text-primary transition-colors"
          >
            {showP2 ? <FiEyeOff size={20} /> : <FiEye size={20} />}
          </button>
        </div>
      </form>
    </Modal>
  );
}
