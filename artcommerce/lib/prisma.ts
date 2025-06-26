// lib/prisma.ts
import { PrismaClient } from '@prisma/client'

declare global {
  // Prevent multiple instances in dev
  var prisma: PrismaClient | undefined
}

// Add better error handling and logging for database connection
const prismaClientSingleton = () => {
  try {
    console.log('Initializing Prisma client with DATABASE_URL:', 
      process.env.DATABASE_URL ? `${process.env.DATABASE_URL.substring(0, 15)}...` : 'undefined');
    
    return new PrismaClient({
      log: ['error', 'warn'],
      errorFormat: 'pretty',
    })
  } catch (error) {
    console.error('Failed to initialize Prisma client:', error);
    // Return a minimal client that will throw clear errors when used
    return new PrismaClient();
  }
}

const prisma = global.prisma || prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') global.prisma = prisma

export default prisma