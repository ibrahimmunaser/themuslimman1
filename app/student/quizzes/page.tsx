import { redirect } from "next/navigation";
import { requireStudent } from "@/lib/auth";
import { StudentLayout } from "@/components/student/student-layout";
import { prisma } from "@/lib/db";
import { ClipboardCheck, Clock, CheckCircle2, XCircle } from "lucide-react";

export const metadata = { title: "Quizzes | Seerah Masterclass" };
export const dynamic = "force-dynamic";

export default async function QuizzesPage() {
  const user = await requireStudent();
  if (!user.studentProfileId) redirect("/");

  const purchases = await prisma.purchase.findMany({
    where: { userId: user.id, status: "succeeded" },
  });

  if (purchases.length === 0) redirect("/pricing");

  const hasCompletePlan = purchases.some(p => p.planId === "complete");
  const userPlan = hasCompletePlan ? "complete" : "essentials";

  return (
    <StudentLayout userPlan={userPlan} userName={user.fullName}>
      <div className="min-h-screen bg-[#0a0a0a]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-text mb-2">Quizzes</h1>
            <p className="text-text-secondary">
              Test your knowledge and track your quiz performance
            </p>
          </div>

          {/* Stats */}
          <div className="grid sm:grid-cols-3 gap-4 mb-8">
            {[
              { icon: ClipboardCheck, label: "Total Quizzes", value: "0", color: "gold" },
              { icon: CheckCircle2, label: "Completed", value: "0", color: "green" },
              { icon: Clock, label: "In Progress", value: "0", color: "blue" },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="p-6 rounded-xl border border-border bg-surface">
                  <div className="flex items-center gap-3 mb-2">
                    <Icon className={`w-5 h-5 text-${stat.color}-500`} />
                    <p className="text-text-muted text-sm">{stat.label}</p>
                  </div>
                  <p className="text-3xl font-bold text-text">{stat.value}</p>
                </div>
              );
            })}
          </div>

          {/* Coming Soon */}
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center mx-auto mb-4">
              <ClipboardCheck className="w-8 h-8 text-gold" />
            </div>
            <h2 className="text-xl font-semibold text-text mb-2">Quiz History Coming Soon</h2>
            <p className="text-text-secondary max-w-md mx-auto">
              Your quiz attempts and scores will be displayed here. Complete quizzes within lessons to track your progress.
            </p>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}
