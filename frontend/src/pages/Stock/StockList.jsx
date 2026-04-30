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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-headline-md font-bold text-on-surface">Inventario</h1>
          <p className="text-body-md text-on-surface-variant mt-0.5">
            Gestión de piezas individuales de stock
          </p>
        </div>
        <Link to="/admin/stock/nuevo">
          <Button>+ Agregar pieza</Button>
        </Link>
      </div>

      {/* Filtros */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-card p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            placeholder="Buscar por nombre de pieza..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); reset(); }}
          />
          <Select value={estado} onChange={(e) => { setEstado(e.target.value); reset(); }}>
            {ESTADOS.map((e) => (
              <option key={e} value={e}>
                {e || 'Todos los estados'}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-card overflow-hidden">
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
