// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaClient } = require("../.prisma/client");
import { PrismaPg } from "@prisma/adapter-pg";

type PrismaClientType = InstanceType<typeof PrismaClient>;

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClientType };

function createClient(): PrismaClientType {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  return new PrismaClient({ adapter });
}

export const prisma: PrismaClientType =
  globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
