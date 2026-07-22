// Insert 109 May 1-15, 2026 trips into production DB
// Uses REC WT for weight column
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const rawTrips: { date: string; vehicleNo: string; invoiceNo: string; lrNo: string; recWt: number }[] = [
  { date: '2026-05-01', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0518211', lrNo: '462000453', recWt: 43.21 },
  { date: '2026-05-01', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0518293', lrNo: '462000454', recWt: 39.36 },
  { date: '2026-05-01', vehicleNo: 'BR01GN4328', invoiceNo: 'TRIP-0518302', lrNo: '462000454', recWt: 45.10 },
  { date: '2026-05-01', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0518491', lrNo: '462000454', recWt: 42.15 },
  { date: '2026-05-01', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0518513', lrNo: '462000454', recWt: 40.16 },
  { date: '2026-05-01', vehicleNo: 'BR01GN4328', invoiceNo: 'TRIP-0518515', lrNo: '462000454', recWt: 42.72 },
  { date: '2026-05-01', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0518626', lrNo: '462000454', recWt: 39.38 },
  { date: '2026-05-01', vehicleNo: 'BR01GN4328', invoiceNo: 'TRIP-0518643', lrNo: '462000454', recWt: 42.90 },
  { date: '2026-05-01', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0518648', lrNo: '462000454', recWt: 39.56 },
  { date: '2026-05-02', vehicleNo: 'BR01GN4328', invoiceNo: 'TRIP-0518759', lrNo: '462000455', recWt: 41.92 },
  { date: '2026-05-02', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0518762', lrNo: '462000455', recWt: 39.50 },
  { date: '2026-05-02', vehicleNo: 'BR01GN4328', invoiceNo: 'TRIP-0518855', lrNo: '462000455', recWt: 45.01 },
  { date: '2026-05-02', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0518859', lrNo: '462000455', recWt: 43.42 },
  { date: '2026-05-02', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0518915', lrNo: '462000455', recWt: 41.02 },
  { date: '2026-05-02', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0519104', lrNo: '462000455', recWt: 43.17 },
  { date: '2026-05-02', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0519287', lrNo: '462000455', recWt: 41.11 },
  { date: '2026-05-02', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0519316', lrNo: '462000455', recWt: 41.15 },
  { date: '2026-05-03', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0519388', lrNo: '462000455', recWt: 42.40 },
  { date: '2026-05-03', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0519484', lrNo: '462000456', recWt: 40.07 },
  { date: '2026-05-03', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0519591', lrNo: '462000456', recWt: 38.22 },
  { date: '2026-05-03', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0519635', lrNo: '462000456', recWt: 40.38 },
  { date: '2026-05-03', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0519742', lrNo: '462000456', recWt: 43.56 },
  { date: '2026-05-03', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0519751', lrNo: '462000456', recWt: 45.47 },
  { date: '2026-05-04', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0519911', lrNo: '462000456', recWt: 40.61 },
  { date: '2026-05-04', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0519923', lrNo: '462000456', recWt: 37.31 },
  { date: '2026-05-04', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0520047', lrNo: '462000456', recWt: 43.15 },
  { date: '2026-05-04', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0520056', lrNo: '462000456', recWt: 41.64 },
  { date: '2026-05-04', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0520245', lrNo: '462000457', recWt: 42.06 },
  { date: '2026-05-04', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0520263', lrNo: '462000457', recWt: 44.13 },
  { date: '2026-05-04', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0520373', lrNo: '462000457', recWt: 40.12 },
  { date: '2026-05-04', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0520449', lrNo: '462000457', recWt: 44.26 },
  { date: '2026-05-05', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0520517', lrNo: '462000457', recWt: 40.56 },
  { date: '2026-05-05', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0520543', lrNo: '462000457', recWt: 41.27 },
  { date: '2026-05-05', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0520625', lrNo: '462000457', recWt: 40.91 },
  { date: '2026-05-05', vehicleNo: 'BR01GN4328', invoiceNo: 'TRIP-0520720', lrNo: '462000455', recWt: 44.50 },
  { date: '2026-05-05', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0520727', lrNo: '462000458', recWt: 43.19 },
  { date: '2026-05-05', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0520745', lrNo: '462000458', recWt: 37.12 },
  { date: '2026-05-05', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0520835', lrNo: '462000458', recWt: 39.51 },
  { date: '2026-05-05', vehicleNo: 'BR01GN4328', invoiceNo: 'TRIP-0520859', lrNo: '462000458', recWt: 35.43 },
  { date: '2026-05-05', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0520865', lrNo: '462000458', recWt: 37.66 },
  { date: '2026-05-06', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0521010', lrNo: '462000458', recWt: 40.72 },
  { date: '2026-05-06', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0521044', lrNo: '462000458', recWt: 40.23 },
  { date: '2026-05-06', vehicleNo: 'BR01GN4328', invoiceNo: 'TRIP-0521045', lrNo: '462000458', recWt: 37.85 },
  { date: '2026-05-06', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0521121', lrNo: '462000458', recWt: 38.47 },
  { date: '2026-05-06', vehicleNo: 'BR01GN4328', invoiceNo: 'TRIP-0521304', lrNo: '462000458', recWt: 43.23 },
  { date: '2026-05-06', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0521309', lrNo: '462000458', recWt: 40.66 },
  { date: '2026-05-06', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0521318', lrNo: '462000458', recWt: 38.92 },
  { date: '2026-05-06', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0521589', lrNo: '462000459', recWt: 32.87 },
  { date: '2026-05-06', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0521590', lrNo: '462000459', recWt: 41.56 },
  { date: '2026-05-07', vehicleNo: 'BR01GN4328', invoiceNo: 'TRIP-0521658', lrNo: '462000459', recWt: 40.08 },
  { date: '2026-05-07', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0521675', lrNo: '462000459', recWt: 37.22 },
  { date: '2026-05-07', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0521730', lrNo: '462000459', recWt: 39.40 },
  { date: '2026-05-07', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0521779', lrNo: '462000459', recWt: 41.17 },
  { date: '2026-05-07', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0521989', lrNo: '462000460', recWt: 43.35 },
  { date: '2026-05-07', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0521995', lrNo: '462000460', recWt: 39.34 },
  { date: '2026-05-08', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0522189', lrNo: '462000460', recWt: 40.10 },
  { date: '2026-05-08', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0522204', lrNo: '462000460', recWt: 40.12 },
  { date: '2026-05-08', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0522269', lrNo: '462000460', recWt: 39.49 },
  { date: '2026-05-08', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0522285', lrNo: '462000460', recWt: 42.92 },
  { date: '2026-05-08', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0522517', lrNo: '462000460', recWt: 41.27 },
  { date: '2026-05-08', vehicleNo: 'BR01GN4328', invoiceNo: 'TRIP-0522614', lrNo: '462000460', recWt: 36.87 },
  { date: '2026-05-08', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0522662', lrNo: '462000460', recWt: 40.88 },
  { date: '2026-05-08', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0522684', lrNo: '462000460', recWt: 44.65 },
  { date: '2026-05-09', vehicleNo: 'BR01GN4328', invoiceNo: 'TRIP-0522702', lrNo: '462000460', recWt: 40.82 },
  { date: '2026-05-09', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0522703', lrNo: '462000460', recWt: 42.49 },
  { date: '2026-05-09', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0522840', lrNo: '462000461', recWt: 42.79 },
  { date: '2026-05-09', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0522871', lrNo: '462000461', recWt: 41.24 },
  { date: '2026-05-09', vehicleNo: 'BR01GN4328', invoiceNo: 'TRIP-0522955', lrNo: '462000461', recWt: 42.49 },
  { date: '2026-05-09', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0523031', lrNo: '462000461', recWt: 36.11 },
  { date: '2026-05-09', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0523045', lrNo: '462000461', recWt: 38.19 },
  { date: '2026-05-09', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0523245', lrNo: '462000461', recWt: 38.21 },
  { date: '2026-05-10', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0523291', lrNo: '462000461', recWt: 42.29 },
  { date: '2026-05-10', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0523436', lrNo: '462000461', recWt: 39.63 },
  { date: '2026-05-10', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0523437', lrNo: '462000461', recWt: 42.94 },
  { date: '2026-05-10', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0523624', lrNo: '462000462', recWt: 43.16 },
  { date: '2026-05-10', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0523709', lrNo: '462000462', recWt: 40.74 },
  { date: '2026-05-10', vehicleNo: 'BR01GN4328', invoiceNo: 'TRIP-0523823', lrNo: '462000462', recWt: 45.45 },
  { date: '2026-05-11', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0523903', lrNo: '462000462', recWt: 40.61 },
  { date: '2026-05-11', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0523938', lrNo: '462000462', recWt: 40.90 },
  { date: '2026-05-11', vehicleNo: 'BR01GN4328', invoiceNo: 'TRIP-0523944', lrNo: '462000462', recWt: 42.41 },
  { date: '2026-05-11', vehicleNo: 'BR01GN4328', invoiceNo: 'TRIP-0524104', lrNo: '462000462', recWt: 43.73 },
  { date: '2026-05-11', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0524154', lrNo: '462000462', recWt: 40.73 },
  { date: '2026-05-11', vehicleNo: 'BR01GN4328', invoiceNo: 'TRIP-0524327', lrNo: '462000462', recWt: 43.47 },
  { date: '2026-05-11', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0524332', lrNo: '462000462', recWt: 41.54 },
  { date: '2026-05-11', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0524518', lrNo: '462000463', recWt: 42.54 },
  { date: '2026-05-11', vehicleNo: 'BR01GN4328', invoiceNo: 'TRIP-0524519', lrNo: '462000463', recWt: 44.57 },
  { date: '2026-05-12', vehicleNo: 'BR01GN4328', invoiceNo: 'TRIP-0524643', lrNo: '462000463', recWt: 39.63 },
  { date: '2026-05-12', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0524691', lrNo: '462000463', recWt: 41.49 },
  { date: '2026-05-12', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0524713', lrNo: '462000463', recWt: 41.09 },
  { date: '2026-05-12', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0524790', lrNo: '462000463', recWt: 41.23 },
  { date: '2026-05-12', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0524849', lrNo: '462000463', recWt: 41.19 },
  { date: '2026-05-12', vehicleNo: 'BR01GN4328', invoiceNo: 'TRIP-0524856', lrNo: '462000463', recWt: 41.96 },
  { date: '2026-05-12', vehicleNo: 'BR01GN4328', invoiceNo: 'TRIP-0525011', lrNo: '462000463', recWt: 40.16 },
  { date: '2026-05-12', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0525016', lrNo: '462000463', recWt: 41.58 },
  { date: '2026-05-12', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0525017', lrNo: '462000463', recWt: 40.55 },
  { date: '2026-05-13', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0525119', lrNo: '462000464', recWt: 43.62 },
  { date: '2026-05-13', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0525129', lrNo: '462000464', recWt: 41.53 },
  { date: '2026-05-13', vehicleNo: 'BR01GN4328', invoiceNo: 'TRIP-0525131', lrNo: '462000464', recWt: 41.65 },
  { date: '2026-05-13', vehicleNo: 'BR01GN4328', invoiceNo: 'TRIP-0525314', lrNo: '462000464', recWt: 40.95 },
  { date: '2026-05-13', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0525362', lrNo: '462000464', recWt: 39.12 },
  { date: '2026-05-13', vehicleNo: 'BR01GN4328', invoiceNo: 'TRIP-0525581', lrNo: '462000464', recWt: 43.06 },
  { date: '2026-05-14', vehicleNo: 'BR01GN4328', invoiceNo: 'TRIP-0525739', lrNo: '462000464', recWt: 36.31 },
  { date: '2026-05-14', vehicleNo: 'BR01GN4328', invoiceNo: 'TRIP-0525858', lrNo: '462000466', recWt: 41.75 },
  { date: '2026-05-14', vehicleNo: 'BR01GN4328', invoiceNo: 'TRIP-0526110', lrNo: '462000466', recWt: 43.04 },
  { date: '2026-05-15', vehicleNo: 'BR01GN4328', invoiceNo: 'TRIP-0526369', lrNo: '462000466', recWt: 39.94 },
  { date: '2026-05-15', vehicleNo: 'BR01GN4328', invoiceNo: 'TRIP-0526503', lrNo: '462000466', recWt: 45.64 },
  { date: '2026-05-15', vehicleNo: 'BR01GN4328', invoiceNo: 'TRIP-0526582', lrNo: '462000466', recWt: 41.92 },
  { date: '2026-05-15', vehicleNo: 'BR01GN4328', invoiceNo: 'TRIP-0526688', lrNo: '462000466', recWt: 43.04 },
  { date: '2026-05-15', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0526732', lrNo: '462000466', recWt: 35.68 },
]

async function main() {
  console.log(`Total May 1-15 trips to insert: ${rawTrips.length}`)

  const plateNos = [...new Set(rawTrips.map(t => t.vehicleNo))]
  console.log(`\nVehicles needed: ${plateNos.join(', ')}`)

  const vehicles = await prisma.vehicle.findMany({
    where: { plateNo: { in: plateNos } },
    select: { id: true, plateNo: true, projectId: true }
  })

  const vehicleMap: Record<string, { id: string; projectId: string | null }> = {}
  for (const v of vehicles) {
    vehicleMap[v.plateNo] = { id: v.id, projectId: v.projectId }
  }

  for (const v of vehicles) {
    console.log(`  ${v.plateNo} -> ID: ${v.id}`)
  }

  const missingPlates = plateNos.filter(p => !vehicleMap[p])
  if (missingPlates.length > 0) {
    console.error(`\n❌ Missing vehicles: ${missingPlates.join(', ')}`)
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
  if (existingSet.size > 0) {
    console.log(`⚠️ ${existingSet.size} trips already exist, will skip.`)
  }
  const newTrips = rawTrips.filter(t => !existingSet.has(t.invoiceNo))
  console.log(`📊 New trips to insert: ${newTrips.length}`)

  if (newTrips.length === 0) {
    console.log('✅ All trips already exist!')
    return
  }

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
  console.log(`\n📊 Summary:`)
  console.log(`  Total weight (REC WT): ${totalWeight.toFixed(2)} MT`)
  console.log(`  Date range: ${newTrips[0].date} to ${newTrips[newTrips.length - 1].date}`)

  const byVehicle: Record<string, { count: number; weight: number }> = {}
  for (const t of newTrips) {
    if (!byVehicle[t.vehicleNo]) byVehicle[t.vehicleNo] = { count: 0, weight: 0 }
    byVehicle[t.vehicleNo].count++
    byVehicle[t.vehicleNo].weight += t.recWt
  }
  console.log(`\n  Vehicle-wise breakdown:`)
  for (const [plate, data] of Object.entries(byVehicle)) {
    console.log(`    ${plate}: ${data.count} trips, ${data.weight.toFixed(2)} MT`)
  }

  const totalInDb = await prisma.trip.count()
  console.log(`\n📦 Total trips now in DB: ${totalInDb}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
