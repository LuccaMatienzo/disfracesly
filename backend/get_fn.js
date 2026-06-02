const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.$queryRawUnsafe(`SELECT pg_get_functiondef(oid) FROM pg_proc WHERE proname = 'fn_obtener_estado_financiero';`);
  console.log(result[0].pg_get_functiondef);
}
main().catch(console.error).finally(() => prisma.$disconnect());
