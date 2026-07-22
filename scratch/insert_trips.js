const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  console.log("Starting script...");
  const filePath = path.join(__dirname, 'trips_data.tsv');
  const fileContent = fs.readFileSync(filePath, 'utf-8');

  const projectId = 'cmnu4rlue0001ic047ys9jae2'; // GAJRA BEHRA
  const defaultPartyRate = 133;
  const defaultOwnerRate = 125;
  
  // First get all vehicles
  const vehicles = await prisma.vehicle.findMany();
  const vehicleMap = new Map();
  for (const v of vehicles) {
    vehicleMap.set(v.plateNo, v.id);
  }

  const trips = [];
  const lines = fileContent.split('\n');
  
  let lineCount = 0;
  for (const line of lines) {
    lineCount++;
    if (!line.trim()) continue;
    
    // Split by tab
    const parts = line.split('\t');
    
    if (parts.length < 11) continue;
    
    const sno = parts[0].trim();
    if (isNaN(parseInt(sno))) {
      continue;
    }
    
    const dateStr = parts[1].trim(); // DD-MM-YYYY
    const vehicleNo = parts[2].trim();
    const invoiceNo = parts[3].trim();
    const lrNo = parts[6].trim();
    
    // REC WT is column 8 (0-indexed)
    const recWtStr = parts[8].trim();
    const weight = parseFloat(recWtStr);
    
    // FREIGHT is column 10
    const freightRate = parseFloat(parts[10].trim());
    
    // Parse date: DD-MM-YYYY
    const [day, month, year] = dateStr.split('-');
    const date = new Date(`${year}-${month}-${day}T00:00:00Z`);
    
    const vehicleId = vehicleMap.get(vehicleNo);
    if (!vehicleId) {
      console.warn(`Vehicle not found: ${vehicleNo} on line ${lineCount}`);
      continue;
    }
    
    const ownerRate = freightRate || defaultOwnerRate;
    const partyRate = defaultPartyRate;
    
    trips.push({
      date,
      invoiceNo,
      lrNo,
      vehicleId,
      projectId,
      weight,
      ownerRate, 
      partyRate, 
      ownerFreightAmount: weight * ownerRate,
      partyFreightAmount: weight * partyRate,
    });
  }
  
  console.log(`Parsed ${trips.length} trips.`);
  
  if (trips.length > 0) {
    const result = await prisma.trip.createMany({
      data: trips,
      skipDuplicates: true,
    });
    console.log(`Successfully inserted ${result.count} trips.`);
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
