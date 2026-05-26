const { z } = require('zod');
require('dotenv').config();

/**
 * @module config/env
 * @description Valida y exporta las variables de entorno de la aplicación
 * usando un schema Zod. Si alguna variable requerida está ausente o es inválida,
 * el proceso termina inmediatamente con código de salida 1 (fail-fast).
 */

/**
 * Schema de validación de variables de entorno.
 * Las variables opcionales tienen valores por defecto seguros para desarrollo.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z
    .string()
    .default('5000')
    .transform((v) => parseInt(v, 10)),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL es requerida'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET debe tener al menos 32 caracteres'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  FRONTEND_URL: z.string().default('http://localhost:3000'),
  UPLOAD_DIR: z.string().default('uploads'),
  MAX_FILE_SIZE: z
    .string()
    .default('5242880')
    .transform((v) => parseInt(v, 10)), // 5 MB por defecto
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('[Config] Error en la validacion de variables de entorno:');
  const errors = parsed.error.format();
  Object.entries(errors).forEach(([key, val]) => {
    if (key !== '_errors') {
      console.error(`  [Config]   ${key}: ${val._errors.join(', ')}`);
    }
  });
  console.error('[Config] Asegurese de tener un archivo .env valido en la raiz del proyecto.');
  process.exit(1);
}

/** @type {z.infer<typeof envSchema>} Variables de entorno validadas y tipadas */
const env = parsed.data;

module.exports = { env };
