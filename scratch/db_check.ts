import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('--- Database Summary ---')
  
  const tables = [
    'transporter',
    'user',
    'project',
    'owner',
    'vehicle',
    'trip',
    'expense',
    'settlement',
    'ownerAdvance'
  ]

  for (const table of tables) {
    try {
      // @ts-ignore
      const count = await prisma[table].count()
      console.log(`${table}: ${count} rows`)
    } catch (e) {
      console.log(`${table}: Error or not found`)
    }
  }

  console.log('\n--- Recent Trips (if any) ---')
  const trips = await prisma.trip.findMany({
    take: 5,
    orderBy: { date: 'desc' },
    include: {
      vehicle: true,
      project: true
    }
  })
  console.log(JSON.stringify(trips, null, 2))

  console.log('\n--- Schema Changes (Inferred from schema.prisma) ---')
  console.log('- Added invoiceNo and lrNo to Trip model.')
  console.log('- Added ownerRate, partyRate, ownerFreightAmount, partyFreightAmount to Trip model.')
  console.log('- Settlement model implemented with status (PENDING/SETTLED).')
  console.log('- Multi-tenant structure with Transporter model.')

  await prisma.$disconnect()
}

main()
