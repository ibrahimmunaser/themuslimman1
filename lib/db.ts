import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// In serverless (Vercel), each function instance needs its own connection budget.
// Use a small pool so concurrent edge-function invocations don't starve each other.
//   connection_limit=5  – allow a few concurrent connections per instance
//   connect_timeout=15  – TCP connection establishment limit (seconds)
//   pool_timeout=30     – max wait for a connection from the pool (seconds)
//                         Higher than before so brief traffic spikes don't P2024.
function buildDatabaseUrl() {
  const url = process.env.DATABASE_URL;
  if (!url) return url;
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}connection_limit=5&connect_timeout=15&pool_timeout=30`;
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl: buildDatabaseUrl(),
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Gracefully handle disconnection
if (typeof window === "undefined") {
  process.on("beforeExit", async () => {
    await prisma.$disconnect();
  });
}
