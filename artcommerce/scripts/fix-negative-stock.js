// File: scripts/fix-negative-stock.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixNegativeStock() {
  try {
    console.log('Finding products with negative stock...');
    
    // Find all products with negative stock
    const negativeStockProducts = await prisma.product.findMany({
      where: {
        stockQuantity: {
          lt: 0
        }
      }
    });
    
    console.log(`Found ${negativeStockProducts.length} products with negative stock:`);
    console.log(negativeStockProducts.map(p => ({ id: p.id, name: p.name, stock: p.stockQuantity })));
    
    if (negativeStockProducts.length > 0) {
      // Update all products with negative stock to have 0 stock
      const updateResult = await prisma.product.updateMany({
        where: {
          stockQuantity: {
            lt: 0
          }
        },
        data: {
          stockQuantity: 0
        }
      });
      
      console.log(`Updated ${updateResult.count} products to have 0 stock.`);
      
      // Verify the update
      const verifyProducts = await prisma.product.findMany({
        where: {
          id: {
            in: negativeStockProducts.map(p => p.id)
          }
        }
      });
      
      console.log('Updated products:');
      console.log(verifyProducts.map(p => ({ id: p.id, name: p.name, stock: p.stockQuantity })));
    }
    
    console.log('Stock correction completed successfully.');
  } catch (error) {
    console.error('Error fixing negative stock:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixNegativeStock(); 