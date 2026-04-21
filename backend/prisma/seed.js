const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function daysFromNow(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}

function hoursAgo(n) {
  const d = new Date();
  d.setHours(d.getHours() - n);
  return d;
}

function minutesAgo(n) {
  const d = new Date();
  d.setMinutes(d.getMinutes() - n);
  return d;
}

// ─── Data samples ─────────────────────────────────────────────────────────────

const CATEGORIAS = [
  { nombre: 'Piratas', descripcion: 'Disfraces de piratas y corsarios' },
  { nombre: 'Medievales', descripcion: 'Royalty y nobleza medieval' },
  { nombre: 'Superhéroes', descripcion: 'Capas, máscaras y poderes' },
  { nombre: 'Halloween', descripcion: 'Terror y fantasía oscura' },
  { nombre: 'Entretenimiento', descripcion: 'Payasos, mimos y animadores' },
  { nombre: 'Época', descripcion: 'Trajes de época histórica' },
  { nombre: 'Fantasía', descripcion: 'Elfos, hadas y criaturas mágicas' },
  { nombre: 'Animales', descripcion: 'Disfraces de animales' },
];

const PIEZAS = [
  { nombre: 'Pirate Captain', descripcion: 'Conjunto completo de capitán pirata con sombrero' },
  { nombre: 'Medieval Queen', descripcion: 'Vestido de reina medieval con corona' },
  { nombre: 'Superhero Cape', descripcion: 'Capa de superhéroe de tela satinada' },
  { nombre: 'Vampire Tux', descripcion: 'Esmoquin con capa estilo vampiro' },
  { nombre: 'Gladiator Roman', descripcion: 'Armadura de gladiador romano' },
  { nombre: 'María Antonieta', descripcion: 'Vestido rococó con peluca empolvada' },
  { nombre: 'Cabaret Parisino', descripcion: 'Traje de cabaret estilo Moulin Rouge' },
  { nombre: 'Alquimista Dorado', descripcion: 'Túnica de alquimista con detalles dorados' },
  { nombre: 'Reina de Corazones', descripcion: 'Vestido de la Reina de Corazones' },
  { nombre: 'Ninja Shadow', descripcion: 'Traje completo de ninja con accesorios' },
  { nombre: 'Cowboy Western', descripcion: 'Conjunto vaquero con sombrero y botas' },
  { nombre: 'Princesa de Hielo', descripcion: 'Vestido de princesa de hielo con capa' },
  { nombre: 'Robot Futurista', descripcion: 'Traje de robot con luces LED' },
  { nombre: 'Bruja Elegante', descripcion: 'Vestido de bruja con sombrero puntiagudo' },
  { nombre: 'Arlequín Clásico', descripcion: 'Traje de arlequín con rombos bicolor' },
  { nombre: 'Astronauta', descripcion: 'Traje de astronauta con casco' },
  { nombre: 'Hada del Bosque', descripcion: 'Vestido de hada con alas translúcidas' },
  { nombre: 'Samurái', descripcion: 'Armadura de samurái con katana decorativa' },
  { nombre: 'Cleopatra', descripcion: 'Vestido de Cleopatra con corona dorada' },
  { nombre: 'Detective Noir', descripcion: 'Gabardina y sombrero fedora estilo noir' },
];

const TALLES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const ESTADOS_STOCK = ['DISPONIBLE', 'RESERVADA', 'ALQUILADA', 'FUERA_DE_SERVICIO'];

const CLIENTES = [
  { nombre: 'Ana', apellido: 'García', documento: '30123456', telefono: '1134567890', domicilio: 'Av. Santa Fe 1234, CABA' },
  { nombre: 'Carlos', apellido: 'Martínez', documento: '28765432', telefono: '1145678901', domicilio: 'Calle Belgrano 567, CABA' },
  { nombre: 'Lucía', apellido: 'Pereyra', documento: '35987654', telefono: '1156789012', domicilio: 'Av. Corrientes 890, CABA' },
  { nombre: 'Martín', apellido: 'López', documento: '32456789', telefono: '1167890123', domicilio: 'Calle Florida 321, CABA' },
  { nombre: 'Valeria', apellido: 'Sánchez', documento: '33567890', telefono: '1178901234', domicilio: 'Av. Rivadavia 456, CABA' },
  { nombre: 'Sofía', apellido: 'Martínez', documento: '31234567', telefono: '1189012345', domicilio: 'Calle Lavalle 789, CABA' },
  { nombre: 'Elena', apellido: 'Gómez', documento: '29876543', telefono: '1190123456', domicilio: 'Av. de Mayo 654, CABA' },
  { nombre: 'Luis', apellido: 'Fernando', documento: '34678901', telefono: '1101234567', domicilio: 'Calle Tucumán 987, CABA' },
  { nombre: 'María', apellido: 'Álvarez', documento: '36789012', telefono: '1112345678', domicilio: 'Av. Callao 135, CABA' },
  { nombre: 'Diego', apellido: 'Romero', documento: '27654321', telefono: '1123456789', domicilio: 'Calle Junín 246, CABA' },
];

