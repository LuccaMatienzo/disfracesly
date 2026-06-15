import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios.instance';
import { useUrlFilters } from '@/hooks/useUrlFilters';
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
import KpiCarousel from '@/components/ui/KpiCarousel';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const formatCurrency = (val) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(val);
const COLORS = ['#84cc16', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444'];

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
  const { filters, updateFilters, goToPage, reset } = useUrlFilters();
  const { search, flujo: filtroFlujo = '', metodo: filtroMetodo = '', tipo: filtroTipo = '', sort_field: sortField, sort_direction: sortDirection, page, limit } = filters;
  const sort = { field: sortField, direction: sortDirection };

  const [localSearch, setLocalSearch] = useState(search);
  const debouncedSearch = useDebounce(localSearch, 300);

  useEffect(() => {
    if (debouncedSearch !== search) {
      updateFilters({ search: debouncedSearch, page: 1 }, { replace: true });
    }
  }, [debouncedSearch, search, updateFilters]);

  const [showFilters, setShowFilters] = useState(false);
  const [viewId, setViewId] = useState(null);

  const handleSortChange = (field, direction) => {
    updateFilters({ sort_field: field, sort_direction: direction, page: 1 });
  };

  // ─── Queries ────────────────────────────────────────────────────────────────
  const { data: statsData, isLoading: isLoadingStats } = useQuery({
    queryKey: ['pagos', 'stats'],
    queryFn: () => api.get('/pagos/stats').then((r) => r.data),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['pagos', filters],
    queryFn: () => api.get('/pagos', { params: filters }).then((r) => r.data),
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
        <div className="flex flex-col gap-6 mb-6">
          <KpiCarousel className="grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4">
            <KpiCard
              title="Recaudación Total (Mes)"
              amount={statsData.ingresosMes}
              icon={MdTrendingUp}
              colorClass="text-primary"
              onClick={() => { updateFilters({ flujo: 'ingreso', metodo: null, page: 1 }); }}
            />
            <KpiCard
              title="Fondo de Garantía"
              amount={statsData.depositosActivos}
              icon={MdAccountBalanceWallet}
              colorClass="text-amber-500"
              onClick={() => { updateFilters({ tipo: 'DEPOSITO', flujo: null, page: 1 }); }}
            />
            <KpiCard
              title="Efectivo (Mes)"
              amount={statsData.efectivoMes}
              icon={MdOutlineSwapHoriz}
              colorClass="text-success"
              onClick={() => { updateFilters({ flujo: 'ingreso', metodo: 'EFECTIVO', page: 1 }); }}
            />
            <KpiCard
              title="Transferencias (Mes)"
              amount={statsData.transferenciaMes}
              icon={MdOutlineSwapHoriz}
              colorClass="text-blue-500"
              onClick={() => { updateFilters({ flujo: 'ingreso', metodo: 'TRANSFERENCIA', page: 1 }); }}
            />
          </KpiCarousel>

          {/* Gráficas */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-6">
            {/* Gráfica de Tendencia (AreaChart) */}
            <div className="xl:col-span-2 bg-surface-container-lowest rounded-2xl shadow-card p-4 md:p-6 flex flex-col min-h-[300px]">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-title-md font-headline font-semibold text-on-surface">Recaudación Histórica (Últimos 6 meses)</h3>
                <div className="flex items-center gap-4 text-xs font-medium text-on-surface-variant">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#84cc16]"></span>
                    Alquileres
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#3b82f6]"></span>
                    Ventas
                  </div>
                </div>
              </div>
              <div className="flex-1 w-full h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={statsData.trend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorAlquileres" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#84cc16" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#84cc16" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-outline-variant)" opacity={0.5} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--color-on-surface-variant)' }} dy={10} />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(val) => `$${val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val}`}
                      tick={{ fontSize: 12, fill: 'var(--color-on-surface-variant)' }}
                      dx={-10}
                    />
                    <RechartsTooltip
                      formatter={(value) => [formatCurrency(value)]}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: 'var(--shadow-elevated)' }}
                    />
                    <Area type="monotone" dataKey="alquileres" name="Alquileres" stroke="#84cc16" strokeWidth={2} fillOpacity={1} fill="url(#colorAlquileres)" />
                    <Area type="monotone" dataKey="ventas" name="Ventas" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorVentas)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Gráfica de Tipos (PieChart) */}
            <div className="xl:col-span-1 bg-surface-container-lowest rounded-2xl shadow-card p-4 md:p-6 flex flex-col min-h-[300px]">
              <h3 className="text-title-md font-headline font-semibold text-on-surface mb-2">Origen de Recaudación (Mes Actual)</h3>
              <div className="flex-1 w-full h-[250px] relative flex items-center justify-center">
                {(statsData.ingresosAlquiler === 0 && statsData.ingresosVenta === 0) ? (
                  <div className="flex flex-col items-center justify-center text-center p-4">
                    <span className="material-symbols-outlined text-[48px] text-on-surface-variant/30 mb-3">query_stats</span>
                    <p className="text-body-md text-on-surface-variant max-w-[220px]">
                      Aún no hay recaudación este mes. El gráfico se generará al registrar cobros.
                    </p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Alquileres', value: statsData.ingresosAlquiler },
                          { name: 'Ventas', value: statsData.ingresosVenta }
                        ].filter(v => v.value > 0)}
                        cx="50%"
                        cy="45%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {[
                          { name: 'Alquileres', value: statsData.ingresosAlquiler },
                          { name: 'Ventas', value: statsData.ingresosVenta }
                        ].filter(v => v.value > 0).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.name === 'Alquileres' ? '#84cc16' : '#3b82f6'} />
                        ))}
                      </Pie>
                      <RechartsTooltip formatter={(value) => [formatCurrency(value)]} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: 'var(--shadow-elevated)' }} />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', color: 'var(--color-on-surface)' }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>
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
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`md:hidden flex-shrink-0 h-11 w-11 flex items-center justify-center rounded-xl transition-colors border ${showFilters || filtroFlujo || filtroMetodo || filtroTipo || sort.field
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
                onChange={(e) => updateFilters({ flujo: e.target.value, page: 1 })}
                className="appearance-none w-auto px-3 py-1 pr-8 text-sm font-medium rounded-full border border-outline-variant bg-surface-container text-on-surface cursor-pointer focus:outline-none"
              >
                <option value="" className="bg-surface-container text-on-surface">Todos los Movimientos</option>
                <option value="ingreso" className="bg-surface-container text-on-surface">Ingresos Percibidos</option>
                <option value="egreso" className="bg-surface-container text-on-surface">Devoluciones Emitidas</option>
              </select>
              <FiChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant size-3.5" />
            </div>

            {/* Filtro Metodo */}
            <div className="relative inline-block shrink-0">
              <select
                value={filtroMetodo}
                onChange={(e) => updateFilters({ metodo: e.target.value, page: 1 })}
                className="appearance-none w-auto px-3 py-1 pr-8 text-sm font-medium rounded-full border border-outline-variant bg-surface-container text-on-surface cursor-pointer focus:outline-none"
              >
                <option value="" className="bg-surface-container text-on-surface">Todos los Métodos</option>
                <option value="EFECTIVO" className="bg-surface-container text-on-surface">Efectivo</option>
                <option value="TRANSFERENCIA" className="bg-surface-container text-on-surface">Transferencia</option>
              </select>
              <FiChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant size-3.5" />
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

          <div className="ml-auto shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                updateFilters({ flujo: null, metodo: null, tipo: null, sort_field: null, sort_direction: null, page: 1 });
              }}
              className="text-on-surface-variant hover:text-on-surface"
            >
              Limpiar Filtros
            </Button>
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
                    onChange={(e) => updateFilters({ flujo: e.target.value, page: 1 })}
                    className="appearance-none w-full px-4 py-3 text-body-lg rounded-2xl border border-divider bg-surface-container-low text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Todos los Movimientos</option>
                    <option value="ingreso">Ingresos Percibidos</option>
                    <option value="egreso">Devoluciones Emitidas</option>
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
                    onChange={(e) => updateFilters({ metodo: e.target.value, page: 1 })}
                    className="appearance-none w-full px-4 py-3 text-body-lg rounded-2xl border border-divider bg-surface-container-low text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Todos los Métodos</option>
                    <option value="EFECTIVO">Efectivo</option>
                    <option value="TRANSFERENCIA">Transferencia</option>
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
                  updateFilters({ flujo: null, metodo: null, tipo: null, sort_field: null, sort_direction: null, page: 1 });
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

