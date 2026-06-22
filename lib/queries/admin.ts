import "server-only";
import { prisma } from "@/lib/db";
import { ROLES } from "@/lib/roles";

export async function getAdminDashboardData() {
  const startTime = Date.now();
  console.log(`[ADMIN_QUERY] getAdminDashboardData: Starting dashboard data fetch...`);
  
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

  const elapsed = Date.now() - startTime;
  console.log(`[ADMIN_QUERY] getAdminDashboardData: Complete - Students: ${totalStudents} (${paidStudents} paid), Revenue: $${(totalRevenueCents / 100).toFixed(2)} (${totalOrders} orders), Parts completed: ${partsCompleted}, Avg quiz: ${avgQuizScore?.toFixed(1)}%, Recent signups: ${recentSignups.length}, Support tickets: ${openSupportTickets} [${elapsed}ms]`);

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

export async function getAdminAnalyticsData() {
  const ROLES_STUDENT = "student";
  const ACTIVE_SUB_STATUSES = ["active", "trialing", "past_due"] as const;

  const [
    totalSignups,
    startedCheckout,
    completedPurchase,
    planBreakdown,
    subStatusBreakdown,
    abandonedUsers,
    revenueByPlan,
    recentAbandoned,
  ] = await Promise.all([
    // Total student signups
    prisma.user.count({ where: { role: ROLES_STUDENT } }),

    // Started checkout = Stripe customer was created (checkout page was reached and form was initialized)
    prisma.user.count({
      where: { role: ROLES_STUDENT, stripeCustomerId: { not: null } },
    }),

    // Completed a purchase (lifetime or subscription)
    prisma.user.count({
      where: {
        role: ROLES_STUDENT,
        OR: [
          { hasPaid: true },
          { subscriptions: { some: { status: { in: [...ACTIVE_SUB_STATUSES] } } } },
        ],
      },
    }),

    // Revenue + count broken down by planId
    prisma.purchase.groupBy({
      by: ["planId"],
      where: { status: "succeeded" },
      _sum: { amount: true },
      _count: { id: true },
      orderBy: { _sum: { amount: "desc" } },
    }),

    // Subscription counts by status
    prisma.subscription.groupBy({
      by: ["status"],
      _count: { id: true },
    }),

    // Checkout abandonment count: reached checkout (stripeCustomerId) but never purchased
    prisma.user.count({
      where: {
        role: ROLES_STUDENT,
        stripeCustomerId: { not: null },
        hasPaid: false,
        subscriptions: { none: { status: { in: [...ACTIVE_SUB_STATUSES] } } },
      },
    }),

    // Revenue by plan with plan name for display
    prisma.purchase.groupBy({
      by: ["planId", "planName"],
      where: { status: "succeeded" },
      _sum: { amount: true },
      _count: { id: true },
    }),

    // Recent abandoned checkout users for the table
    prisma.user.findMany({
      where: {
        role: ROLES_STUDENT,
        stripeCustomerId: { not: null },
        hasPaid: false,
        subscriptions: { none: { status: { in: [...ACTIVE_SUB_STATUSES] } } },
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        createdAt: true,
        lastLoginAt: true,
        emailVerified: true,
      },
      orderBy: { createdAt: "desc" },
      take: 25,
    }),
  ]);

  // Merge planBreakdown and revenueByPlan into one list
  const planStats = revenueByPlan.map((r) => ({
    planId:   r.planId,
    planName: r.planName,
    count:    r._count.id,
    revenueCents: r._sum.amount ?? 0,
  })).sort((a, b) => b.revenueCents - a.revenueCents);

  const subStats = subStatusBreakdown.map((s) => ({
    status: s.status,
    count:  s._count.id,
  }));

  return {
    funnel: {
      totalSignups,
      startedCheckout,
      completedPurchase,
      abandonedCheckout: abandonedUsers,
    },
    planStats,
    subStats,
    recentAbandoned,
  };
}

export async function getAdminEmailStats() {
  const ACTIVE_SUB = ["active", "trialing"] as const;

  const [
    totalNonPurchasers,
    uncontacted,
    autoSentStep1,
    autoSentStep2,
    manualSent,
    autoFailed,
    manualFailed,
  ] = await Promise.all([
    // All verified students with no paid access
    prisma.user.count({
      where: {
        role: "student",
        emailVerified: true,
        isActive: true,
        hasPaid: false,
        subscriptions: { none: { status: { in: [...ACTIVE_SUB] } } },
      },
    }),
    // Never contacted by any email flow
    prisma.user.count({
      where: {
        role: "student",
        emailVerified: true,
        isActive: true,
        hasPaid: false,
        subscriptions: { none: { status: { in: [...ACTIVE_SUB] } } },
        emailAutomationEvents: { none: {} },
        emailOutreachLogs:     { none: {} },
      },
    }),
    prisma.emailAutomationEvent.count({ where: { flowType: "NO_PLAN_RECOVERY", step: 1, status: "SENT" } }),
    prisma.emailAutomationEvent.count({ where: { flowType: "NO_PLAN_RECOVERY", step: 2, status: "SENT" } }),
    prisma.emailOutreachLog.count({ where: { status: "SENT" } }),
    prisma.emailAutomationEvent.count({ where: { status: "FAILED" } }),
    prisma.emailOutreachLog.count({ where: { status: "FAILED" } }),
  ]);

  const totalSent      = autoSentStep1 + autoSentStep2 + manualSent;
  const contacted      = totalNonPurchasers - uncontacted;
  const coveragePct    = totalNonPurchasers > 0
    ? Math.round((contacted / totalNonPurchasers) * 100)
    : 0;

  return {
    totalNonPurchasers,
    uncontacted,
    totalSent,
    autoSentStep1,
    autoSentStep2,
    manualSent,
    totalFailed: autoFailed + manualFailed,
    coveragePct,
  };
}

export async function getAdminOrdersData() {
  const startTime = Date.now();
  console.log(`[ADMIN_QUERY] getAdminOrdersData: Starting orders data fetch...`);
  
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

  const totalRevenueCents = revenueResult._sum.amount ?? 0;
  const totalOrders = revenueResult._count;

  const elapsed = Date.now() - startTime;
  console.log(`[ADMIN_QUERY] getAdminOrdersData: Complete - Fetched ${purchases.length} purchases, Revenue: $${(totalRevenueCents / 100).toFixed(2)} (${totalOrders} orders), Unique buyers: ${paidCount} [${elapsed}ms]`);

  return {
    purchases,
    totalRevenueCents,
    totalOrders,
    uniqueBuyers: paidCount,
  };
}
