const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const result = await prisma.$queryRaw`SELECT definition FROM pg_views WHERE viewname = 'v_active_operations_details'`;
  console.log(result);
  await prisma.$disconnect();
}
main();
