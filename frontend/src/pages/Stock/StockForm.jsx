import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios.instance';
import { useCreateStock, useUpdateStock, useStockItem } from '@/hooks/useStock';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Select } from '@/components/ui/Input';

export default function StockForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const { data: item } = useStockItem(id);
  const { data: piezasData } = useQuery({
    queryKey: ['piezas-all'],
    queryFn: () => api.get('/catalogo/piezas', { params: { limit: 200 } }).then((r) => r.data),
  });

  const createStock = useCreateStock();
  const updateStock = useUpdateStock();

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
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

  const onSubmit = async (data) => {
    const payload = { ...data, id_pieza: Number(data.id_pieza) };
    if (isEditing) await updateStock.mutateAsync({ id, data: payload });
    else await createStock.mutateAsync(payload);
    navigate('/stock');
  };

  const piezas = piezasData?.data ?? [];

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <button onClick={() => navigate(-1)} className="text-body-md text-primary hover:underline font-label mb-2">
          ← Volver
        </button>
        <h1 className="font-display text-headline-md font-bold text-on-surface">
          {isEditing ? 'Editar pieza de stock' : 'Nueva pieza de stock'}
        </h1>
      </div>

      <div className="bg-surface-container-lowest rounded-2xl shadow-card p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
          <Select
            label="Pieza"
            error={errors.id_pieza?.message}
            {...register('id_pieza', { required: 'Seleccioná una pieza' })}
          >
            <option value="">Seleccionar pieza...</option>
            {piezas.map((p) => (
              <option key={p.id_pieza} value={p.id_pieza}>{p.nombre}</option>
            ))}
          </Select>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Talle" placeholder="XS, S, M, L, XL..." {...register('talle')} />
            <Input label="Medidas" placeholder="Ej: 90cm busto" {...register('medidas')} />
          </div>

          <Select label="Estado" {...register('estado_pieza_stock')}>
            <option value="DISPONIBLE">Disponible</option>
            <option value="FUERA_DE_SERVICIO">Fuera de servicio</option>
          </Select>

          <Input
            label="Descripción"
            placeholder="Detalles adicionales sobre esta pieza..."
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
    </div>
  );
}
