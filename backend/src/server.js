require('dotenv').config();
const app = require('./app');
const { prisma } = require('./config/database');
const { env } = require('./config/env');

async function main() {
  try {
    await prisma.$connect();
    console.log('✅ Conectado a PostgreSQL (schema: gestion)');

    const server = app.listen(env.PORT, () => {
      console.log(`🚀 Disfracesly API corriendo en http://localhost:${env.PORT}`);
      console.log(`📄 Ambiente: ${env.NODE_ENV}`);
      console.log(`🔗 Health check: http://localhost:${env.PORT}/api/health`);
    });

    // Graceful shutdown
    const shutdown = async (signal) => {
      console.log(`\n⚠️  ${signal} recibido. Cerrando servidor...`);
      server.close(async () => {
        await prisma.$disconnect();
        console.log('✅ Servidor cerrado limpiamente.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    console.error('❌ Error fatal al iniciar el servidor:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

main();
