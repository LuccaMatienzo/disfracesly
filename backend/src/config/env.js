const { z } = require('zod');
require('dotenv').config();

// Schema de validación de variables de entorno
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
  console.error('\n❌ Error en variables de entorno:');
  const errors = parsed.error.format();
  Object.entries(errors).forEach(([key, val]) => {
    if (key !== '_errors') {
      console.error(`  • ${key}: ${val._errors.join(', ')}`);
    }
  });
  console.error('\n💡 Asegurate de tener un archivo .env en la raíz del proyecto.');
  process.exit(1);
}

const env = parsed.data;

module.exports = { env };
