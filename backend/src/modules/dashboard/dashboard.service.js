const { prisma } = require('../../config/database');

// ─── KPI: En Preparación ─────────────────────────────────────────────────────
// Alquileres RESERVADO — se mantiene en Prisma (query simple, sin lógica JS)

async function getInPreparation() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStart = new Date(tomorrow.setHours(0, 0, 0, 0));
  const tomorrowEnd   = new Date(tomorrow.setHours(23, 59, 59, 999));

  const [total, urgent] = await prisma.$transaction([
    prisma.alquiler.count({
      where: { etapa: 'RESERVADO', operacion: { deleted_at: null } },
    }),
    prisma.alquiler.count({
      where: {
        etapa: 'RESERVADO',
        operacion: { deleted_at: null, fecha_retiro: { gte: tomorrowStart, lte: tomorrowEnd } },
      },
    }),
  ]);

  return { total, urgentTomorrow: urgent };
}

// ─── KPI: Listos para Retiro ─────────────────────────────────────────────────
// Alquileres LISTO_PARA_RETIRO — se mantiene en Prisma (COUNT simple)

async function getReadyForPickup() {
  const totalPackages = await prisma.alquiler.count({
    where: { etapa: 'LISTO_PARA_RETIRO', operacion: { deleted_at: null } },
  });
  return { totalPackages };
}

// ─── KPI: Estado del Stock ────────────────────────────────────────────────────
// groupBy simple — se mantiene en Prisma

async function getStockStatus() {
  const counts = await prisma.piezaStock.groupBy({
    by: ['estado_pieza_stock'],
    where: { deleted_at: null },
    _count: { _all: true },
  });

  const statusMap = { DISPONIBLE: 0, RESERVADA: 0, ALQUILADA: 0, VENDIDA: 0, FUERA_DE_SERVICIO: 0 };
  let total = 0;
  for (const row of counts) {
    statusMap[row.estado_pieza_stock] = row._count._all;
    total += row._count._all;
  }

  return { ...statusMap, total };
}

// ─── SQL Functions ────────────────────────────────────────────────────────────
// Las siguientes consultas delegan lógica analítica compleja a PostgreSQL.
// Beneficios: 1 round-trip por query, sin procesamiento JS, plan cacheado.

/**
 * KPI Alquileres Activos — reemplaza getActiveRentals() + loop JS
 * Retorna: totalItems (piezas), overdue, dueToday
 */
async function getActiveRentals() {
  const [row] = await prisma.$queryRaw`
    SELECT * FROM gestion.fn_kpi_active_rentals()
  `;
  return {
    totalItems:  Number(row.total_items),
    overdue:     Number(row.overdue),
    dueToday:    Number(row.due_today),
  };
}

/**
 * Ingresos mensuales — reemplaza getMonthlyRevenue() + cálculo % en JS
 * Retorna: current, previous, percentChange
 */
async function getMonthlyRevenue() {
  const [row] = await prisma.$queryRaw`
    SELECT * FROM gestion.fn_monthly_revenue()
  `;
  return {
    current:       Number(row.current_amount),
    previous:      Number(row.previous_amount),
    percentChange: Number(row.percent_change),
  };
}

/**
 * Cash flow hoy — reemplaza getCashFlowToday() (3 queries + reduce en JS)
 * Retorna: totalIncome, depositsInCustody, pendingBalance
 */
async function getCashFlowToday() {
  const [row] = await prisma.$queryRaw`
    SELECT * FROM gestion.fn_cash_flow_today()
  `;
  return {
    totalIncome:       Number(row.total_income),
    depositsInCustody: Number(row.deposits_in_custody),
    pendingBalance:    Number(row.pending_balance),
  };
}

/**
 * Movimientos recientes — reemplaza getRecentMovements() (join 6 tablas + map JS)
 * La vista ya devuelve las columnas con los nombres que espera el frontend.
 */
async function getRecentMovements(limit = 8) {
  const rows = await prisma.$queryRaw`
    SELECT * FROM gestion.v_recent_movements LIMIT ${limit}
  `;
  return rows.map((r) => ({
    id:               r.id_interaccion_operacion.toString(),
    status:           r.status,
    itemName:         r.item_name    ?? 'Item',
    itemSize:         r.item_size    ?? '',
    itemId:           r.item_id,
    customerName:     r.customer_name ?? 'Walk-in Customer',
    employeeName:     r.employee_name,
    employeeInitials: r.employee_initials,
    timeAgo:          r.time_ago,
  }));
}

/**
 * Próximos alquileres a vencer — reemplaza getUpcomingReturns() + lógica etapa en JS
 * La función SQL ya calcula la etiqueta (Pendiente/Confirmado/Por vencer/Activo).
 */
async function getUpcomingReturns(limit = 5) {
  const rows = await prisma.$queryRaw`
    SELECT * FROM gestion.fn_upcoming_returns(${limit}::int)
  `;
  // La función ya devuelve el shape exacto que espera el frontend
  return rows.map((r) => ({
    id:        r.id,
    cliente:   r.cliente   ?? 'Sin cliente',
    disfraz:   r.disfraz   ?? 'Sin pieza',
    retiro:    r.retiro    ?? '—',
    devolucion:r.devolucion ?? '—',
    etapa:     r.etapa,
  }));
}

// ─── Aggregate endpoint ───────────────────────────────────────────────────────

async function getDashboardData() {
  const [
    inPreparation,
    readyForPickup,
    activeRentals,
    monthlyRevenue,
    recentMovements,
    cashFlowToday,
    stockStatus,
    upcomingReturns,
  ] = await Promise.all([
    getInPreparation(),
    getReadyForPickup(),
    getActiveRentals(),
    getMonthlyRevenue(),
    getRecentMovements(),
    getCashFlowToday(),
    getStockStatus(),
    getUpcomingReturns(),
  ]);

  return {
    inPreparation,
    readyForPickup,
    activeRentals,
    monthlyRevenue,
    recentMovements,
    cashFlowToday,
    stockStatus,
    upcomingReturns,
  };
}

module.exports = { getDashboardData };
