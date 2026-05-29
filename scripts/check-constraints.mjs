import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const indexes = await prisma.$queryRaw`
  SELECT indexname, indexdef 
  FROM pg_indexes 
  WHERE tablename = 'PartProgress'
  ORDER BY indexname
`;
console.log("PartProgress indexes:");
for (const idx of indexes) {
  console.log(`  ${idx.indexname}:`);
  console.log(`    ${idx.indexdef}`);
}

await prisma.$disconnect();
