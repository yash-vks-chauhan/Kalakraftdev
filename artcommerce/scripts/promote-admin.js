import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  await prisma.user.update({
    where: { email: 'yash.vks.chauhan@gmail.com' },
    data:  { role: 'admin' },
  })
  console.log('Promoted to admin!')
}

main().finally(() => prisma.$disconnect())