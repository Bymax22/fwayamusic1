import { prisma } from './client';

async function main() {
  // Business settings
  const settings = [
    { key: 'VAT_RATE', value: '16' },
    { key: 'PAYMENT_PROVISION_PERCENT', value: '5' },
    { key: 'ARTIST_SHARE_PERCENT_DIRECT', value: '75' },
    { key: 'FWAYA_SHARE_PERCENT_DIRECT', value: '25' },
    { key: 'ARTIST_SHARE_PERCENT_RESELLER', value: '65' },
    { key: 'RESELLER_SHARE_PERCENT', value: '20' },
    { key: 'FWAYA_SHARE_PERCENT', value: '15' },
    { key: 'MIN_FWAYA_MARGIN', value: '0' },
  ];

  for (const s of settings) {
    await prisma.businessSetting.upsert({ where: { key: s.key }, update: { value: s.value }, create: { key: s.key, value: s.value } });
  }

  // Product types
  const productTypesData = [
    { name: 'Single Song', description: 'One audio track' },
    { name: 'EP / Collated Songs', description: 'Approx. 2-6 audio tracks' },
    { name: 'Album', description: 'Approx. 7+ tracks' },
    { name: 'Music Video', description: 'Premium music video' },
    { name: 'Audio + Video Bundle', description: 'Audio plus corresponding premium video' },
  ];

  const createdTypes: Record<string, number> = {};
  for (const t of productTypesData) {
    const pt = await prisma.productType.upsert({ where: { name: t.name }, update: { description: t.description }, create: { name: t.name, description: t.description } });
    createdTypes[t.name] = pt.id;
  }

  // Price tiers for Single Song
  const singleSongTiers = [10,15,20,25,30,40,50];
  for (const p of singleSongTiers) {
    const existing = await prisma.priceTier.findFirst({ where: { productTypeId: createdTypes['Single Song'], name: `K${p}` } });
    if (existing) {
      await prisma.priceTier.update({ where: { id: existing.id }, data: { directPrice: p } });
    } else {
      await prisma.priceTier.create({ data: { productTypeId: createdTypes['Single Song'], name: `K${p}`, directPrice: p, resellerDiscount: Math.round(p * 0.1) } });
    }
  }

  // EP tiers
  const epTiers = [30,40,50,60,75,100];
  for (const p of epTiers) {
    const existing = await prisma.priceTier.findFirst({ where: { productTypeId: createdTypes['EP / Collated Songs'], name: `K${p}` } });
    if (existing) {
      await prisma.priceTier.update({ where: { id: existing.id }, data: { directPrice: p } });
    } else {
      await prisma.priceTier.create({ data: { productTypeId: createdTypes['EP / Collated Songs'], name: `K${p}`, directPrice: p, resellerDiscount: Math.round(p*0.1) } });
    }
  }

  // Album tiers
  const albumTiers = [75,100,150,200,250,300,350];
  for (const p of albumTiers) {
    const existing = await prisma.priceTier.findFirst({ where: { productTypeId: createdTypes['Album'], name: `K${p}` } });
    if (existing) {
      await prisma.priceTier.update({ where: { id: existing.id }, data: { directPrice: p } });
    } else {
      await prisma.priceTier.create({ data: { productTypeId: createdTypes['Album'], name: `K${p}`, directPrice: p, resellerDiscount: Math.round(p*0.1) } });
    }
  }

  // Music Video tiers (smaller set)
  const videoTiers = [20,30,40,50,75,100];
  for (const p of videoTiers) {
    const existing = await prisma.priceTier.findFirst({ where: { productTypeId: createdTypes['Music Video'], name: `K${p}` } });
    if (existing) {
      await prisma.priceTier.update({ where: { id: existing.id }, data: { directPrice: p } });
    } else {
      await prisma.priceTier.create({ data: { productTypeId: createdTypes['Music Video'], name: `K${p}`, directPrice: p, resellerDiscount: Math.round(p*0.05) } });
    }
  }

  console.log('Seeding complete');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
