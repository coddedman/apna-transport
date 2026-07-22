// Insert 110 June 1-15, 2026 trips into production DB
// Uses REC WT for weight column
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const rawTrips: { date: string; vehicleNo: string; invoiceNo: string; lrNo: string; recWt: number }[] = [
  { date: '2026-06-01', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0248705', lrNo: 'TRIP-0248705', recWt: 41.13 },
  { date: '2026-06-01', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0248713', lrNo: 'TRIP-0248713', recWt: 43.25 },
  { date: '2026-06-01', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0248758', lrNo: 'TRIP-0248758', recWt: 44.30 },
  { date: '2026-06-01', vehicleNo: 'BR01GN4328', invoiceNo: 'TRIP-0248743', lrNo: 'TRIP-0248743', recWt: 43.85 },
  { date: '2026-06-01', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0248784', lrNo: 'TRIP-0248784', recWt: 43.57 },
  { date: '2026-06-01', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0248788', lrNo: 'TRIP-0248788', recWt: 44.19 },
  { date: '2026-06-01', vehicleNo: 'BR01GN4328', invoiceNo: 'TRIP-0248796', lrNo: 'TRIP-0248796', recWt: 43.63 },
  { date: '2026-06-01', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0248813', lrNo: 'TRIP-0248813', recWt: 41.55 },
  { date: '2026-06-02', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0248843', lrNo: 'TRIP-0248843', recWt: 39.06 },
  { date: '2026-06-02', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0248883', lrNo: 'TRIP-0248883', recWt: 43.22 },
  { date: '2026-06-02', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0248936', lrNo: 'TRIP-0248936', recWt: 42.09 },
  { date: '2026-06-02', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0248935', lrNo: 'TRIP-0248935', recWt: 38.41 },
  { date: '2026-06-02', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0248980', lrNo: 'TRIP-0248980', recWt: 43.47 },
  { date: '2026-06-02', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0248979', lrNo: 'TRIP-0248979', recWt: 46.02 },
  { date: '2026-06-02', vehicleNo: 'BR01GN4328', invoiceNo: 'TRIP-0248981', lrNo: 'TRIP-0248981', recWt: 44.19 },
  { date: '2026-06-03', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0249016', lrNo: 'TRIP-0249016', recWt: 45.57 },
  { date: '2026-06-03', vehicleNo: 'BR01GN4328', invoiceNo: 'TRIP-0249059', lrNo: 'TRIP-0249059', recWt: 40.52 },
  { date: '2026-06-03', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0249070', lrNo: 'TRIP-0249070', recWt: 41.96 },
  { date: '2026-06-03', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0249083', lrNo: 'TRIP-0249083', recWt: 43.85 },
  { date: '2026-06-03', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0249100', lrNo: 'TRIP-0249100', recWt: 40.82 },
  { date: '2026-06-04', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0249132', lrNo: 'TRIP-0249132', recWt: 42.34 },
  { date: '2026-06-04', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0249209', lrNo: 'TRIP-0249209', recWt: 43.49 },
  { date: '2026-06-03', vehicleNo: 'BR01GN4328', invoiceNo: 'TRIP-0249084', lrNo: 'TRIP-0249084', recWt: 46.70 },
  { date: '2026-06-04', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0249218', lrNo: 'TRIP-0249218', recWt: 41.19 },
  { date: '2026-06-04', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0249251', lrNo: 'TRIP-0249251', recWt: 39.65 },
  { date: '2026-06-04', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0249232', lrNo: 'TRIP-0249232', recWt: 40.90 },
  { date: '2026-06-04', vehicleNo: 'BR01GN4328', invoiceNo: 'TRIP-0249265', lrNo: 'TRIP-0249265', recWt: 42.68 },
  { date: '2026-06-05', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0249279', lrNo: 'TRIP-0249279', recWt: 38.80 },
  { date: '2026-06-05', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0249325', lrNo: 'TRIP-0249325', recWt: 41.77 },
  { date: '2026-06-05', vehicleNo: 'BR01GN4328', invoiceNo: 'TRIP-0249299', lrNo: 'TRIP-0249299', recWt: 39.45 },
  { date: '2026-06-05', vehicleNo: 'BR01GN4328', invoiceNo: 'TRIP-0249355', lrNo: 'TRIP-0249355', recWt: 38.62 },
  { date: '2026-06-05', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0249370', lrNo: 'TRIP-0249370', recWt: 39.17 },
  { date: '2026-06-05', vehicleNo: 'BR01GN4328', invoiceNo: 'TRIP-0249404', lrNo: 'TRIP-0249404', recWt: 44.21 },
  { date: '2026-06-06', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0249411', lrNo: 'TRIP-0249411', recWt: 42.59 },
  { date: '2026-06-06', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0249448', lrNo: 'TRIP-0249448', recWt: 41.61 },
  { date: '2026-06-06', vehicleNo: 'BR01GN4328', invoiceNo: 'TRIP-0249440', lrNo: 'TRIP-0249440', recWt: 46.68 },
  { date: '2026-06-06', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0249476', lrNo: 'TRIP-0249476', recWt: 44.03 },
  { date: '2026-06-06', vehicleNo: 'BR01GN4328', invoiceNo: 'TRIP-0249491', lrNo: 'TRIP-0249491', recWt: 41.65 },
  { date: '2026-06-06', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0249498', lrNo: 'TRIP-0249498', recWt: 38.13 },
  { date: '2026-06-06', vehicleNo: 'BR01GN4328', invoiceNo: 'TRIP-0249544', lrNo: 'TRIP-0249544', recWt: 40.97 },
  { date: '2026-06-07', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0249571', lrNo: 'TRIP-0249571', recWt: 44.09 },
  { date: '2026-06-07', vehicleNo: 'BR01GN4328', invoiceNo: 'TRIP-0249643', lrNo: 'TRIP-0249643', recWt: 42.53 },
  { date: '2026-06-07', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0249646', lrNo: 'TRIP-0249646', recWt: 40.70 },
  { date: '2026-06-07', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0249642', lrNo: 'TRIP-0249642', recWt: 40.73 },
  { date: '2026-06-07', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0249693', lrNo: 'TRIP-0249693', recWt: 40.06 },
  { date: '2026-06-07', vehicleNo: 'BR01GN4328', invoiceNo: 'TRIP-0249598', lrNo: 'TRIP-0249598', recWt: 43.23 },
  { date: '2026-06-07', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0249572', lrNo: 'TRIP-0249572', recWt: 41.40 },
  { date: '2026-06-08', vehicleNo: 'BR01GN4328', invoiceNo: 'TRIP-0249706', lrNo: 'TRIP-0249706', recWt: 43.85 },
  { date: '2026-06-08', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0249707', lrNo: 'TRIP-0249707', recWt: 43.23 },
  { date: '2026-06-08', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0249769', lrNo: 'TRIP-0249769', recWt: 41.10 },
  { date: '2026-06-08', vehicleNo: 'BR01GN4328', invoiceNo: 'TRIP-0249786', lrNo: 'TRIP-0249786', recWt: 40.43 },
  { date: '2026-06-08', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0249775', lrNo: 'TRIP-0249775', recWt: 40.16 },
  { date: '2026-06-08', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0249815', lrNo: 'TRIP-0249815', recWt: 43.36 },
  { date: '2026-06-08', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0249838', lrNo: 'TRIP-0249838', recWt: 40.73 },
  { date: '2026-06-08', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0249828', lrNo: 'TRIP-0249828', recWt: 39.77 },
  { date: '2026-06-08', vehicleNo: 'BR01GN4328', invoiceNo: 'TRIP-0249831', lrNo: 'TRIP-0249831', recWt: 39.62 },
  { date: '2026-06-08', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0249871', lrNo: 'TRIP-0249871', recWt: 46.01 },
  { date: '2026-06-09', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0249873', lrNo: 'TRIP-0249873', recWt: 42.80 },
  { date: '2026-06-09', vehicleNo: 'BR01GN4328', invoiceNo: 'TRIP-0249877', lrNo: 'TRIP-0249877', recWt: 40.95 },
  { date: '2026-06-09', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0249888', lrNo: 'TRIP-0249888', recWt: 40.92 },
  { date: '2026-06-09', vehicleNo: 'BR01GN4328', invoiceNo: 'TRIP-0249907', lrNo: 'TRIP-0249907', recWt: 45.84 },
  { date: '2026-06-10', vehicleNo: 'BR01GN4328', invoiceNo: 'TRIP-0250063', lrNo: 'TRIP-0250063', recWt: 45.76 },
  { date: '2026-06-10', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0250110', lrNo: 'TRIP-0250110', recWt: 39.15 },
  { date: '2026-06-10', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0250131', lrNo: 'TRIP-0250131', recWt: 42.15 },
  { date: '2026-06-10', vehicleNo: 'BR01GN4328', invoiceNo: 'TRIP-0250005', lrNo: 'TRIP-0250005', recWt: 38.95 },
  { date: '2026-06-10', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0250047', lrNo: 'TRIP-0250047', recWt: 47.59 },
  { date: '2026-06-10', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0250054', lrNo: 'TRIP-0250054', recWt: 45.96 },
  { date: '2026-06-10', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0250075', lrNo: 'TRIP-0250075', recWt: 41.60 },
  { date: '2026-06-11', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0250269', lrNo: 'TRIP-0250269', recWt: 43.24 },
  { date: '2026-06-11', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0250267', lrNo: 'TRIP-0250267', recWt: 42.20 },
  { date: '2026-06-11', vehicleNo: 'BR01GN4328', invoiceNo: 'TRIP-0250136', lrNo: 'TRIP-0250136', recWt: 44.06 },
  { date: '2026-06-11', vehicleNo: 'BR01GN4328', invoiceNo: 'TRIP-0250299', lrNo: 'TRIP-0250299', recWt: 45.50 },
  { date: '2026-06-11', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0250152', lrNo: 'TRIP-0250152', recWt: 39.00 },
  { date: '2026-06-11', vehicleNo: 'BR01GN4328', invoiceNo: 'TRIP-0250184', lrNo: 'TRIP-0250184', recWt: 42.15 },
  { date: '2026-06-11', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0250190', lrNo: 'TRIP-0250190', recWt: 45.27 },
  { date: '2026-06-11', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0250191', lrNo: 'TRIP-0250191', recWt: 45.34 },
  { date: '2026-06-11', vehicleNo: 'BR01GN4328', invoiceNo: 'TRIP-0250234', lrNo: 'TRIP-0250234', recWt: 45.32 },
  { date: '2026-06-12', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0250322', lrNo: 'TRIP-0250322', recWt: 39.32 },
  { date: '2026-06-12', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0250320', lrNo: 'TRIP-0250320', recWt: 42.33 },
  { date: '2026-06-12', vehicleNo: 'BR01GN4328', invoiceNo: 'TRIP-0250325', lrNo: 'TRIP-0250325', recWt: 42.71 },
  { date: '2026-06-12', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0250355', lrNo: 'TRIP-0250355', recWt: 42.85 },
  { date: '2026-06-12', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0250358', lrNo: 'TRIP-0250358', recWt: 45.94 },
  { date: '2026-06-12', vehicleNo: 'BR01GN4328', invoiceNo: 'TRIP-0250374', lrNo: 'TRIP-0250374', recWt: 40.16 },
  { date: '2026-06-12', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0250405', lrNo: 'TRIP-0250405', recWt: 46.09 },
  { date: '2026-06-12', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0250436', lrNo: 'TRIP-0250436', recWt: 41.47 },
  { date: '2026-06-12', vehicleNo: 'BR01GN4328', invoiceNo: 'TRIP-0250443', lrNo: 'TRIP-0250443', recWt: 37.98 },
  { date: '2026-06-13', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0250467', lrNo: 'TRIP-0250467', recWt: 39.64 },
  { date: '2026-06-13', vehicleNo: 'BR01GN4328', invoiceNo: 'TRIP-0250501', lrNo: 'TRIP-0250501', recWt: 41.34 },
  { date: '2026-06-13', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0250513', lrNo: 'TRIP-0250513', recWt: 41.13 },
  { date: '2026-06-13', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0250528', lrNo: 'TRIP-0250528', recWt: 44.53 },
  { date: '2026-06-13', vehicleNo: 'BR01GN4328', invoiceNo: 'TRIP-0250556', lrNo: 'TRIP-0250556', recWt: 43.58 },
  { date: '2026-06-13', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0250603', lrNo: 'TRIP-0250603', recWt: 45.71 },
  { date: '2026-06-13', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0250554', lrNo: 'TRIP-0250554', recWt: 44.56 },
  { date: '2026-06-14', vehicleNo: 'BR01GN4328', invoiceNo: 'TRIP-0250622', lrNo: 'TRIP-0250622', recWt: 46.17 },
  { date: '2026-06-14', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0250626', lrNo: 'TRIP-0250626', recWt: 43.06 },
  { date: '2026-06-14', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0250624', lrNo: 'TRIP-0250624', recWt: 49.58 },
  { date: '2026-06-14', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0250661', lrNo: 'TRIP-0250661', recWt: 44.88 },
  { date: '2026-06-14', vehicleNo: 'BR01GN4328', invoiceNo: 'TRIP-0250662', lrNo: 'TRIP-0250662', recWt: 44.86 },
  { date: '2026-06-14', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0250666', lrNo: 'TRIP-0250666', recWt: 45.74 },
  { date: '2026-06-14', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0250701', lrNo: 'TRIP-0250701', recWt: 43.90 },
  { date: '2026-06-14', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0250708', lrNo: 'TRIP-0250708', recWt: 44.14 },
  { date: '2026-06-14', vehicleNo: 'BR01GN4328', invoiceNo: 'TRIP-0250709', lrNo: 'TRIP-0250709', recWt: 44.10 },
  { date: '2026-06-14', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0250753', lrNo: 'TRIP-0250753', recWt: 43.74 },
  { date: '2026-06-15', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0250761', lrNo: 'TRIP-0250761', recWt: 40.83 },
  { date: '2026-06-15', vehicleNo: 'BR01GN4328', invoiceNo: 'TRIP-0250762', lrNo: 'TRIP-0250762', recWt: 43.18 },
  { date: '2026-06-15', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0250790', lrNo: 'TRIP-0250790', recWt: 45.52 },
  { date: '2026-06-15', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0250821', lrNo: 'TRIP-0250821', recWt: 42.42 },
  { date: '2026-06-15', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0250831', lrNo: 'TRIP-0250831', recWt: 42.35 },
  { date: '2026-06-15', vehicleNo: 'BR01GN4328', invoiceNo: 'TRIP-0250820', lrNo: 'TRIP-0250820', recWt: 42.60 },
  { date: '2026-06-15', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0250871', lrNo: 'TRIP-0250871', recWt: 41.69 },
]

async function main() {
  console.log(`Total June 1-15 trips to insert: ${rawTrips.length}`)

  const plateNos = [...new Set(rawTrips.map(t => t.vehicleNo))]
  const vehicles = await prisma.vehicle.findMany({
    where: { plateNo: { in: plateNos } },
    select: { id: true, plateNo: true, projectId: true }
  })

  const vehicleMap: Record<string, { id: string; projectId: string | null }> = {}
  for (const v of vehicles) {
    vehicleMap[v.plateNo] = { id: v.id, projectId: v.projectId }
    console.log(`  ${v.plateNo} -> ID: ${v.id}`)
  }

  const missingPlates = plateNos.filter(p => !vehicleMap[p])
  if (missingPlates.length > 0) {
    console.error(`❌ Missing vehicles: ${missingPlates.join(', ')}`)
    return
  }

  const projectId = vehicles[0].projectId!
  const project = await prisma.project.findUnique({ where: { id: projectId } })
  if (!project) { console.error('❌ Project not found!'); return }
  console.log(`\nProject: ${project.projectName}, PartyRate: ${project.partyRate}, OwnerRate: ${project.ownerRate}`)

  // Check for duplicates
  const invoiceNos = rawTrips.map(t => t.invoiceNo)
  const existing = await prisma.trip.findMany({
    where: { invoiceNo: { in: invoiceNos } },
    select: { invoiceNo: true }
  })
  const existingSet = new Set(existing.map(t => t.invoiceNo))
  if (existingSet.size > 0) console.log(`⚠️ ${existingSet.size} trips already exist, will skip.`)

  const newTrips = rawTrips.filter(t => !existingSet.has(t.invoiceNo))
  console.log(`📊 New trips to insert: ${newTrips.length}`)

  if (newTrips.length === 0) { console.log('✅ All already exist!'); return }

  const tripsToCreate = newTrips.map(t => {
    const vehicle = vehicleMap[t.vehicleNo]
    const weight = t.recWt
    return {
      date: new Date(t.date),
      invoiceNo: t.invoiceNo,
      lrNo: t.lrNo,
      vehicleId: vehicle.id,
      projectId,
      weight,
      ownerRate: project.ownerRate,
      partyRate: project.partyRate,
      ownerFreightAmount: parseFloat((weight * project.ownerRate).toFixed(2)),
      partyFreightAmount: parseFloat((weight * project.partyRate).toFixed(2)),
    }
  })

  const result = await prisma.trip.createMany({ data: tripsToCreate, skipDuplicates: true })
  console.log(`\n✅ Successfully inserted ${result.count} trips!`)

  const totalWeight = newTrips.reduce((sum, t) => sum + t.recWt, 0)
  console.log(`  Total weight (REC WT): ${totalWeight.toFixed(2)} MT`)
  console.log(`  Date range: ${newTrips[0].date} to ${newTrips[newTrips.length - 1].date}`)

  const byVehicle: Record<string, { count: number; weight: number }> = {}
  for (const t of newTrips) {
    if (!byVehicle[t.vehicleNo]) byVehicle[t.vehicleNo] = { count: 0, weight: 0 }
    byVehicle[t.vehicleNo].count++
    byVehicle[t.vehicleNo].weight += t.recWt
  }
  for (const [plate, data] of Object.entries(byVehicle)) {
    console.log(`    ${plate}: ${data.count} trips, ${data.weight.toFixed(2)} MT`)
  }

  const totalInDb = await prisma.trip.count()
  console.log(`\n📦 Total trips now in DB: ${totalInDb}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
