// Prisma client singleton.
// Avoids exhausting DB connections from hot-reload (dev) and serverless re-instantiation.
// Pattern recommended for Next.js + Prisma. Lazy: the client does not connect until the
// first query, so importing this without DATABASE_URL set (e.g. at build) is safe.

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
