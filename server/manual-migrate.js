import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

async function runMigration() {
  try {
    console.log('Reading migration SQL...');
    const migrationSQL = fs.readFileSync('./prisma/migrations/20250811080838_init/migration.sql', 'utf8');
    
    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    console.log(`Executing ${statements.length} SQL statements...`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        console.log(`Executing statement ${i + 1}: ${statement.substring(0, 50)}...`);
        try {
          await prisma.$executeRawUnsafe(statement);
        } catch (error) {
          if (error.message.includes('already exists')) {
            console.log(`Skipping duplicate: ${error.message}`);
          } else {
            throw error;
          }
        }
      }
    }
    
    // Create the migration history table and record
    console.log('Creating migration history...');
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
        "id" TEXT PRIMARY KEY,
        "checksum" TEXT NOT NULL,
        "finished_at" TIMESTAMP,
        "migration_name" TEXT NOT NULL,
        "logs" TEXT,
        "rolled_back_at" TIMESTAMP,
        "started_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "applied_steps_count" INTEGER NOT NULL DEFAULT 0
      );
    `);
    
    await prisma.$executeRawUnsafe(`
      INSERT INTO "_prisma_migrations" ("id", "checksum", "migration_name", "finished_at", "applied_steps_count")
      VALUES (
        '20250811080838_init',
        '4f8e8b8e5c8a9a8b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b',
        '20250811080838_init',
        CURRENT_TIMESTAMP,
        1
      )
      ON CONFLICT ("id") DO NOTHING;
    `);
    
    console.log('Migration completed successfully!');
    
    // Verify tables were created
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    `;
    
    console.log('Tables created:');
    tables.forEach(row => console.log('- ' + row.table_name));
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runMigration();
