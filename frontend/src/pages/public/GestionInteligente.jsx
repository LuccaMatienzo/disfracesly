import { Link } from 'react-router-dom';
import PublicNavbar from '@/components/public/PublicNavbar';
import PublicFooter from '@/components/public/PublicFooter';

const FEATURES = [
  {
    icon: 'inventory_2',
    title: 'Stock en Tiempo Real',
    desc: 'Cada pieza rastreada por estado: disponible, alquilada, en limpieza. Visibilidad total del inventario.',
    color: 'bg-primary-container',
    iconColor: 'text-[#1a2e05]',
    span: 'md:col-span-2',
  },
  {
    icon: 'people',
    title: 'Gestión de Clientes',
    desc: 'Historial completo de alquileres y ventas por cliente.',
    color: 'bg-secondary-container',
    iconColor: 'text-white',
    span: '',
  },
  {
    icon: 'receipt_long',
    title: 'Operaciones XOR',
    desc: 'Alquiler o venta, nunca ambas. Lógica de negocio a prueba de errores.',
    color: 'bg-inverse-surface',
    iconColor: 'text-inverse-on-surface',
    span: '',
  },
  {
    icon: 'bar_chart',
    title: 'Dashboard con KPIs',
    desc: 'Alquileres activos, prendas en limpieza y uptime de operaciones en un vistazo.',
    color: 'bg-tertiary-container',
    iconColor: 'text-on-surface',
    span: '',
  },
  {
    icon: 'payments',
    title: 'Control de Pagos',
    desc: 'Registro de cómo y cuándo pagó cada cliente. Señas, saldos y liquidaciones.',
    color: 'bg-surface-container-high',
    iconColor: 'text-on-surface',
    span: '',
  },
  {
    icon: 'image',
    title: 'Imágenes Curadas',
    desc: 'Galería por disfraz y por pieza. La imagen correcta siempre visible para el equipo.',
    color: 'bg-primary-container',
    iconColor: 'text-[#1a2e05]',
    span: 'md:col-span-2',
  },
];

const TESTIMONIAL = {
  quote:
    '"Antes llevábamos todo en planillas. Con Disfracesly, en 5 minutos sabemos qué tenemos disponible para el fin de semana. Fue un antes y un después."',
  name: 'Valeria M.',
  role: 'Directora de Atelier',
};

export default function GestionInteligente() {
  return (
    <div className="min-h-screen bg-background">
      <PublicNavbar />

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-20 px-6 md:px-10 overflow-hidden">
        <div className="absolute -top-40 right-0 w-[500px] h-[500px] rounded-full bg-primary/10 blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary-container text-[#1a2e05] font-label text-xs uppercase tracking-widest mb-6">
              Para Administradores
            </span>
            <h1 className="font-headline text-[3rem] md:text-[4rem] font-black leading-[1.05] tracking-tight text-on-surface mb-6">
              Gestión Inteligente{' '}
              <span className="bg-clip-text text-transparent editorial-gradient">
                para tu Atelier
              </span>
            </h1>
            <p className="font-body text-xl text-on-surface-variant leading-relaxed mb-10 max-w-lg">
              Un sistema diseñado específicamente para el negocio del alquiler y venta de disfraces.
              Control total. Sin complicaciones.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                to="/acceso"
                className="editorial-gradient text-white px-8 py-4 rounded-xl font-headline font-bold text-base shadow-editorial hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2"
              >
                Acceder al Portal
                <span className="material-symbols-outlined text-xl">arrow_forward</span>
              </Link>
              <a
                href="https://wa.me/5491100000000?text=Hola%2C%20quiero%20conocer%20más%20sobre%20la%20plataforma%20de%20gestión%20Disfracesly"
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-4 rounded-xl border-2 border-outline-variant font-headline font-bold text-base text-on-surface hover:border-primary hover:text-primary transition-all flex items-center gap-2"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-[#25d366]" aria-hidden="true">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Consultar por WhatsApp
              </a>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { value: '23', label: 'Tablas en la base de datos', icon: 'table_chart' },
              { value: 'XOR', label: 'Lógica Alquiler/Venta exclusiva', icon: 'alt_route' },
              { value: '100%', label: 'Soft-delete. Nunca perdés un registro', icon: 'history' },
              { value: 'JWT', label: 'Autenticación segura con refresh tokens', icon: 'lock' },
            ].map(({ value, label, icon }) => (
              <div key={label} className="bg-white rounded-2xl shadow-card p-6 hover:-translate-y-1 transition-transform">
                <span className="material-symbols-outlined text-primary text-2xl mb-3 block">{icon}</span>
                <p className="font-headline font-black text-3xl text-on-surface">{value}</p>
                <p className="text-xs text-on-surface-variant mt-1 leading-tight">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features Bento ────────────────────────────────────────────────── */}
      <section className="py-20 px-6 md:px-10 bg-surface-container-low">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12 text-center">
            <span className="font-label text-xs uppercase tracking-widest text-primary">Features</span>
            <h2 className="font-headline text-4xl font-black text-on-surface mt-2">
              Todo lo que necesitás, nada que no
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {FEATURES.map(({ icon, title, desc, color, iconColor, span }) => (
              <div
                key={title}
                className={`group rounded-2xl p-8 ${color} hover:-translate-y-1 transition-all duration-300 ${span}`}
              >
                <span className={`material-symbols-outlined text-3xl mb-4 block ${iconColor}`}>{icon}</span>
                <h3 className={`font-headline font-bold text-xl mb-2 ${iconColor}`}>{title}</h3>
                <p className={`text-sm leading-relaxed opacity-80 ${iconColor}`}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonial ───────────────────────────────────────────────────── */}
      <section className="py-24 px-6 md:px-10">
        <div className="max-w-3xl mx-auto text-center">
          <span className="material-symbols-outlined text-4xl text-primary mb-6 block" style={{ fontVariationSettings: "'FILL' 1" }}>
            format_quote
          </span>
          <blockquote className="font-headline text-2xl md:text-3xl font-bold text-on-surface leading-snug mb-8">
            {TESTIMONIAL.quote}
          </blockquote>
          <div className="flex items-center justify-center gap-3">
            <div className="w-10 h-10 rounded-full editorial-gradient flex items-center justify-center text-white font-headline font-bold">
              {TESTIMONIAL.name.charAt(0)}
            </div>
            <div className="text-left">
              <p className="font-headline font-bold text-on-surface">{TESTIMONIAL.name}</p>
              <p className="text-sm text-tertiary">{TESTIMONIAL.role}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA final ─────────────────────────────────────────────────────── */}
      <section className="py-20 px-6 md:px-10 bg-inverse-surface relative overflow-hidden">
        <div className="relative max-w-3xl mx-auto text-center">
          <h2 className="font-headline font-black text-4xl text-inverse-on-surface mb-6">
            ¿Listo para gestionar tu atelier{' '}
            <span className="text-primary-container">con precisión</span>?
          </h2>
          <Link
            to="/acceso"
            className="inline-flex items-center gap-3 editorial-gradient text-white px-10 py-5 rounded-xl font-headline font-bold text-lg shadow-editorial hover:scale-[1.03] transition-all"
          >
            Acceder al Portal
            <span className="material-symbols-outlined">arrow_forward</span>
          </Link>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
