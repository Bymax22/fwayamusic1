import { PrismaClient } from '@prisma/client';

async function testDB() {
  const prisma = new PrismaClient();
  try {
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    // Test a simple query
    const count = await prisma.media.count();
    console.log(`📊 Media records: ${count}`);
    
    // Test relation queries using only valid relations from your schema
    const mediaWithRelations = await prisma.media.findFirst({
      include: {
        // Include only relations that exist in your Prisma schema
        user: true,  // Common relation that likely exists
        // Add other relations that exist in your Media model
        // Example:
        // categories: true,
        // comments: true
      }
    });
    
    console.log('🎵 Sample media with relations:', 
      JSON.stringify(mediaWithRelations, null, 2));
    
    return true;
  } catch (error) {
    console.error('❌ Database error:', error);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

// Run with async wrapper
(async () => {
  const success = await testDB();
  process.exit(success ? 0 : 1);
})();