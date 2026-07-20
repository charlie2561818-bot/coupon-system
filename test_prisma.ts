import { PrismaClient } from '@prisma/client';
import { createClient } from '@libsql/client';
import { PrismaLibSQL } from '@prisma/adapter-libsql';
import dotenv from 'dotenv';
dotenv.config();

const libsql = createClient({
  url: process.env.DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});
const adapter = new PrismaLibSQL(libsql);
const prisma = new PrismaClient({ adapter });

async function main() {
  try {
    const liffLocation = await prisma.qrLocation.findUnique({
      where: { id: 'LINE_LIFF' }
    });
    console.log(liffLocation);
    const locations = await prisma.qrLocation.findMany();
    console.log("Locations:", locations);
  } catch (e) {
    console.error("ERROR:", e);
  }
}
main();
