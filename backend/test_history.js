const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const stockService = require('./src/modules/stock/stock.service.js');
const { getOperacionById } = require('./src/modules/operaciones/operaciones.service.js');

async function main() {
  try {
    // 1. Give logical delete to piece 83
    await stockService.deleteStock(83n);
    console.log("Piece 83 deleted.");
    
    // 2. Fetch the operation that had piece 83 (it was operation 46)
    const op = await getOperacionById(46n);
    console.log("Fetched Operacion 46. Detalles count:", op.detalles.length);
    const hasPiece83 = op.detalles.some(d => d.piezaStock && d.piezaStock.id_pieza_stock === 83n);
    console.log("Does the operation still include Piece 83 data?", hasPiece83);
    if(hasPiece83) {
      const p = op.detalles.find(d => d.piezaStock.id_pieza_stock === 83n).piezaStock;
      console.log("Piece deleted_at:", p.deleted_at);
    }
    
    // 3. Restore
    await prisma.piezaStock.update({ where: { id_pieza_stock: 83n }, data: { deleted_at: null } });
    console.log("Piece restored.");
  } catch (error) {
    console.error("Error:", error);
  }
}

main().finally(() => prisma.$disconnect());
