import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

// Prisma v7 uses the "client" engine (WASM-based) which requires a database adapter.
// We use @prisma/adapter-pg with the pg driver to connect to PostgreSQL.
function createPrismaClient() {
  const adapter = new PrismaPg({ connectionString: process.env["DATABASE_URL"] });
  return new PrismaClient({
    adapter,
    log: ["error"],
  });
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
