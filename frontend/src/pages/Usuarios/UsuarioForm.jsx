import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/api/axios.instance';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useToast } from '@/hooks/useToast';

export default function UsuarioForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { success, error } = useToast();
  const isEditing = !!id;

  const { data: usuario } = useQuery({
    queryKey: ['usuarios', id],
    queryFn: () => api.get(`/usuarios/${id}`).then((r) => r.data),
    enabled: isEditing,
  });

  const { data: roles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: () => api.get('/usuarios/roles').then((r) => r.data),
  });

  const mutation = useMutation({
    mutationFn: (data) =>
      isEditing
        ? api.put(`/usuarios/${id}`, data).then((r) => r.data)
        : api.post('/usuarios', data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['usuarios'] });
      success(isEditing ? 'Usuario actualizado con éxito' : 'Usuario creado con éxito');
      navigate('/admin/usuarios');
    },
    onError: (err) => {
      error(err?.response?.data?.message || 'Error al guardar el usuario');
    }
  });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      correo: '',
      contrasena: '',
      id_rol: '',
      persona: { documento: '', nombre: '', apellido: '' }
    },
  });

  useEffect(() => {
    if (isEditing && usuario) {
      reset({
        correo: usuario.correo,
        contrasena: '', // intentionally empty
        id_rol: Number(usuario.id_rol),
        persona: {
          documento: usuario.persona.documento,
          nombre: usuario.persona.nombre,
          apellido: usuario.persona.apellido
        },
      });
    }
  }, [usuario, isEditing, reset]);

  const onSubmit = (formData) => {
    // If we are editing and no password was provided, we delete it from the payload
    if (isEditing && !formData.contrasena) {
      delete formData.contrasena;
    }
    
    // Convert id_rol to number
    const payload = {
      ...formData,
      id_rol: Number(formData.id_rol)
    };

    // Document is not strictly updatable in some flows, but the backend update schema allows persona.nombre/apellido.
    // The backend schema: updateUsuarioSchema -> persona: { nombre, apellido }
    if (isEditing) {
      delete payload.persona.documento; // Previene envío de documento al actualizar si backend no lo acepta
    }

    mutation.mutate(payload);
  };

  return (
    <div className="w-full">
      <div className="mb-6">
        <button onClick={() => navigate(-1)} className="text-body-md text-primary hover:underline font-label mb-2">← Volver</button>
        <h1 className="font-display text-headline-md font-semibold text-on-surface">
          {isEditing ? 'Editar usuario' : 'Nuevo usuario'}
        </h1>
      </div>
      <div className="bg-surface-container-lowest rounded-2xl shadow-card p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
          <h2 className="font-headline text-title-md text-on-surface">Datos personales</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="DNI / Documento" error={errors.persona?.documento?.message} disabled={isEditing}
              {...register('persona.documento', { 
                required: isEditing ? false : 'Documento requerido',
              })} />
            <Input label="Nombre" error={errors.persona?.nombre?.message}
              {...register('persona.nombre', { 
                required: 'Nombre requerido',
              })} />
            <Input label="Apellido" error={errors.persona?.apellido?.message}
              {...register('persona.apellido', { 
                required: 'Apellido requerido',
              })} className="sm:col-span-2" />
          </div>

          <h2 className="font-headline text-title-md text-on-surface mt-2">Acceso al sistema</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Correo electrónico" type="email" error={errors.correo?.message}
              {...register('correo', { 
                required: 'Correo requerido',
              })} />
            
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-on-surface">Rol</label>
              <select
                {...register('id_rol', { required: 'Rol requerido' })}
                className="w-full h-[48px] bg-surface-container hover:bg-surface-container-high focus:bg-surface-container-high transition-colors outline-none border border-outline-variant/30 focus:border-primary px-4 rounded-xl text-on-surface"
              >
                <option value="">Seleccionar rol…</option>
                {roles.map(rol => (
                  <option key={rol.id_rol} value={rol.id_rol}>{rol.nombre}</option>
                ))}
              </select>
              {errors.id_rol && <span className="text-error text-xs font-medium">{errors.id_rol.message}</span>}
            </div>

            <Input 
              label={isEditing ? 'Nueva contraseña (Opcional)' : 'Contraseña'} 
              type="password" 
              error={errors.contrasena?.message}
              {...register('contrasena', { 
                required: isEditing ? false : 'Contraseña requerida',
                minLength: { value: 8, message: 'La contraseña debe tener al menos 8 caracteres' }
              })} 
            />
          </div>

          <div className="flex gap-3 justify-end mt-2">
            <Button type="button" variant="secondary" onClick={() => navigate(-1)}>Cancelar</Button>
            <Button type="submit" loading={isSubmitting}>{isEditing ? 'Guardar cambios' : 'Crear usuario'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
