// Check existing trips by invoice number to see what's already there
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Get project rates
  const project = await prisma.project.findUnique({
    where: { id: 'cmnu4rlue0001ic047ys9jae2' }
  })
  console.log(`Project: ${project?.projectName}, PartyRate: ${project?.partyRate}, OwnerRate: ${project?.ownerRate}`)

  // Get all existing trips for these vehicles in the date range
  const existingTrips = await prisma.trip.findMany({
    where: {
      vehicle: {
        plateNo: {
          in: ['BR01GN0351', 'BR01GN4328', 'JH13J9407']
        }
      },
      date: {
        gte: new Date('2026-05-16'),
        lte: new Date('2026-05-31T23:59:59')
      }
    },
    include: {
      vehicle: { select: { plateNo: true } }
    },
    orderBy: [
      { vehicle: { plateNo: 'asc' } },
      { date: 'asc' }
    ]
  })

  console.log(`\nTotal existing trips: ${existingTrips.length}`)
  
  // Group by vehicle
  const byVehicle: Record<string, typeof existingTrips> = {}
  for (const t of existingTrips) {
    const plate = t.vehicle.plateNo
    if (!byVehicle[plate]) byVehicle[plate] = []
    byVehicle[plate].push(t)
  }

  for (const [plate, trips] of Object.entries(byVehicle)) {
    console.log(`\n=== ${plate}: ${trips.length} trips ===`)
    for (const t of trips) {
      console.log(`  ${t.date.toISOString().slice(0,10)} | Invoice: ${t.invoiceNo || 'N/A'} | LR: ${t.lrNo || 'N/A'} | Weight: ${t.weight} | ID: ${t.id}`)
    }
  }

  // List the invoices from the user data that we need to insert
  const allInvoices = [
    // BR01GN0351 (44 trips)
    'TRIP-0527006','TRIP-0527155','TRIP-0527364','TRIP-0528018','TRIP-0527511','TRIP-0527730','TRIP-0527851',
    'TRIP-0528165','TRIP-0528340','TRIP-0528465','TRIP-0528666','TRIP-0529182','TRIP-0529369','TRIP-0529589',
    'TRIP-0530277','TRIP-0530432','TRIP-0530712','TRIP-0530805','TRIP-0531025','TRIP-0531193','TRIP-0531414',
    'TRIP-0531764','TRIP-0531822','TRIP-0532060','TRIP-0532222','TRIP-0532486','TRIP-0532725','TRIP-0532920',
    'TRIP-0533127','TRIP-0533388','TRIP-0533787','TRIP-0534048','TRIP-0533577','TRIP-0534594','TRIP-0534218',
    'TRIP-0534435','TRIP-0535312','TRIP-0535105','TRIP-0534903','TRIP-0535582','TRIP-0535704','TRIP-0536092',
    'TRIP-0536270','TRIP-0536522',
    // BR01GN4328 (27 trips) — partial data shown but user said 27 trips total
    'TRIP-0526811','TRIP-0526980','TRIP-0527256','TRIP-0527474','TRIP-0527655','TRIP-0527837',
    'TRIP-0528694','TRIP-0528870','TRIP-0529065','TRIP-0529193','TRIP-0529364',
    // JH13J9407 (41 trips) — partial data shown
    'TRIP-0532720','TRIP-0532923','TRIP-0533147','TRIP-0533786','TRIP-0534041','TRIP-0533401','TRIP-0533596',
    'TRIP-0534197','TRIP-0534334','TRIP-0534513','TRIP-0535032','TRIP-0535306','TRIP-0534845','TRIP-0535598',
    'TRIP-0535794','TRIP-0536158','TRIP-0536530',
  ]

  // Check which invoices already exist
  const existing = existingTrips.map(t => t.invoiceNo).filter(Boolean)
  const newInvoices = allInvoices.filter(inv => !existing.includes(inv))
  const existingMatches = allInvoices.filter(inv => existing.includes(inv))

  console.log(`\n=== MATCH ANALYSIS ===`)
  console.log(`Invoices in user data: ${allInvoices.length}`)
  console.log(`Already exist in DB: ${existingMatches.length}`)
  console.log(`New to insert: ${newInvoices.length}`)
  console.log(`Existing invoices that match:`, existingMatches)
  console.log(`New invoices to insert:`, newInvoices)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
