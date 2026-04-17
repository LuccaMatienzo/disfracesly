import { useState, useEffect } from 'react';
import api from '@/api/axios.instance';
import { useAuth } from '@/context/AuthContext';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const KPI_CONFIG = [
  {
    key: 'alquileresActivos',
    label: 'Alquileres Activos',
    icon: 'calendar_today',
    color: 'text-primary',
    bg: 'bg-primary-container',
    suffix: '',
  },
  {
    key: 'piezasEnLimpieza',
    label: 'En Limpieza',
    icon: 'sanitizer',
    color: 'text-tertiary',
    bg: 'bg-tertiary-container',
    suffix: ' pzas',
  },
  {
    key: 'clientesNuevos',
    label: 'Nuevos Clientes',
    icon: 'person_add',
    color: 'text-secondary',
    bg: 'bg-secondary-container',
    suffix: ' este mes',
  },
  {
    key: 'uptime',
    label: 'Sistema Uptime',
    icon: 'monitoring',
    color: 'text-primary',
    bg: 'bg-primary-container',
    suffix: '%',
  },
];

const MOCK_KPIS = {
  alquileresActivos: 12,
  piezasEnLimpieza: 8,
  clientesNuevos: 5,
  uptime: 99.9,
};

const TRIMESTRAL = [
  { mes: 'Ene', valor: 72 },
  { mes: 'Feb', valor: 58 },
  { mes: 'Mar', valor: 89 },
  { mes: 'Abr', valor: 94 },
  { mes: 'May', valor: 76 },
  { mes: 'Jun', valor: 110 },
  { mes: 'Jul', valor: 88 },
  { mes: 'Ago', valor: 103 },
  { mes: 'Sep', valor: 67 },
];

const BADGE_ETAPA = {
  ACTIVO:        { label: 'Activo',       cls: 'bg-primary-container text-[#1a2e05]' },
  CONFIRMADO:    { label: 'Confirmado',   cls: 'bg-tertiary-container text-on-surface' },
  PENDIENTE:     { label: 'Pendiente',    cls: 'bg-secondary-container text-white' },
  POR_VENCER:    { label: 'Por vencer',   cls: 'bg-error/15 text-error' },
  ENTREGADO:     { label: 'Entregado',    cls: 'bg-surface-container text-tertiary' },
};

function KpiCard({ label, icon, color, bg, value, suffix }) {
  return (
    <div className="bg-white rounded-2xl shadow-card p-6 hover:-translate-y-1 transition-transform duration-200 cursor-default">
      <div className={`inline-flex w-12 h-12 rounded-xl ${bg} items-center justify-center mb-4`}>
        <span className={`material-symbols-outlined text-2xl ${color}`}>{icon}</span>
      </div>
      <p className="text-3xl font-headline font-black text-on-surface">
        {value ?? '—'}{suffix}
      </p>
      <p className="text-sm text-on-surface-variant mt-1">{label}</p>
    </div>
  );
}

function BarChart({ data }) {
  const max = Math.max(...data.map((d) => d.valor));
  return (
    <div className="flex items-end gap-3 h-36 mt-4">
      {data.map(({ mes, valor }) => (
        <div key={mes} className="flex-1 flex flex-col items-center gap-1 group">
          <span className="text-[10px] text-tertiary font-label opacity-0 group-hover:opacity-100 transition-opacity">
            {valor}
          </span>
          <div
            className="w-full rounded-t-lg editorial-gradient transition-all duration-300 hover:opacity-90"
            style={{ height: `${(valor / max) * 100}%` }}
          />
          <span className="text-[10px] text-tertiary font-label">{mes}</span>
        </div>
      ))}
    </div>
  );
}

