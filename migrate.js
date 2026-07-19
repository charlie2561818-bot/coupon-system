import { createClient } from "@libsql/client";
import "dotenv/config";

async function main() {
  const client = createClient({
    url: process.env.DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  try {
    await client.execute("ALTER TABLE Coupon ADD COLUMN isDraw BOOLEAN NOT NULL DEFAULT 1;");
    console.log("Migration successful.");
  } catch (err) {
    console.error("Migration failed:", err);
  }
}
main();
