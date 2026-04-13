const { PrismaClient } = require('@prisma/client');
const { env } = require('./env');

// Singleton de Prisma Client
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

// Log de queries en desarrollo (útil para debugging)
if (env.NODE_ENV === 'development') {
  prisma.$on('query', (e) => {
    if (process.env.LOG_QUERIES === 'true') {
      console.log(`Query: ${e.query}`);
      console.log(`Params: ${e.params}`);
      console.log(`Duration: ${e.duration}ms`);
    }
  });
}

module.exports = { prisma };
