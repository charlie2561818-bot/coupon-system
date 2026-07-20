import { createClient } from "@libsql/client";
import dotenv from "dotenv";
dotenv.config({ path: ".env" });
const client = createClient({
  url: process.env.DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});
async function run() {
  try {
    const coupons = await client.execute("SELECT count(*) as c FROM Coupon");
    const locs = await client.execute("SELECT count(*) as c FROM QrLocation");
    console.log("Coupons:", coupons.rows[0].c);
    console.log("Locs:", locs.rows[0].c);
  } catch(e) {
    console.error(e);
  }
}
run();
