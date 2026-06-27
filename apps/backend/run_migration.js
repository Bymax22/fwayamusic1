const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  const envLine = fs.readFileSync('.env', 'utf8').split(/\r?\n/).find(line => line.startsWith('DATABASE_URL='));
  if (!envLine) throw new Error('DATABASE_URL not found in .env');
  const url = envLine.split('=')[1].trim().replace(/^\"|\"$/g, '');
  
  // Read migration SQL
  const migrationPath = path.join(__dirname, 'prisma', 'migrations', 'fix_beatpack_relation', 'migration.sql');
  const migrationSql = fs.readFileSync(migrationPath, 'utf8');
  
  const client = new Client({ connectionString: url });
  try {
    await client.connect();
    console.log('Connected to database');
    
    // Execute migration SQL
    await client.query(migrationSql);
    console.log('✓ Migration executed successfully');
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
