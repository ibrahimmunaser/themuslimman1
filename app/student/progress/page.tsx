import { redirect } from "next/navigation";
import { requireStudent } from "@/lib/auth";
import { StudentLayout } from "@/components/student/student-layout";
import { prisma } from "@/lib/db";
import { TrendingUp, Target, Clock, Award, FileText } from "lucide-react";

export const metadata = { title: "Progress | Seerah Masterclass" };
export const dynamic = "force-dynamic";

export default async function ProgressPage() {
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
            <h1 className="text-3xl font-bold text-text mb-2">My Progress</h1>
            <p className="text-text-secondary">
              Track your learning journey through the Seerah
            </p>
          </div>

          {/* Stats */}
          <div className="grid sm:grid-cols-4 gap-4 mb-8">
            {(userPlan === "essentials" ? [
              { icon: Target, label: "Lessons Watched", value: "0 / 100", color: "gold" },
              { icon: TrendingUp, label: "Progress", value: "0%", color: "green" },
              { icon: Clock, label: "Study Time", value: "0h", color: "blue" },
              { icon: FileText, label: "Briefings Read", value: "0", color: "purple" },
            ] : [
              { icon: Target, label: "Lessons Completed", value: "0 / 100", color: "gold" },
              { icon: TrendingUp, label: "Progress", value: "0%", color: "green" },
              { icon: Clock, label: "Study Time", value: "0h", color: "blue" },
              { icon: Award, label: "Quiz Score", value: "0%", color: "purple" },
            ]).map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="p-6 rounded-xl border border-border bg-surface">
                  <div className="flex items-center gap-3 mb-2">
                    <Icon className="w-5 h-5 text-gold" />
                  </div>
                  <p className="text-text-muted text-sm mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold text-text">{stat.value}</p>
                </div>
              );
            })}
          </div>

          {/* Progress Chart Placeholder */}
          <div className="p-8 rounded-xl border border-border bg-surface mb-8">
            <h2 className="text-lg font-semibold text-text mb-4">Learning Progress</h2>
            <div className="h-64 flex items-center justify-center text-text-muted">
              <div className="text-center">
                <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Progress chart coming soon</p>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="p-8 rounded-xl border border-border bg-surface">
            <h2 className="text-lg font-semibold text-text mb-4">Recent Activity</h2>
            <div className="text-center py-8 text-text-muted">
              <p>No recent activity yet. Start learning to see your progress here!</p>
            </div>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}
