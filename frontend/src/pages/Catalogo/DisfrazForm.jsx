import { useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, useWatch } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/api/axios.instance';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

/* ── Chip individual de pieza ──────────────────────────────────────── */
function PiezaChip({ pieza, isSelected, onToggle }) {
  return (
    <button
      type="button"
      className="hover:-translate-y-0.5 active:scale-95"
      onClick={() => onToggle(pieza.id_pieza)}
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
      {pieza.nombre}
    </button>
  );
}

/* ── Componente principal ──────────────────────────────────────────────── */
export default function DisfrazForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const isEditing = !!id;

  // Si quisiéramos modo editar después, esto ya queda preparado
  const { data: disfraz } = useQuery({
    queryKey: ['disfraces', id],
    queryFn: () => api.get(`/catalogo/disfraces/${id}`).then((r) => r.data),
    enabled: isEditing,
  });

  const { data: piezasData } = useQuery({
    queryKey: ['piezas-all'],
    queryFn: () => api.get('/catalogo/piezas', { params: { limit: 500 } }).then((r) => r.data),
  });

  const mutation = useMutation({
    mutationFn: (data) =>
      isEditing
        ? api.put(`/catalogo/disfraces/${id}`, data).then((r) => r.data)
        : api.post('/catalogo/disfraces', data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['disfraces'] });
      navigate('/admin/catalogo');
    },
  });

  const { register, handleSubmit, reset, setValue, getValues, control, formState: { isSubmitting } } = useForm({
    defaultValues: { nombre: '', descripcion: '', pieza_ids: [] },
  });

  // Observar selección en tiempo real para re-render del contador y chips
  const selectedIds = useWatch({ control, name: 'pieza_ids' }) ?? [];
  const selectedSet = useMemo(() => new Set(selectedIds.map(Number)), [selectedIds]);

  useEffect(() => {
    if (isEditing && disfraz) {
      reset({
        nombre: disfraz.nombre,
        descripcion: disfraz.descripcion ?? '',
        pieza_ids: disfraz.piezas?.map((p) => p.id_pieza) ?? [],
      });
    }
  }, [disfraz, isEditing, reset]);

  const piezas = piezasData?.data ?? [];

  // Índice O(1): id_pieza → pieza (se reconstruye solo cuando cambia piezas)
  const piezasMap = useMemo(
    () => new Map(piezas.map((p) => [p.id_pieza, p])),
    [piezas]
  );

  // Agrupar por letra inicial
  const grouped = useMemo(() => {
    const map = {};
    for (const pieza of piezas) {
      const letter = pieza.nombre[0].toUpperCase();
      if (!map[letter]) map[letter] = [];
      map[letter].push(pieza);
    }
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [piezas]);

  // Calcular categorías derivadas — O(n+m) gracias al Map index
  const derivedCategories = useMemo(() => {
    const categoriesMap = new Map();
    for (const piezaId of selectedIds) {
      const piezaInfo = piezasMap.get(Number(piezaId));
      if (piezaInfo?.categorias) {
        for (const cat of piezaInfo.categorias) {
          if (cat.categoriaMotivo) {
            categoriesMap.set(cat.categoriaMotivo.id_categoria_motivo, cat.categoriaMotivo.nombre);
          }
        }
      }
    }
    return Array.from(categoriesMap.entries())
      .map(([id, nombre]) => ({ id, nombre }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [selectedIds, piezasMap]);

  const togglePieza = (piezaId) => {
    const current = (getValues('pieza_ids') ?? []).map(Number);
    const numId = Number(piezaId);
    const next = current.includes(numId) ? current.filter((x) => x !== numId) : [...current, numId];
    setValue('pieza_ids', next, { shouldDirty: true });
  };

  const clearAll = () => setValue('pieza_ids', [], { shouldDirty: true });

  return (
    <div className="w-full min-h-0 md:h-[calc(100vh-120px)] flex flex-col">
      <div className="mb-4 md:mb-6 shrink-0">
        <button onClick={() => navigate(-1)} className="text-body-md text-primary hover:underline font-label mb-2 min-h-[44px] inline-flex items-center">← Volver</button>
        <h1 className="font-display text-headline-md font-semibold text-on-surface">
          {isEditing ? 'Editar disfraz' : 'Nuevo disfraz del catálogo'}
        </h1>
      </div>

      <div className="bg-surface-container-lowest rounded-2xl shadow-card p-4 md:p-6 flex flex-col flex-1 min-h-0">
        <form
          onSubmit={handleSubmit((data) =>
            mutation.mutate({ ...data, pieza_ids: (data.pieza_ids ?? []).map(Number) })
          )}
          className="flex flex-col gap-6 flex-1 min-h-0"
        >
          <div className="flex flex-col gap-6 shrink-0">
            <Input label="Nombre" placeholder="Nombre del disfraz…" {...register('nombre', { required: true })} />
            <Input label="Descripción" placeholder="Descripción opcional…" {...register('descripcion')} />
          </div>

          {/* ── Sección de piezas ────────────────────────────────── */}
          {piezas.length > 0 && (
            <div className="flex flex-col flex-1 min-h-0">
              {/* Encabezado con contador */}
              <div className="shrink-0" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div>
                  <label className="text-label-lg font-label font-medium text-on-surface-variant uppercase tracking-wide block">
                    Piezas incluidas
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
                {grouped.map(([letter, items]) => (
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
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', paddingLeft: '8px' }} className="md:!pl-[26px]">
                      {items.map((pieza) => (
                        <PiezaChip
                          key={pieza.id_pieza}
                          pieza={pieza}
                          isSelected={selectedSet.has(Number(pieza.id_pieza))}
                          onToggle={togglePieza}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Categorías derivadas ───────────────────────────────── */}
          {derivedCategories.length > 0 && (
            <div className="pt-2 shrink-0">
              <label className="text-label-lg font-label font-medium text-on-surface-variant uppercase tracking-wide block mb-3">
                Categorías / Motivos del Disfraz
              </label>
              <div className="flex flex-wrap gap-2">
                {derivedCategories.map(c => (
                  <span
                    key={c.id}
                    style={{
                      display: 'inline-flex',
                      padding: '4px 12px',
                      borderRadius: '8px',
                      background: 'var(--color-surface-container-high)',
                      color: 'var(--color-on-surface)',
                      fontSize: '0.8rem',
                      fontWeight: '500',
                      border: '1px solid var(--color-outline-variant)'
                    }}
                  >
                    {c.nombre}
                  </span>
                ))}
              </div>
              <p className="text-body-sm text-on-surface-variant mt-2 opacity-80">
                Estas categorías se heredan automáticamente de las piezas seleccionadas y no son modificables desde aquí.
              </p>
            </div>
          )}

          {/* Campo oculto que react-hook-form necesita para pieza_ids */}
          <input type="hidden" {...register('pieza_ids')} />

          <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end mt-4 md:mt-2 shrink-0">
            <Button type="button" variant="secondary" onClick={() => navigate(-1)} className="w-full sm:w-auto">Cancelar</Button>
            <Button type="submit" loading={isSubmitting} className="w-full sm:w-auto">
              {isEditing ? 'Guardar cambios' : 'Crear disfraz'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
