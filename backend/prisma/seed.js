const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
    const passwordHasheada = await bcrypt.hash('admin123', 10);

    console.log('🌱 Iniciando siembra de datos...');

    // 1. Crear el Rol
    const rolAdmin = await prisma.rol.upsert({
        where: { nombre: 'ADMIN' },
        update: {},
        create: {
            nombre: 'ADMIN',
            descripcion: 'Administrador total del sistema'
        }
    });
    console.log('✅ Rol verificado/creado');

    // 2. Crear la Persona (Cambiado 'dni' por 'documento')
    const personaAdmin = await prisma.persona.upsert({
        where: { documento: '12345678' }, // Usamos el nombre exacto del esquema
        update: {},
        create: {
            nombre: 'Admin',
            apellido: 'Disfracesly',
            documento: '12345678'       // Usamos el nombre exacto del esquema
        }
    });
    console.log('✅ Persona verificada/creada');

    // 3. Crear el Usuario
    const admin = await prisma.usuario.upsert({
        where: { correo: 'admin@disfracesly.com' },
        update: {},
        create: {
            correo: 'admin@disfracesly.com',
            contrasena: passwordHasheada,
            id_persona: personaAdmin.id_persona,
            id_rol: rolAdmin.id_rol
        },
    });

    console.log('🚀 ¡Listo! Ingresá con:', admin.correo);
}

main()
    .catch((e) => {
        console.error('❌ Error en el seed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });