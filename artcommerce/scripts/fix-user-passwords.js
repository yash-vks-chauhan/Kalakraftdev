const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function fixUserPasswords() {
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
    
    let fixedCount = 0;
    
    // Process each user
    for (const user of users) {
      // Skip users that already have a valid password hash
      if (user.passwordHash && typeof user.passwordHash === 'string' && user.passwordHash.startsWith('$2')) {
        console.log(`User ${user.email} already has a valid bcrypt hash`);
        continue;
      }
      
      // Create a default password based on their email
      const defaultPassword = 'password123';
      const newPasswordHash = await bcrypt.hash(defaultPassword, 10);
      
      // Update the user
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: newPasswordHash }
      });
      
      console.log(`Fixed password for user: ${user.email}`);
      fixedCount++;
    }
    
    console.log(`Fixed passwords for ${fixedCount} users`);
    console.log('Default password set to: password123');
    
  } catch (error) {
    console.error('Error fixing user passwords:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixUserPasswords(); 