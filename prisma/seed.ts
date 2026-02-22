import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("Seed script — Phase 11 implementation pending");
  // La logique de seed sera implementee en Phase 11
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
