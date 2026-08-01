import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

/**
 * Creates a platform admin. Password MUST come from ADMIN_BOOTSTRAP_PASSWORD.
 * Never commit real passwords to this file.
 */
async function main() {
  const email = process.env.ADMIN_BOOTSTRAP_EMAIL ?? "admin@example.com";
  const password = process.env.ADMIN_BOOTSTRAP_PASSWORD;
  if (!password || password.length < 12) {
    console.error("Set ADMIN_BOOTSTRAP_PASSWORD (min 12 chars) before running.");
    process.exit(1);
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log("Admin already exists:", email);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.create({
    data: {
      id: crypto.randomUUID(),
      updatedAt: new Date(),
      fullName: "Platform Admin",
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