const MOCK_OPERACIONES = [
  { id: 1, cliente: 'Ana García', disfraz: 'Reina de Corazones', retiro: '2026-04-18', devolución: '2026-04-21', etapa: 'POR_VENCER' },
  { id: 2, cliente: 'Carlos M.', disfraz: 'Alquimista Dorado', retiro: '2026-04-16', devolución: '2026-04-19', etapa: 'ACTIVO' },
  { id: 3, cliente: 'Lucía P.', disfraz: 'María Antonieta', retiro: '2026-04-20', devolución: '2026-04-23', etapa: 'CONFIRMADO' },
  { id: 4, cliente: 'Martín L.', disfraz: 'Cabaret Parisino', retiro: '2026-04-15', devolución: '2026-04-17', etapa: 'POR_VENCER' },
  { id: 5, cliente: 'Valeria S.', disfraz: 'Gladiador Romano', retiro: '2026-04-22', devolución: '2026-04-25', etapa: 'PENDIENTE' },
];

export default function Dashboard() {
  const { user } = useAuth();
  const [kpis] = useState(MOCK_KPIS);
  const [operaciones] = useState(MOCK_OPERACIONES);

  const hora = new Date().getHours();
  const saludo = hora < 12 ? 'Buenos días' : hora < 19 ? 'Buenas tardes' : 'Buenas noches';

  return (
    <div className="space-y-8 animate-fade-in">

      {/* ── Greeting ──────────────────────────────────────────────────────── */}
      <div>
        <h1 className="font-headline font-black text-3xl text-on-surface">
          {saludo}, {user?.persona?.nombre ?? 'Admin'} 👋
        </h1>
        <p className="text-on-surface-variant mt-1">
          Resumen de operaciones del atelier
        </p>
      </div>

      {/* ── KPI Cards ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {KPI_CONFIG.map((cfg) => (
          <KpiCard
            key={cfg.key}
            label={cfg.label}
            icon={cfg.icon}
            color={cfg.color}
            bg={cfg.bg}
            value={kpis[cfg.key]}
            suffix={cfg.suffix}
          />
        ))}
      </div>

      {/* ── Bento: Chart + Info ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-card p-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-headline font-bold text-on-surface text-lg">
              Tráfico de Alquileres
            </h2>
            <span className="text-xs text-tertiary font-label uppercase tracking-widest bg-surface-container-low px-3 py-1 rounded-full">
              Últimos 9 meses
            </span>
          </div>
          <p className="text-on-surface-variant text-sm mb-4">
            Volumen de operaciones por mes
          </p>
          <BarChart data={TRIMESTRAL} />
        </div>

        {/* Quick stats */}
        <div className="flex flex-col gap-4">
          <div className="bg-white rounded-2xl shadow-card p-6 flex-1">
            <span className="material-symbols-outlined text-3xl text-primary mb-3 block">trending_up</span>
            <p className="font-headline font-black text-4xl text-on-surface">+18%</p>
            <p className="text-sm text-on-surface-variant mt-1">vs. mes anterior</p>
          </div>
          <div className="bg-inverse-surface rounded-2xl shadow-card p-6 flex-1">
            <span className="material-symbols-outlined text-3xl text-primary-container mb-3 block">star</span>
            <p className="font-headline font-black text-4xl text-inverse-on-surface">4.9</p>
            <p className="text-sm text-inverse-on-surface/60 mt-1">Satisfacción promedio</p>
          </div>
        </div>
      </div>

      {/* ── Tabla: Próximos alquileres a vencer ─────────────────────────── */}
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
              {operaciones.map((op, i) => {
                const badge = BADGE_ETAPA[op.etapa] ?? BADGE_ETAPA.PENDIENTE;
                return (
                  <tr
                    key={op.id}
                    className={`border-b border-outline-variant/10 last:border-0 hover:bg-surface-container-low/60 transition-colors ${
                      i % 2 === 0 ? '' : 'bg-surface-container-low/30'
                    }`}
                  >
                    <td className="px-6 py-4 font-medium text-on-surface text-sm">{op.cliente}</td>
                    <td className="px-6 py-4 text-on-surface-variant text-sm">{op.disfraz}</td>
                    <td className="px-6 py-4 text-on-surface-variant text-sm">{op.retiro}</td>
                    <td className="px-6 py-4 text-on-surface-variant text-sm">{op['devolución']}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${badge.cls}`}>
                        {badge.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
