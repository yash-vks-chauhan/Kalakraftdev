// lib/prisma.ts
import { PrismaClient } from '@prisma/client'

declare global {
  // Prevent multiple instances in dev
  var prisma: PrismaClient | undefined
}

const prismaClientSingleton = () => {
  try {
    return new PrismaClient({
      log: ['error', 'warn'],
      errorFormat: 'pretty',
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      }
    })
  } catch (error) {
    console.error('Failed to initialize Prisma client:', error)
    return new PrismaClient()
  }
}

const prisma = global.prisma || prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') global.prisma = prisma

export default prisma
