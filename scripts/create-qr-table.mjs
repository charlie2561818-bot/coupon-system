import { createClient } from '@libsql/client';
import 'dotenv/config';

const client = createClient({
  url: process.env.DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function main() {
  await client.execute(`
    CREATE TABLE IF NOT EXISTS "QrLocation" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "name" TEXT NOT NULL,
      "activeCampaignId" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('✅ QrLocation table created successfully!');
  
  // Verify
  const result = await client.execute('SELECT name FROM sqlite_master WHERE type="table"');
  console.log('Tables:', result.rows.map(r => r.name));
}

main().catch(console.error);
