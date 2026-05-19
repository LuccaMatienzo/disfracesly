import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/api/axios.instance';
import { useStock } from '@/hooks/useStock';
import { usePagination } from '@/hooks/usePagination';
import { useToast } from '@/hooks/useToast';
import Table, { Pagination } from '@/components/ui/Table';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Select } from '@/components/ui/Input';
import ActionButtons from '@/components/ui/ActionButtons';
import ConfirmDeleteModal from '@/components/ui/ConfirmDeleteModal';
import StockViewModal from '@/components/ui/StockViewModal';
import ToastContainer from '@/components/ui/Toast';
import { FiSearch } from 'react-icons/fi';

const ESTADOS = ['', 'DISPONIBLE', 'RESERVADA', 'ALQUILADA', 'VENDIDA', 'FUERA_DE_SERVICIO'];

export default function StockList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { page, limit, goToPage, reset } = usePagination();
  const [search, setSearch] = useState('');
  const [estado, setEstado] = useState('');
  const { toasts, success, error, remove } = useToast();

  const [deleteTarget, setDeleteTarget] = useState(null); // { id, nombre }
  const [viewId, setViewId] = useState(null);             // id de stock en modal Ver

  // ─── Query ────────────────────────────────────────────────────────────────
  const { data, isLoading } = useStock({
    page,
    limit,
    search: search || undefined,
    estado: estado || undefined,
  });

  // ─── Mutación: soft-delete ────────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/stock/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock'] });
      success('Pieza de stock eliminada correctamente');
      setDeleteTarget(null);
    },
    onError: (err) => {
      error(err?.response?.data?.message ?? 'Error al eliminar la pieza de stock');
      setDeleteTarget(null);
    },
  });

  // ─── Columnas ─────────────────────────────────────────────────────────────
  const columns = [
    { key: 'id_pieza_stock', label: '#', width: '60px' },
    { key: 'pieza', label: 'Pieza', render: (_, r) => r.pieza?.nombre ?? '—' },
    { key: 'talle', label: 'Talle', align: 'center', render: (v) => v ?? '—' },
    {
      key: 'estado_pieza_stock',
      label: 'Estado',
      render: (v) => <Badge value={v} />,
    },
    { key: 'descripcion', label: 'Descripción', render: (v) => v ?? '—' },
    {
      key: 'acciones',
      label: 'Acciones',
      width: '160px',
      align: 'center',
      render: (_, r) => (
        <ActionButtons
          onView={() => setViewId(r.id_pieza_stock)}
          onEdit={() => navigate(`/admin/stock/${r.id_pieza_stock}/editar`)}
          onDelete={() =>
            setDeleteTarget({
              id: r.id_pieza_stock,
              nombre: `${r.pieza?.nombre ?? 'pieza'} (talle: ${r.talle ?? 'único'})`,
            })
          }
        />
      ),
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

        <Link to="/admin/stock/nuevo">
          <Button className="h-11 px-4 flex items-center justify-center gap-2 whitespace-nowrap flex-shrink-0">
            <span className="material-symbols-outlined text-[18px]">add</span>
            Nuevo
          </Button>
        </Link>
      </div>

      {/* Filtros */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-card p-3 md:p-5">
        <div className="flex flex-col md:flex-row gap-3 md:gap-4">
          <div className="flex-1">
            <Input
              placeholder="Buscar por nombre de pieza…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); reset(); }}
            />
          </div>
          <div className="w-full md:w-56">
            <Select value={estado} onChange={(e) => { setEstado(e.target.value); reset(); }}>
              {ESTADOS.map((e) => (
                <option key={e} value={e}>
                  {e || 'Todos los estados'}
                </option>
              ))}
            </Select>
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

      {/* Toasts */}
      <ToastContainer toasts={toasts} onRemove={remove} />
    </div>
  );
}
