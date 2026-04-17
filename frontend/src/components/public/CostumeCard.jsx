import { Link } from 'react-router-dom';

const BADGE = {
  DISPONIBLE:  { label: 'Disponible',   cls: 'bg-primary-container text-[#1a2e05]' },
  RESERVADA:   { label: 'Reservada',    cls: 'bg-secondary-container text-white' },
  ALQUILADA:   { label: 'Alquilada',    cls: 'bg-tertiary-container text-on-surface' },
  SIN_STOCK:   { label: 'Sin Stock',    cls: 'bg-surface-container-high text-tertiary' },
};

export default function CostumeCard({ disfraz }) {
  const {
    id_disfraz,
    nombre,
    descripcion,
    imagenPrincipal,
    disponibilidad = 'DISPONIBLE',
    talles = [],
    categorias = [],
  } = disfraz;

  const badge = BADGE[disponibilidad] ?? BADGE.SIN_STOCK;

  return (
    <article className="group relative bg-surface-container-lowest rounded-2xl overflow-hidden shadow-card hover:shadow-editorial transition-all duration-300 hover:-translate-y-1 flex flex-col">
      {/* Imagen */}
      <Link
        to={`/catalogo/${id_disfraz}`}
        className="block overflow-hidden aspect-[4/5] bg-surface-container-low relative"
        aria-label={`Ver ${nombre}`}
      >
        {imagenPrincipal ? (
          <img
            src={imagenPrincipal}
            alt={nombre}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-surface-container">
            <span className="material-symbols-outlined text-5xl text-outline-variant opacity-40">
              apparel
            </span>
          </div>
        )}
        {/* Badge flotante */}
        <span className={`absolute top-3 left-3 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${badge.cls}`}>
          {badge.label}
        </span>
      </Link>

      {/* Info */}
      <div className="flex flex-col flex-1 p-5">
        {/* Categorías */}
        {categorias.length > 0 && (
          <p className="text-[10px] font-label uppercase tracking-widest text-tertiary mb-1">
            {categorias.slice(0, 2).join(' · ')}
          </p>
        )}
        <h3 className="font-headline font-bold text-on-surface text-lg leading-tight mb-2 line-clamp-2">
          {nombre}
        </h3>
        {descripcion && (
          <p className="text-body-md text-on-surface-variant line-clamp-2 mb-4 flex-1">
            {descripcion}
          </p>
        )}

        {/* Talles disponibles */}
        {talles.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-4">
            {talles.map((t) => (
              <span
                key={t}
                className="px-2.5 py-1 rounded-lg bg-surface-container-low text-tertiary text-xs font-label uppercase"
              >
                {t}
              </span>
            ))}
          </div>
        )}

        {/* CTA */}
        <Link
          to={`/catalogo/${id_disfraz}`}
          className="mt-auto block w-full text-center py-3 rounded-xl editorial-gradient text-white font-headline font-bold text-sm shadow-md hover:scale-[1.02] active:scale-95 transition-all"
        >
          Ver Detalle
        </Link>
      </div>
    </article>
  );
}
