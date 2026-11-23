import { PrismaClient } from "./generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function getConnectionString(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not configured. Please set it in .env or .env.local with your PostgreSQL connection string."
    );
  }
  // In production, reject placeholder/localhost URLs
  if (process.env.NODE_ENV === "production" && (url.includes("localhost") || url.includes("password@"))) {
    throw new Error(
      "DATABASE_URL must point to a real PostgreSQL instance in production."
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
