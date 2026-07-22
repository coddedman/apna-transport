// Insert 129 April 2026 trips into production DB
// Uses REC WT for weight column, freight rate = 125
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Raw trip data from user: [date, vehicleNo, invoiceNo, destination, lrNo, recWt]
const rawTrips: { date: string; vehicleNo: string; invoiceNo: string; lrNo: string; recWt: number }[] = [
  { date: '2026-04-08', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0241597', lrNo: '462000431', recWt: 39.29 },
  { date: '2026-04-07', vehicleNo: 'BR06GD0994', invoiceNo: 'TRIP-0241511', lrNo: '462000431', recWt: 31.02 },
  { date: '2026-04-08', vehicleNo: 'BR06GD0994', invoiceNo: 'TRIP-0241662', lrNo: '462000434', recWt: 38.17 },
  { date: '2026-04-08', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0241663', lrNo: '462000434', recWt: 38.44 },
  { date: '2026-04-09', vehicleNo: 'BR06GD0994', invoiceNo: 'TRIP-0241758', lrNo: '462000434', recWt: 42.46 },
  { date: '2026-04-09', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0241794', lrNo: '462000435', recWt: 39.43 },
  { date: '2026-04-10', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0241933', lrNo: '462000436', recWt: 40.71 },
  { date: '2026-04-11', vehicleNo: 'BR06GD0994', invoiceNo: 'TRIP-0242071', lrNo: '462000437', recWt: 38.34 },
  { date: '2026-04-11', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0242072', lrNo: '462000437', recWt: 41.04 },
  { date: '2026-04-11', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0242146', lrNo: '462000437', recWt: 43.03 },
  { date: '2026-04-11', vehicleNo: 'BR06GD0994', invoiceNo: 'TRIP-0242147', lrNo: '462000437', recWt: 39.14 },
  { date: '2026-04-12', vehicleNo: 'BR06GD0994', invoiceNo: 'TRIP-0242270', lrNo: '462000438', recWt: 37.97 },
  { date: '2026-04-12', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0242259', lrNo: '462000438', recWt: 42.14 },
  { date: '2026-04-13', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0242316', lrNo: '462000438', recWt: 41.32 },
  { date: '2026-04-13', vehicleNo: 'BR06GD0994', invoiceNo: 'TRIP-0242366', lrNo: '442000022', recWt: 40.54 },
  { date: '2026-04-13', vehicleNo: 'BR06GD0994', invoiceNo: 'TRIP-0242414', lrNo: '442000022', recWt: 37.25 },
  { date: '2026-04-13', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0242417', lrNo: '442000022', recWt: 43.86 },
  { date: '2026-04-14', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0242452', lrNo: '442000022', recWt: 36.33 },
  { date: '2026-04-15', vehicleNo: 'BR06GD0994', invoiceNo: 'TRIP-0242594', lrNo: '462000440', recWt: 36.25 },
  { date: '2026-04-15', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0242611', lrNo: '462000439', recWt: 47.51 },
  { date: '2026-04-16', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0242668', lrNo: '482000178', recWt: 42.03 },
  { date: '2026-04-16', vehicleNo: 'BR06GD0994', invoiceNo: 'TRIP-0242709', lrNo: '462000439', recWt: 38.14 },
  { date: '2026-04-16', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0242731', lrNo: '462000439', recWt: 45.54 },
  { date: '2026-04-16', vehicleNo: 'BR06GD0994', invoiceNo: 'TRIP-0242745', lrNo: '462000439', recWt: 36.55 },
  { date: '2026-04-17', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0242787', lrNo: '462000441', recWt: 42.42 },
  { date: '2026-04-17', vehicleNo: 'BR06GD0994', invoiceNo: 'TRIP-0242864', lrNo: '462000441', recWt: 36.63 },
  { date: '2026-04-17', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0242872', lrNo: '462000441', recWt: 42.13 },
  { date: '2026-04-17', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0242927', lrNo: '462000442', recWt: 42.38 },
  { date: '2026-04-17', vehicleNo: 'BR06GD0994', invoiceNo: 'TRIP-0242926', lrNo: '462000442', recWt: 36.01 },
  { date: '2026-04-18', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0242996', lrNo: '462000442', recWt: 40.80 },
  { date: '2026-04-18', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0243039', lrNo: '462000443', recWt: 37.70 },
  { date: '2026-04-19', vehicleNo: 'BR01GN4328', invoiceNo: 'TRIP-0243207', lrNo: '462000444', recWt: 45.13 },
  { date: '2026-04-19', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0243201', lrNo: '462000444', recWt: 38.39 },
  { date: '2026-04-19', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0243204', lrNo: '462000444', recWt: 40.85 },
  { date: '2026-04-19', vehicleNo: 'BR06GD0994', invoiceNo: 'TRIP-0243148', lrNo: '462000444', recWt: 39.50 },
  { date: '2026-04-19', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0243159', lrNo: '462000444', recWt: 43.44 },
  { date: '2026-04-19', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0243158', lrNo: '462000444', recWt: 42.15 },
  { date: '2026-04-19', vehicleNo: 'BR01GN4328', invoiceNo: 'TRIP-0243157', lrNo: '462000444', recWt: 45.06 },
  { date: '2026-04-20', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0243268', lrNo: '462000445', recWt: 43.92 },
  { date: '2026-04-20', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0243276', lrNo: '462000445', recWt: 43.39 },
  { date: '2026-04-20', vehicleNo: 'BR01GN4328', invoiceNo: 'TRIP-0243309', lrNo: '462000445', recWt: 47.06 },
  { date: '2026-04-20', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0243301', lrNo: '462000445', recWt: 43.55 },
  { date: '2026-04-20', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0243308', lrNo: '462000445', recWt: 45.40 },
  { date: '2026-04-20', vehicleNo: 'BR01GN4328', invoiceNo: 'TRIP-0243346', lrNo: '462000445', recWt: 45.24 },
  { date: '2026-04-20', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0243347', lrNo: '462000445', recWt: 41.19 },
  { date: '2026-04-20', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0243355', lrNo: '462000445', recWt: 40.96 },
  { date: '2026-04-20', vehicleNo: 'BR01GN4328', invoiceNo: 'TRIP-0243375', lrNo: '462000445', recWt: 43.35 },
  { date: '2026-04-20', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0243401', lrNo: '462000445', recWt: 42.63 },
  { date: '2026-04-21', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0243405', lrNo: '462000445', recWt: 43.08 },
  { date: '2026-04-21', vehicleNo: 'BR01GN4328', invoiceNo: 'TRIP-0243427', lrNo: '462000446', recWt: 44.09 },
  { date: '2026-04-21', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0243448', lrNo: '462000446', recWt: 42.40 },
  { date: '2026-04-21', vehicleNo: 'BR01GN4328', invoiceNo: 'TRIP-0243457', lrNo: '462000446', recWt: 43.59 },
  { date: '2026-04-21', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0243454', lrNo: '462000446', recWt: 42.43 },
  { date: '2026-04-21', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0243490', lrNo: '462000295', recWt: 45.86 },
  { date: '2026-04-21', vehicleNo: 'BR01GN4328', invoiceNo: 'TRIP-0243499', lrNo: '462000446', recWt: 44.38 },
  { date: '2026-04-21', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0243537', lrNo: '462000446', recWt: 42.63 },
  { date: '2026-04-21', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0243557', lrNo: '462000446', recWt: 42.29 },
  { date: '2026-04-22', vehicleNo: 'BR01GN4328', invoiceNo: 'TRIP-0243590', lrNo: '462000447', recWt: 45.45 },
  { date: '2026-04-22', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0243608', lrNo: '462000447', recWt: 36.32 },
  { date: '2026-04-22', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0243595', lrNo: '462000447', recWt: 36.26 },
  { date: '2026-04-22', vehicleNo: 'BR01GN4328', invoiceNo: 'TRIP-0243631', lrNo: '462000447', recWt: 43.40 },
  { date: '2026-04-22', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0243636', lrNo: '462000447', recWt: 41.40 },
  { date: '2026-04-22', vehicleNo: 'BR01GN4328', invoiceNo: 'TRIP-0243664', lrNo: '462000447', recWt: 44.38 },
  { date: '2026-04-22', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0243682', lrNo: '462000447', recWt: 43.74 },
  { date: '2026-04-22', vehicleNo: 'BR01GN4328', invoiceNo: 'TRIP-0243705', lrNo: '462000447', recWt: 44.23 },
  { date: '2026-04-23', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0243740', lrNo: '462000447', recWt: 41.23 },
  { date: '2026-04-23', vehicleNo: 'BR01GN4328', invoiceNo: 'TRIP-0243735', lrNo: '462000447', recWt: 43.39 },
  { date: '2026-04-23', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0243770', lrNo: '462000448', recWt: 43.63 },
  { date: '2026-04-23', vehicleNo: 'BR01GN4328', invoiceNo: 'TRIP-0243773', lrNo: '462000448', recWt: 42.63 },
  { date: '2026-04-23', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0243781', lrNo: '462000448', recWt: 39.86 },
  { date: '2026-04-20', vehicleNo: 'BR06GD0994', invoiceNo: 'TRIP-0243351', lrNo: '462000445', recWt: 41.85 },
  { date: '2026-04-23', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0243805', lrNo: '462000448', recWt: 44.45 },
  { date: '2026-04-23', vehicleNo: 'BR01GN4328', invoiceNo: 'TRIP-0243801', lrNo: '462000448', recWt: 44.76 },
  { date: '2026-04-23', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0243810', lrNo: '462000448', recWt: 38.79 },
  { date: '2026-04-23', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0243827', lrNo: '462000448', recWt: 45.65 },
  { date: '2026-04-23', vehicleNo: 'BR01GN4328', invoiceNo: 'TRIP-0243828', lrNo: '462000448', recWt: 46.03 },
  { date: '2026-04-23', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0243845', lrNo: '462000448', recWt: 38.26 },
  { date: '2026-04-23', vehicleNo: 'BR06GD0994', invoiceNo: 'TRIP-0243826', lrNo: '462000448', recWt: 42.86 },
  { date: '2026-04-24', vehicleNo: 'BR01GN4328', invoiceNo: 'TRIP-0243860', lrNo: '462000448', recWt: 39.37 },
  { date: '2026-04-24', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0243876', lrNo: '462000448', recWt: 40.46 },
  { date: '2026-04-24', vehicleNo: 'BR01GN4328', invoiceNo: 'TRIP-0243889', lrNo: '462000448', recWt: 44.66 },
  { date: '2026-04-24', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0243858', lrNo: '462000448', recWt: 39.77 },
  { date: '2026-04-24', vehicleNo: 'BR01GN4328', invoiceNo: 'TRIP-0243922', lrNo: '462000449', recWt: 37.13 },
  { date: '2026-04-24', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0243924', lrNo: '462000449', recWt: 39.97 },
  { date: '2026-04-24', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0243926', lrNo: '462000449', recWt: 40.52 },
  { date: '2026-04-24', vehicleNo: 'BR01GN4328', invoiceNo: 'TRIP-0243957', lrNo: '462000449', recWt: 45.68 },
  { date: '2026-04-24', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0243959', lrNo: '462000449', recWt: 41.02 },
  { date: '2026-04-24', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0243955', lrNo: '462000449', recWt: 46.73 },
  { date: '2026-04-25', vehicleNo: 'BR01GN4328', invoiceNo: 'TRIP-0244001', lrNo: '462000449', recWt: 45.45 },
  { date: '2026-04-25', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0244006', lrNo: '462000449', recWt: 44.37 },
  { date: '2026-04-25', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0244010', lrNo: '462000449', recWt: 44.80 },
  { date: '2026-04-25', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0244035', lrNo: '462000449', recWt: 47.29 },
  { date: '2026-04-25', vehicleNo: 'BR01GN4328', invoiceNo: 'TRIP-0244034', lrNo: '462000449', recWt: 48.78 },
  { date: '2026-04-25', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0244042', lrNo: '462000449', recWt: 50.82 },
  { date: '2026-04-25', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0244072', lrNo: '462000450', recWt: 42.58 },
  { date: '2026-04-25', vehicleNo: 'BR01GN4328', invoiceNo: 'TRIP-0244079', lrNo: '462000450', recWt: 46.35 },
  { date: '2026-04-25', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0244080', lrNo: '462000450', recWt: 39.97 },
  { date: '2026-04-25', vehicleNo: 'BR06GD0994', invoiceNo: 'TRIP-0244104', lrNo: '462000450', recWt: 33.65 },
  { date: '2026-04-26', vehicleNo: 'BR01GN4328', invoiceNo: 'TRIP-0244119', lrNo: '462000450', recWt: 48.26 },
  { date: '2026-04-26', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0244116', lrNo: '462000450', recWt: 45.78 },
  { date: '2026-04-26', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0244139', lrNo: '462000450', recWt: 41.00 },
  { date: '2026-04-26', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0244170', lrNo: '462000450', recWt: 43.06 },
  { date: '2026-04-26', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0244164', lrNo: '462000450', recWt: 43.26 },
  { date: '2026-04-26', vehicleNo: 'BR01GN4328', invoiceNo: 'TRIP-0244184', lrNo: '462000450', recWt: 47.03 },
  { date: '2026-04-26', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0244201', lrNo: '462000450', recWt: 42.04 },
  { date: '2026-04-27', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0244257', lrNo: '462000451', recWt: 44.06 },
  { date: '2026-04-27', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0244299', lrNo: '462000451', recWt: 44.86 },
  { date: '2026-04-27', vehicleNo: 'BR01GN4328', invoiceNo: 'TRIP-0244378', lrNo: '462000451', recWt: 42.35 },
  { date: '2026-04-26', vehicleNo: 'BR06GD0994', invoiceNo: 'TRIP-0244145', lrNo: '462000450', recWt: 34.58 },
  { date: '2026-04-28', vehicleNo: 'BR01GN4328', invoiceNo: 'TRIP-0244426', lrNo: '462000451', recWt: 45.69 },
  { date: '2026-04-28', vehicleNo: 'BR01GN4328', invoiceNo: 'TRIP-0244477', lrNo: '462000452', recWt: 46.75 },
  { date: '2026-04-28', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0244517', lrNo: '462000452', recWt: 40.89 },
  { date: '2026-04-28', vehicleNo: 'BR01GN4328', invoiceNo: 'TRIP-0244518', lrNo: '462000452', recWt: 37.16 },
  { date: '2026-04-28', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0244521', lrNo: '462000452', recWt: 41.46 },
  { date: '2026-04-29', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0244536', lrNo: '462000452', recWt: 41.88 },
  { date: '2026-04-29', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0244559', lrNo: '462000452', recWt: 43.26 },
  { date: '2026-04-29', vehicleNo: 'BR01GN4328', invoiceNo: 'TRIP-0244575', lrNo: '462000452', recWt: 45.68 },
  { date: '2026-04-29', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0244594', lrNo: '462000452', recWt: 37.98 },
  { date: '2026-04-29', vehicleNo: 'BR01GN4328', invoiceNo: 'TRIP-0244605', lrNo: '462000452', recWt: 42.85 },
  { date: '2026-04-29', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0244635', lrNo: '462000453', recWt: 40.18 },
  { date: '2026-04-29', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0244641', lrNo: '462000453', recWt: 38.31 },
  { date: '2026-04-30', vehicleNo: 'BR01GN4328', invoiceNo: 'TRIP-0244661', lrNo: '462000453', recWt: 40.28 },
  { date: '2026-04-30', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0244668', lrNo: '462000453', recWt: 38.28 },
  { date: '2026-04-30', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0244674', lrNo: '462000453', recWt: 38.26 },
  { date: '2026-04-30', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0244707', lrNo: '462000453', recWt: 37.16 },
  { date: '2026-04-30', vehicleNo: 'BR01GN4328', invoiceNo: 'TRIP-0244703', lrNo: '462000453', recWt: 37.70 },
  { date: '2026-04-30', vehicleNo: 'BR01GN0351', invoiceNo: 'TRIP-0244709', lrNo: '462000453', recWt: 37.54 },
  { date: '2026-04-30', vehicleNo: 'BR01GN4328', invoiceNo: 'TRIP-0244734', lrNo: '462000453', recWt: 39.25 },
  { date: '2026-04-30', vehicleNo: 'JH13J9407', invoiceNo: 'TRIP-0244735', lrNo: '462000453', recWt: 35.82 },
]

async function main() {
  console.log(`Total trips to insert: ${rawTrips.length}`)

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

  // Check for missing vehicles
  const missingPlates = plateNos.filter(p => !vehicleMap[p])
  if (missingPlates.length > 0) {
    console.error(`\n❌ Missing vehicles: ${missingPlates.join(', ')}`)
    console.error('Please add these vehicles first!')
    return
  }

  // 2. Get project info for rates
  const projectId = vehicles[0].projectId
  if (!projectId) {
    console.error('❌ No project assigned to vehicles!')
    return
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId }
  })

  if (!project) {
    console.error('❌ Project not found!')
    return
  }

  console.log(`\nProject: ${project.projectName}`)
  console.log(`  Party Rate: ${project.partyRate}`)
  console.log(`  Owner Rate: ${project.ownerRate}`)

  // 3. DELETE all existing trips
  const deleted = await prisma.trip.deleteMany({})
  console.log(`\n🗑️ Deleted ${deleted.count} existing trips from the table.`)

  // 4. Insert all 129 trips
  const tripsToCreate = rawTrips.map(t => {
    const vehicle = vehicleMap[t.vehicleNo]
    const weight = t.recWt // Using REC WT as requested
    const ownerRate = project.ownerRate
    const partyRate = project.partyRate

    return {
      date: new Date(t.date),
      invoiceNo: t.invoiceNo,
      lrNo: t.lrNo,
      vehicleId: vehicle.id,
      projectId: projectId,
      weight: weight,
      ownerRate: ownerRate,
      partyRate: partyRate,
      ownerFreightAmount: parseFloat((weight * ownerRate).toFixed(2)),
      partyFreightAmount: parseFloat((weight * partyRate).toFixed(2)),
    }
  })

  const result = await prisma.trip.createMany({
    data: tripsToCreate,
    skipDuplicates: true,
  })

  console.log(`\n✅ Successfully inserted ${result.count} trips!`)

  // 5. Summary
  const totalWeight = rawTrips.reduce((sum, t) => sum + t.recWt, 0)
  console.log(`\n📊 Summary:`)
  console.log(`  Total trips inserted: ${result.count}`)
  console.log(`  Total weight (REC WT): ${totalWeight.toFixed(2)} MT`)
  console.log(`  Date range: ${rawTrips[0].date} to ${rawTrips[rawTrips.length - 1].date}`)

  // Vehicle-wise breakdown
  const byVehicle: Record<string, { count: number; weight: number }> = {}
  for (const t of rawTrips) {
    if (!byVehicle[t.vehicleNo]) byVehicle[t.vehicleNo] = { count: 0, weight: 0 }
    byVehicle[t.vehicleNo].count++
    byVehicle[t.vehicleNo].weight += t.recWt
  }
  console.log(`\n  Vehicle-wise breakdown:`)
  for (const [plate, data] of Object.entries(byVehicle)) {
    console.log(`    ${plate}: ${data.count} trips, ${data.weight.toFixed(2)} MT`)
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
