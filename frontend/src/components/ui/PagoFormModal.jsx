import { useState, useEffect, useMemo } from 'react';
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

export default function PagoFormModal({ open, onClose, onSubmit, loading, initialData, operacion }) {
  const [formData, setFormData] = useState({
    tipo: 'SALDO',
    metodo: 'EFECTIVO',
    monto: '',
  });

  const availableOptions = useMemo(() => {
    if (!operacion) return TIPO_PAGO_OPTIONS;
    
    const options = [];
    const isAlquiler = !!operacion.alquiler;
    const isVenta = !!operacion.venta;
    const saldoPendiente = operacion.estado_financiero?.saldo_pendiente ?? 0;
    
    if (isAlquiler) {
      const depositoPactado = parseFloat(operacion.alquiler.deposito_monto ?? 0);
      const depositoPagado = operacion.estado_financiero?.deposito_garantia ?? 0;
      const depositoPendiente = Math.max(0, depositoPactado - depositoPagado);

      if (depositoPendiente > 0 || (initialData && initialData.tipo === 'DEPOSITO')) {
        options.push({ value: 'DEPOSITO', label: 'Depósito' });
      }
      
      if (saldoPendiente > 0 || (initialData && initialData.tipo === 'SALDO')) {
        options.push({ value: 'SALDO', label: 'Saldo' });
      }
      
      options.push({ value: 'DEVOLUCION_DEPOSITO', label: 'Devolución Depósito' });
      options.push({ value: 'AJUSTE', label: 'Ajuste' });
    } else if (isVenta) {
      const senaPactada = parseFloat(operacion.venta.sena_monto ?? 0);
      const senaPagada = operacion.estado_financiero?.sena_pagada ?? 0;
      const senaPendiente = Math.max(0, senaPactada - senaPagada);

      if (senaPendiente > 0 || (initialData && initialData.tipo === 'SENA')) {
         options.push({ value: 'SENA', label: 'Seña' });
      }

      if (saldoPendiente > 0 || (initialData && initialData.tipo === 'SALDO')) {
        options.push({ value: 'SALDO', label: 'Saldo' });
      }

      options.push({ value: 'AJUSTE', label: 'Ajuste' });
    }

    return options;
  }, [operacion, initialData]);

  useEffect(() => {
    if (initialData) {
      setFormData({
        tipo: initialData.tipo,
        metodo: initialData.metodo,
        monto: initialData.monto,
      });
    } else if (open) {
      setFormData({
        tipo: availableOptions.find(o => o.value === 'SALDO') ? 'SALDO' : (availableOptions[0]?.value ?? 'SALDO'),
        metodo: 'EFECTIVO',
        monto: '',
      });
    }
  }, [initialData, open, availableOptions]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      monto: parseFloat(formData.monto),
    });
  };

  const handlePositiveNumbersOnly = (e) => {
    if (['e', 'E', '+', '-', '.', ','].includes(e.key)) {
      e.preventDefault();
    }
  };

  const montoNum = parseFloat(formData.monto);
  const isMontoValid = formData.monto !== '' && !isNaN(montoNum) && Number.isInteger(montoNum) && montoNum > 0;
  const montoError = (formData.monto !== '' && !isMontoValid) ? 'El monto debe ser un entero positivo' : undefined;

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
          <Button onClick={handleSubmit} loading={loading} disabled={!isMontoValid || loading}>
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
            {availableOptions.map((opt) => (
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
          min="1"
          step="1"
          placeholder="0"
          value={formData.monto}
          onChange={(e) => setFormData({ ...formData, monto: e.target.value })}
          onKeyDown={handlePositiveNumbersOnly}
          required
          error={montoError}
        />
      </form>
    </Modal>
  );
}
