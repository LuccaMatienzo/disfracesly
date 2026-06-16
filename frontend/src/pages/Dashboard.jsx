/**
 * @module pages/Dashboard
 * @description Página principal del panel de administración.
 *
 * Carga todos los KPIs del dashboard en un solo request a `/dashboard`
 * y los distribuye en una grilla de tarjetas tipo Bento.
 * Los sub-componentes (KpiCards, DonutChart, MovimientosTable, etc.) son
 * componentes funcionales privados del módulo para reducir la superficie pública.
 */
import { useState, useEffect, useMemo } from 'react';
import api from '@/api/axios.instance';
import { useAuth } from '@/context/AuthContext';
import { MdOutlinePendingActions } from 'react-icons/md';
import { LuPackageOpen } from 'react-icons/lu';
import { BsBagCheck } from 'react-icons/bs';
import KpiDetailsModal from '@/components/ui/KpiDetailsModal';
import KpiCarousel from '@/components/ui/KpiCarousel';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Convierte una fecha ISO a texto relativo en español (e.g. '5 min atrás', '2 días atrás').
 * @param {string} dateStr - Fecha en formato ISO 8601
 * @returns {string}
 */
function timeAgo(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'recién';
  if (diffMin < 60) return `${diffMin} min atrás`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs} hora${diffHrs > 1 ? 's' : ''} atrás`;
  const diffDays = Math.floor(diffHrs / 24);
  return `${diffDays} día${diffDays > 1 ? 's' : ''} atrás`;
}

// Hoisted al scope del módulo: ARS sin decimales (el peso argentino no los usa)
const _currencyFmt = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0, maximumFractionDigits: 0 });

function formatCurrency(amount) {
  return _currencyFmt.format(amount);
}

const BADGE_ETAPA = {
  'Activo': { cls: 'bg-primary-container text-primary-on-container' },
  'Confirmado': { cls: 'bg-tertiary-container text-on-surface' },
  'Pendiente': { cls: 'bg-secondary-container text-white' },
  'Por vencer': { cls: 'bg-error/15 text-error' },
  'Entregado': { cls: 'bg-surface-container text-tertiary' },
  'RETIRADO': { cls: 'bg-primary-container text-primary-on-container' },
  'RESERVADO': { cls: 'bg-tertiary-container text-on-surface' },
  'LISTO_PARA_RETIRO': { cls: 'bg-secondary-container text-white' },
  'LISTO_PARA_ENTREGA': { cls: 'bg-secondary-container text-white' },
};

const STATUS_CONFIG = {
  Pickup: { color: '#4caf50', dotColor: '#4caf50', label: 'Retiro' },
  Return: { color: '#4caf50', dotColor: '#4caf50', label: 'Devolución' },
  Sale: { color: '#ef5350', dotColor: '#ef5350', label: 'Venta', isSale: true },
  Otra: { color: '#9e9e9e', dotColor: '#9e9e9e', label: 'Otro' },
};

// ─── Donut Chart ──────────────────────────────────────────────────────────────

function DonutChart({ data }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-on-surface-variant text-sm">
        Sin datos de stock
      </div>
    );
  }

  const radius = 70;
  const strokeWidth = 24;
  const circumference = 2 * Math.PI * radius;

  let cumulativeOffset = 0;
  const segments = data.map((item) => {
    const pct = item.value / total;
    const dashArray = `${pct * circumference} ${circumference}`;
    const dashOffset = -cumulativeOffset * circumference;
    cumulativeOffset += pct;
    return { ...item, dashArray, dashOffset, pct };
  });

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 200 200" width="180" height="180">
        {segments.map((seg, i) => (
          <circle
            key={i}
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke={seg.color}
            strokeWidth={strokeWidth}
            strokeDasharray={seg.dashArray}
            strokeDashoffset={seg.dashOffset}
            strokeLinecap="round"
            transform="rotate(-90 100 100)"
            className="transition-all duration-500"
          />
        ))}
      </svg>
      <div className="flex flex-wrap justify-center gap-x-5 gap-y-1 mt-3">
        {data.map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <span
              className="size-2.5 rounded-full inline-block"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-xs text-on-surface-variant">
              {item.label} ({total > 0 ? Math.round((item.value / total) * 100) : 0}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── KPI Top Cards ────────────────────────────────────────────────────────────

function KpiActiveRentals({ data, onClick, onClickOverdue }) {
  return (
    <div 
      onClick={onClick}
      className="bg-card-panel rounded-2xl shadow-card p-4 md:p-5 hover:-translate-y-1 hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden relative flex flex-col justify-start h-full"
    >
      <div className="absolute top-6 right-4 md:top-8 md:right-6 pointer-events-none opacity-20 text-tertiary">
        <MdOutlinePendingActions size={40} className="md:hidden" />
        <MdOutlinePendingActions size={50} className="hidden md:block" />
      </div>
      <div className="relative z-10 flex flex-col w-full">
        <p className="text-[10px] md:text-xs text-on-surface-variant font-label uppercase tracking-widest mb-1">Operaciones Activas</p>
        <p className="text-3xl md:text-4xl font-headline font-black text-on-surface">{data.totalItems}</p>
      </div>
      <div className="flex flex-wrap gap-2 md:gap-4 mt-2 text-[10px] md:text-xs">
        {data.overdue > 0 && (
          <span 
            className="text-error font-semibold cursor-pointer hover:underline"
            onClick={(e) => {
              e.stopPropagation();
              onClickOverdue?.();
            }}
          >
            Atrasados ({data.overdue})
          </span>
        )}
        {data.dueToday > 0 && (
          <span className="text-primary font-semibold">Vencen Hoy ({data.dueToday})</span>
        )}
      </div>
    </div>
  );
}

function KpiPreparation({ data, onClick }) {
  return (
    <div 
      onClick={onClick}
      className="bg-card-panel rounded-2xl shadow-card p-4 md:p-5 hover:-translate-y-1 hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden relative flex flex-col justify-start h-full"
    >
      <div className="absolute top-6 right-4 md:top-8 md:right-6 pointer-events-none opacity-20 text-tertiary">
        <LuPackageOpen size={40} className="md:hidden" />
        <LuPackageOpen size={50} className="hidden md:block" />
      </div>
      <div className="relative z-10 flex flex-col w-full">
        <p className="text-[10px] md:text-xs text-on-surface-variant font-label uppercase tracking-widest mb-1">En Preparación</p>
        <p className="text-3xl md:text-4xl font-headline font-black text-on-surface">{data.total}</p>
      </div>
    </div>
  );
}

function KpiReadyForPickup({ data, onClick }) {
  return (
    <div 
      onClick={onClick}
      className="bg-card-panel rounded-2xl shadow-card p-4 md:p-5 hover:-translate-y-1 hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden relative flex flex-col justify-start h-full"
    >
      <div className="absolute top-6 right-4 md:top-8 md:right-6 pointer-events-none opacity-20 text-tertiary">
        <BsBagCheck size={40} className="md:hidden" />
        <BsBagCheck size={50} className="hidden md:block" />
      </div>
      <div className="relative z-10 flex flex-col w-full">
        <p className="text-[10px] md:text-xs text-on-surface-variant font-label uppercase tracking-widest mb-1">Listos para Retiro</p>
        <p className="text-3xl md:text-4xl font-headline font-black text-on-surface">{data.totalPackages}</p>
      </div>
    </div>
  );
}


function KpiMonthlyRevenue({ data }) {
  const isPositive = data.percentChange >= 0;
  return (
    <div className="bg-card-panel rounded-2xl shadow-card p-4 md:p-5 hover:-translate-y-1 transition-transform duration-200 cursor-default overflow-hidden relative flex flex-col justify-start h-full">
      <div className="absolute top-6 right-4 md:top-8 md:right-6 pointer-events-none opacity-20 text-tertiary">
        <span className="material-symbols-outlined" style={{ fontSize: '40px' }}>payments</span>
      </div>
      <div className="relative z-10 flex flex-col w-full">
        <p className="text-[10px] md:text-xs text-on-surface-variant font-label uppercase tracking-widest mb-1">Ingresos del Mes</p>
        <p className="text-2xl md:text-3xl font-headline font-black text-on-surface">{formatCurrency(data.current, 0)}</p>
      </div>
      <div className="flex items-center gap-1 mt-2">
        <span className={`material-symbols-outlined text-base ${isPositive ? 'text-primary' : 'text-error'}`}>
          {isPositive ? 'trending_up' : 'trending_down'}
        </span>
        <span className={`text-[10px] md:text-xs font-semibold ${isPositive ? 'text-primary' : 'text-error'}`}>
          {isPositive ? '+' : ''}{data.percentChange}% vs mes anterior
        </span>
      </div>
    </div>
  );
}

// ─── Recent Movements Table ───────────────────────────────────────────────────

function RecentMovements({ movements }) {
  if (!movements || movements.length === 0) {
    return (
      <div className="bg-card-panel rounded-2xl shadow-card p-4 md:p-6 h-full">
        <h2 className="font-headline font-semibold text-on-surface text-base md:text-lg mb-4">Movimientos Recientes</h2>
        <p className="text-on-surface-variant text-sm">No hay movimientos recientes</p>
      </div>
    );
  }

  return (
    <div className="bg-card-panel rounded-2xl shadow-card overflow-hidden h-full flex flex-col">
      <div className="px-4 md:px-6 py-3 md:py-4 border-b border-divider flex items-center justify-between">
        <h2 className="font-headline font-semibold text-on-surface text-base md:text-lg">Movimientos Recientes</h2>
        <a href="/admin/operaciones" className="text-xs md:text-sm text-on-surface-variant font-label font-semibold hover:underline">
          Ver Todos
        </a>
      </div>

      {/* Mobile: stacked cards */}
      <div className="md:hidden divide-y divide-divider">
        {movements.map((mov) => {
          const cfg = STATUS_CONFIG[mov.status] ?? STATUS_CONFIG.Otra;
          return (
            <div key={mov.id} className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5">
                  {cfg.isSale ? (
                    <span className="material-symbols-outlined text-sm" style={{ color: cfg.color }}>sell</span>
                  ) : (
                    <span className="size-2 rounded-full" style={{ backgroundColor: cfg.dotColor }} />
                  )}
                  <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: cfg.color }}>
                    {cfg.label}
                  </span>
                </span>
                <span className="text-[11px] text-on-surface-variant">{timeAgo(mov.timeAgo)}</span>
              </div>
              <p className="text-sm font-medium text-on-surface">
                {mov.itemName} {mov.itemSize ? `(${mov.itemSize})` : ''}
                <span className="text-[10px] text-on-surface-variant ml-1">#{mov.itemId}</span>
              </p>
              <div className="flex items-center justify-between text-xs text-on-surface-variant">
                <span>{mov.customerName}</span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-5 rounded-full bg-surface-container-low flex items-center justify-center text-[9px] font-bold text-on-surface-variant uppercase">
                    {mov.employeeInitials}
                  </span>
                  {mov.employeeName.split(' ')[0]}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop: table */}
      <div className="hidden md:block overflow-x-auto flex-1">
        <table className="w-full">
          <thead>
            <tr className="border-b border-divider">
              {['ESTADO', 'ARTÍCULO', 'CLIENTE', 'EMPLEADO', 'TIEMPO'].map((h) => (
                <th
                  key={h}
                  className="text-left px-6 py-3 text-[10px] font-label font-bold uppercase tracking-widest text-tertiary"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {movements.map((mov, i) => {
              const cfg = STATUS_CONFIG[mov.status] ?? STATUS_CONFIG.Otra;
              return (
                <tr
                  key={mov.id}
                  className={`border-b border-divider last:border-0 hover:bg-surface-container-low/60 transition-colors ${i % 2 === 0 ? '' : 'bg-surface-container-low/30'
                    }`}
                >
                  <td className="px-6 py-3.5">
                    <span className="inline-flex items-center gap-1.5">
                      {cfg.isSale ? (
                        <span className="material-symbols-outlined text-sm" style={{ color: cfg.color }}>sell</span>
                      ) : (
                        <span className="size-2 rounded-full" style={{ backgroundColor: cfg.dotColor }} />
                      )}
                      <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: cfg.color }}>
                        {cfg.label}
                      </span>
                    </span>
                  </td>
                  <td className="px-6 py-3.5">
                    <p className="text-sm font-medium text-on-surface">
                      {mov.itemName} {mov.itemSize ? `(${mov.itemSize})` : ''}
                    </p>
                    <p className="text-[10px] text-on-surface-variant">ID: #{mov.itemId}</p>
                  </td>
                  <td className="px-6 py-3.5 text-sm text-on-surface-variant">{mov.customerName}</td>
                  <td className="px-6 py-3.5">
                    <span className="inline-flex items-center gap-2">
                      <span className="size-7 rounded-full bg-surface-container-low flex items-center justify-center text-[10px] font-bold text-on-surface-variant uppercase">
                        {mov.employeeInitials}
                      </span>
                      <span className="text-sm text-on-surface-variant">{mov.employeeName.split(' ')[0]}</span>
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-xs text-on-surface-variant whitespace-nowrap">
                    {timeAgo(mov.timeAgo)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Cash Flow Card ───────────────────────────────────────────────────────────

function CashFlow({ data }) {
  const items = [
    { label: 'INGRESOS TOTALES', value: data.totalIncome, icon: 'account_balance_wallet', bg: 'bg-primary-container', iconColor: 'text-primary' },
    { label: 'DEPÓSITOS EN CUSTODIA', value: data.depositsInCustody, icon: 'lock', bg: 'bg-secondary-fixed', iconColor: 'text-secondary' },
    { label: 'SALDO PENDIENTE', value: data.pendingBalance, icon: 'credit_score', bg: 'bg-error-container', iconColor: 'text-error' },
  ];

  return (
    <div className="bg-card-panel rounded-2xl shadow-card p-4 md:p-6">
      <h2 className="font-headline font-semibold text-on-surface text-base md:text-lg mb-3 md:mb-4">Flujo de Caja Semanal</h2>
      <div className="space-y-3 md:space-y-4">
        {items.map((item) => (
          <div key={item.label} className={`flex items-center gap-3 md:gap-4 p-2.5 md:p-3 rounded-xl ${item.bg}/30`}>
            <div className={`size-9 md:w-10 md:h-10 rounded-xl ${item.bg} flex items-center justify-center shrink-0`}>
              <span className={`material-symbols-outlined text-lg md:text-xl ${item.iconColor}`}>{item.icon}</span>
            </div>
            <div>
              <p className="text-[10px] font-label font-bold uppercase tracking-widest text-on-surface-variant">{item.label}</p>
              <p className="text-lg md:text-xl font-headline font-black text-on-surface">{formatCurrency(item.value, 0)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Stock Status Card ────────────────────────────────────────────────────────

function StockStatusCard({ data }) {
  const chartData = [
    { label: 'Disponible', value: data.DISPONIBLE ?? 0, color: '#4caf50' },
    { label: 'Alquilado', value: data.ALQUILADA ?? 0, color: '#2196f3' },
    { label: 'Reservado', value: data.RESERVADA ?? 0, color: '#ff9800' },
  ];

  return (
    <div className="bg-card-panel rounded-2xl shadow-card p-4 md:p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-3 md:mb-4">
        <h2 className="font-headline font-semibold text-on-surface text-base md:text-lg">Estado del Stock</h2>
        <a href="/admin/stock" className="text-[10px] md:text-xs text-on-surface-variant font-label font-semibold bg-surface-container-low px-2.5 md:px-3 py-1 rounded-full hover:bg-surface-container transition-colors">
          Reporte por Categoría
        </a>
      </div>
      <div className="flex-1 flex items-center justify-center">
        <DonutChart data={chartData} />
      </div>
    </div>
  );
}

// ─── Upcoming Returns Table ───────────────────────────────────────────────────

function UpcomingReturns({ returns: list }) {
  if (!list || list.length === 0) {
    return (
      <div className="bg-card-panel rounded-2xl shadow-card p-4 md:p-6">
        <h2 className="font-headline font-semibold text-on-surface text-base md:text-lg mb-4">
          Próximos alquileres a vencer
        </h2>
        <p className="text-on-surface-variant text-sm">No hay alquileres próximos a vencer</p>
      </div>
    );
  }

  return (
    <div className="bg-card-panel rounded-2xl shadow-card overflow-hidden">
      <div className="px-4 md:px-6 py-3 md:py-4 border-b border-divider flex items-center justify-between">
        <h2 className="font-headline font-semibold text-on-surface text-base md:text-lg">
          Próximos alquileres a vencer
        </h2>
        <a
          href="/admin/operaciones"
          className="text-xs md:text-sm text-primary font-label font-semibold hover:underline"
        >
          Ver todos →
        </a>
      </div>

      {/* Mobile: stacked cards */}
      <div className="md:hidden divide-y divide-divider">
        {list.map((op) => {
          const today = new Date();
          today.setHours(0,0,0,0);
          const [y, m, d] = op.devolucion.split('-');
          const devDate = new Date(y, m - 1, d);
          const isVencido = devDate < today;
          const displayEtapa = isVencido ? 'Vencido' : 'Por vencer';
          const badge = isVencido ? { cls: 'bg-error text-white' } : { cls: 'bg-error/15 text-error' };
          
          return (
            <div key={op.id} className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-on-surface">{op.cliente}</p>
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${badge.cls}`}>
                  {displayEtapa}
                </span>
              </div>
              <p className="text-xs text-on-surface-variant">{op.disfraz}</p>
              <div className="flex items-center gap-4 text-[11px] text-on-surface-variant">
                <span>Retiro: {op.retiro}</span>
                <span>Dev: {op.devolucion}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop: table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-divider">
              {['Cliente', 'Disfraz', 'Retiro', 'Devolución', 'Estado'].map((h) => (
                <th
                  key={h}
                  className={`px-6 py-3 text-[10px] font-label font-bold uppercase tracking-widest text-tertiary ${h === 'Estado' ? 'text-center' : 'text-left'}`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {list.map((op, i) => {
              const today = new Date();
              today.setHours(0,0,0,0);
              const [y, m, d] = op.devolucion.split('-');
              const devDate = new Date(y, m - 1, d);
              const isVencido = devDate < today;
              const displayEtapa = isVencido ? 'Vencido' : 'Por vencer';
              const badge = isVencido ? { cls: 'bg-error text-white' } : { cls: 'bg-error/15 text-error' };
              
              return (
                <tr
                  key={op.id}
                  className={`border-b border-divider last:border-0 hover:bg-surface-container-low/60 transition-colors ${i % 2 === 0 ? '' : 'bg-surface-container-low/30'
                    }`}
                >
                  <td className="px-6 py-4 font-medium text-on-surface text-sm">{op.cliente}</td>
                  <td className="px-6 py-4 text-on-surface-variant text-sm">{op.disfraz}</td>
                  <td className="px-6 py-4 text-on-surface-variant text-sm">{op.retiro}</td>
                  <td className="px-6 py-4 text-on-surface-variant text-sm">{op.devolucion}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${badge.cls}`}>
                      {displayEtapa}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Skeleton Loader ──────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-card-panel rounded-2xl shadow-card p-5 animate-pulse">
      <div className="h-3 w-24 bg-surface-container rounded-full mb-3" />
      <div className="h-10 w-20 bg-surface-container rounded-lg mb-2" />
      <div className="h-3 w-16 bg-surface-container rounded-full" />
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

/**
 * Componente principal del Dashboard del panel de administración.
 *
 * Carga los datos del dashboard desde `/dashboard` al montar.
 * Incluye estados de carga (skeleton), error con retry y la vista principal
 * con grid de KPIs, movimientos recientes, flujo de caja y próximos vencimientos.
 *
 * @returns {JSX.Element}
 */
export default function Dashboard() {
  const { user, hasRol } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // States para modales de KPIs
  const [activeOpsModalOpen, setActiveOpsModalOpen] = useState(false);
  const [overdueOpsModalOpen, setOverdueOpsModalOpen] = useState(false);
  const [prepModalOpen, setPrepModalOpen] = useState(false);
  const [readyModalOpen, setReadyModalOpen] = useState(false);

  const activeOpsColumns = useMemo(() => [
    { key: 'cliente', label: 'Cliente', align: 'center' },
    { key: 'tipo', label: 'Tipo', align: 'center' },
    { 
      key: 'etapa', 
      label: 'Etapa',
      align: 'center',
      render: (etapa) => {
        const badge = BADGE_ETAPA[etapa] ?? BADGE_ETAPA.Pendiente;
        return (
          <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${badge.cls}`}>
            {etapa.replace(/_/g, ' ')}
          </span>
        );
      }
    },
    { 
      key: 'fecha', 
      label: 'Fecha',
      align: 'center',
      getLabel: (row) => row.tipo === 'Alquiler' ? 'Fecha Retiro' : 'Fecha Entrega',
      render: (fecha) => fecha ? new Date(fecha).toLocaleDateString('es-AR') : '—'
    }
  ], []);

  const overdueOpsColumns = useMemo(() => [
    ...activeOpsColumns,
    {
      key: 'causante',
      label: 'Causante',
      align: 'center',
      render: (_, row) => {
        if (row.etapa === 'RESERVADO') return 'Tienda';
        return 'Cliente';
      }
    },
    {
      key: 'motivo',
      label: 'Motivo',
      align: 'center',
      width: '140px',
      render: (_, row) => {
        if (row.etapa === 'RESERVADO') return 'Disfraz no terminado';
        if (row.etapa === 'LISTO_PARA_RETIRO' || row.etapa === 'LISTO_PARA_ENTREGA') return 'No retiró disfraz';
        if (row.etapa === 'RETIRADO') return 'No devolvió disfraz';
        return '—';
      }
    }
  ], [activeOpsColumns]);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        setLoading(true);
        const { data } = await api.get('/dashboard');
        setDashboard(data);
      } catch (err) {
        console.error('[Dashboard] Error al cargar datos del dashboard:', err);
        setError('No se pudo cargar el dashboard');
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  const hora = new Date().getHours();
  const saludo = hora < 12 ? 'Buenos días' : hora < 19 ? 'Buenas tardes' : 'Buenas noches';

  if (loading) {
    return (
      <div className="space-y-5 md:space-y-8 animate-fade-in">
        <div>
          <h1 className="font-headline font-semibold text-xl md:text-3xl text-on-surface">
            {saludo}, {user?.persona?.nombre ?? 'Admin'}
          </h1>
          <p className="text-on-surface-variant text-sm md:text-base mt-1">Cargando datos del dashboard…</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4">
          {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="bg-error/10 text-error p-6 rounded-2xl text-center">
          <span className="material-symbols-outlined text-4xl mb-2 block">error</span>
          <p className="font-semibold">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-error text-white rounded-xl text-sm font-semibold hover:bg-error/90 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  const { inPreparation, readyForPickup, activeRentals, monthlyRevenue, recentMovements, cashFlowWeekly, stockStatus, upcomingReturns } = dashboard;

  return (
    <div className="space-y-5 md:space-y-8 animate-fade-in">

      {/* ── Greeting ──────────────────────────────────────────────────────── */}
      <div>
        <h1 className="font-headline font-semibold text-xl md:text-3xl text-on-surface">
          {saludo}, {user?.persona?.nombre ?? 'Admin'}
        </h1>
        <p className="text-on-surface-variant text-sm md:text-base mt-1">
          Resumen de operaciones de la tienda
        </p>
      </div>

      {/* ── KPI Cards ─────────────────────────────────────────────────────── */}
      <KpiCarousel className={`grid-cols-1 sm:grid-cols-2 ${hasRol('Empleado') ? 'xl:grid-cols-3' : 'xl:grid-cols-4'} gap-3 md:gap-4`}>
        <KpiActiveRentals 
          data={activeRentals} 
          onClick={() => setActiveOpsModalOpen(true)} 
          onClickOverdue={() => setOverdueOpsModalOpen(true)}
        />
        <KpiPreparation 
          data={inPreparation} 
          onClick={() => setPrepModalOpen(true)}
        />
        <KpiReadyForPickup 
          data={readyForPickup} 
          onClick={() => setReadyModalOpen(true)}
        />
        {!hasRol('Empleado') && <KpiMonthlyRevenue data={monthlyRevenue} />}
      </KpiCarousel>

      {/* ── Bento: Movements + Cash/Stock ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 items-stretch gap-4 md:gap-6">
        <div className="lg:col-span-2 flex flex-col">
          <div className="flex-1 flex flex-col">
            <RecentMovements movements={recentMovements} />
          </div>
        </div>
        <div className="flex flex-col gap-4 md:gap-6">
          {!hasRol('Empleado') && <CashFlow data={cashFlowWeekly} />}
          <div className="flex-1 flex flex-col min-h-0">
            <StockStatusCard data={stockStatus} />
          </div>
        </div>
      </div>

      {/* ── Upcoming Returns Table ────────────────────────────────────────── */}
      <UpcomingReturns returns={upcomingReturns} />

      <KpiDetailsModal 
        open={activeOpsModalOpen} 
        onClose={() => setActiveOpsModalOpen(false)}
        title="Operaciones Activas"
        endpoint="/dashboard/active-operations"
        columns={activeOpsColumns}
        rowClassName={(row) => row.esAtrasado ? 'text-coral font-medium' : ''}
      />

      <KpiDetailsModal 
        open={overdueOpsModalOpen} 
        onClose={() => setOverdueOpsModalOpen(false)}
        title="Operaciones Atrasadas"
        endpoint="/dashboard/active-operations?overdue=true"
        columns={overdueOpsColumns}
        rowClassName={() => 'text-coral font-medium'}
      />

      <KpiDetailsModal 
        open={prepModalOpen} 
        onClose={() => setPrepModalOpen(false)}
        title="En Preparación"
        endpoint="/dashboard/active-operations?etapa=RESERVADO"
        columns={activeOpsColumns}
      />

      <KpiDetailsModal 
        open={readyModalOpen} 
        onClose={() => setReadyModalOpen(false)}
        title="Listos para Retiro"
        endpoint="/dashboard/active-operations?etapa=LISTO_PARA_RETIRO,LISTO_PARA_ENTREGA"
        columns={activeOpsColumns}
      />

    </div>
  );
}
