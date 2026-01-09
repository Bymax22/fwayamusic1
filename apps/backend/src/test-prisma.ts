// src/test-prisma.ts
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Listing all users:');
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      username: true,
      displayName: true,
      role: true,
      isEmailVerified: true,
      kycStatus: true,
      createdAt: true,
    },
  });
  console.log(users);

  console.log('\nListing all artists:');
  const artists = await prisma.user.findMany({
    where: {
      role: 'ARTIST',
    },
    select: {
      id: true,
      email: true,
      username: true,
      displayName: true,
      artistName: true,
      stageName: true,
      role: true,
      isEmailVerified: true,
      kycStatus: true,
      createdAt: true,
    },
  });
  console.log(artists);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());