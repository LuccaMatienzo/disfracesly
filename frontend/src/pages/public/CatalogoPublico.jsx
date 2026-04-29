import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import PublicNavbar from '@/components/public/PublicNavbar';
import PublicFooter from '@/components/public/PublicFooter';
import CostumeCard from '@/components/public/CostumeCard';
import { useCatalogoPublico, useCategoriasPublicas } from '@/hooks/useCatalogoPublico';

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
  const currentSearch = searchParams.get('search') ?? '';
  const currentCat = searchParams.get('categoria') ?? '';

  const [search, setSearch] = useState(currentSearch);
  const [selectedCat, setSelectedCat] = useState(currentCat);

  const { categorias, isLoading: loadingCat } = useCategoriasPublicas();

  const { data, total, page, totalPages, isLoading, error, applyFilters, goToPage, filters } =
    useCatalogoPublico({
      search: currentSearch,
      categoria: currentCat,
    });

  // Sync state with URL when back button is used
  useEffect(() => {
    let applied = false;
    if (filters.categoria !== currentCat) {
      setSelectedCat(currentCat);
      applied = true;
    }
    if (filters.search !== currentSearch) {
      setSearch(currentSearch);
      applied = true;
    }

    if (applied) {
      applyFilters({ search: currentSearch, categoria: currentCat });
    }
  }, [currentSearch, currentCat, filters.search, filters.categoria, applyFilters]);

  // Handle slider arrows
  const scrollContainerRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(Math.ceil(scrollLeft) < scrollWidth - clientWidth - 1);
    }
  };

  useEffect(() => {
    handleScroll();
    window.addEventListener('resize', handleScroll);
    return () => window.removeEventListener('resize', handleScroll);
  }, [categorias]);

  const scrollLeftBtn = () => {
    if (scrollContainerRef.current) {
      const width = scrollContainerRef.current.clientWidth;
      scrollContainerRef.current.scrollBy({ left: -width, behavior: 'smooth' });
    }
  };

  const scrollRightBtn = () => {
    if (scrollContainerRef.current) {
      const width = scrollContainerRef.current.clientWidth;
      scrollContainerRef.current.scrollBy({ left: width, behavior: 'smooth' });
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const newParams = new URLSearchParams();
    if (search) newParams.set('search', search);
    if (currentCat) newParams.set('categoria', currentCat);
    setSearchParams(newParams);
  };

  const handleCat = (cat) => {
    const newParams = new URLSearchParams();
    // Limpiar búsqueda al cambiar de categoría
    setSearch('');
    if (cat) newParams.set('categoria', cat);
    setSearchParams(newParams);
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <PublicNavbar />

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <section className="pt-28 pb-8 px-6 md:px-10 bg-surface-container-low">
        <div className="max-w-7xl mx-auto">
          <h1 
            className="font-headline font-black text-4xl text-on-surface mb-3 cursor-pointer hover:opacity-80 transition-opacity inline-block"
            onClick={() => {
              setSearch('');
              const newParams = new URLSearchParams();
              setSearchParams(newParams);
            }}
          >
            Catálogo de Disfraces
          </h1>
          <p className="text-on-surface-variant text-lg mb-6">
            {isLoading
              ? 'Cargando...'
              : total > 0
                ? total === 1 ? '1 disfraz disponible' : `${total} disfraces disponibles`
                : 'No se encontraron resultados'}
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
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-card-panel border border-outline-variant/40 text-on-surface placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
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
        <div className="max-w-7xl mx-auto py-4 flex items-center gap-3">
          {/* Flecha Izquierda */}
          <button
            onClick={scrollLeftBtn}
            disabled={!showLeftArrow}
            className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${showLeftArrow
              ? 'bg-surface-container-high text-on-surface hover:bg-primary hover:text-white shadow-sm hover:shadow-md hover:scale-105'
              : 'opacity-0 pointer-events-none'
              } hidden md:flex`}
            aria-label="Página anterior de categorías"
          >
            <span className="material-symbols-outlined text-sm font-bold">arrow_back_ios_new</span>
          </button>

          {/* Contenedor scrolleable */}
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex-1 flex gap-3 overflow-x-auto snap-x snap-mandatory scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] px-1 py-1"
          >
            {loadingCat ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex-shrink-0 h-9 w-24 rounded-full bg-surface-container animate-pulse snap-start" />
              ))
            ) : (
              categorias.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => handleCat(value)}
                  className={`snap-start flex-shrink-0 px-5 py-2 rounded-full font-label text-sm font-bold whitespace-nowrap transition-all outline-none [-webkit-tap-highlight-color:transparent] transform active:scale-95 border-2 ${selectedCat === value
                    ? 'editorial-gradient text-white border-[#fafaeb] dark:border-[#131410]'
                    : 'bg-surface-container text-on-surface border-transparent hover:bg-[#efefe0] dark:hover:bg-[#292a24]'
                    }`}
                >
                  {label}
                </button>
              ))
            )}
          </div>

          {/* Flecha Derecha */}
          <button
            onClick={scrollRightBtn}
            disabled={!showRightArrow}
            className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${showRightArrow && !loadingCat && categorias.length > 0
              ? 'bg-surface-container-high text-on-surface hover:bg-primary hover:text-white shadow-sm hover:shadow-md hover:scale-105'
              : 'opacity-0 pointer-events-none'
              } hidden md:flex`}
            aria-label="Página siguiente de categorías"
          >
            <span className="material-symbols-outlined text-sm font-bold">arrow_forward_ios</span>
          </button>
        </div>
      </section>

      {/* ── Main grid ────────────────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-6 md:px-10 py-10">
        {error && (
          <div className="text-center py-20">
            <span className="material-symbols-outlined text-5xl text-error mb-4 block">error_outline</span>
            <p className="text-on-surface-variant">{error}</p>
            <button
              onClick={() => applyFilters({ search: currentSearch, categoria: currentCat })}
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
                    className={`w-10 h-10 rounded-xl font-label font-bold text-sm transition-all ${p === page
                      ? 'editorial-gradient text-white shadow-md'
                      : 'bg-surface-container text-on-surface-variant hover:bg-primary-container hover:text-primary-on-container'
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

