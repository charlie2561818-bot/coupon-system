import { createClient } from "@libsql/client";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });

const client = createClient({
  url: process.env.DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function run() {
  try {
    await client.execute("ALTER TABLE Coupon ADD COLUMN showInCart BOOLEAN NOT NULL DEFAULT 1;");
    console.log("Success");
  } catch(e) {
    console.error(e);
  }
}
run();
