import { redirect } from "next/navigation";
import Link from "next/link";
import { requireStudent } from "@/lib/auth";
import { StudentLayout } from "@/components/student/student-layout";
import { prisma } from "@/lib/db";
import { Award, Lock, CheckCircle2 } from "lucide-react";

export const metadata = { title: "Certificate | Seerah Masterclass" };
export const dynamic = "force-dynamic";

export default async function CertificatePage() {
  const user = await requireStudent();
  if (!user.studentProfileId) redirect("/");

  const purchases = await prisma.purchase.findMany({
    where: { userId: user.id, status: "succeeded" },
  });

  if (purchases.length === 0) redirect("/pricing");

  const hasCompletePlan = purchases.some(p => p.planId === "complete");
  const userPlan = "complete" as const;

  const requiredLessons = userPlan === "complete" ? 100 : 75;

  return (
    <StudentLayout userPlan={userPlan} userName={user.fullName}>
      <div className="min-h-screen bg-[#0a0a0a]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-text mb-2">Certificate of Completion</h1>
            <p className="text-text-secondary">
              Complete all required lessons to earn your certificate
            </p>
          </div>

          {/* Certificate Preview (Locked) */}
          <div className="relative p-8 rounded-xl border-2 border-gold/30 bg-gradient-to-b from-gold/5 to-surface mb-8">
            {/* Lock Overlay */}
            <div className="absolute inset-0 bg-surface/80 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-gold/10 border-2 border-gold/30 flex items-center justify-center mb-4">
                <Lock className="w-8 h-8 text-gold" />
              </div>
              <h3 className="text-xl font-bold text-text mb-2">Certificate Locked</h3>
              <p className="text-text-secondary text-center max-w-md mb-6">
                Complete all {requiredLessons} lessons and pass all quizzes to unlock your certificate of completion
              </p>
              <Link
                href="/seerah"
                className="px-6 py-3 rounded-lg bg-gold text-ink font-semibold hover:bg-gold/90 transition-colors"
              >
                Continue Learning
              </Link>
            </div>

            {/* Certificate Design Preview (Blurred) */}
            <div className="opacity-30 blur-sm pointer-events-none">
              <div className="text-center py-12">
                <Award className="w-20 h-20 text-gold mx-auto mb-6" />
                <h2 className="text-3xl font-bold text-text mb-2">Certificate of Completion</h2>
                <p className="text-text-secondary text-lg mb-8">This certifies that</p>
                <p className="text-4xl font-bold text-gold mb-8">{user.fullName}</p>
                <p className="text-text-secondary mb-4">has successfully completed</p>
                <p className="text-2xl font-semibold text-text mb-8">
                  Complete Seerah Masterclass
                </p>
                <p className="text-text-muted text-sm">
                  {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                </p>
              </div>
            </div>
          </div>

          {/* Requirements */}
          <div className="p-6 rounded-xl border border-border bg-surface">
            <h3 className="text-lg font-semibold text-text mb-4">Requirements</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-text-secondary">
                <div className="w-6 h-6 rounded-full border-2 border-border flex items-center justify-center flex-shrink-0">
                  <span className="text-xs">✓</span>
                </div>
                <span>Complete all {requiredLessons} lessons</span>
              </div>
              <div className="flex items-center gap-3 text-text-secondary">
                <div className="w-6 h-6 rounded-full border-2 border-border flex items-center justify-center flex-shrink-0">
                  <span className="text-xs">✓</span>
                </div>
                <span>Pass all quizzes with at least 70%</span>
              </div>
              <div className="flex items-center gap-3 text-text-secondary">
                <div className="w-6 h-6 rounded-full border-2 border-border flex items-center justify-center flex-shrink-0">
                  <span className="text-xs">✓</span>
                </div>
                <span>Maintain active student status</span>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-border">
              <p className="text-sm text-text-muted">
                <strong className="text-text">Current Progress:</strong> 0 of {requiredLessons} lessons completed (0%)
              </p>
            </div>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}
