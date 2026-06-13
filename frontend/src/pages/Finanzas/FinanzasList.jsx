import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios.instance';
import { usePagination } from '@/hooks/usePagination';
import { useDebounce } from '@/hooks/useDebounce';
import Table, { Pagination } from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import ActionButtons from '@/components/ui/ActionButtons';
import Badge from '@/components/ui/Badge';
import SortToggle from '@/components/ui/SortToggle';
import PagoViewModal from '@/components/ui/PagoViewModal';
import { FiSearch, FiChevronDown } from 'react-icons/fi';
import { MdTrendingUp, MdTrendingDown, MdAccountBalanceWallet, MdOutlineSwapHoriz } from 'react-icons/md';

const formatCurrency = (val) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(val);

function KpiCard({ title, amount, icon: Icon, colorClass, isNegative = false, onClick }) {
  return (
    <div 
      onClick={onClick}
      className="bg-card-panel rounded-2xl shadow-card p-4 md:p-5 hover:-translate-y-1 hover:bg-surface-container-lowest transition-all duration-200 cursor-pointer overflow-hidden relative flex flex-col justify-start h-full border border-transparent hover:border-primary/20"
    >
      <div className="absolute top-6 right-4 md:top-8 md:right-6 pointer-events-none opacity-[0.15] text-tertiary z-0">
        <Icon size={40} className="md:hidden" />
        <Icon size={50} className="hidden md:block" />
      </div>
      <div className="relative z-10 flex flex-col w-full">
        <p className="text-[10px] md:text-xs text-on-surface-variant font-label uppercase tracking-widest mb-1">{title}</p>
        <p className={`text-xl md:text-2xl lg:text-3xl font-headline font-black truncate pr-4 ${colorClass}`}>
          {isNegative ? '-' : ''}{formatCurrency(amount)}
        </p>
      </div>
    </div>
  );
}

