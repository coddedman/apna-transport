import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function checkUser() {
  const users = await prisma.user.findMany()
  console.log('Users in DB:', JSON.stringify(users, null, 2))
  await prisma.$disconnect()
}

checkUser()
