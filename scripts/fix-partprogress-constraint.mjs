/**
 * Drops the legacy unique constraint (userId, partNumber) from PartProgress.
 *
 * Background: The schema originally had @@unique([userId, partNumber]).
 * After the family profiles migration, it was changed to @@unique([learnerProfileId, partNumber]).
 * The new index was created but the old one was never dropped, causing a P2002 error
 * whenever two profiles under the same account try to track the same part number.
 */
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

console.log("Dropping legacy unique constraint PartProgress_userId_partNumber_key...");
await prisma.$executeRaw`DROP INDEX IF EXISTS "PartProgress_userId_partNumber_key"`;
console.log("✅ Done.");

// Verify
const indexes = await prisma.$queryRaw`
  SELECT indexname FROM pg_indexes WHERE tablename = 'PartProgress' ORDER BY indexname
`;
console.log("\nRemaining indexes:");
for (const idx of indexes) console.log("  •", idx.indexname);

await prisma.$disconnect();
