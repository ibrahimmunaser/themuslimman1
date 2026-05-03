import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function cleanupAllStudents() {
  console.log("🧹 Starting complete student account cleanup...\n");

  try {
    // Get count of student accounts before deletion
    const studentCount = await prisma.user.count({
      where: { role: "student" }
    });

    const adminCount = await prisma.user.count({
      where: { role: "platform_admin" }
    });

    console.log(`📊 Current Database State:`);
    console.log(`   Students: ${studentCount}`);
    console.log(`   Admins: ${adminCount}`);
    console.log(``);

    if (studentCount === 0) {
      console.log("✅ No student accounts found. Database is already clean!");
      return;
    }

    console.log(`⚠️  About to delete ${studentCount} student account(s) and all associated data:\n`);
    console.log(`   - User accounts`);
    console.log(`   - Student profiles`);
    console.log(`   - Sessions`);
    console.log(`   - Purchases`);
    console.log(`   - Progress records`);
    console.log(`   - Quiz attempts`);
    console.log(`   - Exam attempts`);
    console.log(`   - Activity logs`);
    console.log(`   - Enrollments`);
    console.log(``);

    // Delete in correct order to respect foreign key constraints

    // 1. Delete activity logs
    const deletedActivityLogs = await prisma.activityLog.deleteMany({
      where: {
        user: {
          role: "student"
        }
      }
    });
    console.log(`✅ Deleted ${deletedActivityLogs.count} activity logs`);

    // 2. Delete quiz answers and attempts
    const deletedQuizAnswers = await prisma.quizAnswer.deleteMany({
      where: {
        attempt: {
          student: {
            user: {
              role: "student"
            }
          }
        }
      }
    });
    console.log(`✅ Deleted ${deletedQuizAnswers.count} quiz answers`);

    const deletedQuizAttempts = await prisma.quizAttempt.deleteMany({
      where: {
        student: {
          user: {
            role: "student"
          }
        }
      }
    });
    console.log(`✅ Deleted ${deletedQuizAttempts.count} quiz attempts`);

    // 3. Delete exam attempts
    const deletedExamAttempts = await prisma.examAttempt.deleteMany({
      where: {
        student: {
          user: {
            role: "student"
          }
        }
      }
    });
    console.log(`✅ Deleted ${deletedExamAttempts.count} exam attempts`);

    // 4. Delete student progress
    const deletedStudentProgress = await prisma.studentProgress.deleteMany({
      where: {
        student: {
          user: {
            role: "student"
          }
        }
      }
    });
    console.log(`✅ Deleted ${deletedStudentProgress.count} student progress records`);

    // 5. Delete part progress
    const deletedPartProgress = await prisma.partProgress.deleteMany({
      where: {
        user: {
          role: "student"
        }
      }
    });
    console.log(`✅ Deleted ${deletedPartProgress.count} part progress records`);

    // 6. Delete release overrides
    const deletedReleaseOverrides = await prisma.studentReleaseOverride.deleteMany({
      where: {
        student: {
          user: {
            role: "student"
          }
        }
      }
    });
    console.log(`✅ Deleted ${deletedReleaseOverrides.count} release overrides`);

    // 7. Delete class enrollments
    const deletedEnrollments = await prisma.classEnrollment.deleteMany({
      where: {
        student: {
          user: {
            role: "student"
          }
        }
      }
    });
    console.log(`✅ Deleted ${deletedEnrollments.count} class enrollments`);

    // 8. Delete purchases
    const deletedPurchases = await prisma.purchase.deleteMany({
      where: {
        user: {
          role: "student"
        }
      }
    });
    console.log(`✅ Deleted ${deletedPurchases.count} purchases`);

    // 9. Delete sessions
    const deletedSessions = await prisma.session.deleteMany({
      where: {
        user: {
          role: "student"
        }
      }
    });
    console.log(`✅ Deleted ${deletedSessions.count} sessions`);

    // 10. Delete student profiles
    const deletedStudentProfiles = await prisma.studentProfile.deleteMany({
      where: {
        user: {
          role: "student"
        }
      }
    });
    console.log(`✅ Deleted ${deletedStudentProfiles.count} student profiles`);

    // 11. Finally, delete user accounts
    const deletedUsers = await prisma.user.deleteMany({
      where: {
        role: "student"
      }
    });
    console.log(`✅ Deleted ${deletedUsers.count} user accounts`);

    console.log(`\n🎉 Cleanup complete!`);
    console.log(`\n📊 Final Database State:`);
    
    const finalStudentCount = await prisma.user.count({
      where: { role: "student" }
    });
    const finalAdminCount = await prisma.user.count({
      where: { role: "platform_admin" }
    });

    console.log(`   Students: ${finalStudentCount}`);
    console.log(`   Admins: ${finalAdminCount}`);
    console.log(`\n✨ Your website is ready for launch with a clean database!`);

  } catch (error) {
    console.error("❌ Error during cleanup:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

console.log("⚠️  WARNING: This will delete ALL student accounts and their data!");
console.log("⚠️  Platform admin accounts will be preserved.");
console.log("");

cleanupAllStudents();
