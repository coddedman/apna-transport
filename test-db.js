const { PrismaClient } = require('@prisma/client')
// No params, no adapter. Rely on prisma.config.ts which we know works for db push.
const prisma = new PrismaClient()

async function main() {
  console.log('Testing connection...')
  const users = await prisma.user.findMany()
  console.log('Users found:', users.length)
}

main().catch(console.error).finally(() => prisma.$disconnect())
