import { useState, useEffect, useMemo } from 'react';
import api from '@/api/axios.instance';
import { useAuth } from '@/context/AuthContext';

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

const BADGE_ETAPA = {
  'Activo': { cls: 'bg-primary-container text-[#1a2e05]' },
  'Confirmado': { cls: 'bg-tertiary-container text-on-surface' },
  'Pendiente': { cls: 'bg-secondary-container text-white' },
  'Por vencer': { cls: 'bg-error/15 text-error' },
  'Entregado': { cls: 'bg-surface-container text-tertiary' },
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
              className="w-2.5 h-2.5 rounded-full inline-block"
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

function KpiPreparation({ data }) {
  return (
    <div className="bg-white rounded-2xl shadow-card p-5 hover:-translate-y-1 transition-transform duration-200 cursor-default overflow-hidden relative flex flex-col justify-start h-full">
      <div className="absolute top-8 right-6 pointer-events-none opacity-20 text-tertiary">
        <span className="material-symbols-outlined" style={{ fontSize: '50px' }}>inventory_2</span>
      </div>
      <div className="relative z-10 flex flex-col w-full">
        <p className="text-xs text-on-surface-variant font-label uppercase tracking-widest mb-1">En Preparación</p>
        <p className="text-4xl font-headline font-black text-on-surface">{data.total}</p>
        <p className="text-sm text-on-surface-variant">Pedidos</p>
      </div>
      <div className="mt-3 w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{
            width: data.total > 0 ? `${Math.min(100, (data.urgentTomorrow / data.total) * 100)}%` : '0%',
            background: 'linear-gradient(90deg, #84cc16, #facc15)',
          }}
        />
      </div>
      {data.urgentTomorrow > 0 && (
        <p className="text-xs text-on-surface-variant mt-1.5">{data.urgentTomorrow} Urgentes para mañana</p>
      )}
    </div>
  );
}

function KpiReadyForPickup({ data }) {
  return (
    <div className="bg-white rounded-2xl shadow-card p-5 hover:-translate-y-1 transition-transform duration-200 cursor-default overflow-hidden relative flex flex-col justify-start h-full">
      <div className="absolute top-8 right-6 pointer-events-none opacity-20 text-tertiary">
        <span className="material-symbols-outlined" style={{ fontSize: '50px' }}>package_2</span>
      </div>
      <div className="relative z-10 flex flex-col w-full">
        <p className="text-xs text-on-surface-variant font-label uppercase tracking-widest mb-1">Listos para Retiro</p>
        <p className="text-4xl font-headline font-black text-on-surface">{data.totalPackages}</p>
        <p className="text-sm text-on-surface-variant">Paquetes</p>
      </div>
    </div>
  );
}

function KpiActiveRentals({ data }) {
  return (
    <div className="bg-white rounded-2xl shadow-card p-5 hover:-translate-y-1 transition-transform duration-200 cursor-default overflow-hidden relative flex flex-col justify-start h-full">
      <div className="absolute top-8 right-6 pointer-events-none opacity-20 text-tertiary">
        <span className="material-symbols-outlined" style={{ fontSize: '50px' }}>checkroom</span>
      </div>
      <div className="relative z-10 flex flex-col w-full">
        <p className="text-xs text-on-surface-variant font-label uppercase tracking-widest mb-1">Alquileres Activos</p>
        <p className="text-4xl font-headline font-black text-on-surface">{data.totalItems}</p>
        <p className="text-sm text-on-surface-variant">Artículos</p>
      </div>
      <div className="flex gap-4 mt-2 text-xs">
        {data.overdue > 0 && (
          <span className="text-error font-semibold">Atrasados ({data.overdue})</span>
        )}
        {data.dueToday > 0 && (
          <span className="text-primary font-semibold">Vencen Hoy ({data.dueToday})</span>
        )}
      </div>
    </div>
  );
}

