import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkProgress() {
  console.log("🔍 Checking all progress data...\n");

  try {
    // Find user by email
    const user = await prisma.user.findFirst({
      where: {
        email: "ibrahimmunaser2@gmail.com"
      },
      include: {
        partProgress: true,
        student: {
          include: {
            progress: true,
            quizAttempts: true,
            examAttempts: true
          }
        }
      }
    });

    if (user) {
      console.log(`👤 User: ${user.fullName} (${user.email})`);
      console.log(`📊 PartProgress records: ${user.partProgress.length}`);
      console.log(`📊 StudentProgress records: ${user.student?.progress.length || 0}`);
      console.log(`📊 QuizAttempts: ${user.student?.quizAttempts.length || 0}`);
      console.log(`📊 ExamAttempts: ${user.student?.examAttempts.length || 0}`);
      
      if (user.partProgress.length > 0) {
        console.log("\n📝 Part Progress:");
        user.partProgress.forEach(p => {
          console.log(`  - Part ${p.partNumber}: ${p.status} (${p.progressPercent}%)`);
        });
      }
    } else {
      console.log("❌ User not found");
    }

    // Check all users
    const allUsers = await prisma.user.findMany({
      include: {
        partProgress: true,
        student: {
          include: {
            progress: true
          }
        }
      }
    });

    console.log(`\n📊 Total users: ${allUsers.length}`);
    let totalPartProgress = 0;
    let totalStudentProgress = 0;
    
    allUsers.forEach(u => {
      totalPartProgress += u.partProgress.length;
      totalStudentProgress += u.student?.progress.length || 0;
    });
    
    console.log(`📊 Total PartProgress across all users: ${totalPartProgress}`);
    console.log(`📊 Total StudentProgress across all users: ${totalStudentProgress}`);

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkProgress();
