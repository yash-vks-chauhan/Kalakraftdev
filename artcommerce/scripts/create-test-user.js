const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    // Check if user already exists
    const email = 'test@example.com';
    const existingUser = await prisma.user.findUnique({ where: { email } });
    
    if (existingUser) {
      console.log('Test user already exists');
      return;
    }
    
    // Create a new user with hashed password
    const passwordHash = await bcrypt.hash('password123', 10);
    
    const user = await prisma.user.create({
      data: {
        fullName: 'Test User',
        email,
        passwordHash,
        role: 'user'
      }
    });
    
    console.log('Test user created successfully:', user);
  } catch (error) {
    console.error('Error creating test user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser(); 