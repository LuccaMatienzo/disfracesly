import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios.instance';
import Modal from './Modal';
import Input from './Input';
import Button from './Button';
import Badge from './Badge';

export default function PiezasModal({ open, onClose, onSubmit, currentDetalles, loading }) {
  const [stockSearch, setStockSearch] = useState('');
  const [selectedPiezas, setSelectedPiezas] = useState(new Map());

  // Set initial state
  useEffect(() => {
    if (open && currentDetalles) {
      const map = new Map();
      currentDetalles.forEach(d => {
        if (d.piezaStock) {
          map.set(d.piezaStock.id_pieza_stock, d.piezaStock);
        }
      });
      setSelectedPiezas(map);
    }
  }, [open, currentDetalles]);

  const { data: stockData } = useQuery({
    queryKey: ['stock-disponible', stockSearch],
    queryFn: () =>
      api.get('/stock', { params: { estado: 'DISPONIBLE', search: stockSearch, limit: 30 } }).then((r) => r.data),
    enabled: open,
  });

  const togglePieza = (pieza) => {
    const id = pieza.id_pieza_stock;
    setSelectedPiezas((prev) => {
      const next = new Map(prev);
      next.has(id) ? next.delete(id) : next.set(id, pieza);
      return next;
    });
  };

  const handleSave = () => {
    if (selectedPiezas.size === 0) return;
    const ids = [...selectedPiezas.keys()].map(Number);
    onSubmit({ pieza_stock_ids: ids });
  };

  const stockItems = stockData?.data ?? [];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Editar Piezas"
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>Cancelar</Button>
          <Button onClick={handleSave} disabled={selectedPiezas.size === 0} loading={loading}>Guardar</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input
          placeholder="Buscar pieza para agregar…"
          value={stockSearch}
          onChange={(e) => setStockSearch(e.target.value)}
        />
        {selectedPiezas.size > 0 && (
          <div className="mb-3 flex gap-2 flex-wrap">
            <span className="text-label-lg text-on-surface-variant">Seleccionadas:</span>
            {[...selectedPiezas.values()].map((pieza) => (
              <button
                key={pieza.id_pieza_stock}
                type="button"
                onClick={() => togglePieza(pieza)}
                className="bg-primary/10 text-primary text-label-lg rounded-pill px-3 py-1 hover:bg-error/10 hover:text-error transition-colors"
              >
                {pieza.pieza?.nombre ?? `#${pieza.id_pieza_stock}`}
                {pieza.talle ? ` (${pieza.talle})` : ''} ✕
              </button>
            ))}
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto">
          {stockItems.map((s) => (
            <button
              key={s.id_pieza_stock}
              type="button"
              onClick={() => togglePieza(s)}
              className={`
                flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all
                ${selectedPiezas.has(s.id_pieza_stock)
                  ? 'border-primary bg-primary/5'
                  : 'border-outline-variant/20 hover:border-primary/30'
                }
              `}
            >
              <div className="flex-1 min-w-0">
                <p className="text-body-md font-medium text-on-surface truncate">{s.pieza?.nombre}</p>
                <p className="text-label-lg text-on-surface-variant">{s.talle ?? 'Sin talle'}</p>
              </div>
              <Badge value={s.estado_pieza_stock} />
            </button>
          ))}
        </div>
        {selectedPiezas.size === 0 && (
          <p className="text-label-lg text-error mt-2">Seleccioná al menos una pieza</p>
        )}
      </div>
    </Modal>
  );
}
