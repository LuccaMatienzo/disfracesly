import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import PublicNavbar from '@/components/public/PublicNavbar';
import PublicFooter from '@/components/public/PublicFooter';

const EVENTOS_ANUALES = [
  { nombre: 'Malvinas', mes: 4, dia: 2, subtitle: 'Colección Conmemorativa', color: 'from-[#1e3a8a] to-[#3b82f6]', emoji: '🇦🇷' },
  { nombre: 'Día del Animal', mes: 4, dia: 29, subtitle: 'Colección Animales', color: 'from-[#064e3b] to-[#10b981]', emoji: '🦁' },
  { nombre: 'Revolución de Mayo', mes: 5, dia: 25, subtitle: 'Colección Patria', color: 'from-[#8b5cf6] to-[#d946ef]', emoji: '🏛️' },
  { nombre: 'Dia de la Bandera', mes: 6, dia: 20, subtitle: 'Colección Celeste y Blanca', color: 'from-[#0ea5e9] to-[#38bdf8]', emoji: '🇦🇷' },
  { nombre: 'Dia de la Independencia', mes: 7, dia: 9, subtitle: 'Colección Independencia', color: 'from-[#b45309] to-[#f59e0b]', emoji: '📜' },
  { nombre: 'Día de la Raza', mes: 10, dia: 12, subtitle: 'Colección Diversidad', color: 'from-[#be123c] to-[#f43f5e]', emoji: '🌎' },
  { nombre: 'Halloween', mes: 10, dia: 31, subtitle: 'Noche de Brujas', color: 'from-[#c2410c] to-[#f97316]', emoji: '🎃' },
];

function getProximoEvento() {
  const hoy = new Date();
  const mesActual = hoy.getMonth() + 1;
  const diaActual = hoy.getDate();

  for (const evento of EVENTOS_ANUALES) {
    if (evento.mes > mesActual || (evento.mes === mesActual && evento.dia >= diaActual)) {
      return evento;
    }
  }
  return EVENTOS_ANUALES[0];
}

const BENTO_STYLES = [
  { color: 'from-[#a43c12] to-[#fe7e4f]', emoji: '✨', span: 'md:col-span-2 md:row-span-2' },
  { color: 'from-[#65a30d] to-[#a3e635]', emoji: '🎭', span: '' },
  { color: 'from-[#50606f] to-[#abbbcc]', emoji: '🌟', span: '' },
  { color: 'from-[#b45309] to-[#fbbf24]', emoji: '👑', span: 'md:col-span-2' },
];

const JOURNEY_STEPS = [
  {
    icon: 'search',
    step: '01',
    title: 'Explorá el Catálogo',
    desc: 'Navegá por nuestra extensa colección y encontrá el disfraz perfecto.',
  },
  {
    icon: 'chat',
    step: '02',
    title: 'Solicitá por WhatsApp',
    desc: 'Enviás tu solicitud directamente a la tienda y te confirmamos disponibilidad.',
  },
  {
    icon: 'apparel',
    step: '03',
    title: 'Retirá y Disfrutá',
    desc: 'Coordinamos para que retires el disfraz. Te lo entregamos impecable, limpio y listo.',
  },
];

const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER ?? '5493814120331';

