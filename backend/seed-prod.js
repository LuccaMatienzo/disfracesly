const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando siembra de datos para PRODUCCIÓN...');

  const passwordHasheada = await bcrypt.hash('240721_Nala', 10);

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
  console.log('✅ Roles (ADMIN, EMPLEADO) creados');

  // 2. Persona Lucca
  const personaAdmin = await prisma.persona.upsert({
    where: { documento: '43706987' },
    update: {},
    create: { nombre: 'Lucca Nicolás', apellido: 'Matienzo', documento: '43706987' },
  });

  // 3. Usuario Lucca
  await prisma.usuario.upsert({
    where: { correo: '12matienzo@gmail.com' },
    update: { contrasena: passwordHasheada },
    create: {
      correo: '12matienzo@gmail.com',
      contrasena: passwordHasheada,
      id_persona: personaAdmin.id_persona,
      id_rol: rolAdmin.id_rol,
    },
  });
  
  console.log('✅ Usuario Administrador Lucca Matienzo creado exitosamente');
  console.log('🚀 Base de datos inicializada y lista para usar.');
}

main()
  .catch((e) => {
    console.error('❌ Error en el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
