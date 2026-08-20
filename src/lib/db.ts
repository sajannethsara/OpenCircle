import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const DEFAULT_DB_URL =
  "postgresql://neondb_owner:npg_YI0EiRZHj1Dw@ep-lingering-river-azpvr3d2-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

function createPrismaClient() {
  const connectionString = process.env.DB_URL || process.env.DATABASE_URL || DEFAULT_DB_URL;
  const pool = new pg.Pool({
    connectionString,
  });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
