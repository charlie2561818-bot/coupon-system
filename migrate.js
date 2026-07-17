const fs = require('fs');
const { createClient } = require('@libsql/client');
require('dotenv').config();

async function main() {
  const sql = fs.readFileSync('migration.sql', 'utf8');
  const client = createClient({
    url: process.env.DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
  await client.executeMultiple(sql);
  console.log("Migration applied successfully!");
}
main().catch(console.error);