export default function FinanzasList() {
  const navigate = useNavigate();
  const { page, limit, goToPage, reset } = usePagination();
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [filtroFlujo, setFiltroFlujo] = useState('');
  const [filtroMetodo, setFiltroMetodo] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [sort, setSort] = useState({ field: null, direction: null });
  const [showFilters, setShowFilters] = useState(false);
  const [viewId, setViewId] = useState(null);

  const handleSortChange = (field, direction) => {
    setSort({ field, direction });
    reset();
  };

  useEffect(() => {
    reset();
  }, [debouncedSearchQuery, filtroFlujo, filtroMetodo, filtroTipo, sort, reset]);

  // ─── Queries ────────────────────────────────────────────────────────────────
  const { data: statsData, isLoading: isLoadingStats } = useQuery({
    queryKey: ['pagos', 'stats'],
    queryFn: () => api.get('/pagos/stats').then((r) => r.data),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['pagos', { page, limit, search: debouncedSearchQuery, filtroFlujo, filtroMetodo, filtroTipo, sort }],
    queryFn: () =>
      api.get('/pagos', { 
        params: { 
          page, limit, 
          search: debouncedSearchQuery || undefined,
          flujo: filtroFlujo || undefined,
          metodo: filtroMetodo || undefined,
          tipo: filtroTipo || undefined,
          sort_field: sort.field ?? undefined,
          sort_direction: sort.direction ?? undefined,
        } 
      }).then((r) => r.data),
  });

  // ─── Columnas ─────────────────────────────────────────────────────────────
  const columns = [
    { key: 'id_pago_operacion', label: 'ID', width: '60px' },
    {
      key: 'fecha',
      label: 'Fecha',
      render: (v) => new Date(v).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' }),
    },
    {
      key: 'operacion',
      label: 'Operación',
      render: (_, r) => `Op. #${r.id_operacion}`,
    },
    {
      key: 'cliente',
      label: 'Cliente',
      render: (_, r) => {
        const p = r.operacion?.cliente?.persona;
        return p ? `${p.nombre} ${p.apellido}`.trim() : '—';
      },
    },
    {
      key: 'usuario',
      label: 'Registrado por',
      render: (_, r) => {
        const p = r.persona;
        return p ? `${p.nombre} ${p.apellido}`.trim() : '—';
      },
    },
    {
      key: 'tipo',
      label: 'Tipo',
      render: (v) => <Badge value={v} />,
    },
    {
      key: 'metodo',
      label: 'Método',
      render: (v) => <Badge value={v} />,
    },
    {
      key: 'monto',
      label: 'Monto',
      render: (v, r) => {
        const isEgreso = r.tipo === 'DEVOLUCION_DEPOSITO' || (r.tipo === 'AJUSTE' && Number(v) < 0);
        const montoNum = Math.abs(Number(v));
        const textClass = isEgreso ? 'text-error font-semibold' : 'text-success font-semibold';
        return <span className={textClass}>{isEgreso ? '-' : ''}{formatCurrency(montoNum)}</span>;
      },
    },
    {
      key: 'acciones',
      label: 'Acciones',
      width: '100px',
      align: 'center',
      render: (_, r) => (
        <ActionButtons
          onView={() => setViewId(r.id_pago_operacion)}
          onDetail={() => navigate(`/admin/operaciones/${r.id_operacion}`)}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-row items-center justify-between gap-2 md:gap-4 w-full mb-6">
        <div className="min-w-0 overflow-x-auto">
          <div className="inline-flex h-11 bg-surface-container-high border border-transparent dark:border-zinc-800 rounded-xl items-center">
            <div className="relative flex h-full items-center justify-center px-6 rounded-xl text-sm font-medium transition-all duration-200 bg-surface-container-lowest shadow-sm text-primary font-semibold">
              Finanzas
            </div>
          </div>
        </div>
      </div>

      {/* ── KPI Cards ─────────────────────────────────────────────────────── */}
      {!isLoadingStats && statsData && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4 mb-6">
          <KpiCard 
            title="Ingresos Brutos" 
            amount={statsData.ingresos} 
            icon={MdTrendingUp} 
            colorClass="text-primary" 
            onClick={() => { setFiltroFlujo('ingreso'); setFiltroMetodo(''); reset(); }}
          />
          <KpiCard 
            title="Egresos (Devoluciones)" 
            amount={statsData.egresos} 
            icon={MdTrendingDown} 
            colorClass="text-error" 
            isNegative={true}
            onClick={() => { setFiltroFlujo('egreso'); setFiltroMetodo(''); reset(); }}
          />
          <KpiCard 
            title="Saldo Neto" 
            amount={statsData.saldoNeto} 
            icon={MdAccountBalanceWallet} 
            colorClass={statsData.saldoNeto >= 0 ? 'text-on-surface' : 'text-error'} 
            onClick={() => { setFiltroFlujo(''); setFiltroMetodo(''); reset(); }}
          />
          <KpiCard 
            title="Efectivo en Caja" 
            amount={statsData.efectivo} 
            icon={MdOutlineSwapHoriz} 
            colorClass="text-success" 
            onClick={() => { setFiltroFlujo(''); setFiltroMetodo('EFECTIVO'); reset(); }}
          />
        </div>
      )}

      {/* Buscador y Filtros */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-card p-3 lg:p-5 flex flex-col gap-4">
        {/* Buscador y Toggle */}
        <div className="flex flex-row flex-nowrap w-full gap-2 items-center">
          <div className="flex-1 min-w-0 relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10 pointer-events-none text-[20px]">search</span>
            <Input
              placeholder="Buscar por cliente…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`md:hidden flex-shrink-0 h-11 w-11 flex items-center justify-center rounded-xl transition-colors border ${
              showFilters || filtroFlujo || filtroMetodo || filtroTipo || sort.field
                ? 'bg-primary/10 text-primary border-primary/20'
                : 'bg-surface-container-high text-on-surface-variant border-transparent dark:border-zinc-800 hover:bg-surface-container-highest'
            }`}
            title="Filtros y Orden"
          >
            <span className="material-symbols-outlined text-[20px]">
              {showFilters ? 'close' : 'tune'}
            </span>
          </button>
        </div>

        {/* Barra inferior (Desktop) */}
        <div className="hidden md:flex flex-row flex-nowrap overflow-x-auto whitespace-nowrap gap-3 pb-2 w-full pt-3 border-t border-divider items-center min-w-0 overflow-visible justify-start">
          <div className="flex flex-row items-center gap-3 shrink-0">
            {/* Filtro Flujo */}
            <div className="relative inline-block shrink-0">
              <select
                value={filtroFlujo}
                onChange={(e) => setFiltroFlujo(e.target.value)}
                className="appearance-none w-auto px-3 py-1 pr-8 text-sm font-medium rounded-full border border-gray-300 dark:border-gray-600 bg-transparent dark:bg-transparent text-gray-700 dark:text-gray-200 cursor-pointer focus:outline-none"
              >
                <option value="" className="bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-200">Todos los Flujos</option>
                <option value="ingreso" className="bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-200">Ingresos</option>
                <option value="egreso" className="bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-200">Egresos</option>
              </select>
              <FiChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 size-3.5" />
            </div>

            {/* Filtro Metodo */}
            <div className="relative inline-block shrink-0">
              <select
                value={filtroMetodo}
                onChange={(e) => setFiltroMetodo(e.target.value)}
                className="appearance-none w-auto px-3 py-1 pr-8 text-sm font-medium rounded-full border border-gray-300 dark:border-gray-600 bg-transparent dark:bg-transparent text-gray-700 dark:text-gray-200 cursor-pointer focus:outline-none"
              >
                <option value="" className="bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-200">Todos los Métodos</option>
                <option value="EFECTIVO" className="bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-200">Efectivo</option>
                <option value="TRANSFERENCIA" className="bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-200">Transferencia</option>
              </select>
              <FiChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 size-3.5" />
            </div>

            {/* Filtro Tipo */}
            <div className="relative inline-block shrink-0">
              <select
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
                className="appearance-none w-auto px-3 py-1 pr-8 text-sm font-medium rounded-full border border-gray-300 dark:border-gray-600 bg-transparent dark:bg-transparent text-gray-700 dark:text-gray-200 cursor-pointer focus:outline-none"
              >
                <option value="" className="bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-200">Todos los Tipos</option>
                <option value="SENA" className="bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-200">Seña</option>
                <option value="DEPOSITO" className="bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-200">Depósito</option>
                <option value="SALDO" className="bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-200">Saldo</option>
                <option value="DEVOLUCION_DEPOSITO" className="bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-200">Devolución Dep.</option>
                <option value="AJUSTE" className="bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-200">Ajuste</option>
              </select>
              <FiChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 size-3.5" />
            </div>

            <div className="w-px h-6 bg-divider shrink-0 ml-1"></div>

            <span className="text-label-lg font-label font-medium text-on-surface-variant uppercase tracking-wide shrink-0 ml-1">
              Ordenar:
            </span>
          </div>
          
          <div className="flex flex-row items-center gap-2 shrink-0 lg:flex-nowrap">
            <SortToggle
              label="Fecha"
              field="fecha"
              currentSort={sort}
              onSortChange={handleSortChange}
            />
            <SortToggle
              label="Monto"
              field="monto"
              currentSort={sort}
              onSortChange={handleSortChange}
            />
          </div>
        </div>
      </div>

      {/* Bottom Sheet de Filtros (Mobile) */}
      {showFilters && createPortal(
        <div 
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 md:hidden animate-fade-in" 
          onClick={() => setShowFilters(false)}
        >
          <div 
            className="bg-surface-container-lowest w-full rounded-t-3xl shadow-elevated p-5 sm:p-6 flex flex-col animate-slide-up relative max-h-[90vh] overflow-hidden" 
            onClick={e => e.stopPropagation()}
          >
            {/* Handle visual */}
            <div className="w-10 h-1.5 bg-surface-container-highest rounded-full mx-auto mb-5 shrink-0" />

            <div className="flex items-center justify-between mb-6 shrink-0">
              <h3 className="text-title-lg font-bold text-on-surface">Filtros y Orden</h3>
              <button 
                onClick={() => setShowFilters(false)} 
                className="text-on-surface-variant hover:text-on-surface flex items-center justify-center w-8 h-8 rounded-full bg-surface-container-high transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="flex flex-col gap-6 overflow-y-auto pb-4">
              {/* Filtros Dropdowns */}
              <div className="flex flex-col gap-3">
                <span className="text-label-lg font-bold text-on-surface-variant uppercase tracking-wide">
                  Flujo
                </span>
                <div className="relative inline-block w-full">
                  <select
                    value={filtroFlujo}
                    onChange={(e) => setFiltroFlujo(e.target.value)}
                    className="appearance-none w-full px-4 py-3 text-body-lg rounded-2xl border border-divider bg-surface-container-low text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Todos los Flujos</option>
                    <option value="ingreso">Ingresos</option>
                    <option value="egreso">Egresos</option>
                  </select>
                  <FiChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant" />
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <span className="text-label-lg font-bold text-on-surface-variant uppercase tracking-wide">
                  Método
                </span>
                <div className="relative inline-block w-full">
                  <select
                    value={filtroMetodo}
                    onChange={(e) => setFiltroMetodo(e.target.value)}
                    className="appearance-none w-full px-4 py-3 text-body-lg rounded-2xl border border-divider bg-surface-container-low text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Todos los Métodos</option>
                    <option value="EFECTIVO">Efectivo</option>
                    <option value="TRANSFERENCIA">Transferencia</option>
                  </select>
                  <FiChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant" />
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <span className="text-label-lg font-bold text-on-surface-variant uppercase tracking-wide">
                  Tipo
                </span>
                <div className="relative inline-block w-full">
                  <select
                    value={filtroTipo}
                    onChange={(e) => setFiltroTipo(e.target.value)}
                    className="appearance-none w-full px-4 py-3 text-body-lg rounded-2xl border border-divider bg-surface-container-low text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Todos los Tipos</option>
                    <option value="SENA">Seña</option>
                    <option value="DEPOSITO">Depósito</option>
                    <option value="SALDO">Saldo</option>
                    <option value="DEVOLUCION_DEPOSITO">Devolución Dep.</option>
                    <option value="AJUSTE">Ajuste</option>
                  </select>
                  <FiChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant" />
                </div>
              </div>

              {/* Ordenamiento */}
              <div className="flex flex-col gap-3 mt-2">
                <span className="text-label-lg font-bold text-on-surface-variant uppercase tracking-wide">
                  Ordenar por
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <SortToggle
                    label="Fecha"
                    field="fecha"
                    currentSort={sort}
                    onSortChange={handleSortChange}
                    className="w-full justify-center bg-surface-container-low py-3"
                  />
                  <SortToggle
                    label="Monto"
                    field="monto"
                    currentSort={sort}
                    onSortChange={handleSortChange}
                    className="w-full justify-center bg-surface-container-low py-3"
                  />
                </div>
              </div>
            </div>

            <div className="pt-5 mt-2 border-t border-divider flex gap-3 shrink-0">
              <Button 
                onClick={() => {
                  setFiltroFlujo('');
                  setFiltroMetodo('');
                  setFiltroTipo('');
                  setSort({ field: null, direction: null });
                  reset();
                }} 
                className="flex-1 h-12 flex justify-center items-center bg-surface-container-high text-on-surface hover:bg-surface-container-highest"
              >
                Limpiar
              </Button>
              <Button onClick={() => setShowFilters(false)} className="flex-1 h-12 flex justify-center items-center">
                Aplicar
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Tabla */}
      <div className="md:bg-surface-container-lowest rounded-2xl md:shadow-card md:overflow-hidden">
        <Table columns={columns} data={data?.data} loading={isLoading} emptyMessage="Sin movimientos financieros registrados" />
        <div className="px-4 pb-4">
          <Pagination meta={data?.meta} page={page} onPageChange={goToPage} />
        </div>
      </div>

      {/* Modal Ver Pago */}
      <PagoViewModal
        id={viewId}
        open={!!viewId}
        onClose={() => setViewId(null)}
      />
    </div>
  );
}
