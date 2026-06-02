const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const result = await prisma.$queryRaw`SELECT viewname, definition FROM pg_views WHERE schemaname = 'gestion'`;
  console.log(JSON.stringify(result, null, 2));
  await prisma.$disconnect();
}
main();
