import { useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, useWatch } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/api/axios.instance';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

/* ── Chip individual de categoría ──────────────────────────────────────── */
function CatChip({ cat, isSelected, onToggle }) {
  return (
    <button
      type="button"
      className="hover:-translate-y-0.5 active:scale-95"
      onClick={() => onToggle(cat.id_categoria_motivo)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 14px',
        borderRadius: '999px',
        border: isSelected ? '1.5px solid var(--color-primary)' : '1.5px solid var(--color-outline-variant)',
        backgroundColor: isSelected ? 'var(--color-primary)' : 'var(--color-surface-container)',
        color: isSelected ? 'var(--color-on-primary)' : 'var(--color-on-surface-variant)',
        cursor: 'pointer',
        fontSize: '0.85rem',
        fontWeight: isSelected ? '600' : '400',
        transition: 'all 0.18s ease',
        userSelect: 'none',
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '16px',
        height: '16px',
        borderRadius: '50%',
        backgroundColor: isSelected ? 'var(--color-on-primary)' : 'transparent',
        border: isSelected ? 'none' : '1.5px solid var(--color-outline)',
        transition: 'all 0.18s ease',
        flexShrink: 0,
      }}>
        {isSelected && (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="animate-scale-in">
            <path d="M2 5l2.5 2.5L8 3" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      {cat.nombre}
    </button>
  );
}

/* ── Componente principal ──────────────────────────────────────────────── */
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

  const { register, handleSubmit, reset, setValue, getValues, control, formState: { isSubmitting } } = useForm({
    defaultValues: { nombre: '', descripcion: '', categoria_ids: [] },
  });

  // Observar selección en tiempo real para re-render del contador y chips
  const selectedIds = useWatch({ control, name: 'categoria_ids' }) ?? [];
  const selectedSet = useMemo(() => new Set(selectedIds.map(Number)), [selectedIds]);

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

  // Agrupar por letra inicial
  const grouped = useMemo(() => {
    const map = {};
    for (const cat of categorias) {
      const letter = cat.nombre[0].toUpperCase();
      if (!map[letter]) map[letter] = [];
      map[letter].push(cat);
    }
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [categorias]);

  const toggleCategory = (catId) => {
    const current = (getValues('categoria_ids') ?? []).map(Number);
    const numId = Number(catId);
    const next = current.includes(numId) ? current.filter((x) => x !== numId) : [...current, numId];
    setValue('categoria_ids', next, { shouldDirty: true });
  };

  const clearAll = () => setValue('categoria_ids', [], { shouldDirty: true });

  return (
    <div className="w-full h-[calc(100vh-120px)] flex flex-col">
      <div className="mb-6 shrink-0">
        <button onClick={() => navigate(-1)} className="text-body-md text-primary hover:underline font-label mb-2">← Volver</button>
        <h1 className="font-display text-headline-md font-semibold text-on-surface">
          {isEditing ? 'Editar pieza' : 'Nueva pieza del catálogo'}
        </h1>
      </div>

      <div className="bg-surface-container-lowest rounded-2xl shadow-card p-6 flex flex-col flex-1 min-h-0">
        <form
          onSubmit={handleSubmit((data) =>
            mutation.mutate({ ...data, categoria_ids: (data.categoria_ids ?? []).map(Number) })
          )}
          className="flex flex-col gap-6 flex-1 min-h-0"
        >
          <div className="flex flex-col gap-6 shrink-0">
            <Input label="Nombre" placeholder="Nombre de la pieza…" {...register('nombre', { required: true })} />
            <Input label="Descripción" placeholder="Descripción opcional…" {...register('descripcion')} />
          </div>

          {/* ── Sección de categorías ────────────────────────────────── */}
          {categorias.length > 0 && (
            <div className="flex flex-col flex-1 min-h-0">
              {/* Encabezado con contador */}
              <div className="shrink-0" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div>
                  <label className="text-label-lg font-label font-medium text-on-surface-variant uppercase tracking-wide block">
                    Categorías / Motivos
                  </label>
                  <span style={{ fontSize: '0.78rem', color: 'var(--color-on-surface-variant)', marginTop: '2px', display: 'block' }}>
                    {selectedSet.size === 0
                      ? 'Ninguna seleccionada'
                      : `${selectedSet.size} seleccionada${selectedSet.size > 1 ? 's' : ''}`}
                  </span>
                </div>
                {selectedSet.size > 0 && (
                  <button
                    type="button"
                    onClick={clearAll}
                    style={{
                      fontSize: '0.78rem',
                      color: 'var(--color-error, #ef4444)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'color-mix(in srgb, var(--color-error, #ef4444) 10%, transparent)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                  >
                    Limpiar selección
                  </button>
                )}
              </div>

              {/* Grupos por letra */}
              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {grouped.map(([letter, cats]) => (
                  <div key={letter}>
                    {/* Separador de letra */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                      <span style={{
                        fontSize: '1rem',
                        fontWeight: '700',
                        letterSpacing: '0.12em',
                        color: 'var(--color-primary)',
                        textTransform: 'uppercase',
                        minWidth: '16px',
                      }}>
                        {letter}
                      </span>
                      <div style={{ flex: 1, height: '1px', background: 'var(--color-outline-variant)', opacity: 0.5 }} />
                    </div>

                    {/* Chips de ese grupo */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', paddingLeft: '26px' }}>
                      {cats.map((cat) => (
                        <CatChip
                          key={cat.id_categoria_motivo}
                          cat={cat}
                          isSelected={selectedSet.has(Number(cat.id_categoria_motivo))}
                          onToggle={toggleCategory}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Campo oculto que react-hook-form necesita para categoria_ids */}
          <input type="hidden" {...register('categoria_ids')} />

          <div className="flex gap-3 justify-end mt-2 shrink-0">
            <Button type="button" variant="secondary" onClick={() => navigate(-1)}>Cancelar</Button>
            <Button type="submit" loading={isSubmitting}>
              {isEditing ? 'Guardar cambios' : 'Crear pieza'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
