import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database (PostgreSQL)...')
  
  // Create test transporter
  const transporter = await prisma.transporter.upsert({
    where: { id: 'test-transporter-1' },
    update: {},
    create: {
      id: 'test-transporter-1',
      name: 'Hyva Transport Pvt. Ltd.',
      registration: 'GST1234567890',
    },
  })
  console.log('✅ Transporter:', transporter.name)

  // Create SUPER_ADMIN user (Platform Owner)
  const superAdminPassword = await bcrypt.hash('SuperAdmin@123', 10)
  const superAdmin = await prisma.user.upsert({
    where: { email: 'super@hyvatransport.com' },
    update: { password: superAdminPassword },
    create: {
      email: 'super@hyvatransport.com',
      password: superAdminPassword,
      role: 'SUPER_ADMIN',
      // SUPER_ADMIN doesn't belong to a specific transporter
      transporterId: null,
    },
  })
  console.log('✅ Super Admin:', superAdmin.email)

  // Create admin user
  const hashedPassword = await bcrypt.hash('Admin@123', 10)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@hyvatransport.com' },
    update: { password: hashedPassword },
    create: {
      email: 'admin@hyvatransport.com',
      password: hashedPassword,
      role: 'ORG_ADMIN',
      transporterId: transporter.id,
    },
  })
  console.log('✅ Admin user:', admin.email)

  // Create a field manager
  const managerPassword = await bcrypt.hash('Manager@123', 10)
  const manager = await prisma.user.upsert({
    where: { email: 'manager@hyvatransport.com' },
    update: { password: managerPassword },
    create: {
      email: 'manager@hyvatransport.com',
      password: managerPassword,
      role: 'FIELD_MANAGER',
      transporterId: transporter.id,
    },
  })
  console.log('✅ Field Manager:', manager.email)

  console.log('\n🎉 Seeding complete!')
  console.log('   Platform Owner: super@hyvatransport.com / SuperAdmin@123')
  console.log('   Transporter Admin: admin@hyvatransport.com / Admin@123')
  console.log('   Field Manager: manager@hyvatransport.com / Manager@123')
  
  await prisma.$disconnect()
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e)
    process.exit(1)
  })
