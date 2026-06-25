import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import ConfirmActionModal from '@/components/ui/ConfirmActionModal';
import { useState } from 'react';

const schema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido').max(100),
  descripcion: z.string().optional(),
});

export default function CategoriaFormModal({ open, onClose, onSubmit, initialData = null, loading = false }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { nombre: '', descripcion: '' },
  });

  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingData, setPendingData] = useState(null);

  const handleFormSubmit = (data) => {
    setPendingData(data);
    setShowConfirm(true);
  };

  const handleConfirmSave = () => {
    setShowConfirm(false);
    if (pendingData) {
      onSubmit(pendingData);
    }
  };

  useEffect(() => {
    if (open) {
      if (initialData) {
        reset({ nombre: initialData.nombre, descripcion: initialData.descripcion ?? '' });
      } else {
        reset({ nombre: '', descripcion: '' });
      }
    }
  }, [open, initialData, reset]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initialData ? 'Editar Categoría' : 'Nueva Categoría'}
      icon="category"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        <div className="space-y-4">
          <Input
            label="Nombre de Categoría *"
            placeholder="Ej: Halloween, Superhéroes..."
            {...register('nombre')}
            error={errors.nombre?.message}
          />

          <Input
            label="Descripción (opcional)"
            placeholder="Breve descripción de la categoría..."
            {...register('descripcion')}
            error={errors.descripcion?.message}
          />
        </div>

        <div className="flex flex-row justify-end gap-3 pt-4 border-t border-divider">
          <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </form>

      <ConfirmActionModal
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleConfirmSave}
        title={initialData ? 'Confirmar modificación' : 'Confirmar creación'}
        message={initialData ? '¿Estás seguro que deseas modificar esta categoría?' : '¿Confirmás la creación de esta nueva categoría?'}
        confirmText="Sí, confirmar"
        confirmVariant="primary"
        loading={loading}
      />
    </Modal>
  );
}
