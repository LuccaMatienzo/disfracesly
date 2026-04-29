const { prisma } = require('../../config/database');

// ─── Helpers ──────────────────────────────────────────────────────────────────

function startOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function startOfMonth(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function startOfLastMonth(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth() - 1, 1);
}

function endOfLastMonth(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), 0, 23, 59, 59, 999);
}

// ─── KPI Cards ────────────────────────────────────────────────────────────────

/**
 * "In Preparation" — Alquileres en etapa RESERVADO
 * Also counts how many are urgent (fecha_retiro = tomorrow)
 */
async function getInPreparation() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStart = startOfDay(tomorrow);
  const tomorrowEnd = endOfDay(tomorrow);

  const [total, urgent] = await prisma.$transaction([
    prisma.alquiler.count({
      where: {
        etapa: 'RESERVADO',
        operacion: { deleted_at: null },
      },
    }),
    prisma.alquiler.count({
      where: {
        etapa: 'RESERVADO',
        operacion: {
          deleted_at: null,
          fecha_retiro: { gte: tomorrowStart, lte: tomorrowEnd },
        },
      },
    }),
  ]);

  return { total, urgentTomorrow: urgent };
}

/**
 * "Ready for Pickup" — Alquileres en etapa LISTO_PARA_RETIRO
 */
async function getReadyForPickup() {
  const items = await prisma.alquiler.findMany({
    where: {
      etapa: 'LISTO_PARA_RETIRO',
      operacion: { deleted_at: null },
    },
    include: {
      operacion: {
        include: {
          detalles: { select: { id_pieza_stock: true } },
        },
      },
    },
  });

  // Count total packages (alquileres) and total pieces
  const totalPackages = items.length;
  return { totalPackages };
}

/**
 * "Active Rentals" — Alquileres en etapa RETIRADO
 * Also computes overdue count, due today count, and late fees estimate
 */
async function getActiveRentals() {
  const now = new Date();
  const todayEnd = endOfDay(now);

  const rentals = await prisma.alquiler.findMany({
    where: {
      etapa: 'RETIRADO',
      operacion: { deleted_at: null },
    },
    include: {
      operacion: {
        include: {
          detalles: { select: { id_pieza_stock: true } },
        },
      },
    },
  });

  let totalItems = 0;
  let overdue = 0;
  let dueToday = 0;

  for (const rental of rentals) {
    totalItems += rental.operacion.detalles.length;
    if (rental.fecha_devolucion) {
      const devDate = new Date(rental.fecha_devolucion);
      if (devDate < startOfDay(now)) {
        overdue++;
      } else if (devDate >= startOfDay(now) && devDate <= todayEnd) {
        dueToday++;
      }
    }
  }

  return { totalItems, overdue, dueToday };
}

/**
 * "Monthly Revenue" — Sum of all payments this month + % change vs last month
 */
async function getMonthlyRevenue() {
  const now = new Date();
  const thisMonthStart = startOfMonth(now);
  const lastMonthStart = startOfLastMonth(now);
  const lastMonthEnd = endOfLastMonth(now);

  const [thisMonthPayments, lastMonthPayments] = await prisma.$transaction([
    prisma.pagoOperacion.aggregate({
      where: {
        deleted_at: null,
        fecha: { gte: thisMonthStart },
        tipo: { in: ['SENA', 'DEPOSITO', 'SALDO'] },
      },
      _sum: { monto: true },
    }),
    prisma.pagoOperacion.aggregate({
      where: {
        deleted_at: null,
        fecha: { gte: lastMonthStart, lte: lastMonthEnd },
        tipo: { in: ['SENA', 'DEPOSITO', 'SALDO'] },
      },
      _sum: { monto: true },
    }),
  ]);

  const current = Number(thisMonthPayments._sum.monto ?? 0);
  const previous = Number(lastMonthPayments._sum.monto ?? 0);
  const percentChange = previous > 0 ? Math.round(((current - previous) / previous) * 100) : (current > 0 ? 100 : 0);

  return { current, previous, percentChange };
}

// ─── Recent Movements ─────────────────────────────────────────────────────────

/**
 * Recent movements — latest interactions (retiro/devolución) + ventas
 */
async function getRecentMovements(limit = 8) {
  const interactions = await prisma.interaccionOperacion.findMany({
    where: { deleted_at: null },
    include: {
      operacion: {
        include: {
          cliente: { include: { persona: true } },
          alquiler: true,
          venta: true,
          detalles: {
            include: {
              piezaStock: {
                include: {
                  pieza: true,
                },
              },
            },
            take: 1,
          },
        },
      },
      usuario: { include: { persona: true } },
    },
    orderBy: { fecha_hora: 'desc' },
    take: limit,
  });

  return interactions.map((i) => {
    const op = i.operacion;
    const isAlquiler = !!op.alquiler;
    const piezaStock = op.detalles[0]?.piezaStock;
    const pieza = piezaStock?.pieza;

    // Determine status label
    let status = 'Otra';
    if (i.tipo === 'RETIRO') status = 'Pickup';
    if (i.tipo === 'DEVOLUCION') status = 'Return';
    if (!isAlquiler && op.venta) status = 'Sale';

    return {
      id: i.id_interaccion_operacion.toString(),
      status,
      itemName: pieza?.nombre ?? 'Item',
      itemSize: piezaStock?.talle ?? '',
      itemId: op.id_operacion.toString(),
      customerName: op.cliente
        ? `${op.cliente.persona.nombre} ${op.cliente.persona.apellido}`
        : 'Walk-in Customer',
      employeeName: `${i.usuario.persona.nombre} ${i.usuario.persona.apellido}`,
      employeeInitials: `${i.usuario.persona.nombre[0]}${i.usuario.persona.apellido[0]}`,
      timeAgo: i.fecha_hora,
    };
  });
}

