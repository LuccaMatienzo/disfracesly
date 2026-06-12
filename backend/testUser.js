const { prisma } = require('./src/config/database');
const bcrypt = require('bcryptjs');

async function main() {
  let user = await prisma.usuario.findFirst({ include: { persona: true } });
  if (user) {
    console.log(`Usuario encontrado: ${user.correo}`);
    // Vamos a forzar la contraseña a "123456" para pruebas
    const hash = await bcrypt.hash('123456', 12);
    await prisma.usuario.update({
      where: { id_usuario: user.id_usuario },
      data: { contrasena: hash }
    });
    console.log(`Contraseña de ${user.correo} actualizada a "123456"`);
  } else {
    console.log("No se encontraron usuarios.");
  }
  process.exit(0);
}

main().catch(console.error);