export default function LandingPage() {
  const [populares, setPopulares] = useState([]);
  const [heroDisfraz, setHeroDisfraz] = useState(null);

  const proximoEvento = useMemo(() => getProximoEvento(), []);

  useEffect(() => {
    const API_URL = import.meta.env.VITE_API_URL || '/api';

    fetch(`${API_URL}/catalogo/disfraces/populares/publico`)
      .then(r => r.json())
      .then(data => {
        // Ensure data is an array
        if (Array.isArray(data)) {
          setPopulares(data);
        } else if (data && data.data && Array.isArray(data.data)) {
          setPopulares(data.data);
        }
      })
      .catch(console.error);

    fetch(`${API_URL}/catalogo/disfraces/publico?search=${encodeURIComponent(proximoEvento.nombre)}&limit=1`)
      .then(r => r.json())
      .then(res => {
        if (res && res.data && res.data.length > 0) {
          setHeroDisfraz(res.data[0]);
        }
      })
      .catch(console.error);
  }, [proximoEvento.nombre]);

  return (
    <div className="min-h-screen bg-background text-on-background overflow-x-hidden">
      <PublicNavbar />

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section className="relative pt-28 pb-20 px-6 md:px-10 overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute -top-32 -right-32 w-[600px] h-[600px] rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-32 w-[400px] h-[400px] rounded-full bg-secondary/10 blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Text */}
          <div>
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary-container text-primary-on-container font-label text-xs tracking-widest mb-6">
              Alquiler y Venta de Disfraces Confeccionados Artesanalmente
            </span>
            <h1 className="font-headline text-[3.5rem] md:text-[4.5rem] font-black leading-[1.05] tracking-tight text-on-surface mb-6">
              Dale vida a tu{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-blue-500">
                imaginación
              </span>
            </h1>
            <div className="mb-10 max-w-lg">
              <p className="font-body text-xl text-on-surface-variant leading-relaxed">
                Detrás de cada disfraz hay un nombre, una historia, más de 15 años de trayectoria y dedicación.
              </p>
              <p className="font-body text-xl text-on-surface-variant leading-relaxed">
                Liliana Elizabeth Sosa diseña y crea cada pieza a mano,
                cuidando cada detalle para vestir tus mejores recuerdos.
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              <Link
                to="/catalogo"
                className="editorial-gradient text-white px-8 py-4 rounded-xl font-headline font-bold text-base shadow-editorial hover:scale-[1.02] active:scale-95 transition-all outline-none ring-0 overflow-hidden bg-clip-padding flex items-center gap-2"
              >
                Explorar Catálogo
                <span className="material-symbols-outlined text-xl">arrow_forward</span>
              </Link>
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-4 rounded-xl border-2 border-outline-variant font-headline font-bold text-base text-on-surface hover:border-[#25d366] hover:text-[#25d366] transition-all flex items-center gap-2"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-[#25d366]" aria-hidden="true">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                Consultar por WhatsApp
              </a>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap gap-6 mt-12 opacity-60">
              {[
                { icon: 'verified', label: 'Calidad Garantizada' },
                { icon: 'content_cut', label: '100% Artesanal' },
                { icon: 'volunteer_activism', label: 'Atencion Personalizada' },
              ].map(({ icon, label }) => (
                <div key={label} className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-lg">{icon}</span>
                  <span className="text-xs font-label uppercase tracking-wider text-on-surface-variant">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Hero visual */}
          <div className="relative flex justify-center">
            <div
              className="relative w-72 h-96 md:w-96 md:h-[32rem]"
              style={{ animation: 'float 6s ease-in-out infinite' }}
            >
              {heroDisfraz && heroDisfraz.imagenPrincipal ? (
                <div className="w-full h-full rounded-3xl overflow-hidden shadow-editorial border border-outline-variant/30 relative">
                  <img src={heroDisfraz.imagenPrincipal} alt={heroDisfraz.nombre} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-8">
                    <span className="text-white/80 font-label text-xs uppercase tracking-widest mb-1">{proximoEvento.nombre}</span>
                    <h3 className="text-white font-headline font-black text-2xl leading-tight">{heroDisfraz.nombre}</h3>
                  </div>
                </div>
              ) : (
                <div className={`w-full h-full rounded-3xl bg-gradient-to-br ${proximoEvento.color} flex items-center justify-center shadow-editorial border border-primary/10 relative overflow-hidden`}>
                  <div className="absolute inset-0 bg-black/10 mix-blend-overlay"></div>
                  <div className="text-center p-8 relative z-10">
                    <span className="text-8xl block mb-4 drop-shadow-md">{proximoEvento.emoji}</span>
                    <p className="font-headline font-black text-2xl text-white drop-shadow-md">{proximoEvento.nombre}</p>
                    <p className="text-sm text-white/90 mt-2 font-label uppercase tracking-widest drop-shadow-md">{proximoEvento.subtitle}</p>
                  </div>
                </div>
              )}
              {/* Accent card */}
              <div className="absolute -bottom-6 -left-6 bg-card-panel rounded-2xl shadow-float px-5 py-4 flex items-center gap-3">
                <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>event</span>
                <div>
                  <p className="font-headline font-bold text-sm text-on-surface">Próximo Evento</p>
                  <p className="text-xs text-tertiary">Colección {proximoEvento.nombre}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Curated Collections Bento ─────────────────────────────────────── */}
      <section className="py-20 px-6 md:px-10 bg-surface-container-low">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12">
            <span className="font-label text-xs uppercase tracking-widest text-primary">
              Disfraces únicos
            </span>
            <h2 className="font-headline text-4xl font-black text-on-surface mt-2">
              Hechos con dedicación y amor
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {populares.map((disfraz, index) => {
              const style = BENTO_STYLES[index % BENTO_STYLES.length];
              const label = disfraz.categorias && disfraz.categorias.length > 0 ? disfraz.categorias[0].nombre : 'Destacado';

              return (
                <Link
                  key={disfraz.id_disfraz}
                  to={`/catalogo/${disfraz.id_disfraz}`}
                  className={`group relative rounded-2xl overflow-hidden cursor-pointer hover:scale-[1.02] transition-all duration-300 ${style.span}`}
                >
                  <div className={`bg-gradient-to-br ${style.color} h-56 md:h-full min-h-48 flex flex-col justify-between p-8 relative`}>
                    {disfraz.imagenPrincipal && (
                      <div className="absolute inset-0 z-0">
                        <img src={disfraz.imagenPrincipal} alt={disfraz.nombre} className="w-full h-full object-cover opacity-40 mix-blend-overlay group-hover:scale-105 transition-transform duration-700" />
                      </div>
                    )}
                    <div className="relative z-10 flex flex-col justify-between h-full">
                      <span className="text-white/80 font-label text-xs uppercase tracking-widest bg-black/20 self-start px-3 py-1 rounded-full backdrop-blur-md">{label}</span>
                      <div className="mt-auto">
                        <div className="text-4xl mb-3 drop-shadow-md">{style.emoji}</div>
                        <p className="text-white font-headline font-black text-2xl leading-tight drop-shadow-md">{disfraz.nombre}</p>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-white/50 group-hover:text-white group-hover:translate-x-1 transition-all absolute bottom-8 right-8 z-10">
                      arrow_forward
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="text-center mt-10">
            <Link
              to="/catalogo"
              className="font-headline font-bold text-primary border-b-2 border-primary/30 hover:border-primary pb-1 transition-all"
            >
              Ver catálogo completo →
            </Link>
          </div>
        </div>
      </section>

      {/* ──  ───────────────────────────────────────────── */}
      <section className="py-20 px-6 md:px-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="font-label text-xs uppercase tracking-widest text-primary">
              Cómo funciona
            </span>
            <h2 className="font-headline text-4xl font-black text-on-surface mt-2">
              Descubrí tu disfraz ideal en 3 pasos
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {JOURNEY_STEPS.map(({ icon, step, title, desc }) => (
              <div key={step} className="relative">
                {/* Connector line */}
                <div className="hidden md:block absolute top-8 left-full w-full h-px bg-outline-variant/40 z-0 w-1/2" />

                <div className="relative z-10 flex flex-col items-start gap-4 p-8 rounded-2xl bg-card-panel border border-outline-variant/20 shadow-card hover:-translate-y-1 transition-transform">
                  <div className="w-14 h-14 rounded-xl editorial-gradient flex items-center justify-center shadow-md">
                    <span className="material-symbols-outlined text-white text-2xl">{icon}</span>
                  </div>
                  <span className="font-label text-xs text-tertiary tracking-widest">{step}</span>
                  <h3 className="font-headline font-bold text-xl text-on-surface">{title}</h3>
                  <p className="text-on-surface-variant text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Call to Action ─────────────────────────────────────────────── */}
      <section className="py-24 px-6 md:px-10 relative overflow-hidden">
        {/* Background decorative blobs */}
        <div className="absolute top-1/2 left-0 md:left-1/4 w-72 h-72 rounded-full bg-primary/10 blur-3xl -translate-y-1/2 pointer-events-none" />
        <div className="absolute top-1/2 right-0 md:right-1/4 w-72 h-72 rounded-full bg-secondary/10 blur-3xl -translate-y-1/2 pointer-events-none" />

        <div className="relative max-w-4xl mx-auto">
          {/* Floating Container with Glassmorphism */}
          <div className="rounded-xl shadow-sm border border-outline-variant/30 bg-[#FFFFF0]/90 dark:bg-[#1f201a]/90 backdrop-blur-md px-8 py-16 md:py-20 text-center flex flex-col items-center transition-colors duration-300">

            <h2 className="font-headline font-black text-4xl md:text-5xl text-gray-800 dark:text-on-surface mb-6">
              Encontrá el Disfraz
              <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-blue-500">
                Perfecto para Vos
              </span>
            </h2>

            <p className="text-gray-600 dark:text-on-surface-variant text-lg mb-10 max-w-lg mx-auto leading-relaxed">
              Explorá el catálogo y consultá disponibilidad directamente por WhatsApp.
            </p>

            <div className="flex flex-col sm:flex-row gap-5 items-center justify-center w-full sm:w-auto">
              {/* Primary CTA (Green Gradient) */}
              <Link
                to="/catalogo"
                className="editorial-gradient text-white px-8 py-4 rounded-xl font-headline font-bold text-lg shadow-editorial hover:scale-[1.02] active:scale-95 transition-all outline-none ring-0 overflow-hidden bg-clip-padding flex items-center gap-3 w-full sm:w-auto"
              >
                Explorar Catálogo
                <span className="material-symbols-outlined">arrow_forward</span>
              </Link>

              {/* Secondary CTA (Outlined Green) */}
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl border-2 border-outline-variant font-headline font-bold text-lg text-on-surface hover:border-[#25d366] hover:text-[#25d366] transition-all w-full sm:w-auto group"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-[#25d366] group-hover:scale-110 transition-transform" aria-hidden="true">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                Consultar Ahora
              </a>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
