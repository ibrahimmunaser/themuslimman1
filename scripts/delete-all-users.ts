import { prisma } from "../lib/db";

async function deleteAllUsers() {
  try {
    console.log("\n🗑️  Deleting all user accounts and related data...\n");

    // Delete in order to respect foreign key constraints
    
    // 1. Delete all sessions
    const sessionsDeleted = await prisma.session.deleteMany({});
    console.log(`✓ Deleted ${sessionsDeleted.count} sessions`);

    // 2. Delete all activity logs
    const activityLogsDeleted = await prisma.activityLog.deleteMany({});
    console.log(`✓ Deleted ${activityLogsDeleted.count} activity logs`);

    // 3. Delete all part progress
    const partProgressDeleted = await prisma.partProgress.deleteMany({});
    console.log(`✓ Deleted ${partProgressDeleted.count} part progress records`);

    // 4. Delete all purchases
    const purchasesDeleted = await prisma.purchase.deleteMany({});
    console.log(`✓ Deleted ${purchasesDeleted.count} purchases`);

    // 5. Delete all student profiles
    const studentProfilesDeleted = await prisma.studentProfile.deleteMany({});
    console.log(`✓ Deleted ${studentProfilesDeleted.count} student profiles`);

    // 6. Finally, delete all users
    const usersDeleted = await prisma.user.deleteMany({});
    console.log(`✓ Deleted ${usersDeleted.count} users`);

    console.log("\n✅ All user accounts and related data have been removed.\n");
  } catch (error) {
    console.error("❌ Error deleting users:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

deleteAllUsers();
