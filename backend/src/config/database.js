/**
 * @module config/database
 * @description Instancia singleton de Prisma Client compartida por toda la aplicación.
 * En desarrollo, habilita el logging de queries solo cuando LOG_QUERIES=true en el entorno,
 * lo que permite activar/desactivar el nivel de detalle sin reiniciar el servidor.
 */
const { PrismaClient } = require('@prisma/client');
const { env } = require('./env');

/**
 * Instancia única de Prisma Client (Singleton).
 * El nivel de log varía según el entorno: en desarrollo emite eventos de query;
 * en producción solo registra errores para minimizar el ruido en los logs.
 */
const prisma = new PrismaClient({
  log:
    env.NODE_ENV === 'development'
      ? [
          { emit: 'event', level: 'query' },
          { emit: 'stdout', level: 'info' },
          { emit: 'stdout', level: 'warn' },
          { emit: 'stdout', level: 'error' },
        ]
      : [{ emit: 'stdout', level: 'error' }],
});

// El log de queries en desarrollo está tras la variable LOG_QUERIES para
// evitar saturar la consola durante el desarrollo normal.
if (env.NODE_ENV === 'development') {
  prisma.$on('query', (e) => {
    if (process.env.LOG_QUERIES === 'true') {
      console.log(`[Prisma] Query: ${e.query}`);
      console.log(`[Prisma] Params: ${e.params}`);
      console.log(`[Prisma] Duration: ${e.duration}ms`);
    }
  });
}

module.exports = { prisma };
