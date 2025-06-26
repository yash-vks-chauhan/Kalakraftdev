// scripts/test-login.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function testLogin(email, password) {
  try {
    console.log(`Testing login for email: ${email}`);
    
    // Find the user
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        passwordHash: true
      }
    });
    
    if (!user) {
      console.log('User not found in database');
      return;
    }
    
    console.log(`User found: ${user.email}`);
    
    // Check password
    if (!user.passwordHash || typeof user.passwordHash !== 'string') {
      console.log('Password hash is invalid or missing');
      return;
    }
    
    try {
      const isValid = await bcrypt.compare(password, user.passwordHash);
      console.log(`Password valid: ${isValid}`);
      
      if (!isValid) {
        // If the password is wrong, let's check if it's the default password
        const isDefaultValid = await bcrypt.compare('password123', user.passwordHash);
        console.log(`Default password (password123) valid: ${isDefaultValid}`);
      }
    } catch (err) {
      console.error('Error comparing passwords:', err);
    }
    
  } catch (error) {
    console.error('Error testing login:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Get email and password from command line arguments
const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.log('Usage: node scripts/test-login.js <email> <password>');
} else {
  testLogin(email, password);
} 