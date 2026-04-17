import { useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import PublicNavbar from '@/components/public/PublicNavbar';
import PublicFooter from '@/components/public/PublicFooter';

const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER ?? '5491100000000';

function buildWhatsappMessage({ nombre, telefono, notas, disfraz, fechaRetiro, fechaDevolucion, tipo }) {
  const lines = [
    '¡Hola Disfracesly! 👋 Quiero hacer una solicitud de pedido:',
    '',
    `*Disfraz:* ${disfraz?.nombre ?? 'N/A'}`,
    disfraz?.talle ? `*Talle:* ${disfraz.talle}` : null,
    fechaRetiro ? `*Retiro deseado:* ${fechaRetiro}` : null,
    fechaDevolucion ? `*Devolución:* ${fechaDevolucion}` : null,
    `*Tipo de operación:* ${tipo === 'venta' ? 'Compra' : 'Alquiler'}`,
    '',
    `*Mi nombre:* ${nombre}`,
    `*Mi teléfono:* ${telefono}`,
    notas ? `*Notas:* ${notas}` : null,
    '',
    '_Esta solicitud está sujeta a confirmación de disponibilidad por parte del atelier._',
  ].filter(Boolean).join('\n');

  return encodeURIComponent(lines);
}

const PLACEHOLDER = 'https://placehold.co/120x150/efefe0/6b7a7a?text=♛';

export default function SolicitudPedido() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state ?? {};

  const { disfraz, fechaRetiro: initRetiro = '', fechaDevolucion: initDevolucion = '' } = state;

  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [notas, setNotas] = useState('');
  const [tipo, setTipo] = useState('alquiler');
  const [fechaRetiro, setFechaRetiro] = useState(initRetiro);
  const [fechaDevolucion, setFechaDevolucion] = useState(initDevolucion);
  const [sent, setSent] = useState(false);

  const canSend = nombre.trim().length > 0 && telefono.trim().length > 0;

  const handleSolicitar = () => {
    if (!canSend) return;
    const msg = buildWhatsappMessage({ nombre, telefono, notas, disfraz, fechaRetiro, fechaDevolucion, tipo });
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    setSent(true);
  };

  if (!disfraz) {
    // Si llegan directo sin state, redirigir al catálogo
    return (
      <div className="min-h-screen bg-background">
        <PublicNavbar />
        <div className="pt-32 text-center px-6">
          <span className="material-symbols-outlined text-6xl text-tertiary block mb-4">chat</span>
          <h1 className="font-headline font-black text-2xl text-on-surface mb-4">
            No hay ningún disfraz seleccionado
          </h1>
          <Link to="/catalogo" className="editorial-gradient text-white px-8 py-3 rounded-xl font-headline font-bold inline-block">
            Explorar Catálogo
          </Link>
        </div>
        <PublicFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PublicNavbar />

      <main className="pt-24 pb-20 px-6 md:px-10 max-w-5xl mx-auto">
        <nav className="flex items-center gap-2 text-xs font-label uppercase tracking-widest text-tertiary mb-8">
          <Link to="/" className="hover:text-primary">Inicio</Link>
          <span className="material-symbols-outlined text-xs">chevron_right</span>
          <Link to="/catalogo" className="hover:text-primary">Catálogo</Link>
          <span className="material-symbols-outlined text-xs">chevron_right</span>
          <Link to={`/catalogo/${disfraz.id}`} className="hover:text-primary">{disfraz.nombre}</Link>
          <span className="material-symbols-outlined text-xs">chevron_right</span>
          <span className="text-on-surface font-bold">Solicitud</span>
        </nav>

        <h1 className="font-headline font-black text-4xl text-on-surface mb-2">Solicitud de Pedido</h1>
        <p className="text-on-surface-variant mb-10">
          Completá tus datos. Te abriremos WhatsApp con toda la información lista para enviar al atelier.
          Un empleado confirmará la disponibilidad y acordará los términos con vos.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">

          {/* ── Form ──────────────────────────────────────────────────────── */}
          <div className="lg:col-span-3 space-y-6">

            {/* Tipo de operación */}
            <div>
              <span className="block text-xs font-label uppercase tracking-widest text-on-surface font-bold mb-3">
                Tipo de operación
              </span>
              <div className="flex gap-4">
                {[
                  { value: 'alquiler', label: 'Alquiler', icon: 'calendar_today' },
                  { value: 'venta', label: 'Compra', icon: 'shopping_bag' },
                ].map(({ value, label, icon }) => (
                  <button
                    key={value}
                    onClick={() => setTipo(value)}
                    className={`flex-1 flex items-center gap-3 px-5 py-4 rounded-xl border-2 font-headline font-bold transition-all ${
                      tipo === value
                        ? 'border-primary editorial-gradient text-white'
                        : 'border-outline-variant text-on-surface-variant hover:border-primary/50'
                    }`}
                  >
                    <span className="material-symbols-outlined">{icon}</span>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Fechas (solo alquiler) */}
            {tipo === 'alquiler' && (
              <div>
                <span className="block text-xs font-label uppercase tracking-widest text-on-surface font-bold mb-3">
                  Período deseado
                </span>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-surface-container-high rounded-xl p-3">
                    <span className="text-[10px] text-tertiary uppercase font-bold block mb-1">Retiro</span>
                    <input
                      type="date"
                      value={fechaRetiro}
                      onChange={(e) => setFechaRetiro(e.target.value)}
                      className="bg-transparent text-sm font-medium text-on-surface w-full focus:outline-none"
                    />
                  </div>
                  <div className="bg-surface-container-high rounded-xl p-3">
                    <span className="text-[10px] text-tertiary uppercase font-bold block mb-1">Devolución</span>
                    <input
                      type="date"
                      value={fechaDevolucion}
                      onChange={(e) => setFechaDevolucion(e.target.value)}
                      className="bg-transparent text-sm font-medium text-on-surface w-full focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Datos personales */}
            <div>
              <span className="block text-xs font-label uppercase tracking-widest text-on-surface font-bold mb-3">
                Tus datos de contacto
              </span>
              <div className="space-y-4">
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-tertiary text-xl pointer-events-none">
                    person
                  </span>
                  <input
                    type="text"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Tu nombre completo"
                    required
                    className="w-full pl-12 pr-4 py-4 rounded-xl bg-white border border-outline-variant/40 text-on-surface placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
                  />
                </div>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-tertiary text-xl pointer-events-none">
                    phone
                  </span>
                  <input
                    type="tel"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    placeholder="Tu WhatsApp (con código de área)"
                    required
                    className="w-full pl-12 pr-4 py-4 rounded-xl bg-white border border-outline-variant/40 text-on-surface placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
                  />
                </div>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-5 text-tertiary text-xl pointer-events-none">
                    notes
                  </span>
                  <textarea
                    value={notas}
                    onChange={(e) => setNotas(e.target.value)}
                    placeholder="Notas adicionales: talle exacto, evento, dudas..."
                    rows={3}
                    className="w-full pl-12 pr-4 py-4 rounded-xl bg-white border border-outline-variant/40 text-on-surface placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/40 transition resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Botón WhatsApp */}
            <button
              onClick={handleSolicitar}
              disabled={!canSend}
              className="w-full py-5 rounded-xl bg-[#25d366] text-white font-headline font-bold text-lg shadow-lg hover:bg-[#1fba58] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current" aria-hidden="true">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Enviar Solicitud por WhatsApp
            </button>

            {sent && (
              <div className="p-4 rounded-xl bg-primary-container text-[#1a2e05] flex gap-3 items-start animate-slide-up">
                <span className="material-symbols-outlined text-xl mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                <div>
                  <p className="font-headline font-bold">¡WhatsApp abierto!</p>
                  <p className="text-sm mt-1">Si no se abrió automáticamente,{' '}
                    <a
                      href={`https://wa.me/${WHATSAPP_NUMBER}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline font-bold"
                    >
                      hacé click aquí
                    </a>.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* ── Resumen del pedido ─────────────────────────────────────────── */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-card p-6 sticky top-24">
              <h3 className="font-headline font-bold text-lg text-on-surface mb-4 border-b border-outline-variant/20 pb-3">
                Resumen del pedido
              </h3>

              {/* Imagen del disfraz */}
              <div className="aspect-[3/4] rounded-xl overflow-hidden bg-surface-container-low mb-4">
                {disfraz.imagenPrincipal ? (
                  <img
                    src={disfraz.imagenPrincipal}
                    alt={disfraz.nombre}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-5xl">♛</span>
                  </div>
                )}
              </div>

              <p className="font-headline font-bold text-on-surface">{disfraz.nombre}</p>
              {disfraz.talle && (
                <p className="text-sm text-tertiary mt-1">Talle: {disfraz.talle}</p>
              )}

              <div className="mt-4 pt-4 border-t border-outline-variant/20 space-y-2 text-sm text-on-surface-variant">
                {tipo === 'alquiler' && fechaRetiro && (
                  <div className="flex justify-between">
                    <span>Retiro:</span>
                    <span className="font-medium text-on-surface">{fechaRetiro}</span>
                  </div>
                )}
                {tipo === 'alquiler' && fechaDevolucion && (
                  <div className="flex justify-between">
                    <span>Devolución:</span>
                    <span className="font-medium text-on-surface">{fechaDevolucion}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Operación:</span>
                  <span className="font-medium text-on-surface capitalize">{tipo}</span>
                </div>
              </div>

              <p className="mt-6 text-[11px] text-tertiary text-center leading-relaxed">
                El precio final, disponibilidad y condiciones son confirmadas por el atelier vía WhatsApp.
              </p>
            </div>
          </div>

        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
