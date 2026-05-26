/**
 * @component KpiDetailsModal
 * @description Modal reutilizable para mostrar el detalle de un KPI del dashboard.
 *
 * Realiza una petición GET al `endpoint` indicado cuando `open` es true y
 * muestra los datos en un componente `Table` con las columnas especificadas.
 * El estado de carga se refleja en la tabla; los errores se muestran como alerta inline.
 *
 * @param {object}   props
 * @param {boolean}  props.open         - Si el modal está visible
 * @param {Function} props.onClose      - Handler de cierre del modal
 * @param {string}   props.title        - Título del modal
 * @param {string}   props.endpoint     - Endpoint GET a consultar (relativo a la API)
 * @param {object[]} props.columns      - Definición de columnas para el componente Table
 * @param {Function} [props.rowClassName] - Función para asignar clases CSS a filas
 * @returns {JSX.Element}
 */
import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Table from '@/components/ui/Table';
import api from '@/api/axios.instance';

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
          console.error(`[KpiDetailsModal] Error al cargar detalle de KPI (${endpoint}):`, err);
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
