// Insert 112 May 2026 trips (16-31 May) into production DB
// Uses REC WT for weight column, freight rate = 125
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const rawTrips: { date: string; vehicleNo: string; invoiceNo: string; lrNo: string; recWt: number }[] = [
  { date: '2026-05-16', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0246847', lrNo: '462000467', recWt: 43.58 },
  { date: '2026-05-16', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0246800', lrNo: '462000467', recWt: 41.33 },
  { date: '2026-05-16', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0246803', lrNo: '462000467', recWt: 41.09 },
  { date: '2026-05-16', vehicleNo: 'BR01GN4328', invoiceNo: 'TRIP-0246791', lrNo: '462000467', recWt: 44.49 },
  { date: '2026-05-16', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0246815', lrNo: '462000467', recWt: 41.03 },
  { date: '2026-05-16', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0246826', lrNo: '462000467', recWt: 42.69 },
  { date: '2026-05-16', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0246856', lrNo: '462000467', recWt: 41.05 },
  { date: '2026-05-16', vehicleNo: 'BR01GN4328', invoiceNo: 'TRIP-0246857', lrNo: '462000467', recWt: 41.25 },
  { date: '2026-05-16', vehicleNo: 'BR01GN4328', invoiceNo: 'TRIP-0246752', lrNo: '462000466', recWt: 43.60 },
  { date: '2026-05-16', vehicleNo: 'BR01GN4328', invoiceNo: 'TRIP-0246827', lrNo: '462000467', recWt: 42.13 },
  { date: '2026-05-17', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0246947', lrNo: '462000467', recWt: 42.58 },
  { date: '2026-05-17', vehicleNo: 'BR01GN4328', invoiceNo: 'TRIP-0246887', lrNo: '462000467', recWt: 46.62 },
  { date: '2026-05-17', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0246888', lrNo: '462000467', recWt: 43.85 },
  { date: '2026-05-17', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0246896', lrNo: '462000467', recWt: 42.52 },
  { date: '2026-05-17', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0246921', lrNo: '462000467', recWt: 39.88 },
  { date: '2026-05-17', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0246864', lrNo: '462000467', recWt: 44.37 },
  { date: '2026-05-17', vehicleNo: 'BR01GN4328', invoiceNo: 'TRIP-0246920', lrNo: '462000467', recWt: 44.43 },
  { date: '2026-05-17', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0246924', lrNo: '462000467', recWt: 43.21 },
  { date: '2026-05-17', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0246960', lrNo: '462000467', recWt: 37.87 },
  { date: '2026-05-18', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0247041', lrNo: '462000467', recWt: 41.86 },
  { date: '2026-05-18', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0246972', lrNo: '462000467', recWt: 40.92 },
  { date: '2026-05-18', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0247047', lrNo: '462000467', recWt: 40.15 },
  { date: '2026-05-18', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0247000', lrNo: '462000467', recWt: 43.99 },
  { date: '2026-05-18', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0246996', lrNo: '462000467', recWt: 39.93 },
  { date: '2026-05-18', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0247020', lrNo: '462000467', recWt: 38.66 },
  { date: '2026-05-18', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0247019', lrNo: '462000467', recWt: 40.66 },
  { date: '2026-05-19', vehicleNo: 'BR01GN4328', invoiceNo: 'TRIP-0247061', lrNo: '462000467', recWt: 40.54 },
  { date: '2026-05-19', vehicleNo: 'BR01GN4328', invoiceNo: 'TRIP-0247097', lrNo: '462000467', recWt: 40.84 },
  { date: '2026-05-19', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0247158', lrNo: '462000468', recWt: 36.37 },
  { date: '2026-05-19', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0247131', lrNo: '462000468', recWt: 41.39 },
  { date: '2026-05-19', vehicleNo: 'BR01GN4328', invoiceNo: 'TRIP-0247134', lrNo: '462000468', recWt: 44.54 },
  { date: '2026-05-19', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0247161', lrNo: '462000468', recWt: 41.76 },
  { date: '2026-05-19', vehicleNo: 'BR01GN4328', invoiceNo: 'TRIP-0247163', lrNo: '462000468', recWt: 41.89 },
  { date: '2026-05-20', vehicleNo: 'BR01GN4328', invoiceNo: 'TRIP-0247193', lrNo: '462000468', recWt: 43.80 },
  { date: '2026-05-20', vehicleNo: 'BR01GN4328', invoiceNo: 'TRIP-0247307', lrNo: '462000468', recWt: 38.44 },
  { date: '2026-05-20', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0247267', lrNo: '462000468', recWt: 36.43 },
  { date: '2026-05-20', vehicleNo: 'BR01GN4328', invoiceNo: 'TRIP-0247263', lrNo: '462000468', recWt: 36.26 },
  { date: '2026-05-20', vehicleNo: 'BR01GN4328', invoiceNo: 'TRIP-0247243', lrNo: '462000468', recWt: 42.91 },
  { date: '2026-05-20', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0247241', lrNo: '462000468', recWt: 41.00 },
  { date: '2026-05-20', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0247234', lrNo: '462000468', recWt: 36.25 },
  { date: '2026-05-20', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0247196', lrNo: '462000468', recWt: 42.93 },
  { date: '2026-05-20', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0247194', lrNo: '462000468', recWt: 42.04 },
  { date: '2026-05-21', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0247428', lrNo: '462000469', recWt: 41.13 },
  { date: '2026-05-21', vehicleNo: 'BR01GN4328', invoiceNo: 'TRIP-0247399', lrNo: '462000469', recWt: 40.80 },
  { date: '2026-05-21', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0247400', lrNo: '462000469', recWt: 38.16 },
  { date: '2026-05-21', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0247388', lrNo: '462000469', recWt: 40.03 },
  { date: '2026-05-21', vehicleNo: 'BR01GN4328', invoiceNo: 'TRIP-0247326', lrNo: '462000468', recWt: 41.22 },
  { date: '2026-05-21', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0247372', lrNo: '462000469', recWt: 37.05 },
  { date: '2026-05-21', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0247370', lrNo: '462000469', recWt: 35.54 },
  { date: '2026-05-21', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0247309', lrNo: '462000468', recWt: 37.60 },
  { date: '2026-05-21', vehicleNo: 'BR01GN4328', invoiceNo: 'TRIP-0247369', lrNo: '462000469', recWt: 37.81 },
  { date: '2026-05-22', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0247493', lrNo: '462000469', recWt: 38.32 },
  { date: '2026-05-22', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0247552', lrNo: '462000470', recWt: 37.58 },
  { date: '2026-05-22', vehicleNo: 'BR01GN4328', invoiceNo: 'TRIP-0247506', lrNo: '462000469', recWt: 40.91 },
  { date: '2026-05-22', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0247516', lrNo: '462000469', recWt: 42.10 },
  { date: '2026-05-22', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0247502', lrNo: '462000469', recWt: 39.82 },
  { date: '2026-05-22', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0247467', lrNo: '462000469', recWt: 40.47 },
  { date: '2026-05-22', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0247461', lrNo: '462000469', recWt: 40.27 },
  { date: '2026-05-22', vehicleNo: 'BR01GN4328', invoiceNo: 'TRIP-0247468', lrNo: '462000469', recWt: 43.65 },
  { date: '2026-05-22', vehicleNo: 'BR01GN4328', invoiceNo: 'TRIP-0247438', lrNo: '462000469', recWt: 38.68 },
  { date: '2026-05-22', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0247436', lrNo: '462000469', recWt: 35.86 },
  { date: '2026-05-23', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0247571', lrNo: '462000470', recWt: 41.74 },
  { date: '2026-05-23', vehicleNo: 'BR01GN4328', invoiceNo: 'TRIP-0247574', lrNo: '462000470', recWt: 38.63 },
  { date: '2026-05-24', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0247643', lrNo: '462000470', recWt: 42.34 },
  { date: '2026-05-24', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0247674', lrNo: '462000471', recWt: 40.22 },
  { date: '2026-05-25', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0247714', lrNo: '462000471', recWt: 41.28 },
  { date: '2026-05-25', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0247833', lrNo: '462000471', recWt: 46.59 },
  { date: '2026-05-25', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0247832', lrNo: '462000471', recWt: 40.48 },
  { date: '2026-05-25', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0247792', lrNo: '462000471', recWt: 41.87 },
  { date: '2026-05-25', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0247793', lrNo: '462000471', recWt: 42.63 },
  { date: '2026-05-25', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0247760', lrNo: '462000471', recWt: 40.27 },
  { date: '2026-05-25', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0247761', lrNo: '462000471', recWt: 43.40 },
  { date: '2026-05-25', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0247711', lrNo: '462000471', recWt: 41.98 },
  { date: '2026-05-26', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0247888', lrNo: '462000472', recWt: 44.85 },
  { date: '2026-05-26', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0247974', lrNo: '462000472', recWt: 42.68 },
  { date: '2026-05-26', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0247936', lrNo: '462000472', recWt: 40.39 },
  { date: '2026-05-26', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0247934', lrNo: '462000472', recWt: 36.41 },
  { date: '2026-05-26', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0247887', lrNo: '462000472', recWt: 42.86 },
  { date: '2026-05-27', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0248115', lrNo: '462000473', recWt: 44.91 },
  { date: '2026-05-27', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0248078', lrNo: '462000473', recWt: 39.54 },
  { date: '2026-05-27', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0248117', lrNo: '462000473', recWt: 46.92 },
  { date: '2026-05-27', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0247977', lrNo: '462000472', recWt: 43.15 },
  { date: '2026-05-27', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0248033', lrNo: '462000473', recWt: 42.12 },
  { date: '2026-05-27', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0248035', lrNo: '462000473', recWt: 41.97 },
  { date: '2026-05-27', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0248076', lrNo: '462000473', recWt: 44.01 },
  { date: '2026-05-28', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0248244', lrNo: '462000474', recWt: 43.57 },
  { date: '2026-05-28', vehicleNo: 'BR01GN4328', invoiceNo: 'TRIP-0248240', lrNo: '462000474', recWt: 43.49 },
  { date: '2026-05-28', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0248163', lrNo: '462000473', recWt: 45.21 },
  { date: '2026-05-28', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0248195', lrNo: '462000473', recWt: 42.81 },
  { date: '2026-05-28', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0248165', lrNo: '462000473', recWt: 44.06 },
  { date: '2026-05-28', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0248213', lrNo: '462000474', recWt: 45.82 },
  { date: '2026-05-28', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0248220', lrNo: '462000474', recWt: 39.25 },
  { date: '2026-05-29', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0248373', lrNo: '462000475', recWt: 43.16 },
  { date: '2026-05-29', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0248383', lrNo: '462000475', recWt: 41.19 },
  { date: '2026-05-29', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0248353', lrNo: '462000474', recWt: 40.68 },
  { date: '2026-05-29', vehicleNo: 'BR01GN4328', invoiceNo: 'TRIP-0248375', lrNo: '462000475', recWt: 40.59 },
  { date: '2026-05-29', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0248336', lrNo: '462000474', recWt: 46.48 },
  { date: '2026-05-29', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0248299', lrNo: '462000474', recWt: 44.09 },
  { date: '2026-05-29', vehicleNo: 'BR01GN4328', invoiceNo: 'TRIP-0248331', lrNo: '462000474', recWt: 40.49 },
  { date: '2026-05-29', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0248288', lrNo: '462000474', recWt: 45.77 },
  { date: '2026-05-30', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0248545', lrNo: '462000475', recWt: 41.74 },
  { date: '2026-05-30', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0248492', lrNo: '462000475', recWt: 43.20 },
  { date: '2026-05-30', vehicleNo: 'BR01GN4328', invoiceNo: 'TRIP-0248496', lrNo: '462000475', recWt: 43.07 },
  { date: '2026-05-30', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0248482', lrNo: '462000475', recWt: 39.59 },
  { date: '2026-05-30', vehicleNo: 'BR01GN4328', invoiceNo: 'TRIP-0248470', lrNo: '462000475', recWt: 44.29 },
  { date: '2026-05-30', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0248458', lrNo: '462000475', recWt: 41.78 },
  { date: '2026-05-30', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0248457', lrNo: '462000475', recWt: 41.15 },
  { date: '2026-05-31', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0248649', lrNo: '462000476', recWt: 41.42 },
  { date: '2026-05-31', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0248646', lrNo: '462000476', recWt: 40.86 },
  { date: '2026-05-31', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0248599', lrNo: '462000476', recWt: 45.17 },
  { date: '2026-05-31', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0248559', lrNo: '462000476', recWt: 42.76 },
  { date: '2026-05-31', vehicleNo: 'BR01GN4328', invoiceNo: 'TRIP-0248693', lrNo: '462000476', recWt: 41.57 },
]

async function main() {
  console.log(`Total May trips to insert: ${rawTrips.length}`)

  // 1. Look up vehicles by plate number
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

  console.log(`\nFound vehicles:`)
  for (const v of vehicles) {
    console.log(`  ${v.plateNo} -> ID: ${v.id}, ProjectID: ${v.projectId}`)
  }

  const missingPlates = plateNos.filter(p => !vehicleMap[p])
  if (missingPlates.length > 0) {
    console.error(`\n❌ Missing vehicles: ${missingPlates.join(', ')}`)
    return
  }

  // 2. Get project info
  const projectId = vehicles[0].projectId
  if (!projectId) { console.error('❌ No project assigned!'); return }

  const project = await prisma.project.findUnique({ where: { id: projectId } })
  if (!project) { console.error('❌ Project not found!'); return }

  console.log(`\nProject: ${project.projectName}, PartyRate: ${project.partyRate}, OwnerRate: ${project.ownerRate}`)

  // 3. Check for duplicates and skip them
  const invoiceNos = rawTrips.map(t => t.invoiceNo)
  const existing = await prisma.trip.findMany({
    where: { invoiceNo: { in: invoiceNos } },
    select: { invoiceNo: true }
  })
  const existingSet = new Set(existing.map(t => t.invoiceNo))
  if (existingSet.size > 0) {
    console.log(`\n⚠️ ${existingSet.size} trips already exist, will skip them.`)
  }
  const newTrips = rawTrips.filter(t => !existingSet.has(t.invoiceNo))
  console.log(`📊 New trips to insert: ${newTrips.length}`)

  if (newTrips.length === 0) {
    console.log('✅ All trips already exist!')
    return
  }

  // 4. Insert
  const tripsToCreate = newTrips.map(t => {
    const vehicle = vehicleMap[t.vehicleNo]
    const weight = t.recWt
    return {
      date: new Date(t.date),
      invoiceNo: t.invoiceNo,
      lrNo: t.lrNo,
      vehicleId: vehicle.id,
      projectId: projectId,
      weight: weight,
      ownerRate: project.ownerRate,
      partyRate: project.partyRate,
      ownerFreightAmount: parseFloat((weight * project.ownerRate).toFixed(2)),
      partyFreightAmount: parseFloat((weight * project.partyRate).toFixed(2)),
    }
  })

  const result = await prisma.trip.createMany({ data: tripsToCreate, skipDuplicates: true })
  console.log(`\n✅ Successfully inserted ${result.count} May trips!`)

  // 5. Summary
  const totalWeight = newTrips.reduce((sum, t) => sum + t.recWt, 0)
  console.log(`\n📊 Summary:`)
  console.log(`  Total trips inserted: ${result.count}`)
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

  // Total DB count
  const totalInDb = await prisma.trip.count()
  console.log(`\n📦 Total trips now in DB: ${totalInDb}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
