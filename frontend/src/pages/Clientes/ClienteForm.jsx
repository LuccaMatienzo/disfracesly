import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/api/axios.instance';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useFeedback } from '@/context/FeedbackContext';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  persona: z.object({
    documento: z.string()
      .min(7, 'El DNI debe tener entre 7 y 8 números')
      .max(8, 'El DNI debe tener entre 7 y 8 números')
      .regex(/^[0-9]+$/, 'Solo números permitidos'),
    nombre: z.string()
      .min(1, 'Requerido')
      .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s']+$/, 'Caracteres inválidos'),
    apellido: z.string()
      .min(1, 'Requerido')
      .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s']+$/, 'Caracteres inválidos'),
  }),
  telefono: z.string()
    .length(10, 'El teléfono debe tener exactamente 10 números')
    .regex(/^[0-9]+$/, 'Solo números permitidos'),
  domicilio: z.string().optional().nullable(),
});

export default function ClienteForm({ isModal = false, onSuccessCallback, onCancelCallback }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { showSuccess, showError, showInfo } = useFeedback();
  const isEditing = !!id;
  const [isAutocompleted, setIsAutocompleted] = useState(false);

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
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['clientes'] });
      showSuccess(isEditing ? 'Cliente actualizado con éxito' : 'Cliente creado con éxito', () => {
        if (isModal && onSuccessCallback) {
          onSuccessCallback(data);
        } else {
          navigate('/admin/clientes');
        }
      });
    },
    onError: (err) => {
      showError(err?.response?.data?.message || 'Error al guardar el cliente');
    }
  });

  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    mode: 'onChange',
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

  const dniRegister = register('persona.documento');

  const handleDniBlur = async (e) => {
    dniRegister.onBlur(e);
    if (isEditing) return; // No auto-completar en edición para evitar sobreescribir datos accidentalmente
    const dni = e.target.value;
    if (dni && dni.length >= 7) {
      try {
        const { data } = await api.get(`/personas/buscar?q=${dni}`);
        if (data && data.length > 0) {
          const p = data[0];
          setValue('persona.nombre', p.nombre, { shouldValidate: true });
          setValue('persona.apellido', p.apellido, { shouldValidate: true });
          setIsAutocompleted(true);
        } else {
          setIsAutocompleted(false);
        }
      } catch (err) {
        setIsAutocompleted(false);
      }
    } else {
      setIsAutocompleted(false);
    }
  };

  const handleCancel = () => {
    if (isModal && onCancelCallback) onCancelCallback();
    else navigate(-1);
  };

  return (
    <div className="w-full">
      {!isModal && (
        <div className="mb-4 md:mb-5 shrink-0 flex items-center justify-between w-full gap-3">
          <h1 className="font-display text-title-lg md:text-headline-sm font-semibold text-on-surface m-0">
            {isEditing ? 'Editar cliente' : 'Nuevo cliente'}
          </h1>
          <button onClick={handleCancel} className="text-body-md text-primary hover:bg-primary/10 p-2 rounded-xl transition-colors font-label inline-flex items-center gap-1 shrink-0">
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            <span className="hidden sm:inline">Volver</span>
          </button>
        </div>
      )}
      <div className="bg-surface-container-lowest rounded-2xl shadow-card p-6">
        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="flex flex-col gap-5" autoComplete="off">
          <h2 className="font-headline text-title-md text-on-surface">Datos personales</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="DNI / Documento" error={errors.persona?.documento?.message}
              {...dniRegister} onBlur={handleDniBlur} />
            <Input label="Nombre" error={errors.persona?.nombre?.message} disabled={isAutocompleted}
              {...register('persona.nombre')} />
            <Input label="Apellido" error={errors.persona?.apellido?.message} disabled={isAutocompleted}
              {...register('persona.apellido')} className="sm:col-span-2" />
          </div>
          <h2 className="font-headline text-title-md text-on-surface mt-2">Contacto</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Teléfono" placeholder="Ej: 3812345678" error={errors.telefono?.message}
              {...register('telefono')} />
            <Input label="Domicilio" placeholder="Dirección…" error={errors.domicilio?.message} {...register('domicilio')} />
          </div>
          <div className="flex gap-3 justify-end mt-2">
            <Button type="button" variant="secondary" onClick={handleCancel}>Cancelar</Button>
            <Button type="submit" loading={isSubmitting}>{isEditing ? 'Guardar cambios' : 'Crear cliente'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
