import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/api/axios.instance';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function ClienteForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const isEditing = !!id;

  const { data: cliente } = useQuery({
    queryKey: ['clientes', id],
    queryFn: () => api.get(`/clientes/${id}`).then((r) => r.data),
    enabled: isEditing,
  });

  const mutation = useMutation({
    mutationFn: (data) =>
      isEditing
        ? api.put(`/clientes/${id}`, data).then((r) => r.data)
        : api.post('/clientes', data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clientes'] });
      navigate('/admin/clientes');
    },
  });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { persona: { documento: '', nombre: '', apellido: '' }, telefono: '', domicilio: '' },
  });

  useEffect(() => {
    if (isEditing && cliente) {
      reset({
        persona: { documento: cliente.persona.documento, nombre: cliente.persona.nombre, apellido: cliente.persona.apellido },
        telefono: cliente.telefono ?? '',
        domicilio: cliente.domicilio ?? '',
      });
    }
  }, [cliente, isEditing, reset]);

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <button onClick={() => navigate(-1)} className="text-body-md text-primary hover:underline font-label mb-2">← Volver</button>
        <h1 className="font-display text-headline-md font-bold text-on-surface">
          {isEditing ? 'Editar cliente' : 'Nuevo cliente'}
        </h1>
      </div>
      <div className="bg-surface-container-lowest rounded-2xl shadow-card p-6">
        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="flex flex-col gap-5">
          <h2 className="font-headline text-title-md text-on-surface">Datos personales</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="DNI / Documento" error={errors.persona?.documento?.message}
              {...register('persona.documento', { required: 'Documento requerido' })} />
            <Input label="Nombre" {...register('persona.nombre', { required: true })} />
            <Input label="Apellido" {...register('persona.apellido', { required: true })} className="sm:col-span-2" />
          </div>
          <h2 className="font-headline text-title-md text-on-surface mt-2">Contacto</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Teléfono" placeholder="Ej: 11-1234-5678" {...register('telefono', { required: true })} />
            <Input label="Domicilio" placeholder="Dirección..." {...register('domicilio')} />
          </div>
          <div className="flex gap-3 justify-end mt-2">
            <Button type="button" variant="secondary" onClick={() => navigate(-1)}>Cancelar</Button>
            <Button type="submit" loading={isSubmitting}>{isEditing ? 'Guardar cambios' : 'Crear cliente'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
