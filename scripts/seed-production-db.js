const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function seedDatabase() {
  try {
    console.log('Starting database seeding...');

    // Create admin user
    const adminEmail = 'yash.vks.chauhan@gmail.com';
    const adminId = 'OKIenNdeFCMlqvmx4wPeRRY0iRs2'; // Replace with your Firebase UID if different

    console.log(`Creating admin user: ${adminEmail}`);
    
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: adminEmail }
    });

    if (!existingUser) {
      await prisma.user.create({
        data: {
          id: adminId,
          email: adminEmail,
          fullName: 'Yash Chauhan',
          role: 'admin',
          avatarUrl: '/avatars/fox.svg'
        }
      });
      console.log('Admin user created successfully');
    } else {
      await prisma.user.update({
        where: { email: adminEmail },
        data: { role: 'admin' }
      });
      console.log('Admin user role updated successfully');
    }

    // Create categories
    console.log('Creating categories...');
    const categories = [
      { name: 'Vases', description: 'Beautiful handcrafted vases', imageUrl: '/images/vases.png' },
      { name: 'Trays', description: 'Elegant serving trays', imageUrl: '/images/trayscollection.png' },
      { name: 'Wall Art', description: 'Stunning wall decorations', imageUrl: '/images/imageclock.png' },
      { name: 'Clocks', description: 'Handmade artistic clocks', imageUrl: '/images/imagecollection1.png' }
    ];

    for (const category of categories) {
      const existingCategory = await prisma.category.findFirst({
        where: { name: category.name }
      });

      if (!existingCategory) {
        await prisma.category.create({
          data: category
        });
      }
    }
    console.log('Categories created successfully');

    // Create sample products
    console.log('Creating sample products...');
    const sampleProducts = [
      {
        name: 'Handcrafted Ceramic Vase',
        description: 'Beautiful handcrafted ceramic vase with intricate designs',
        price: 4999, // $49.99
        images: ['/images/DSC01322.JPG', '/images/DSC01327.JPG'],
        stock: 10,
        categoryName: 'Vases',
        featured: true
      },
      {
        name: 'Wooden Serving Tray',
        description: 'Elegant wooden serving tray with handles',
        price: 3499, // $34.99
        images: ['/images/DSC01336.JPG', '/images/DSC01340.JPG'],
        stock: 15,
        categoryName: 'Trays',
        featured: true
      },
      {
        name: 'Decorative Wall Clock',
        description: 'Artistic wall clock with handpainted details',
        price: 7999, // $79.99
        images: ['/images/DSC01344.JPG', '/images/DSC01362.JPG'],
        stock: 5,
        categoryName: 'Clocks',
        featured: false
      },
      {
        name: 'Abstract Wall Art',
        description: 'Modern abstract wall art piece for home decoration',
        price: 12999, // $129.99
        images: ['/images/DSC01366.JPG', '/images/DSC01373.JPG'],
        stock: 3,
        categoryName: 'Wall Art',
        featured: true
      }
    ];

    for (const product of sampleProducts) {
      const existingProduct = await prisma.product.findFirst({
        where: { name: product.name }
      });

      if (!existingProduct) {
        // Get category
        const category = await prisma.category.findFirst({
          where: { name: product.categoryName }
        });

        if (category) {
          await prisma.product.create({
            data: {
              name: product.name,
              description: product.description,
              price: product.price,
              images: product.images,
              stock: product.stock,
              categoryId: category.id,
              featured: product.featured
            }
          });
        }
      }
    }
    console.log('Sample products created successfully');

    console.log('Database seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedDatabase(); 