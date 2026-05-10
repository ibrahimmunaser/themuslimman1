import "server-only";
import { prisma } from "@/lib/db";
import { ROLES } from "@/lib/roles";

export async function getAdminDashboardData() {
  const [
    totalStudents,
    paidStudents,
    revenueResult,
    partsCompleted,
    quizStats,
    recentSignups,
    openSupportTickets,
  ] = await Promise.all([
    // Total students
    prisma.user.count({ where: { role: ROLES.STUDENT } }),

    // Paid students (successful purchase)
    prisma.purchase.groupBy({
      by: ["userId"],
      where: { status: "succeeded" },
    }).then((r) => r.length),

    // Total revenue from succeeded purchases
    prisma.purchase.aggregate({
      where: { status: "succeeded" },
      _sum: { amount: true },
      _count: true,
    }),

    // Total part completions across all students
    prisma.partProgress.count({ where: { status: "completed" } }),

    // Quiz performance (part-based quizzes via PartProgress)
    prisma.partProgress.aggregate({
      where: { quizCompleted: true, quizBestScore: { not: null } },
      _avg: { quizBestScore: true },
      _count: { quizCompleted: true },
    }),

    // Recent student signups
    prisma.user.findMany({
      where: { role: ROLES.STUDENT },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        fullName: true,
        email: true,
        createdAt: true,
        lastLoginAt: true,
        hasPaid: true,
      },
    }),

    // Open support tickets
    prisma.supportTicket.count({ where: { status: "open" } }),
  ]);

  const totalRevenueCents = revenueResult._sum.amount ?? 0;
  const totalOrders = revenueResult._count;
  const avgQuizScore = quizStats._avg.quizBestScore;
  const totalQuizCompletions = quizStats._count.quizCompleted;

  return {
    totalStudents,
    paidStudents,
    totalRevenueCents,
    totalOrders,
    partsCompleted,
    avgQuizScore,
    totalQuizCompletions,
    recentSignups,
    openSupportTickets,
  };
}

export async function getAdminOrdersData() {
  const [purchases, revenueResult, paidCount] = await Promise.all([
    prisma.purchase.findMany({
      include: {
        user: { select: { fullName: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),

    prisma.purchase.aggregate({
      where: { status: "succeeded" },
      _sum: { amount: true },
      _count: true,
    }),

    prisma.purchase.groupBy({
      by: ["userId"],
      where: { status: "succeeded" },
    }).then((r) => r.length),
  ]);

  return {
    purchases,
    totalRevenueCents: revenueResult._sum.amount ?? 0,
    totalOrders: revenueResult._count,
    uniqueBuyers: paidCount,
  };
}
