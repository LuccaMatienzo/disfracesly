import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios.instance';
import { usePagination } from '@/hooks/usePagination';
import Table, { Pagination } from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import ActionButtons from '@/components/ui/ActionButtons';
import Badge from '@/components/ui/Badge';
import { FiSearch } from 'react-icons/fi';
import { MdTrendingUp, MdTrendingDown, MdAccountBalanceWallet, MdOutlineSwapHoriz } from 'react-icons/md';

const formatCurrency = (val) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 }).format(val);

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
  const [search, setSearch] = useState('');
  const [filtroFlujo, setFiltroFlujo] = useState('');
  const [filtroMetodo, setFiltroMetodo] = useState('');

  // ─── Queries ────────────────────────────────────────────────────────────────
  const { data: statsData, isLoading: isLoadingStats } = useQuery({
    queryKey: ['pagos-stats'],
    queryFn: () => api.get('/pagos/stats').then((r) => r.data),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['pagos', { page, limit, search, filtroFlujo, filtroMetodo }],
    queryFn: () =>
      api.get('/pagos', { 
        params: { 
          page, limit, 
          search: search || undefined,
          flujo: filtroFlujo || undefined,
          metodo: filtroMetodo || undefined
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
          onDetail={() => navigate(`/admin/operaciones/${r.id_operacion}`)}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-row items-center justify-between gap-2 w-full">
        <div>
          <h1 className="font-headline font-semibold text-xl md:text-3xl text-on-surface">Finanzas</h1>
          <p className="text-on-surface-variant text-sm md:text-base mt-1">
            Resumen contable y movimientos del mes en curso
          </p>
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
      <div className="bg-surface-container-lowest rounded-2xl shadow-card p-3 md:p-5">
        <div className="flex flex-col md:flex-row gap-3 md:gap-4 items-center">
          <div className="w-full md:w-1/3 xl:w-1/4">
            <Input
              placeholder="Buscar por cliente…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); reset(); }}
            />
          </div>
          
          <div className="w-full md:w-1/4 xl:w-1/5">
            <select
              value={filtroFlujo}
              onChange={(e) => { setFiltroFlujo(e.target.value); reset(); }}
              className="w-full h-12 bg-surface-container-low border-0 text-on-surface rounded-xl px-4 focus:ring-2 focus:ring-primary focus:outline-none transition-shadow text-sm cursor-pointer"
            >
              <option value="">Todos los Flujos</option>
              <option value="ingreso">Ingresos</option>
              <option value="egreso">Egresos</option>
            </select>
          </div>

          <div className="w-full md:w-1/4 xl:w-1/5">
            <select
              value={filtroMetodo}
              onChange={(e) => { setFiltroMetodo(e.target.value); reset(); }}
              className="w-full h-12 bg-surface-container-low border-0 text-on-surface rounded-xl px-4 focus:ring-2 focus:ring-primary focus:outline-none transition-shadow text-sm cursor-pointer"
            >
              <option value="">Todos los Métodos</option>
              <option value="EFECTIVO">Efectivo</option>
              <option value="TRANSFERENCIA">Transferencia</option>
            </select>
          </div>

          <div className="w-full md:w-auto md:ml-auto">
            <Button
              onClick={() => reset()}
              className="h-12 w-full px-6 shrink-0"
            >
              <FiSearch className="size-5 mr-2" />
              Actualizar
            </Button>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="md:bg-surface-container-lowest rounded-2xl md:shadow-card md:overflow-hidden">
        <Table columns={columns} data={data?.data} loading={isLoading} emptyMessage="Sin movimientos financieros registrados" />
        <div className="px-4 pb-4">
          <Pagination meta={data?.meta} page={page} onPageChange={goToPage} />
        </div>
      </div>
    </div>
  );
}
