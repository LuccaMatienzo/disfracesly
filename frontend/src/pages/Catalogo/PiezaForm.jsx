import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/api/axios.instance';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function PiezaForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const isEditing = !!id;

  const { data: pieza } = useQuery({
    queryKey: ['piezas', id],
    queryFn: () => api.get(`/catalogo/piezas/${id}`).then((r) => r.data),
    enabled: isEditing,
  });

  const { data: categoriasData } = useQuery({
    queryKey: ['categorias-all'],
    queryFn: () => api.get('/catalogo/categorias', { params: { limit: 100 } }).then((r) => r.data),
  });

  const mutation = useMutation({
    mutationFn: (data) =>
      isEditing
        ? api.put(`/catalogo/piezas/${id}`, data).then((r) => r.data)
        : api.post('/catalogo/piezas', data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['piezas'] });
      navigate('/admin/catalogo');
    },
  });

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm({
    defaultValues: { nombre: '', descripcion: '', categoria_ids: [] },
  });

  useEffect(() => {
    if (isEditing && pieza) {
      reset({
        nombre: pieza.nombre,
        descripcion: pieza.descripcion ?? '',
        categoria_ids: pieza.categorias?.map((c) => c.id_categoria_motivo) ?? [],
      });
    }
  }, [pieza, isEditing, reset]);

  const categorias = categoriasData?.data ?? [];

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <button onClick={() => navigate(-1)} className="text-body-md text-primary hover:underline font-label mb-2">← Volver</button>
        <h1 className="font-display text-headline-md font-bold text-on-surface">
          {isEditing ? 'Editar pieza' : 'Nueva pieza del catálogo'}
        </h1>
      </div>
      <div className="bg-surface-container-lowest rounded-2xl shadow-card p-6">
        <form onSubmit={handleSubmit((data) => mutation.mutate({ ...data, categoria_ids: data.categoria_ids?.map(Number) ?? [] }))} className="flex flex-col gap-5">
          <Input label="Nombre" placeholder="Nombre de la pieza..." {...register('nombre', { required: true })} />
          <Input label="Descripción" placeholder="Descripción opcional..." {...register('descripcion')} />

          {categorias.length > 0 && (
            <div>
              <label className="text-label-lg font-label font-medium text-on-surface-variant uppercase tracking-wide mb-2 block">
                Categorías / Motivos
              </label>
              <div className="flex flex-wrap gap-2">
                {categorias.map((cat) => {
                  const inputId = `cat-${cat.id_categoria_motivo}`;
                  return (
                    <label key={cat.id_categoria_motivo} htmlFor={inputId} className="flex items-center gap-2 cursor-pointer bg-surface-container rounded-xl px-3 py-2 hover:bg-surface-container-high transition-colors">
                      <input
                        id={inputId}
                        type="checkbox"
                        value={cat.id_categoria_motivo}
                        {...register('categoria_ids')}
                        className="accent-primary"
                      />
                      <span className="text-body-md text-on-surface">{cat.nombre}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex gap-3 justify-end mt-2">
            <Button type="button" variant="secondary" onClick={() => navigate(-1)}>Cancelar</Button>
            <Button type="submit" loading={isSubmitting}>{isEditing ? 'Guardar cambios' : 'Crear pieza'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
