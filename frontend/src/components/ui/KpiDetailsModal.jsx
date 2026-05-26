import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Table from '@/components/ui/Table';
import api from '@/api/axios.instance';
import Badge from '@/components/ui/Badge'; // To display badges for etapa

export default function KpiDetailsModal({ open, onClose, title, endpoint, columns, rowClassName }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open && endpoint) {
      const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
          const response = await api.get(endpoint);
          setData(response.data);
        } catch (err) {
          console.error(`Error fetching KPI details from ${endpoint}:`, err);
          setError('No se pudo cargar la información detallada.');
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [open, endpoint]);

  return (
    <Modal open={open} onClose={onClose} title={title} size="xl">
      {error ? (
        <div className="bg-error/10 text-error p-4 rounded-xl text-center">
          <p className="font-semibold">{error}</p>
        </div>
      ) : (
        <Table columns={columns} data={data} loading={loading} emptyMessage="No hay operaciones activas en este momento." rowClassName={rowClassName} />
      )}
      <div className="mt-4 flex justify-end">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-surface-container hover:bg-surface-container-high text-on-surface rounded-lg transition-colors font-semibold text-sm min-h-[44px]"
        >
          Cerrar
        </button>
      </div>
    </Modal>
  );
}
