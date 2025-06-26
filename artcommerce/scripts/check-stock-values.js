// File: scripts/check-stock-values.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * This script checks for negative stock values and fixes them by setting them to 0.
 * It can be run periodically using a cron job or similar scheduling mechanism.
 */
async function checkAndFixStockValues() {
  try {
    console.log('Checking for negative stock values...');
    
    // Find all products with negative stock
    const negativeStockProducts = await prisma.product.findMany({
      where: {
        stockQuantity: {
          lt: 0
        }
      }
    });
    
    if (negativeStockProducts.length === 0) {
      console.log('No products with negative stock found. All good!');
      return;
    }
    
    console.log(`Found ${negativeStockProducts.length} products with negative stock:`);
    console.log(negativeStockProducts.map(p => ({ id: p.id, name: p.name, stock: p.stockQuantity })));
    
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
    
  } catch (error) {
    console.error('Error checking and fixing stock values:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
checkAndFixStockValues();

/**
 * To run this script periodically, you can set up a cron job like:
 * 
 * For Linux/Mac:
 * 0 0 * * * cd /path/to/artcommerce && node scripts/check-stock-values.js >> logs/stock-check.log 2>&1
 * 
 * This will run the script daily at midnight and log the output to logs/stock-check.log
 */ 