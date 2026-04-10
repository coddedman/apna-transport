import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const email = process.argv[2]
  const password = process.argv[3]

  if (!email || !password) {
    console.error('❌ Usage: npx tsx scripts/create-super-admin.ts <email> <password>')
    process.exit(1)
  }

  console.log(`🔍 Checking if SUPER_ADMIN already exists...`)
  const existingAdmin = await prisma.user.findFirst({
    where: { role: 'SUPER_ADMIN' },
  })

  if (existingAdmin) {
    console.error('❌ A Platform Owner (SUPER_ADMIN) already exists in the database.')
    process.exit(1)
  }

  console.log(`🔐 Hashing password and creating SUPER_ADMIN account...`)
  const hashedPassword = await bcrypt.hash(password, 10)

  const superAdmin = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      role: 'SUPER_ADMIN',
      transporterId: null, // Super Admin is not tied to a specific transporter
    },
  })

  console.log(`✅ Success! Platform Owner created.`)
  console.log(`   Email: ${superAdmin.email}`)
}

main()
  .catch((e) => {
    console.error('❌ Error creating Super Admin:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
