import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios.instance';
import { useCreateStock, useUpdateStock, useStockItem } from '@/hooks/useStock';
import { useFeedback } from '@/context/FeedbackContext';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Select } from '@/components/ui/Input';
import PiezaCombobox from '@/components/ui/PiezaCombobox';
import ConfirmActionModal from '@/components/ui/ConfirmActionModal';
import { useState } from 'react';

export default function StockForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const { data: item } = useStockItem(id);

  const createStock = useCreateStock();
  const updateStock = useUpdateStock();

  const { register, handleSubmit, reset, control, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { id_pieza: '', talle: '', medidas: '', descripcion: '', estado_pieza_stock: 'DISPONIBLE' },
  });

  useEffect(() => {
    if (isEditing && item) {
      reset({
        id_pieza: String(item.id_pieza),
        talle: item.talle ?? '',
        medidas: item.medidas ?? '',
        descripcion: item.descripcion ?? '',
        estado_pieza_stock: item.estado_pieza_stock,
      });
    }
  }, [item, isEditing, reset]);

  const { showSuccess } = useFeedback();
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingData, setPendingData] = useState(null);

  const onSubmit = (data) => {
    setPendingData(data);
    setShowConfirm(true);
  };

  const handleConfirmSave = async () => {
    if (!pendingData) return;
    const payload = { ...pendingData, id_pieza: Number(pendingData.id_pieza) };
    try {
      setShowConfirm(false);
      if (isEditing) {
        await updateStock.mutateAsync({ id, data: payload });
        showSuccess('La pieza de stock ha sido modificada exitosamente.', () => navigate(-1));
      } else {
        await createStock.mutateAsync(payload);
        showSuccess('La nueva pieza de stock se ha creado con éxito.', () => navigate(-1));
      }
    } catch (error) {
      setShowConfirm(false);
      console.error(error);
    }
  };



  return (
    <div className="w-full">
      <div className="mb-4 md:mb-5 shrink-0 flex items-center justify-between w-full gap-3">
        <h1 className="font-display text-title-lg md:text-headline-sm font-semibold text-on-surface m-0">
          {isEditing ? 'Editar pieza de stock' : 'Nueva pieza de stock'}
        </h1>
        <button onClick={() => navigate(-1)} className="text-body-md text-primary hover:bg-primary/10 p-2 rounded-xl transition-colors font-label inline-flex items-center gap-1 shrink-0">
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          <span className="hidden sm:inline">Volver</span>
        </button>
      </div>

      <div className="bg-surface-container-lowest rounded-2xl shadow-card p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5 mb-2">
            <label className="text-label-lg font-label font-medium text-on-surface-variant uppercase tracking-wide px-1">
              Pieza del Catálogo
            </label>
            <Controller
              name="id_pieza"
              control={control}
              rules={{ required: 'Seleccioná una pieza' }}
              render={({ field: { onChange, value }, fieldState: { error } }) => (
                <PiezaCombobox 
                  value={value} 
                  onChange={onChange} 
                  error={error?.message} 
                  defaultSearchTerm={item?.pieza?.nombre ?? ''}
                />
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Talle" placeholder="XS, S, M, L, XL…" {...register('talle')} />
            <Input label="Medidas" placeholder="Ej: 90cm busto" {...register('medidas')} />
          </div>

          {isEditing && (
            <Select label="Estado" {...register('estado_pieza_stock')}>
              <option value="DISPONIBLE">Disponible</option>
              <option value="FUERA_DE_SERVICIO">Fuera de servicio</option>
            </Select>
          )}

          <Input
            label="Descripción"
            placeholder="Detalles adicionales sobre esta pieza…"
            {...register('descripcion')}
          />

          <div className="flex gap-3 justify-end mt-2">
            <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
              Cancelar
            </Button>
            <Button type="submit" loading={isSubmitting}>
              {isEditing ? 'Guardar cambios' : 'Crear pieza'}
            </Button>
          </div>
        </form>
      </div>

      <ConfirmActionModal
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleConfirmSave}
        title={isEditing ? 'Confirmar modificación' : 'Confirmar creación'}
        message={isEditing ? '¿Estás seguro que deseas modificar esta pieza de stock?' : '¿Confirmás la creación de esta nueva pieza de stock?'}
        confirmText="Sí, confirmar"
        confirmVariant="primary"
        loading={isEditing ? updateStock.isPending : createStock.isPending}
      />
    </div>
  );
}
