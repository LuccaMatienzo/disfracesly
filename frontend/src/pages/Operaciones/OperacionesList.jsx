import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/api/axios.instance';
import { useOperaciones } from '@/hooks/useOperaciones';
import { usePagination } from '@/hooks/usePagination';
import { useFeedback } from '@/context/FeedbackContext';
import Table, { Pagination } from '@/components/ui/Table';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input, { Select } from '@/components/ui/Input';
import ActionButtons from '@/components/ui/ActionButtons';
import ConfirmDeleteModal from '@/components/ui/ConfirmDeleteModal';
import OperacionViewModal from '@/components/ui/OperacionViewModal';

export default function OperacionesList() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { page, limit, goToPage, reset } = usePagination();
  const [tipo, setTipo] = useState('alquiler');
  const [searchQuery, setSearchQuery] = useState('');
  const [etapa, setEtapa] = useState('');

  const [appliedFilters, setAppliedFilters] = useState({ search: '', tipo: 'alquiler', etapa: '' });

  const { showSuccess, showError } = useFeedback();

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
      showSuccess('Operación eliminada correctamente');
      setDeleteTarget(null);
    },
    onError: (err) => {
      showError(err?.response?.data?.message ?? 'Error al eliminar la operación');
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

  /* ─── Tab state ─────────────────────────────────────────────────────────── */
  const [activeTab, setActiveTab] = useState('alquiler');

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setTipo(tab);
    setAppliedFilters((prev) => ({ ...prev, tipo: tab }));
    reset();
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
                activeTab === 'alquiler'
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
                activeTab === 'venta'
                  ? 'bg-surface-container-lowest shadow-sm text-primary font-semibold'
                  : 'bg-transparent text-gray-500 hover:text-gray-700 dark:text-zinc-400 dark:hover:text-zinc-200',
              ].join(' ')}
            >
              Ventas
            </button>
          </div>
        </div>

        {/* CTA */}
        <Link to={`/admin/operaciones/${activeTab === 'alquiler' ? 'alquiler' : 'venta'}/nuevo`}>
          <Button className="h-11 px-4 flex items-center justify-center gap-2 whitespace-nowrap flex-shrink-0">
            <span className="material-symbols-outlined text-[18px]">add</span>
            Nuevo
          </Button>
        </Link>
      </div>

      {/* Filtros */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-card p-5">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Buscar por ID o Nombre de cliente…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
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
          <Button onClick={handleSearch} className="h-[48px] w-full md:w-auto px-6 shrink-0">
            <span className="material-symbols-outlined text-[20px] mr-2">search</span>
            Buscar
          </Button>
        </div>
      </div>

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
