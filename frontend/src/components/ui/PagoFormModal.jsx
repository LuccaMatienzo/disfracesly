import { useState, useEffect } from 'react';
import Modal from './Modal';
import Button from './Button';
import Input, { Select } from './Input';

const TIPO_PAGO_OPTIONS = [
  { value: 'SENA', label: 'Seña' },
  { value: 'DEPOSITO', label: 'Depósito' },
  { value: 'SALDO', label: 'Saldo' },
  { value: 'DEVOLUCION_DEPOSITO', label: 'Devolución Depósito' },
  { value: 'AJUSTE', label: 'Ajuste' },
];

const METODO_OPTIONS = [
  { value: 'EFECTIVO', label: 'Efectivo' },
  { value: 'TRANSFERENCIA', label: 'Transferencia' },
];

export default function PagoFormModal({ open, onClose, onSubmit, loading, initialData }) {
  const [formData, setFormData] = useState({
    tipo: 'SALDO',
    metodo: 'EFECTIVO',
    monto: '',
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        tipo: initialData.tipo,
        metodo: initialData.metodo,
        monto: initialData.monto,
      });
    } else {
      setFormData({
        tipo: 'SALDO',
        metodo: 'EFECTIVO',
        monto: '',
      });
    }
  }, [initialData, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      monto: parseFloat(formData.monto),
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initialData ? 'Editar Pago' : 'Nuevo Pago'}
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} loading={loading}>
            {initialData ? 'Guardar Cambios' : 'Registrar Pago'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 py-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Tipo de Pago"
            value={formData.tipo}
            onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
            required
          >
            {TIPO_PAGO_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>

          <Select
            label="Método"
            value={formData.metodo}
            onChange={(e) => setFormData({ ...formData, metodo: e.target.value })}
            required
          >
            {METODO_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </div>

        <Input
          label="Monto"
          type="number"
          step="100"
          placeholder="0"
          value={formData.monto}
          onChange={(e) => setFormData({ ...formData, monto: e.target.value })}
          required
          autoFocus
        />
      </form>
    </Modal>
  );
}
