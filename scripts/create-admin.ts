import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "themuslimman77@gmail.com";

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log("Admin already exists:", email);
    return;
  }

  const passwordHash = await bcrypt.hash("Chemithabet22?", 12);
  await prisma.user.create({
    data: {
      fullName: "TheMuslimMan Admin",
      email,
      passwordHash,
      role: "platform_admin",
      isActive: true,
      emailVerified: true,
    },
  });

  console.log("Admin created:", email);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
