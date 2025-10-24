// src/test-prisma.ts
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Test queries here
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());