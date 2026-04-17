import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { fetchDisfrazById } from '@/hooks/useCatalogoPublico';
import PublicNavbar from '@/components/public/PublicNavbar';
import PublicFooter from '@/components/public/PublicFooter';

const DISPONIBILIDAD_BADGE = {
  DISPONIBLE: { label: 'Disponible', cls: 'bg-primary-container text-[#1a2e05]' },
  RESERVADA:  { label: 'Reservada',  cls: 'bg-secondary-container text-on-surface' },
  ALQUILADA:  { label: 'Alquilada', cls: 'bg-tertiary-container text-on-surface' },
  SIN_STOCK:  { label: 'Sin Stock',  cls: 'bg-surface-container text-tertiary' },
};

const PLACEHOLDER = 'https://placehold.co/600x750/efefe0/6b7a7a?text=Disfracesly';

export default function DetalleDisfraz() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [disfraz, setDisfraz] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeImg, setActiveImg] = useState(0);
  const [talleSeleccionado, setTalleSeleccionado] = useState(null);
  const [fechaRetiro, setFechaRetiro] = useState('');
  const [fechaDevolucion, setFechaDevolucion] = useState('');

  useEffect(() => {
    setIsLoading(true);
    fetchDisfrazById(id)
      .then((data) => {
        setDisfraz(data);
        if (data.talles?.length) setTalleSeleccionado(data.talles[0]);
      })
      .catch((e) => setError(e.message))
      .finally(() => setIsLoading(false));
  }, [id]);

  const handleSolicitar = () => {
    if (!disfraz) return;
    navigate('/solicitud', {
      state: {
        disfraz: {
          id: disfraz.id_disfraz,
          nombre: disfraz.nombre,
          talle: talleSeleccionado,
          imagenPrincipal: disfraz.imagenPrincipal,
        },
        fechaRetiro,
        fechaDevolucion,
      },
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <PublicNavbar />
        <div className="pt-28 max-w-7xl mx-auto px-6 md:px-10 grid grid-cols-1 lg:grid-cols-12 gap-12 animate-pulse">
          <div className="lg:col-span-7 aspect-[4/5] bg-surface-container rounded-2xl" />
          <div className="lg:col-span-5 space-y-4 pt-6">
            <div className="h-6 bg-surface-container rounded w-24" />
            <div className="h-10 bg-surface-container rounded w-3/4" />
            <div className="h-6 bg-surface-container rounded w-1/2" />
            <div className="h-32 bg-surface-container rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !disfraz) {
    return (
      <div className="min-h-screen bg-background">
        <PublicNavbar />
        <div className="pt-32 text-center px-6">
          <span className="material-symbols-outlined text-6xl text-error block mb-4">error</span>
          <p className="text-on-surface-variant text-lg mb-6">{error ?? 'Disfraz no encontrado'}</p>
          <Link to="/catalogo" className="editorial-gradient text-white px-8 py-3 rounded-xl font-headline font-bold">
            Volver al Catálogo
          </Link>
        </div>
      </div>
    );
  }

  const badge = DISPONIBILIDAD_BADGE[disfraz.disponibilidad] ?? DISPONIBILIDAD_BADGE.SIN_STOCK;
  const imgs = disfraz.imagenes?.length ? disfraz.imagenes : [PLACEHOLDER];

  return (
    <div className="min-h-screen bg-background">
      <PublicNavbar />

      <main className="pt-24 pb-16 px-6 md:px-10 max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs font-label uppercase tracking-widest text-tertiary mb-8">
          <Link to="/" className="hover:text-primary transition-colors">Inicio</Link>
          <span className="material-symbols-outlined text-xs">chevron_right</span>
          <Link to="/catalogo" className="hover:text-primary transition-colors">Catálogo</Link>
          <span className="material-symbols-outlined text-xs">chevron_right</span>
          {disfraz.categorias?.[0] && (
            <>
              <span className="hover:text-primary">{disfraz.categorias[0]}</span>
              <span className="material-symbols-outlined text-xs">chevron_right</span>
            </>
          )}
          <span className="text-on-surface font-bold">{disfraz.nombre}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* ── Galería ─────────────────────────────────────────────────────── */}
          <div className="lg:col-span-7 grid grid-cols-12 gap-4">
            {/* Imagen principal */}
            <div className="col-span-12 rounded-2xl overflow-hidden bg-surface-container-low shadow-card">
              <img
                src={imgs[activeImg]}
                alt={disfraz.nombre}
                className="w-full aspect-[4/5] object-cover transition-opacity duration-300"
                onError={(e) => { e.target.src = PLACEHOLDER; }}
              />
            </div>

            {/* Thumbnails */}
            {imgs.length > 1 && imgs.slice(0, 4).map((img, i) => (
              <button
                key={i}
                onClick={() => setActiveImg(i)}
                className={`col-span-3 rounded-xl overflow-hidden transition-all hover:scale-105 ${
                  activeImg === i ? 'ring-2 ring-primary' : 'opacity-70 hover:opacity-100'
                }`}
              >
                <img
                  src={img}
                  alt={`Vista ${i + 1}`}
                  className="w-full aspect-square object-cover"
                  onError={(e) => { e.target.src = PLACEHOLDER; }}
                />
              </button>
            ))}
          </div>

          {/* ── Info ────────────────────────────────────────────────────────── */}
          <div className="lg:col-span-5 space-y-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${badge.cls}`}>
                  {badge.label}
                </span>
                {disfraz.categorias?.[0] && (
                  <span className="text-tertiary font-label text-xs uppercase tracking-widest">
                    {disfraz.categorias[0]}
                  </span>
                )}
              </div>
              <h1 className="font-headline text-4xl font-black text-on-surface leading-tight mb-4">
                {disfraz.nombre}
              </h1>
              {disfraz.descripcion && (
                <p className="text-on-surface-variant leading-relaxed">
                  {disfraz.descripcion}
                </p>
              )}
            </div>

            {/* Talles */}
            {disfraz.talles?.length > 0 && (
              <div>
                <span className="block text-xs font-label uppercase tracking-widest text-on-surface font-bold mb-3">
                  Talle disponible
                </span>
                <div className="flex flex-wrap gap-3">
                  {disfraz.talles.map((t) => (
                    <button
                      key={t}
                      onClick={() => setTalleSeleccionado(t)}
                      className={`w-14 h-14 flex items-center justify-center rounded-xl font-label font-bold text-sm transition-all ${
                        talleSeleccionado === t
                          ? 'editorial-gradient text-white shadow-md scale-105'
                          : 'bg-surface-container-low text-tertiary hover:bg-primary-container hover:text-[#1a2e05]'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Período de alquiler */}
            <div>
              <span className="block text-xs font-label uppercase tracking-widest text-on-surface font-bold mb-3">
                Período deseado
              </span>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-surface-container-high rounded-xl p-3 flex flex-col">
                  <span className="text-[10px] text-tertiary uppercase font-bold mb-1">Retiro</span>
                  <input
                    type="date"
                    value={fechaRetiro}
                    onChange={(e) => setFechaRetiro(e.target.value)}
                    className="bg-transparent text-sm font-medium text-on-surface focus:outline-none"
                  />
                </div>
                <div className="bg-surface-container-high rounded-xl p-3 flex flex-col">
                  <span className="text-[10px] text-tertiary uppercase font-bold mb-1">Devolución</span>
                  <input
                    type="date"
                    value={fechaDevolucion}
                    onChange={(e) => setFechaDevolucion(e.target.value)}
                    className="bg-transparent text-sm font-medium text-on-surface focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="pt-2">
              <button
                onClick={handleSolicitar}
                disabled={disfraz.disponibilidad === 'SIN_STOCK'}
                className="w-full py-5 rounded-xl editorial-gradient text-white font-headline font-bold text-lg shadow-editorial hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-2xl">chat</span>
                Solicitar por WhatsApp
              </button>
              <p className="text-center text-[11px] text-tertiary mt-4 uppercase tracking-widest">
                Sujeto a confirmación · Respuesta en minutos
              </p>
            </div>

            {/* Incluye */}
            {disfraz.piezas?.length > 0 && (
              <div className="bg-surface-container-low rounded-2xl p-6">
                <h3 className="text-xs font-label uppercase tracking-widest text-on-surface font-bold border-b border-outline-variant/20 pb-3 mb-4">
                  Incluye
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {disfraz.piezas.map((p) => (
                    <div key={p.id_pieza} className="flex items-center gap-3">
                      <span
                        className="material-symbols-outlined text-primary text-xl"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        check_circle
                      </span>
                      <span className="text-sm">{p.nombre}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Trust badges */}
            <div className="flex items-center gap-8 py-2 opacity-60 hover:opacity-100 transition-opacity">
              {[
                { icon: 'verified', label: 'Calidad Verificada' },
                { icon: 'sanitizer', label: 'Deep Cleaned' },
              ].map(({ icon, label }) => (
                <div key={label} className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-xl">{icon}</span>
                  <span className="text-[10px] font-bold uppercase tracking-tight">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
