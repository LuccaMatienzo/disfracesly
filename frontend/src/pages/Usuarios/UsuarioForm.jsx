import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/api/axios.instance';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import { useToast } from '@/hooks/useToast';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FiEye, FiEyeOff } from 'react-icons/fi';

const baseSchema = z.object({
  correo: z.string().email('Correo inválido'),
  id_rol: z.number({ invalid_type_error: 'Rol requerido' }).int().positive('Rol requerido'),
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
});

const createSchema = baseSchema.extend({
  contrasena: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
});

const updateSchema = baseSchema;

const resetPasswordSchema = z.object({
  nuevaContrasena: z.string().min(8, 'Mínimo 8 caracteres'),
  confirmarContrasena: z.string().min(8, 'Mínimo 8 caracteres'),
}).refine(data => data.nuevaContrasena === data.confirmarContrasena, {
  message: "Las contraseñas no coinciden",
  path: ["confirmarContrasena"],
});

export default function UsuarioForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { success, error } = useToast();
  const isEditing = !!id;

  const [showPass, setShowPass] = useState(false);

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

  const schema = isEditing ? updateSchema : createSchema;

  const { register, handleSubmit, reset, formState: { errors, isSubmitting, isValid } } = useForm({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: {
      correo: '',
      id_rol: '',
      persona: { documento: '', nombre: '', apellido: '' },
      contrasena: '',
    },
  });

  useEffect(() => {
    if (isEditing && usuario) {
      reset({
        correo: usuario.correo,
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
    const payload = {
      ...formData,
      id_rol: Number(formData.id_rol)
    };
    mutation.mutate(payload);
  };

  return (
    <div className="w-full">
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <button onClick={() => navigate(-1)} className="text-body-md text-primary hover:underline font-label mb-2">← Volver</button>
          <h1 className="font-display text-headline-md font-semibold text-on-surface">
            {isEditing ? 'Editar usuario' : 'Nuevo usuario'}
          </h1>
        </div>
      </div>
      
      <div className="bg-surface-container-lowest rounded-2xl shadow-card p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" autoComplete="off">
          <h2 className="font-headline text-title-md text-on-surface">Datos personales</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="DNI / Documento" error={errors.persona?.documento?.message}
              {...register('persona.documento')} />
            <Input label="Nombre" error={errors.persona?.nombre?.message}
              {...register('persona.nombre')} />
            <Input label="Apellido" error={errors.persona?.apellido?.message}
              {...register('persona.apellido')} className="sm:col-span-2" />
          </div>

          <h2 className="font-headline text-title-md text-on-surface mt-2">Acceso al sistema</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Correo electrónico" type="email" error={errors.correo?.message}
              autoComplete="new-password"
              {...register('correo')} />
            
            <div className="flex flex-col gap-1.5">
              <label className="text-label-lg font-label font-medium text-on-surface-variant uppercase tracking-wide">Rol</label>
              <select
                {...register('id_rol', { valueAsNumber: true })}
                className={`w-full rounded-lg px-4 py-3 bg-surface-container-high text-on-surface text-body-md border-0 outline-none transition-all duration-150 focus:ring-2 focus:ring-primary/30 focus:bg-surface-container-lowest ${errors.id_rol ? 'ring-2 ring-error' : ''}`}
              >
                <option value="">Seleccionar rol…</option>
                {roles.map(rol => (
                  <option key={rol.id_rol} value={rol.id_rol}>{rol.nombre}</option>
                ))}
              </select>
              {errors.id_rol && <p className="text-label-lg text-error">{errors.id_rol.message}</p>}
            </div>

            {!isEditing && (
              <div className="sm:col-span-2 relative">
                <Input 
                  label="Contraseña" 
                  type={showPass ? 'text' : 'password'} 
                  error={errors.contrasena?.message}
                  autoComplete="new-password"
                  {...register('contrasena')} 
                />
                <button
                  type="button"
                  onClick={() => setShowPass((p) => !p)}
                  className="absolute right-4 top-[38px] text-on-surface-variant hover:text-primary transition-colors"
                  aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPass ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                </button>
              </div>
            )}
          </div>

          <div className="flex gap-3 justify-end mt-2">
            <Button type="button" variant="secondary" onClick={() => navigate(-1)}>Cancelar</Button>
            <Button type="submit" loading={isSubmitting} disabled={!isValid || isSubmitting}>
              {isEditing ? 'Guardar cambios' : 'Crear usuario'}
            </Button>
          </div>
        </form>
      </div>

    </div>
  );
}
