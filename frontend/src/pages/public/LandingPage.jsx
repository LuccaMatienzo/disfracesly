import { Link } from 'react-router-dom';
import PublicNavbar from '@/components/public/PublicNavbar';
import PublicFooter from '@/components/public/PublicFooter';

const FEATURED = [
  {
    label: 'Fantasía',
    title: 'Reina de Corazones',
    sub: 'Premium Collection',
    color: 'from-[#a43c12] to-[#fe7e4f]',
    emoji: '♛',
    span: 'md:col-span-2 md:row-span-2',
  },
  {
    label: 'Histórico',
    title: 'María Antonieta',
    sub: 'Versailles Atelier',
    color: 'from-[#65a30d] to-[#a3e635]',
    emoji: '🌹',
    span: '',
  },
  {
    label: 'Cosplay',
    title: 'Alquimista Dorado',
    sub: 'Anime Collection',
    color: 'from-[#50606f] to-[#abbbcc]',
    emoji: '⚗️',
    span: '',
  },
  {
    label: 'Burlesco',
    title: 'Cabaret Parisino',
    sub: 'Belle Époque',
    color: 'from-[#b45309] to-[#fbbf24]',
    emoji: '🎭',
    span: 'md:col-span-2',
  },
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

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-on-background">
      <PublicNavbar />

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section className="relative pt-28 pb-20 px-6 md:px-10 overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute -top-32 -right-32 w-[600px] h-[600px] rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-32 w-[400px] h-[400px] rounded-full bg-secondary/10 blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Text */}
          <div>
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary-container text-[#1a2e05] font-label text-xs tracking-widest mb-6">
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
                className="editorial-gradient text-white px-8 py-4 rounded-xl font-headline font-bold text-base shadow-editorial hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2"
              >
                Explorar Catálogo
                <span className="material-symbols-outlined text-xl">arrow_forward</span>
              </Link>
              <a
                href="https://wa.me/5493814120331"
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
              {/* Fallback hero card if no image */}
              <div className="w-full h-full rounded-3xl bg-gradient-to-br from-primary-container to-primary/30 flex items-center justify-center shadow-editorial border border-primary/10">
                <div className="text-center p-8">
                  <span className="text-8xl block mb-4">ARG</span>
                  <p className="font-headline font-black text-2xl text-[#1a2e05]">25 de Mayo</p>
                  <p className="text-sm text-primary mt-2 font-label uppercase tracking-widest">Colección Premium</p>
                </div>
              </div>
              {/* Accent card */}
              <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-float px-5 py-4 flex items-center gap-3">
                <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                <div>
                  <p className="font-headline font-bold text-sm text-on-surface">Disponible ahora</p>
                  <p className="text-xs text-tertiary">Colección 25 de Mayo</p>
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
            {FEATURED.map(({ label, title, sub, color, emoji, span }) => (
              <Link
                key={title}
                to={`/catalogo?categoria=${label}`}
                className={`group relative rounded-2xl overflow-hidden cursor-pointer hover:scale-[1.02] transition-all duration-300 ${span}`}
              >
                <div className={`bg-gradient-to-br ${color} h-56 md:h-full min-h-48 flex flex-col justify-between p-8`}>
                  <span className="text-white/30 font-label text-xs uppercase tracking-widest">{label}</span>
                  <div>
                    <div className="text-4xl mb-3">{emoji}</div>
                    <p className="text-white font-headline font-black text-2xl leading-tight">{title}</p>
                    <p className="text-white/75 text-sm mt-1">{sub}</p>
                  </div>
                  <span className="material-symbols-outlined text-white/50 group-hover:text-white group-hover:translate-x-1 transition-all">
                    arrow_forward
                  </span>
                </div>
              </Link>
            ))}
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

      {/* ── The Atelier Journey ───────────────────────────────────────────── */}
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

                <div className="relative z-10 flex flex-col items-start gap-4 p-8 rounded-2xl bg-white border border-outline-variant/20 shadow-card hover:-translate-y-1 transition-transform">
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

      {/* ── Dark CTA ─────────────────────────────────────────────────────── */}
      <section className="py-24 px-6 md:px-10 bg-inverse-surface relative overflow-hidden">
        <div className="absolute -top-20 right-20 w-64 h-64 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -bottom-20 left-20 w-64 h-64 rounded-full bg-secondary/20 blur-3xl" />
        <div className="relative max-w-3xl mx-auto text-center">
          <h2 className="font-headline font-black text-4xl md:text-5xl text-inverse-on-surface mb-6">
            Encontrá el Disfraz
            <br />
            <span className="text-primary-container">Perfecto para Vos</span>
          </h2>
          <p className="text-inverse-on-surface/70 text-lg mb-10 max-w-lg mx-auto leading-relaxed">
            Explorá el catálogo y consultá disponibilidad directamente por WhatsApp.
          </p>
          <Link
            to="/catalogo"
            className="inline-flex items-center gap-3 editorial-gradient text-white px-10 py-5 rounded-xl font-headline font-bold text-lg shadow-editorial hover:scale-[1.03] active:scale-95 transition-all"
          >
            Explorar Catálogo
            <span className="material-symbols-outlined">arrow_forward</span>
          </Link>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
