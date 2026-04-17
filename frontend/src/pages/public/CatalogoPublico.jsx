import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import PublicNavbar from '@/components/public/PublicNavbar';
import PublicFooter from '@/components/public/PublicFooter';
import CostumeCard from '@/components/public/CostumeCard';
import { useCatalogoPublico } from '@/hooks/useCatalogoPublico';

const CATEGORIAS_RAPIDAS = [
  { value: '', label: 'Todos' },
  { value: 'Fantasía', label: 'Fantasía' },
  { value: 'Histórico', label: 'Histórico' },
  { value: 'Cosplay', label: 'Cosplay' },
  { value: 'Infantil', label: 'Infantil' },
  { value: 'Burlesco', label: 'Burlesco' },
  { value: 'Victoriano', label: 'Victoriano' },
];

const Skeleton = () => (
  <div className="bg-surface-container-low rounded-2xl overflow-hidden animate-pulse">
    <div className="aspect-[4/5] bg-surface-container" />
    <div className="p-5 space-y-3">
      <div className="h-3 bg-surface-container rounded w-20" />
      <div className="h-5 bg-surface-container rounded w-3/4" />
      <div className="h-10 bg-surface-container rounded" />
    </div>
  </div>
);

export default function CatalogoPublico() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') ?? '');
  const [selectedCat, setSelectedCat] = useState(searchParams.get('categoria') ?? '');

  const { data, total, page, totalPages, isLoading, error, applyFilters, goToPage } =
    useCatalogoPublico({
      search: searchParams.get('search') ?? '',
      categoria: searchParams.get('categoria') ?? '',
    });

  const handleSearch = (e) => {
    e.preventDefault();
    const newParams = new URLSearchParams();
    if (search) newParams.set('search', search);
    if (selectedCat) newParams.set('categoria', selectedCat);
    setSearchParams(newParams);
    applyFilters({ search, categoria: selectedCat });
  };

  const handleCat = (cat) => {
    setSelectedCat(cat);
    const newParams = new URLSearchParams();
    if (search) newParams.set('search', search);
    if (cat) newParams.set('categoria', cat);
    setSearchParams(newParams);
    applyFilters({ search, categoria: cat });
  };

  return (
    <div className="min-h-screen bg-background">
      <PublicNavbar />

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <section className="pt-28 pb-8 px-6 md:px-10 bg-surface-container-low">
        <div className="max-w-7xl mx-auto">
          <h1 className="font-headline font-black text-4xl text-on-surface mb-3">
            Catálogo de Disfraces
          </h1>
          <p className="text-on-surface-variant text-lg mb-6">
            {total > 0 ? `${total} disfraz${total !== 1 ? 'es' : ''} disponibles` : 'Cargando...'}
          </p>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="flex gap-3 max-w-xl">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-tertiary text-xl pointer-events-none">
                search
              </span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar disfraces..."
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-outline-variant/40 text-on-surface placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
              />
            </div>
            <button
              type="submit"
              className="editorial-gradient text-white px-6 py-3 rounded-xl font-headline font-bold hover:scale-[1.02] transition-transform"
            >
              Buscar
            </button>
          </form>
        </div>
      </section>

      {/* ── Inventory Ribbon ───────────────────────────────────────────────── */}
      <section className="border-b border-outline-variant/20 px-6 md:px-10">
        <div className="max-w-7xl mx-auto py-4 flex gap-3 overflow-x-auto scrollbar-none">
          {CATEGORIAS_RAPIDAS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => handleCat(value)}
              className={`px-4 py-2 rounded-full font-label text-sm font-semibold whitespace-nowrap transition-all ${
                selectedCat === value
                  ? 'editorial-gradient text-white shadow-md'
                  : 'bg-surface-container text-on-surface-variant hover:bg-primary-container hover:text-[#1a2e05]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      {/* ── Main grid ────────────────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-6 md:px-10 py-10">
        {error && (
          <div className="text-center py-20">
            <span className="material-symbols-outlined text-5xl text-error mb-4 block">error_outline</span>
            <p className="text-on-surface-variant">{error}</p>
            <button
              onClick={() => applyFilters({ search, categoria: selectedCat })}
              className="mt-4 editorial-gradient text-white px-6 py-3 rounded-xl font-label font-bold"
            >
              Reintentar
            </button>
          </div>
        )}

        {!error && (
          <>
            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {isLoading
                ? Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} />)
                : data.map((d) => <CostumeCard key={d.id_disfraz} disfraz={d} />)}
            </div>

            {/* Empty state */}
            {!isLoading && data.length === 0 && (
              <div className="text-center py-24">
                <span className="material-symbols-outlined text-6xl text-outline-variant block mb-4">
                  apparel
                </span>
                <p className="text-on-surface-variant text-lg">
                  No encontramos disfraces con esos filtros
                </p>
                <button
                  onClick={() => { setSearch(''); handleCat(''); }}
                  className="mt-4 text-primary font-label font-bold hover:underline"
                >
                  Limpiar filtros
                </button>
              </div>
            )}

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-3 mt-12">
                <button
                  onClick={() => goToPage(page - 1)}
                  disabled={page === 1}
                  className="p-2 rounded-xl bg-surface-container disabled:opacity-40 hover:bg-primary-container transition-colors"
                >
                  <span className="material-symbols-outlined">chevron_left</span>
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => goToPage(p)}
                    className={`w-10 h-10 rounded-xl font-label font-bold text-sm transition-all ${
                      p === page
                        ? 'editorial-gradient text-white shadow-md'
                        : 'bg-surface-container text-on-surface-variant hover:bg-primary-container hover:text-[#1a2e05]'
                    }`}
                  >
                    {p}
                  </button>
                ))}

                <button
                  onClick={() => goToPage(page + 1)}
                  disabled={page === totalPages}
                  className="p-2 rounded-xl bg-surface-container disabled:opacity-40 hover:bg-primary-container transition-colors"
                >
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>
              </div>
            )}
          </>
        )}
      </main>

      <PublicFooter />
    </div>
  );
}
