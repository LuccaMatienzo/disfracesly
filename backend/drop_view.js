const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  await prisma.$executeRawUnsafe(`DROP VIEW IF EXISTS gestion.v_active_operations_details CASCADE;`);
  console.log('View dropped');
  await prisma.$disconnect();
}
main();
