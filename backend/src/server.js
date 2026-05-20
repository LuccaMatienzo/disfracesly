require('dotenv').config();
const app = require('./app');
const { prisma } = require('./config/database');
const { env } = require('./config/env');

/**
 * Inicia el servidor HTTP de la aplicación Disfracesly.
 *
 * Establece la conexión con la base de datos PostgreSQL a través de Prisma,
 * levanta el servidor en el puerto configurado por la variable de entorno PORT
 * y registra los manejadores de señales del sistema operativo para permitir
 * un apagado ordenado (graceful shutdown) ante SIGTERM o SIGINT.
 *
 * @async
 * @returns {Promise<void>}
 */
async function main() {
  try {
    await prisma.$connect();
    console.log('[Server] Conexion establecida con PostgreSQL (schema: gestion).');

    const server = app.listen(env.PORT, () => {
      console.log(`[Server] Disfracesly API escuchando en http://localhost:${env.PORT}`);
      console.log(`[Server] Ambiente: ${env.NODE_ENV}`);
      console.log(`[Server] Health check disponible en http://localhost:${env.PORT}/api/health`);
    });

    /**
     * Ejecuta el apagado ordenado del servidor ante una señal del SO.
     * Cierra el servidor HTTP, desconecta Prisma y termina el proceso con
     * código de salida 0 (exitoso).
     *
     * @async
     * @param {string} signal - Nombre de la señal recibida (p. ej. 'SIGTERM', 'SIGINT').
     * @returns {Promise<void>}
     */
    const shutdown = async (signal) => {
      console.log(`[Server] Senal ${signal} recibida. Iniciando apagado ordenado...`);
      server.close(async () => {
        await prisma.$disconnect();
        console.log('[Server] Servidor cerrado correctamente. Proceso terminado.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT',  () => shutdown('SIGINT'));

  } catch (error) {
    console.error('[Server] Error fatal durante el arranque del servidor:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

main();
