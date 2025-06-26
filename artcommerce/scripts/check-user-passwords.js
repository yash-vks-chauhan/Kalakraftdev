// scripts/check-user-passwords.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUserPasswords() {
  try {
    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        passwordHash: true
      }
    });
    
    console.log(`Found ${users.length} users in the database`);
    
    // Process each user
    for (const user of users) {
      console.log(`User: ${user.email}`);
      console.log(`  ID: ${user.id}`);
      
      if (!user.passwordHash) {
        console.log('  Password Hash: NULL');
      } else if (typeof user.passwordHash !== 'string') {
        console.log(`  Password Hash: INVALID TYPE (${typeof user.passwordHash})`);
        console.log(`  Value: ${JSON.stringify(user.passwordHash)}`);
      } else {
        // Only show first few characters of the hash for security
        const hashPreview = user.passwordHash.substring(0, 20) + '...';
        console.log(`  Password Hash: ${hashPreview}`);
        console.log(`  Valid bcrypt format: ${user.passwordHash.startsWith('$2')}`);
      }
      console.log('-------------------');
    }
    
  } catch (error) {
    console.error('Error checking user passwords:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserPasswords();