import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import Modal from './Modal';
import Input from './Input';
import Button from './Button';

export default function MontosModal({ open, onClose, onSubmit, isAlquiler, isVenta, currentData, loading }) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    if (open && currentData) {
      reset({
        monto_total: currentData.monto_total,
        deposito_monto: isAlquiler ? currentData.deposito_monto : 0,
        sena_monto: isVenta ? currentData.sena_monto : 0,
      });
    }
  }, [open, currentData, reset, isAlquiler, isVenta]);

  const onFormSubmit = (data) => {
    const payload = { monto_total: Number(data.monto_total) };
    if (isAlquiler) payload.deposito_monto = Number(data.deposito_monto);
    if (isVenta) payload.sena_monto = Number(data.sena_monto);
    onSubmit(payload);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Editar Montos"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>Cancelar</Button>
          <Button onClick={handleSubmit(onFormSubmit)} loading={loading}>Guardar</Button>
        </>
      }
    >
      <form id="montos-form" onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
        <Input
          label="Monto Total ($)"
          type="number"
          step="1"
          min="0"
          {...register('monto_total', { required: 'El monto total es requerido' })}
          error={errors.monto_total?.message}
        />
        {isAlquiler && (
          <Input
            label="Monto de Depósito ($)"
            type="number"
            step="1"
            min="0"
            {...register('deposito_monto')}
            error={errors.deposito_monto?.message}
          />
        )}
        {isVenta && (
          <Input
            label="Monto de Seña ($)"
            type="number"
            step="1"
            min="0"
            {...register('sena_monto')}
            error={errors.sena_monto?.message}
          />
        )}
      </form>
    </Modal>
  );
}
