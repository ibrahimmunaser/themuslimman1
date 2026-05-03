import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function clearAllProgress() {
  console.log("🗑️  Starting to clear all student progress...");

  try {
    // Delete all progress records
    const deletedPartProgress = await prisma.partProgress.deleteMany({});
    console.log(`✅ Deleted ${deletedPartProgress.count} PartProgress records`);

    const deletedStudentProgress = await prisma.studentProgress.deleteMany({});
    console.log(`✅ Deleted ${deletedStudentProgress.count} StudentProgress records`);

    // Delete all quiz-related data
    const deletedQuizAnswers = await prisma.quizAnswer.deleteMany({});
    console.log(`✅ Deleted ${deletedQuizAnswers.count} QuizAnswer records`);

    const deletedQuizAttempts = await prisma.quizAttempt.deleteMany({});
    console.log(`✅ Deleted ${deletedQuizAttempts.count} QuizAttempt records`);

    // Delete all exam attempts
    const deletedExamAttempts = await prisma.examAttempt.deleteMany({});
    console.log(`✅ Deleted ${deletedExamAttempts.count} ExamAttempt records`);

    // Delete activity logs (optional - tracks student activities)
    const deletedActivityLogs = await prisma.activityLog.deleteMany({});
    console.log(`✅ Deleted ${deletedActivityLogs.count} ActivityLog records`);

    console.log("\n✨ All student progress has been cleared successfully!");
    console.log("🎯 Students can now start fresh!");
  } catch (error) {
    console.error("❌ Error clearing progress:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

clearAllProgress();
