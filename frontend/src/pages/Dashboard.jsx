import { useAuth } from '@/context/AuthContext';
import { useStock, useStockStats } from '@/hooks/useStock';
import { useOperaciones } from '@/hooks/useOperaciones';
import { KPICard } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Table from '@/components/ui/Table';

const ESTADO_ICONOS = {
  DISPONIBLE: '🟢',
  RESERVADA: '🟡',
  ALQUILADA: '🟠',
  VENDIDA: '⚫',
  FUERA_DE_SERVICIO: '🔴',
};

export default function Dashboard() {
  const { user } = useAuth();
  const { data: stats } = useStockStats();
  const { data: operacionesData } = useOperaciones({ limit: 5 });

  const operaciones = operacionesData?.data ?? [];

  const kpis = [
    {
      label: 'Disponible',
      value: stats?.DISPONIBLE ?? 0,
      icon: '✓',
      accent: 'primary',
      trend: 'Piezas listas para asignar',
    },
    {
      label: 'Alquiladas',
      value: stats?.ALQUILADA ?? 0,
      icon: '↗',
      accent: 'secondary',
      trend: 'En uso actualmente',
    },
    {
      label: 'Reservadas',
      value: stats?.RESERVADA ?? 0,
      icon: '◷',
      accent: 'tertiary',
      trend: 'Pendientes de retiro/entrega',
    },
    {
      label: 'Fuera de servicio',
      value: stats?.FUERA_DE_SERVICIO ?? 0,
      icon: '⚠',
      accent: 'secondary',
      trend: 'Requieren atención',
    },
  ];

  const columns = [
    { key: 'id_operacion', label: '#', width: '60px' },
    {
      key: 'cliente',
      label: 'Cliente',
      render: (_, row) =>
        `${row.cliente?.persona?.nombre ?? ''} ${row.cliente?.persona?.apellido ?? ''}`,
    },
    {
      key: 'tipo',
      label: 'Tipo',
      render: (_, row) => (row.alquiler ? 'Alquiler' : 'Venta'),
    },
    {
      key: 'estado',
      label: 'Estado',
      render: (_, row) => {
        const etapa = row.alquiler?.etapa ?? row.venta?.etapa;
        return etapa ? <Badge value={etapa} /> : '—';
      },
    },
    {
      key: 'fecha_constitucion',
      label: 'Fecha',
      render: (v) =>
        new Date(v).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' }),
    },
  ];

  return (
    <div className="space-y-8">
      {/* Saludo */}
      <div>
        <h1 className="font-display text-headline-lg font-bold text-on-surface">
          ¡Hola, {user?.persona?.nombre ?? 'Usuario'}!
        </h1>
        <p className="text-body-md text-on-surface-variant mt-1">
          Acá tenés un resumen del estado del sistema.
        </p>
      </div>

      {/* KPIs */}
      <section aria-label="Métricas de stock">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((kpi) => (
            <KPICard key={kpi.label} {...kpi} />
          ))}
        </div>
      </section>

      {/* Distribución de stock */}
      {stats && (
        <section aria-label="Distribución de estado de stock">
          <div className="bg-surface-container-lowest rounded-2xl shadow-card p-5">
            <h2 className="font-headline text-title-lg text-on-surface mb-4">
              Estado del inventario
            </h2>
            <div className="flex flex-wrap gap-3">
              {Object.entries(stats).map(([estado, count]) => (
                <div
                  key={estado}
                  className="flex items-center gap-2 bg-surface-container rounded-xl px-4 py-2.5"
                >
                  <span>{ESTADO_ICONOS[estado]}</span>
                  <Badge value={estado} />
                  <span className="font-display font-bold text-on-surface">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Últimas operaciones */}
      <section aria-label="Últimas operaciones">
        <div className="bg-surface-container-lowest rounded-2xl shadow-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-headline text-title-lg text-on-surface">
              Últimas operaciones
            </h2>
            <a href="/operaciones" className="text-body-md text-primary hover:underline font-label">
              Ver todas →
            </a>
          </div>
          <Table
            columns={columns}
            data={operaciones}
            emptyMessage="Sin operaciones recientes"
          />
        </div>
      </section>
    </div>
  );
}