const NOMBRES_EMPLEADOS = [
  { nombre: 'John', apellido: 'Doe', documento: '20111222', correo: 'john@disfracesly.com' },
  { nombre: 'Maria', apellido: 'Acosta', documento: '20222333', correo: 'maria@disfracesly.com' },
];

// ─── Main seed ────────────────────────────────────────────────────────────────

async function main() {
  const passwordHasheada = await bcrypt.hash('admin123', 10);
  const empleadoPass = await bcrypt.hash('empleado123', 10);

  console.log('🌱 Iniciando siembra de datos...');

  // 1. Roles
  const rolAdmin = await prisma.rol.upsert({
    where: { nombre: 'ADMIN' },
    update: {},
    create: { nombre: 'ADMIN', descripcion: 'Administrador total del sistema' },
  });

  const rolEmpleado = await prisma.rol.upsert({
    where: { nombre: 'EMPLEADO' },
    update: {},
    create: { nombre: 'EMPLEADO', descripcion: 'Empleado del sistema' },
  });
  console.log('✅ Roles verificados/creados');

  // 2. Admin persona + usuario
  const personaAdmin = await prisma.persona.upsert({
    where: { documento: '12345678' },
    update: {},
    create: { nombre: 'Admin', apellido: 'Disfracesly', documento: '12345678' },
  });

  await prisma.usuario.upsert({
    where: { correo: 'admin@disfracesly.com' },
    update: {},
    create: {
      correo: 'admin@disfracesly.com',
      contrasena: passwordHasheada,
      id_persona: personaAdmin.id_persona,
      id_rol: rolAdmin.id_rol,
    },
  });
  console.log('✅ Admin verificado/creado');

  // 3. Empleados
  const empleadoUsuarios = [];
  for (const emp of NOMBRES_EMPLEADOS) {
    const persona = await prisma.persona.upsert({
      where: { documento: emp.documento },
      update: {},
      create: { nombre: emp.nombre, apellido: emp.apellido, documento: emp.documento },
    });

    const usuario = await prisma.usuario.upsert({
      where: { correo: emp.correo },
      update: {},
      create: {
        correo: emp.correo,
        contrasena: empleadoPass,
        id_persona: persona.id_persona,
        id_rol: rolEmpleado.id_rol,
      },
    });

    empleadoUsuarios.push(usuario);
  }
  console.log('✅ Empleados creados');

  // 4. Categorías
  const categorias = [];
  for (const cat of CATEGORIAS) {
    const c = await prisma.categoriaMotivo.create({ data: cat });
    categorias.push(c);
  }
  console.log('✅ Categorías creadas');

  // 5. Piezas
  const piezas = [];
  for (const p of PIEZAS) {
    const pieza = await prisma.pieza.create({ data: p });
    piezas.push(pieza);

    // Associate with 1-2 categories
    const catCount = rand(1, 2);
    const usedCats = new Set();
    for (let i = 0; i < catCount; i++) {
      let cat;
      do { cat = pick(categorias); } while (usedCats.has(cat.id_categoria_motivo));
      usedCats.add(cat.id_categoria_motivo);
      await prisma.piezaCategoria.create({
        data: { id_pieza: pieza.id_pieza, id_categoria_motivo: cat.id_categoria_motivo },
      });
    }
  }
  console.log('✅ Piezas creadas con categorías');

  // 6. Stock — 3-5 units per piece
  const stockItems = [];
  for (const pieza of piezas) {
    const numUnits = rand(3, 5);
    for (let u = 0; u < numUnits; u++) {
      const stock = await prisma.piezaStock.create({
        data: {
          id_pieza: pieza.id_pieza,
          talle: pick(TALLES),
          estado_pieza_stock: 'DISPONIBLE',
          descripcion: `Unidad ${u + 1} de ${pieza.nombre}`,
        },
      });
      stockItems.push(stock);
    }
  }
  console.log(`✅ ${stockItems.length} items de stock creados`);

  // 7. Clientes
  const clientes = [];
  for (const cl of CLIENTES) {
    const persona = await prisma.persona.create({
      data: { nombre: cl.nombre, apellido: cl.apellido, documento: cl.documento },
    });
    const cliente = await prisma.cliente.create({
      data: {
        id_persona: persona.id_persona,
        telefono: cl.telefono,
        domicilio: cl.domicilio,
        fecha_alta: daysAgo(rand(5, 90)),
      },
    });
    clientes.push(cliente);
  }
  console.log('✅ Clientes creados');

  // 8. Operaciones (Alquileres) — diverse states
  console.log('🔧 Creando operaciones de alquiler...');

  // Track which stockItems are available
  const availableStock = new Set(stockItems.map((s) => s.id_pieza_stock));

  function takeAvailableStock(count) {
    const taken = [];
    const iter = availableStock.values();
    for (let i = 0; i < count; i++) {
      const next = iter.next();
      if (next.done) break;
      taken.push(next.value);
    }
    taken.forEach((id) => availableStock.delete(id));
    return taken;
  }

  // a) RESERVADO — In Preparation (12 orders)
  for (let i = 0; i < 12; i++) {
    const ids = takeAvailableStock(rand(1, 2));
    if (ids.length === 0) break;

    const montoTotal = rand(800, 3500);
    const depositoMonto = rand(200, 800);

    const op = await prisma.operacion.create({
      data: {
        id_cliente: pick(clientes).id_cliente,
        monto_total: montoTotal,
        fecha_retiro: i < 5 ? daysFromNow(1) : daysFromNow(rand(2, 7)),
        observaciones: 'Alquiler reservado',
        detalles: { create: ids.map((id) => ({ id_pieza_stock: id })) },
      },
    });

    await prisma.alquiler.create({
      data: {
        id_operacion: op.id_operacion,
        etapa: 'RESERVADO',
        fecha_devolucion: daysFromNow(rand(3, 10)),
        deposito_monto: depositoMonto,
      },
    });

    await prisma.piezaStock.updateMany({
      where: { id_pieza_stock: { in: ids } },
      data: { estado_pieza_stock: 'RESERVADA' },
    });

    // Payment: seña
    const empleado = pick(empleadoUsuarios);
    await prisma.pagoOperacion.create({
      data: {
        id_operacion: op.id_operacion,
        id_persona: empleado.id_persona,
        tipo: 'SENA',
        metodo: pick(['EFECTIVO', 'TRANSFERENCIA']),
        monto: rand(200, 500),
        fecha: daysAgo(rand(0, 3)),
      },
    });
  }
  console.log('  ✅ 12 alquileres RESERVADO');

  // b) LISTO_PARA_RETIRO — Ready for Pickup (8 packages)
  for (let i = 0; i < 8; i++) {
    const ids = takeAvailableStock(rand(1, 3));
    if (ids.length === 0) break;

    const montoTotal = rand(1000, 4000);
    const depositoMonto = rand(300, 1000);

    const op = await prisma.operacion.create({
      data: {
        id_cliente: pick(clientes).id_cliente,
        monto_total: montoTotal,
        fecha_retiro: daysFromNow(rand(0, 2)),
        observaciones: 'Listo para retiro',
        detalles: { create: ids.map((id) => ({ id_pieza_stock: id })) },
      },
    });

    await prisma.alquiler.create({
      data: {
        id_operacion: op.id_operacion,
        etapa: 'LISTO_PARA_RETIRO',
        fecha_devolucion: daysFromNow(rand(3, 7)),
        deposito_monto: depositoMonto,
      },
    });

    await prisma.piezaStock.updateMany({
      where: { id_pieza_stock: { in: ids } },
      data: { estado_pieza_stock: 'RESERVADA' },
    });

    const empleado = pick(empleadoUsuarios);
    await prisma.pagoOperacion.create({
      data: {
        id_operacion: op.id_operacion,
        id_persona: empleado.id_persona,
        tipo: 'DEPOSITO',
        metodo: pick(['EFECTIVO', 'TRANSFERENCIA']),
        monto: depositoMonto,
        fecha: daysAgo(rand(0, 2)),
      },
    });
  }
  console.log('  ✅ 8 alquileres LISTO_PARA_RETIRO');

  // c) RETIRADO — Active Rentals (some overdue, some due today)
  const activeCount = 15;
  for (let i = 0; i < activeCount; i++) {
    const ids = takeAvailableStock(rand(1, 3));
    if (ids.length === 0) break;

    const montoTotal = rand(1200, 5000);
    const depositoMonto = rand(400, 1200);
    const fechaRetiro = daysAgo(rand(2, 10));

    let fechaDevolucion;
    if (i < 2) {
      // Overdue
      fechaDevolucion = daysAgo(rand(1, 3));
    } else if (i < 7) {
      // Due today
      fechaDevolucion = new Date();
      fechaDevolucion.setHours(18, 0, 0, 0);
    } else {
      // Future
      fechaDevolucion = daysFromNow(rand(1, 5));
    }

    const op = await prisma.operacion.create({
      data: {
        id_cliente: pick(clientes).id_cliente,
        monto_total: montoTotal,
        fecha_retiro: fechaRetiro,
        observaciones: 'Alquiler activo',
        detalles: { create: ids.map((id) => ({ id_pieza_stock: id })) },
      },
    });

    await prisma.alquiler.create({
      data: {
        id_operacion: op.id_operacion,
        etapa: 'RETIRADO',
        fecha_devolucion: fechaDevolucion,
        deposito_monto: depositoMonto,
      },
    });

    await prisma.piezaStock.updateMany({
      where: { id_pieza_stock: { in: ids } },
      data: { estado_pieza_stock: 'ALQUILADA' },
    });

    // Payment: deposito + saldo parcial
    const empleado = pick(empleadoUsuarios);
    await prisma.pagoOperacion.create({
      data: {
        id_operacion: op.id_operacion,
        id_persona: empleado.id_persona,
        tipo: 'DEPOSITO',
        metodo: pick(['EFECTIVO', 'TRANSFERENCIA']),
        monto: depositoMonto,
        fecha: fechaRetiro,
      },
    });

    await prisma.pagoOperacion.create({
      data: {
        id_operacion: op.id_operacion,
        id_persona: empleado.id_persona,
        tipo: 'SALDO',
        metodo: pick(['EFECTIVO', 'TRANSFERENCIA']),
        monto: rand(300, 1000),
        fecha: fechaRetiro,
      },
    });
  }
  console.log(`  ✅ ${activeCount} alquileres RETIRADO (activos)`);

  // d) Some DEVUELTO (completed)
  for (let i = 0; i < 5; i++) {
    const ids = takeAvailableStock(rand(1, 2));
    if (ids.length === 0) break;

    const montoTotal = rand(800, 3000);
    const depositoMonto = rand(200, 600);
    const fechaRetiro = daysAgo(rand(10, 20));
    const fechaDevolucion = daysAgo(rand(2, 8));

    const op = await prisma.operacion.create({
      data: {
        id_cliente: pick(clientes).id_cliente,
        monto_total: montoTotal,
        fecha_retiro: fechaRetiro,
        observaciones: 'Alquiler completado',
        detalles: { create: ids.map((id) => ({ id_pieza_stock: id })) },
      },
    });

    await prisma.alquiler.create({
      data: {
        id_operacion: op.id_operacion,
        etapa: 'DEVUELTO',
        fecha_devolucion: fechaDevolucion,
        deposito_monto: depositoMonto,
        deposito_devuelto_monto: depositoMonto,
      },
    });

    // These stock pieces go back to DISPONIBLE (already are since we took from available)

    const empleado = pick(empleadoUsuarios);
    await prisma.pagoOperacion.create({
      data: {
        id_operacion: op.id_operacion,
        id_persona: empleado.id_persona,
        tipo: 'SALDO',
        metodo: pick(['EFECTIVO', 'TRANSFERENCIA']),
        monto: montoTotal,
        fecha: fechaRetiro,
      },
    });
    await prisma.pagoOperacion.create({
      data: {
        id_operacion: op.id_operacion,
        id_persona: empleado.id_persona,
        tipo: 'DEVOLUCION_DEPOSITO',
        metodo: 'EFECTIVO',
        monto: depositoMonto,
        fecha: fechaDevolucion,
      },
    });
  }
  console.log('  ✅ 5 alquileres DEVUELTO');

  // e) Some Ventas
  for (let i = 0; i < 3; i++) {
    const ids = takeAvailableStock(1);
    if (ids.length === 0) break;

    const montoTotal = rand(2000, 8000);
    const senaMonto = rand(500, 1500);

    const op = await prisma.operacion.create({
      data: {
        id_cliente: pick(clientes).id_cliente,
        monto_total: montoTotal,
        observaciones: 'Venta directa',
        detalles: { create: ids.map((id) => ({ id_pieza_stock: id })) },
      },
    });

    await prisma.venta.create({
      data: {
        id_operacion: op.id_operacion,
        etapa: pick(['VENDIDO', 'ENTREGADO', 'RESERVADO']),
        sena_monto: senaMonto,
      },
    });

    const empleado = pick(empleadoUsuarios);
    await prisma.pagoOperacion.create({
      data: {
        id_operacion: op.id_operacion,
        id_persona: empleado.id_persona,
        tipo: 'SENA',
        metodo: pick(['EFECTIVO', 'TRANSFERENCIA']),
        monto: senaMonto,
        fecha: daysAgo(rand(0, 5)),
      },
    });

    // Mark stock as VENDIDA
    await prisma.piezaStock.updateMany({
      where: { id_pieza_stock: { in: ids } },
      data: { estado_pieza_stock: 'VENDIDA' },
    });
  }
  console.log('  ✅ 3 ventas creadas');

  // f) Some FUERA_DE_SERVICIO stock (laundry/repair)
  const remainingAvailable = [...availableStock];
  const fdsCount = Math.min(8, remainingAvailable.length);
  const fdsIds = remainingAvailable.slice(0, fdsCount);
  if (fdsIds.length > 0) {
    await prisma.piezaStock.updateMany({
      where: { id_pieza_stock: { in: fdsIds } },
      data: { estado_pieza_stock: 'FUERA_DE_SERVICIO' },
    });
    fdsIds.forEach((id) => availableStock.delete(id));
  }
  console.log(`  ✅ ${fdsIds.length} piezas FUERA_DE_SERVICIO`);

  // 9. Interacciones (para Recent Movements)
  console.log('🔧 Creando interacciones...');

  // Get all operaciones for interactions
  const allOps = await prisma.operacion.findMany({
    where: { deleted_at: null },
    include: { alquiler: true, venta: true },
    orderBy: { fecha_constitucion: 'desc' },
    take: 20,
  });

  for (let i = 0; i < Math.min(12, allOps.length); i++) {
    const op = allOps[i];
    const empleado = pick(empleadoUsuarios);

    let tipo = 'OTRA';
    if (op.alquiler) {
      if (op.alquiler.etapa === 'RETIRADO') tipo = 'RETIRO';
      if (op.alquiler.etapa === 'DEVUELTO') tipo = 'DEVOLUCION';
      if (op.alquiler.etapa === 'LISTO_PARA_RETIRO') tipo = 'OTRA';
      if (op.alquiler.etapa === 'RESERVADO') tipo = 'OTRA';
    }
    if (op.venta) tipo = 'OTRA';

    await prisma.interaccionOperacion.create({
      data: {
        id_usuario: empleado.id_usuario,
        id_persona: empleado.id_persona,
        id_operacion: op.id_operacion,
        tipo,
        fecha_hora: minutesAgo(rand(2, 300)),
        observaciones: tipo === 'RETIRO'
          ? 'Cliente retiró el disfraz'
          : tipo === 'DEVOLUCION'
            ? 'Disfraz devuelto en buenas condiciones'
            : 'Operación procesada',
      },
    });
  }
  console.log('  ✅ Interacciones creadas');

  // 10. Additional payments for today (for Cash Flow Today)
  console.log('🔧 Creando pagos del día...');
  const todayOps = allOps.slice(0, 6);
  for (const op of todayOps) {
    const empleado = pick(empleadoUsuarios);
    await prisma.pagoOperacion.create({
      data: {
        id_operacion: op.id_operacion,
        id_persona: empleado.id_persona,
        tipo: pick(['SENA', 'SALDO']),
        metodo: pick(['EFECTIVO', 'TRANSFERENCIA']),
        monto: rand(100, 800),
        fecha: hoursAgo(rand(0, 8)),
      },
    });
  }
  console.log('  ✅ Pagos del día creados');

  // 11. Last month payments (for Monthly Revenue comparison)
  console.log('🔧 Creando pagos del mes anterior...');
  const lastMonthOps = allOps.slice(0, 10);
  for (const op of lastMonthOps) {
    const empleado = pick(empleadoUsuarios);
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    lastMonth.setDate(rand(1, 28));
    await prisma.pagoOperacion.create({
      data: {
        id_operacion: op.id_operacion,
        id_persona: empleado.id_persona,
        tipo: pick(['SENA', 'SALDO', 'DEPOSITO']),
        metodo: pick(['EFECTIVO', 'TRANSFERENCIA']),
        monto: rand(200, 1200),
        fecha: lastMonth,
      },
    });
  }
  console.log('  ✅ Pagos del mes pasado creados');

  console.log('\n🚀 ¡Seed completo! Ingresá con: admin@disfracesly.com / admin123');
}

main()
  .catch((e) => {
    console.error('❌ Error en el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });