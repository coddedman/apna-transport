import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'

const connectionString =
  process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL || ''
const adapter = new PrismaPg(connectionString)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Seeding database...')

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

  // Create sample owners
  const ownerData = [
    { ownerName: 'Ramesh Kumar', phone: '9876543210' },
    { ownerName: 'Suresh Yadav', phone: '9876543211' },
    { ownerName: 'Mahesh Singh', phone: '9876543212' },
  ]

  for (const o of ownerData) {
    const owner = await prisma.owner.create({
      data: { ...o, transporterId: transporter.id },
    })

    // Create 2 vehicles per owner
    const plates = [
      `HR-55-${owner.ownerName.charAt(0)}${owner.ownerName.charAt(owner.ownerName.length - 1)}-${Math.floor(1000 + Math.random() * 9000)}`,
      `DL-01-${owner.ownerName.charAt(0)}${owner.ownerName.charAt(owner.ownerName.length - 1)}-${Math.floor(1000 + Math.random() * 9000)}`,
    ]

    for (const plateNo of plates) {
      await prisma.vehicle.create({
        data: { plateNo, ownerId: owner.id },
      })
    }
    console.log(`✅ Owner: ${owner.ownerName} (2 vehicles)`)
  }

  // Create sample projects
  const projects = [
    { projectName: 'Manesar Bypass', location: 'Manesar, Haryana' },
    { projectName: 'Gurugram Metro Phase-3', location: 'Gurugram, Haryana' },
    { projectName: 'Dwarka Expressway', location: 'Delhi-Gurugram' },
    { projectName: 'Kundli-Sonipat Highway', location: 'Sonipat, Haryana' },
  ]

  for (const p of projects) {
    await prisma.project.create({
      data: { ...p, transporterId: transporter.id },
    })
    console.log(`✅ Project: ${p.projectName}`)
  }

  console.log('\n🎉 Seeding complete!')
  console.log('   Login with: admin@hyvatransport.com / Admin@123')
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
