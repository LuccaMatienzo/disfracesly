import { useState, useEffect } from 'react';
import Modal from './Modal';
import Button from './Button';

export default function InteraccionModal({ open, onClose, onSubmit, loading, tipo, operacion }) {
  const isRetiro = tipo === 'RETIRO';
  const isVenta = !!operacion?.venta;
  const cliente = operacion?.cliente?.persona;

  const [isNuevaPersona, setIsNuevaPersona] = useState(false);
  const [formData, setFormData] = useState({
    observaciones: '',
    documento: '',
    nombre: '',
    apellido: '',
  });
  const [errors, setErrors] = useState({});

  // Reset al abrir
  useEffect(() => {
    if (open) {
      setIsNuevaPersona(false);
      setFormData({
        observaciones: '',
        documento: '',
        nombre: '',
        apellido: '',
      });
      setErrors({});
    }
  }, [open]);

  const validate = () => {
    if (!isNuevaPersona) return true;
    const newErrors = {};
    if (!formData.documento.trim()) newErrors.documento = 'Requerido';
    else if (!/^\d{8}$/.test(formData.documento)) newErrors.documento = 'Exactamente 8 números';

    if (!formData.nombre.trim()) newErrors.nombre = 'Requerido';
    else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s']+$/.test(formData.nombre)) newErrors.nombre = 'Solo letras y espacios';

    if (!formData.apellido.trim()) newErrors.apellido = 'Requerido';
    else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s']+$/.test(formData.apellido)) newErrors.apellido = 'Solo letras y espacios';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    const payload = {
      tipo,
      observaciones: formData.observaciones || undefined,
      persona: isNuevaPersona 
        ? { documento: formData.documento, nombre: formData.nombre, apellido: formData.apellido }
        : { id_persona: cliente?.id_persona ? Number(cliente.id_persona) : undefined },
    };
    await onSubmit(payload);
  };

  if (!operacion) return null;

  const tituloModal = isRetiro 
    ? (isVenta ? 'Confirmar Entrega' : 'Confirmar Retiro') 
    : 'Confirmar Devolución';
    
  const textoBoton = isRetiro 
    ? (isVenta ? 'Registrar Entrega' : 'Registrar Retiro') 
    : 'Registrar Devolución';
    
  const textoAccion = isRetiro
    ? (isVenta ? 'la entrega' : 'el retiro')
    : 'la devolución';

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={tituloModal}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" form="interaccion-form" loading={loading}>
            {textoBoton}
          </Button>
        </>
      }
    >
      <form id="interaccion-form" onSubmit={handleSubmit} className="space-y-5">
        <p className="text-sm text-on-surface-variant bg-surface-container-low p-3 rounded-xl border border-outline-variant/20">
          Esta acción registrará {textoAccion} y avanzará la operación a la siguiente etapa.
        </p>

        {/* Quién realiza la acción */}
        <div className="space-y-3">
          <h3 className="text-sm font-label font-bold uppercase tracking-widest text-on-surface-variant">
            ¿A quién se le realiza {textoAccion}?
          </h3>
          
          <div className="grid grid-cols-2 gap-3">
            <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
              !isNuevaPersona 
                ? 'border-primary bg-primary/5' 
                : 'border-outline-variant/30 hover:bg-surface-container-low'
            }`}>
              <input
                type="radio"
                name="persona_tipo"
                checked={!isNuevaPersona}
                onChange={() => setIsNuevaPersona(false)}
                className="w-4 h-4 text-primary bg-transparent border-outline-variant focus:ring-primary focus:ring-offset-background"
              />
              <div className="flex-1 min-w-0">
                <span className="block text-sm font-medium text-on-surface">Titular</span>
                <span className="block text-xs text-on-surface-variant truncate">
                  {cliente?.nombre} {cliente?.apellido}
                </span>
              </div>
            </label>

            <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
              isNuevaPersona 
                ? 'border-primary bg-primary/5' 
                : 'border-outline-variant/30 hover:bg-surface-container-low'
            }`}>
              <input
                type="radio"
                name="persona_tipo"
                checked={isNuevaPersona}
                onChange={() => setIsNuevaPersona(true)}
                className="w-4 h-4 text-primary bg-transparent border-outline-variant focus:ring-primary focus:ring-offset-background"
              />
              <div className="flex-1 min-w-0">
                <span className="block text-sm font-medium text-on-surface">Otra persona</span>
                <span className="block text-xs text-on-surface-variant truncate">
                  Ingresar datos
                </span>
              </div>
            </label>
          </div>

          {/* Formulario Nueva Persona */}
          {isNuevaPersona && (
            <div className="space-y-4 pt-2 animate-fade-in">
              <div>
                <label className={`block text-xs font-label font-bold uppercase tracking-wider mb-1.5 ${errors.documento ? 'text-error' : 'text-on-surface-variant'}`}>
                  Documento
                </label>
                <input
                  type="text"
                  required
                  value={formData.documento}
                  onChange={(e) => {
                    setFormData({ ...formData, documento: e.target.value });
                    if (errors.documento) setErrors({ ...errors, documento: '' });
                  }}
                  onBlur={validate}
                  className={`w-full bg-surface-container-lowest border rounded-xl px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-1 transition-all ${
                    errors.documento 
                      ? 'border-error focus:border-error focus:ring-error' 
                      : 'border-outline-variant/30 focus:border-primary focus:ring-primary'
                  }`}
                  placeholder="Ej: 12345678"
                />
                {errors.documento && <span className="text-error text-xs font-medium mt-1 block">{errors.documento}</span>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-xs font-label font-bold uppercase tracking-wider mb-1.5 ${errors.nombre ? 'text-error' : 'text-on-surface-variant'}`}>
                    Nombre
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nombre}
                    onChange={(e) => {
                      setFormData({ ...formData, nombre: e.target.value });
                      if (errors.nombre) setErrors({ ...errors, nombre: '' });
                    }}
                    onBlur={validate}
                    className={`w-full bg-surface-container-lowest border rounded-xl px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-1 transition-all ${
                      errors.nombre 
                        ? 'border-error focus:border-error focus:ring-error' 
                        : 'border-outline-variant/30 focus:border-primary focus:ring-primary'
                    }`}
                    placeholder="Nombre"
                  />
                  {errors.nombre && <span className="text-error text-xs font-medium mt-1 block">{errors.nombre}</span>}
                </div>
                <div>
                  <label className={`block text-xs font-label font-bold uppercase tracking-wider mb-1.5 ${errors.apellido ? 'text-error' : 'text-on-surface-variant'}`}>
                    Apellido
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.apellido}
                    onChange={(e) => {
                      setFormData({ ...formData, apellido: e.target.value });
                      if (errors.apellido) setErrors({ ...errors, apellido: '' });
                    }}
                    onBlur={validate}
                    className={`w-full bg-surface-container-lowest border rounded-xl px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-1 transition-all ${
                      errors.apellido 
                        ? 'border-error focus:border-error focus:ring-error' 
                        : 'border-outline-variant/30 focus:border-primary focus:ring-primary'
                    }`}
                    placeholder="Apellido"
                  />
                  {errors.apellido && <span className="text-error text-xs font-medium mt-1 block">{errors.apellido}</span>}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Observaciones */}
        <div>
          <label className="block text-xs font-label font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
            Observaciones (Opcional)
          </label>
          <textarea
            value={formData.observaciones}
            onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
            className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all min-h-[80px] resize-y"
            placeholder="Detalles sobre el estado de las prendas, demoras, etc."
          />
        </div>
      </form>
    </Modal>
  );
}
