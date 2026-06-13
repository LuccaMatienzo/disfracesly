import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/api/axios.instance';
import { usePagination } from '@/hooks/usePagination';
import { useDebounce } from '@/hooks/useDebounce';
import { useFeedback } from '@/context/FeedbackContext';
import { useAuth } from '@/context/AuthContext';
import Table, { Pagination } from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Input, { Select } from '@/components/ui/Input';
import ActionButtons from '@/components/ui/ActionButtons';
import ConfirmDeleteModal from '@/components/ui/ConfirmDeleteModal';
import Badge from '@/components/ui/Badge';
import ToggleSwitch from '@/components/ui/ToggleSwitch';
import SortToggle from '@/components/ui/SortToggle';
import { FiSearch, FiEye, FiEyeOff, FiChevronDown } from 'react-icons/fi';
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
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const { showSuccess, showError } = useFeedback();

  const [sort, setSort] = useState({ field: null, direction: null });
  const [showFilters, setShowFilters] = useState(false);

  const handleSortChange = (field, direction) => {
    setSort({ field, direction });
    reset();
  };

  const [deleteTarget, setDeleteTarget] = useState(null); // { id, nombre }
  const [roleFilter, setRoleFilter] = useState('');
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetTarget, setResetTarget] = useState(null);

  // ─── Query Roles ──────────────────────────────────────────────────────────
  const { data: roles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: () => api.get('/usuarios/roles').then((r) => r.data),
  });

  useEffect(() => {
    reset();
  }, [debouncedSearchQuery, includeDeleted, roleFilter, reset]);

  // ─── Query ────────────────────────────────────────────────────────────────
  const { data, isLoading } = useQuery({
    queryKey: ['usuarios', { page, limit, search: debouncedSearchQuery, includeDeleted, roleFilter, sort }],
    queryFn: () =>
      api.get('/usuarios', {
        params: {
          page,
          limit,
          search: debouncedSearchQuery || undefined,
          include_deleted: includeDeleted,
          id_rol: roleFilter || undefined,
          sort_field: sort.field ?? undefined,
          sort_direction: sort.direction ?? undefined,
        },
      }).then((r) => r.data),
  });

  // ─── Mutación: soft-delete ────────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/usuarios/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      showSuccess('Usuario eliminado correctamente');
      setDeleteTarget(null);
    },
    onError: (err) => {
      showError(err?.response?.data?.message ?? 'Error al eliminar el usuario');
      setDeleteTarget(null);
    },
  });

  // ─── Mutación: restore ────────────────────────────────────────────────────
  const restoreMutation = useMutation({
    mutationFn: (id) => api.patch(`/usuarios/${id}/restore`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      showSuccess('Usuario restaurado correctamente');
    },
    onError: (err) => {
      showError(err?.response?.data?.message ?? 'Error al restaurar el usuario');
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
        if (r.deleted_at) return <Badge variant="deleted">{rol}</Badge>;
        if (rol === 'Administrador') return <Badge variant="primary">{rol}</Badge>;
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

      {/* Toolbar */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-card p-3 lg:p-5 flex flex-col gap-4">
        {/* Buscador y Toggle */}
        <div className="flex flex-row flex-nowrap w-full gap-2 items-center">
          <div className="flex-1 min-w-0 relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10 pointer-events-none text-[20px]">search</span>
            <Input
              placeholder="Buscar por nombre, apellido o correo…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`md:hidden flex-shrink-0 h-11 w-11 flex items-center justify-center rounded-xl transition-colors border ${
              showFilters || includeDeleted || roleFilter || sort.field
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

        {/* Barra de ordenamiento (Cinta Deslizable - Desktop) */}
        <div className="hidden md:flex flex-row flex-nowrap overflow-x-auto whitespace-nowrap gap-3 pb-2 w-full pt-3 border-t border-divider items-center min-w-0 overflow-visible justify-start">
          <div className="flex flex-row items-center gap-3 shrink-0">
            {user?.rol === 'Administrador' && (
              <>
                <div className="shrink-0">
                  <ToggleSwitch
                    checked={includeDeleted}
                    onChange={(val) => { setIncludeDeleted(val); reset(); }}
                    label="Ver inactivos"
                    id="toggle-inactivos-usuarios"
                  />
                </div>
                <div className="w-px h-6 bg-divider shrink-0"></div>
              </>
            )}

            {/* Filtro por Roles (Nativo) */}
            <div className="relative inline-block shrink-0">
              <select
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  reset();
                }}
                className="appearance-none w-auto px-3 py-1 pr-8 text-sm font-medium rounded-full border border-gray-300 dark:border-gray-600 bg-transparent dark:bg-transparent text-gray-700 dark:text-gray-200 cursor-pointer focus:outline-none"
              >
                <option value="" className="bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-200">Todos los roles</option>
                {roles.map(rol => (
                  <option key={rol.id_rol} value={rol.id_rol} className="bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-200">
                    {rol.nombre}
                  </option>
                ))}
              </select>
              <FiChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 size-3.5" />
            </div>

            <div className="w-px h-6 bg-divider shrink-0 ml-1"></div>

            <span className="text-label-lg font-label font-medium text-on-surface-variant uppercase tracking-wide shrink-0 ml-1">
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
              label="Correo"
              field="correo"
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
              {user?.rol === 'Administrador' && (
                <div className="flex flex-col gap-3">
                  <span className="text-label-lg font-bold text-on-surface-variant uppercase tracking-wide">
                    Estado
                  </span>
                  <div className="bg-surface-container-low border border-divider rounded-2xl p-4 flex items-center justify-between">
                    <span className="text-body-lg font-medium text-on-surface">Ver inactivos</span>
                    <ToggleSwitch
                      checked={includeDeleted}
                      onChange={(val) => { setIncludeDeleted(val); reset(); }}
                      id="toggle-inactivos-usuarios-mobile"
                    />
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-3">
                <span className="text-label-lg font-bold text-on-surface-variant uppercase tracking-wide">
                  Rol
                </span>
                <div className="relative inline-block w-full">
                  <select
                    value={roleFilter}
                    onChange={(e) => {
                      setRoleFilter(e.target.value);
                      reset();
                    }}
                    className="appearance-none w-full px-4 py-3 text-body-lg rounded-2xl border border-divider bg-surface-container-low text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Todos los roles</option>
                    {roles.map(rol => (
                      <option key={rol.id_rol} value={rol.id_rol}>
                        {rol.nombre}
                      </option>
                    ))}
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
                    label="Nombre"
                    field="nombre"
                    currentSort={sort}
                    onSortChange={handleSortChange}
                    className="w-full justify-center bg-surface-container-low py-3"
                  />
                  <SortToggle
                    label="Apellido"
                    field="apellido"
                    currentSort={sort}
                    onSortChange={handleSortChange}
                    className="w-full justify-center bg-surface-container-low py-3"
                  />
                  <SortToggle
                    label="Correo"
                    field="correo"
                    currentSort={sort}
                    onSortChange={handleSortChange}
                    className="w-full justify-center bg-surface-container-low py-3"
                  />
                  <SortToggle
                    label="Documento"
                    field="documento"
                    currentSort={sort}
                    onSortChange={handleSortChange}
                    className="w-full justify-center bg-surface-container-low py-3"
                  />
                </div>
              </div>
            </div>

            <div className="pt-5 mt-2 border-t border-divider flex gap-3 shrink-0">
              <Button 
                onClick={() => {
                  setRoleFilter('');
                  setIncludeDeleted(false);
                  setSort({ field: null, direction: null });
                  reset();
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
  const { showSuccess, showError } = useFeedback();
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
      showSuccess('Contraseña restablecida correctamente');
      reset();
      onClose();
    },
    onError: (err) => {
      showError(err?.response?.data?.message || 'Error al restablecer contraseña');
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
