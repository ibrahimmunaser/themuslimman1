import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// In serverless (Vercel), limit connections and set aggressive timeouts so that
// transient cold-start failures surface quickly and can be retried by the caller.
//   connection_limit=1  – one connection per function instance (standard for serverless)
//   connect_timeout=10  – TCP connection establishment limit (seconds)
//   pool_timeout=10     – max wait for a connection from the pool (seconds)
//                         Lower than the old 20 s so users get a fast error + retry
function buildDatabaseUrl() {
  const url = process.env.DATABASE_URL;
  if (!url) return url;
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}connection_limit=1&connect_timeout=10&pool_timeout=10`;
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