function KpiMonthlyRevenue({ data }) {
  const isPositive = data.percentChange >= 0;
  return (
    <div className="bg-white rounded-2xl shadow-card p-5 hover:-translate-y-1 transition-transform duration-200 cursor-default overflow-hidden relative flex flex-col justify-start h-full">
      <div className="absolute top-8 right-6 pointer-events-none opacity-20 text-tertiary">
        <span className="material-symbols-outlined" style={{ fontSize: '50px' }}>payments</span>
      </div>
      <div className="relative z-10 flex flex-col w-full">
        <p className="text-xs text-on-surface-variant font-label uppercase tracking-widest mb-1">Ingresos del Mes</p>
        <p className="text-3xl font-headline font-black text-on-surface">{formatCurrency(data.current)}</p>
      </div>
      <div className="flex items-center gap-1 mt-2">
        <span className={`material-symbols-outlined text-base ${isPositive ? 'text-primary' : 'text-error'}`}>
          {isPositive ? 'trending_up' : 'trending_down'}
        </span>
        <span className={`text-xs font-semibold ${isPositive ? 'text-primary' : 'text-error'}`}>
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
      <div className="bg-white rounded-2xl shadow-card p-6">
        <h2 className="font-headline font-bold text-on-surface text-lg mb-4">Movimientos Recientes</h2>
        <p className="text-on-surface-variant text-sm">No hay movimientos recientes</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-card overflow-hidden">
      <div className="px-6 py-4 border-b border-outline-variant/20 flex items-center justify-between">
        <h2 className="font-headline font-bold text-on-surface text-lg">Movimientos Recientes</h2>
        <a href="/admin/operaciones" className="text-sm text-on-surface-variant font-label font-semibold hover:underline">
          Ver Todos
        </a>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-outline-variant/10">
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
                  className={`border-b border-outline-variant/10 last:border-0 hover:bg-surface-container-low/60 transition-colors ${i % 2 === 0 ? '' : 'bg-surface-container-low/30'
                    }`}
                >
                  <td className="px-6 py-3.5">
                    <span className="inline-flex items-center gap-1.5">
                      {cfg.isSale ? (
                        <span className="material-symbols-outlined text-sm" style={{ color: cfg.color }}>sell</span>
                      ) : (
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cfg.dotColor }} />
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
                      <span className="w-7 h-7 rounded-full bg-surface-container-low flex items-center justify-center text-[10px] font-bold text-on-surface-variant uppercase">
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
    { label: 'INGRESOS TOTALES', value: data.totalIncome, icon: 'account_balance_wallet', bg: 'bg-[#e8f5e9]', iconColor: 'text-[#4caf50]' },
    { label: 'SEÑAS EN CUSTODIA', value: data.depositsInCustody, icon: 'lock', bg: 'bg-[#fff8e1]', iconColor: 'text-[#ff9800]' },
    { label: 'SALDO PENDIENTE', value: data.pendingBalance, icon: 'credit_score', bg: 'bg-[#ffebee]', iconColor: 'text-[#ef5350]' },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-card p-6">
      <h2 className="font-headline font-bold text-on-surface text-lg mb-4">Flujo de Caja (Hoy)</h2>
      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.label} className={`flex items-center gap-4 p-3 rounded-xl ${item.bg}/30`}>
            <div className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center`}>
              <span className={`material-symbols-outlined text-xl ${item.iconColor}`}>{item.icon}</span>
            </div>
            <div>
              <p className="text-[10px] font-label font-bold uppercase tracking-widest text-on-surface-variant">{item.label}</p>
              <p className="text-xl font-headline font-black text-on-surface">{formatCurrency(item.value)}</p>
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
    { label: 'Reparación', value: data.FUERA_DE_SERVICIO ?? 0, color: '#ef5350' },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-headline font-bold text-on-surface text-lg">Estado del Stock</h2>
        <a href="/admin/stock" className="text-xs text-on-surface-variant font-label font-semibold bg-surface-container-low px-3 py-1 rounded-full hover:bg-surface-container transition-colors">
          Reporte por Categoría
        </a>
      </div>
      <DonutChart data={chartData} />
    </div>
  );
}

// ─── Upcoming Returns Table ───────────────────────────────────────────────────

function UpcomingReturns({ returns: list }) {
  if (!list || list.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-card p-6">
        <h2 className="font-headline font-bold text-on-surface text-lg mb-4">
          Próximos alquileres a vencer
        </h2>
        <p className="text-on-surface-variant text-sm">No hay alquileres próximos a vencer</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-card overflow-hidden">
      <div className="px-6 py-4 border-b border-outline-variant/20 flex items-center justify-between">
        <h2 className="font-headline font-bold text-on-surface text-lg">
          Próximos alquileres a vencer
        </h2>
        <a
          href="/admin/operaciones"
          className="text-sm text-primary font-label font-semibold hover:underline"
        >
          Ver todos →
        </a>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-outline-variant/10">
              {['Cliente', 'Disfraz', 'Retiro', 'Devolución', 'Estado'].map((h) => (
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
            {list.map((op, i) => {
              const badge = BADGE_ETAPA[op.etapa] ?? BADGE_ETAPA.Pendiente;
              return (
                <tr
                  key={op.id}
                  className={`border-b border-outline-variant/10 last:border-0 hover:bg-surface-container-low/60 transition-colors ${i % 2 === 0 ? '' : 'bg-surface-container-low/30'
                    }`}
                >
                  <td className="px-6 py-4 font-medium text-on-surface text-sm">{op.cliente}</td>
                  <td className="px-6 py-4 text-on-surface-variant text-sm">{op.disfraz}</td>
                  <td className="px-6 py-4 text-on-surface-variant text-sm">{op.retiro}</td>
                  <td className="px-6 py-4 text-on-surface-variant text-sm">{op.devolucion}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${badge.cls}`}>
                      {op.etapa}
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
    <div className="bg-white rounded-2xl shadow-card p-5 animate-pulse">
      <div className="h-3 w-24 bg-surface-container rounded-full mb-3" />
      <div className="h-10 w-20 bg-surface-container rounded-lg mb-2" />
      <div className="h-3 w-16 bg-surface-container rounded-full" />
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function Dashboard() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        setLoading(true);
        const { data } = await api.get('/dashboard');
        setDashboard(data);
      } catch (err) {
        console.error('Error fetching dashboard:', err);
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
      <div className="space-y-8 animate-fade-in">
        <div>
          <h1 className="font-headline font-black text-3xl text-on-surface">
            {saludo}, {user?.persona?.nombre ?? 'Admin'}
          </h1>
          <p className="text-on-surface-variant mt-1">Cargando datos del dashboard...</p>
        </div>
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
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

  const { inPreparation, readyForPickup, activeRentals, monthlyRevenue, recentMovements, cashFlowToday, stockStatus, upcomingReturns } = dashboard;

  return (
    <div className="space-y-8 animate-fade-in">

      {/* ── Greeting ──────────────────────────────────────────────────────── */}
      <div>
        <h1 className="font-headline font-black text-3xl text-on-surface">
          {saludo}, {user?.persona?.nombre ?? 'Admin'}
        </h1>
        <p className="text-on-surface-variant mt-1">
          Resumen de operaciones de la tienda
        </p>
      </div>

      {/* ── KPI Cards ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiPreparation data={inPreparation} />
        <KpiReadyForPickup data={readyForPickup} />
        <KpiActiveRentals data={activeRentals} />
        <KpiMonthlyRevenue data={monthlyRevenue} />
      </div>

      {/* ── Bento: Movements + Cash/Stock ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentMovements movements={recentMovements} />
        </div>
        <div className="flex flex-col gap-6">
          <CashFlow data={cashFlowToday} />
          <StockStatusCard data={stockStatus} />
        </div>
      </div>

      {/* ── Upcoming Returns Table ────────────────────────────────────────── */}
      <UpcomingReturns returns={upcomingReturns} />

    </div>
  );
}
