import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/api/axios.instance';
import { useOperaciones } from '@/hooks/useOperaciones';
import { usePagination } from '@/hooks/usePagination';
import { useToast } from '@/hooks/useToast';
import Table, { Pagination } from '@/components/ui/Table';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input, { Select } from '@/components/ui/Input';
import ActionButtons from '@/components/ui/ActionButtons';
import ConfirmDeleteModal from '@/components/ui/ConfirmDeleteModal';
import OperacionViewModal from '@/components/ui/OperacionViewModal';
import ToastContainer from '@/components/ui/Toast';

export default function OperacionesList() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { page, limit, goToPage, reset } = usePagination();
  const [tipo, setTipo] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [etapa, setEtapa] = useState('');
  
  const [appliedFilters, setAppliedFilters] = useState({ search: '', tipo: '', etapa: '' });

  const { toasts, success, error, remove } = useToast();

  const [deleteTarget, setDeleteTarget] = useState(null); // { id, label }
  const [viewId, setViewId] = useState(null);             // id de operación en modal Ver

  // ─── Query ────────────────────────────────────────────────────────────────
  const { data, isLoading } = useOperaciones({ 
    page, 
    limit, 
    tipo: appliedFilters.tipo || undefined,
    search: appliedFilters.search || undefined,
    etapa: appliedFilters.etapa || undefined
  });

  const handleSearch = () => {
    setAppliedFilters({ search: searchQuery, tipo, etapa });
    reset();
  };

  // ─── Mutación: soft-delete ────────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/operaciones/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operaciones'] });
      success('Operación eliminada correctamente');
      setDeleteTarget(null);
    },
    onError: (err) => {
      error(err?.response?.data?.message ?? 'Error al eliminar la operación');
      setDeleteTarget(null);
    },
  });

  // ─── Columnas ─────────────────────────────────────────────────────────────
  const columns = [
    { key: 'id_operacion', label: '#', width: '60px' },
    {
      key: 'cliente',
      label: 'Cliente',
      render: (_, r) => `${r.cliente?.persona?.nombre ?? ''} ${r.cliente?.persona?.apellido ?? ''}`,
    },
    {
      key: 'tipo',
      label: 'Tipo',
      render: (_, r) => (
        <span className={`font-label font-semibold text-body-md ${r.alquiler ? 'text-primary' : 'text-secondary'}`}>
          {r.alquiler ? 'Alquiler' : 'Venta'}
        </span>
      ),
    },
    {
      key: 'etapa',
      label: 'Etapa',
      render: (_, r) => {
        const etapa = r.alquiler?.etapa ?? r.venta?.etapa;
        return etapa ? <Badge value={etapa} /> : '—';
      },
    },
    {
      key: 'monto_total',
      label: 'Monto',
      render: (v) => `$${parseFloat(v).toLocaleString('es-AR')}`,
    },
    {
      key: 'fecha_constitucion',
      label: 'Fecha',
      render: (v) =>
        new Date(v).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: '2-digit' }),
    },
    {
      key: 'acciones',
      label: 'Acciones',
      width: '120px',
      align: 'center',
      render: (_, r) => {
        const tipoLabel = r.alquiler ? 'alquiler' : 'venta';
        const clienteNombre = `${r.cliente?.persona?.nombre ?? ''} ${r.cliente?.persona?.apellido ?? ''}`.trim();
        return (
          <ActionButtons
            onView={() => setViewId(r.id_operacion)}
            onDetail={() => navigate(`/admin/operaciones/${r.id_operacion}`)}
            onDelete={() =>
              setDeleteTarget({
                id: r.id_operacion,
                label: `${tipoLabel} de ${clienteNombre}`,
              })
            }
          />
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-headline-md font-bold text-on-surface">Operaciones</h1>
          <p className="text-body-md text-on-surface-variant mt-0.5">Alquileres y ventas del sistema</p>
        </div>
        <div className="flex gap-3">
          <Link to="/admin/operaciones/alquiler/nuevo">
            <Button variant="outline">+ Alquiler</Button>
          </Link>
          <Link to="/admin/operaciones/venta/nuevo">
            <Button variant="secondary">+ Venta</Button>
          </Link>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-card p-5">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Input 
              placeholder="Buscar por ID o Nombre de cliente..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <div className="w-full md:w-48">
            <Select value={tipo} onChange={(e) => setTipo(e.target.value)}>
              <option value="">Todos los tipos</option>
              <option value="alquiler">Solo alquileres</option>
              <option value="venta">Solo ventas</option>
            </Select>
          </div>
          <div className="w-full md:w-56">
            <Select value={etapa} onChange={(e) => setEtapa(e.target.value)}>
              <option value="">Todas las etapas</option>
              <option value="RESERVADO">Reservado</option>
              <option value="LISTO_PARA_RETIRO">Listo para retiro</option>
              <option value="RETIRADO">Retirado</option>
              <option value="VENDIDO">Vendido</option>
              <option value="DEVUELTO">Devuelto</option>
              <option value="CANCELADO">Cancelado</option>
            </Select>
          </div>
          <Button onClick={handleSearch} className="shrink-0 md:h-[48px] self-end md:self-auto">
            <span className="material-symbols-outlined mr-2">search</span>
            Buscar
          </Button>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-card overflow-hidden">
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

      {/* Toasts */}
      <ToastContainer toasts={toasts} onRemove={remove} />
    </div>
  );
}
