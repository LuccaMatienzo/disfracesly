import { useState } from 'react';
import Modal from './Modal';
import Button from './Button';
import Input from './Input';

export default function CierreWarningModal({ open, onClose, onSubmit, requiereMonto, requiereDeposito, loading }) {
  const [motivoMonto, setMotivoMonto] = useState('');
  const [motivoDeposito, setMotivoDeposito] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      motivo_diferencia_monto: requiereMonto ? motivoMonto : undefined,
      deposito_motivo_retencion: requiereDeposito ? motivoDeposito : undefined,
    });
  };

  const footer = (
    <>
      <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
        Cancelar
      </Button>
      <Button type="button" variant="primary" onClick={handleSubmit} loading={loading}>
        Confirmar Cierre
      </Button>
    </>
  );

  return (
    <Modal open={open} onClose={loading ? () => {} : onClose} title="Cierre con Saldos Pendientes" size="md" footer={footer}>
      <div className="flex items-center gap-3 mb-4 text-error">
        <span className="material-symbols-outlined text-3xl">warning</span>
        <h3 className="text-xl font-headline font-semibold text-on-surface">
          Precaución Requerida
        </h3>
      </div>

      <div className="mt-2 text-on-surface-variant text-sm mb-6">
        <p>
          Se ha detectado que la operación no está totalmente saldada financieramente.
          Para poder cerrarla, debes justificar los siguientes motivos:
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {requiereMonto && (
          <Input
            label="Motivo de Diferencia de Monto *"
            placeholder="Ej. Descuento aplicado, deuda perdonada, etc."
            value={motivoMonto}
            onChange={(e) => setMotivoMonto(e.target.value)}
            required
          />
        )}
        
        {requiereDeposito && (
          <Input
            label="Motivo de Retención de Depósito *"
            placeholder="Ej. Prenda dañada, manchada, etc."
            value={motivoDeposito}
            onChange={(e) => setMotivoDeposito(e.target.value)}
            required
          />
        )}
      </form>
    </Modal>
  );
}