// ─── Cash Flow (Today) ────────────────────────────────────────────────────────

/**
 * Cash flow for today: total income, deposits in custody, and pending balance
 */
async function getCashFlowToday() {
  const todayStart = startOfDay();
  const todayEnd = endOfDay();

  // Total income today (SENA + SALDO payments)
  const incomeResult = await prisma.pagoOperacion.aggregate({
    where: {
      deleted_at: null,
      fecha: { gte: todayStart, lte: todayEnd },
      tipo: { in: ['SENA', 'SALDO'] },
    },
    _sum: { monto: true },
  });

  // Deposits in custody: sum of deposito_monto - deposito_devuelto_monto for active rentals
  const activeRentals = await prisma.alquiler.findMany({
    where: {
      etapa: { in: ['RESERVADO', 'LISTO_PARA_RETIRO', 'RETIRADO'] },
      operacion: { deleted_at: null },
    },
    select: {
      deposito_monto: true,
      deposito_devuelto_monto: true,
    },
  });

  const depositsInCustody = activeRentals.reduce((sum, r) => {
    return sum + Number(r.deposito_monto) - Number(r.deposito_devuelto_monto);
  }, 0);

  // Pending balance: monto_total - sum(pagos) for active operations
  const activeOps = await prisma.operacion.findMany({
    where: {
      deleted_at: null,
      OR: [
        { alquiler: { etapa: { in: ['RESERVADO', 'LISTO_PARA_RETIRO', 'RETIRADO'] } } },
        { venta: { etapa: { in: ['RESERVADO', 'LISTO_PARA_ENTREGA'] } } },
      ],
    },
    include: {
      pagos: {
        where: { deleted_at: null, tipo: { in: ['SENA', 'SALDO'] } },
      },
    },
  });

  const pendingBalance = activeOps.reduce((sum, op) => {
    const totalPaid = op.pagos.reduce((s, p) => s + Number(p.monto), 0);
    return sum + Math.max(0, Number(op.monto_total) - totalPaid);
  }, 0);

  return {
    totalIncome: Number(incomeResult._sum.monto ?? 0),
    depositsInCustody,
    pendingBalance,
  };
}

// ─── Stock Status ─────────────────────────────────────────────────────────────

/**
 * Stock status breakdown by estado_pieza_stock
 */
async function getStockStatus() {
  const counts = await prisma.piezaStock.groupBy({
    by: ['estado_pieza_stock'],
    where: { deleted_at: null },
    _count: { _all: true },
  });

  const statusMap = {
    DISPONIBLE: 0,
    RESERVADA: 0,
    ALQUILADA: 0,
    VENDIDA: 0,
    FUERA_DE_SERVICIO: 0,
  };

  let total = 0;
  for (const row of counts) {
    statusMap[row.estado_pieza_stock] = row._count._all;
    total += row._count._all;
  }

  return { ...statusMap, total };
}

// ─── Próximos Alquileres a Vencer ─────────────────────────────────────────────

/**
 * Upcoming rental returns — active rentals sorted by fecha_devolucion
 */
async function getUpcomingReturns(limit = 5) {
  const rentals = await prisma.alquiler.findMany({
    where: {
      etapa: { in: ['RETIRADO', 'LISTO_PARA_RETIRO', 'RESERVADO'] },
      operacion: { deleted_at: null },
    },
    include: {
      operacion: {
        include: {
          cliente: { include: { persona: true } },
          detalles: {
            include: {
              piezaStock: { include: { pieza: true } },
            },
            take: 1,
          },
        },
      },
    },
    orderBy: { fecha_devolucion: 'asc' },
    take: limit,
  });

  const now = new Date();

  return rentals.map((r) => {
    const op = r.operacion;
    const pieza = op.detalles[0]?.piezaStock?.pieza;
    const devDate = r.fecha_devolucion ? new Date(r.fecha_devolucion) : null;

    let etapaLabel = 'Activo';
    if (r.etapa === 'RESERVADO') etapaLabel = 'Pendiente';
    if (r.etapa === 'LISTO_PARA_RETIRO') etapaLabel = 'Confirmado';
    if (r.etapa === 'RETIRADO') {
      if (devDate && devDate < startOfDay(now)) {
        etapaLabel = 'Por vencer';
      } else {
        etapaLabel = 'Activo';
      }
    }

    return {
      id: op.id_operacion.toString(),
      cliente: op.cliente
        ? `${op.cliente.persona.nombre} ${op.cliente.persona.apellido[0]}.`
        : 'Sin cliente',
      disfraz: pieza?.nombre ?? 'Sin pieza',
      retiro: op.fecha_retiro ? new Date(op.fecha_retiro).toISOString().split('T')[0] : '—',
      devolucion: devDate ? devDate.toISOString().split('T')[0] : '—',
      etapa: etapaLabel,
    };
  });
}

// ─── Aggregate endpoint ─────────────────────────────────────────────────────

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
