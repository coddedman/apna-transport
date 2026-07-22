const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const projects = await prisma.project.findMany();
  const vehicles = await prisma.vehicle.findMany({ include: { owner: true } });
  
  console.log("Projects:");
  console.log(JSON.stringify(projects, null, 2));
  
  console.log("\nVehicles:");
  console.log(JSON.stringify(vehicles, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
