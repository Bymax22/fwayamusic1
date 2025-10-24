import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['error', 'warn'], // Optional: log errors/warnings
    // Uncomment below to set connection limit if needed:
    // datasources: { db: { connection_limit: 20 } }
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;