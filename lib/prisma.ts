import { PrismaClient } from "./generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function getConnectionString(): string {
  const url = process.env.DATABASE_URL;
  if (!url || url.includes("localhost") || url.includes("password@localhost")) {
    throw new Error(
      "DATABASE_URL is not configured. Please set it in .env.local with your real PostgreSQL connection string."
    );
  }
  return url;
}

function createClient(): PrismaClient {
  const adapter = new PrismaPg({ connectionString: getConnectionString() });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new PrismaClient({ adapter } as any);
}

export const prisma: PrismaClient =
  globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
