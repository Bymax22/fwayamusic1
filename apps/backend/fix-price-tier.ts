import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    // First, check current state
    console.log('Current price tiers:');
    const allTiers = await prisma.priceTier.findMany({
      include: { productType: true },
      orderBy: { createdAt: 'desc' },
    });
    
    console.log(
      allTiers.map((t) => ({
        id: t.id,
        name: t.name,
        active: t.active,
        productType: t.productType?.name,
        effectiveFrom: t.effectiveFrom,
        effectiveTo: t.effectiveTo,
        status:
          t.effectiveTo && t.effectiveTo < new Date()
            ? 'EXPIRED'
            : t.effectiveFrom && t.effectiveFrom > new Date()
            ? 'NOT_YET_ACTIVE'
            : 'VALID',
      }))
    );

    // Fix expired tier (id=1)
    const now = new Date();
    const futureDate = new Date('2026-12-31 23:59:59');
    
    const updated = await prisma.priceTier.updateMany({
      where: { 
        id: 1,
        effectiveTo: { lt: now }
      },
      data: { effectiveTo: futureDate }
    });

    console.log(`\nUpdated ${updated.count} expired tier(s)`);

    // Check the result
    const result = await prisma.priceTier.findMany({
      include: { productType: true },
      where: { active: true },
      orderBy: { createdAt: 'desc' },
    });

    console.log(`\nActive tiers after fix:`);
    console.log(
      result.map((t) => ({
        id: t.id,
        name: t.name,
        active: t.active,
        productType: t.productType?.name,
        effectiveFrom: t.effectiveFrom,
        effectiveTo: t.effectiveTo,
      }))
    );

  } catch (error) {
    console.error('Error fixing price tier:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
