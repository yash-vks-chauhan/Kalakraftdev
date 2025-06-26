require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const product = await prisma.product.create({
    data: {
      name: 'Ocean Whimsy Resin Wall Clock',
      slug: 'wall-clock-product',
      description: 'Bring the beauty of the ocean to your wall with this handcrafted clock.',
      shortDesc: 'A charming resin clock',
      price: 799,
      currency: 'INR',
      imageUrls: ['/images/DSC01393.JPG'],
      stockQuantity: 10,
      isActive: true,
      category: { connect: { id: 1 } },
    },
  });

  console.log('✅ Product created:', product);
}

main()
  .catch((e) => {
    console.error('❌ Failed to create product:', e);
  })
  .finally(() => prisma.$disconnect());