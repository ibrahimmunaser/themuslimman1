import { redirect } from "next/navigation";
import Link from "next/link";
import { requireStudent } from "@/lib/auth";
import { hasActiveCourseAccess, TOTAL_COURSE_PARTS } from "@/lib/access";
import { getActiveProfileId } from "@/app/actions/profiles";
import { prisma } from "@/lib/db";
import { StudentLayout } from "@/components/student/student-layout";
import { Award, Lock, CheckCircle2 } from "lucide-react";

export const metadata = { title: "Certificate | Complete Seerah" };
export const dynamic = "force-dynamic";

// Must match the mobile app's certificate_screen.dart exactly — a
// per-quiz pass is 80%+ (see PASS_SCORE in mobile-progress/track), but the
// certificate's OWN requirement is coverage-based: pass 70+ of the 100
// per-part quizzes. These are two different metrics on purpose.
const REQUIRED_QUIZ_COVERAGE_PCT = 70;

export default async function CertificatePage() {
  const user = await requireStudent();
  if (!user.studentProfileId) redirect("/");

  const hasAccess = await hasActiveCourseAccess(user.id, user.hasPaid);
  if (!hasAccess) redirect("/pricing");
  // Entitled unverified users keep certificate access (part-access / IAP parity).

  const userPlan = "complete" as const;
  const requiredLessons = TOTAL_COURSE_PARTS;

  // Mirrors the mobile app's certificate_screen.dart: "studied" is any part
  // with a PartProgress row at all, "quizzesPassed" is rows with
  // quizPassed = true, and quiz coverage is judged against the total part
  // count (not against quizzes attempted).
  const learnerProfileId = await getActiveProfileId(user.id);
  const rows = await prisma.partProgress.findMany({
    where: {
      learnerProfileId,
      partNumber: { gte: 1, lte: TOTAL_COURSE_PARTS },
    },
    select: { partNumber: true, quizPassed: true, quizScoreVerified: true },
  });

  const studied = rows.length;
  // A quiz only counts once its best score has been server-recomputed from
  // real answers — see PartProgress.quizScoreVerified (Audit C4). Without
  // this, a score bulk-synced from an old/offline cache with no answers to
  // re-grade could permanently count toward the certificate.
  const quizzesPassed = rows.filter((r) => r.quizPassed && r.quizScoreVerified).length;
  const quizPct = requiredLessons === 0 ? 0 : (quizzesPassed / requiredLessons) * 100;

  const meetsStudied = studied >= requiredLessons;
  const meetsQuiz = quizPct >= REQUIRED_QUIZ_COVERAGE_PCT;
  const isEarned = meetsStudied && meetsQuiz;

  const studiedPct = requiredLessons === 0 ? 0 : Math.round((studied / requiredLessons) * 100);

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

          {/* Certificate Preview */}
          <div className="relative p-8 rounded-xl border-2 border-gold/30 bg-gradient-to-b from-gold/5 to-surface mb-8">
            {!isEarned && (
              <div className="absolute inset-0 bg-surface/80 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center z-10">
                <div className="w-16 h-16 rounded-full bg-gold/10 border-2 border-gold/30 flex items-center justify-center mb-4">
                  <Lock className="w-8 h-8 text-gold" />
                </div>
                <h3 className="text-xl font-bold text-text mb-2">Certificate Locked</h3>
                <p className="text-text-secondary text-center max-w-md mb-6">
                  Complete all {requiredLessons} lessons and pass enough quizzes to unlock your certificate of completion
                </p>
                <Link
                  href="/seerah"
                  className="px-6 py-3 rounded-lg bg-gold text-ink font-semibold hover:bg-gold/90 transition-colors"
                >
                  Continue Learning
                </Link>
              </div>
            )}

            {/* Certificate Design Preview */}
            <div className={isEarned ? "" : "opacity-30 blur-sm pointer-events-none"}>
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
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    meetsStudied ? "border-emerald-500/60 bg-emerald-500/10" : "border-border"
                  }`}
                >
                  {meetsStudied ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <span className="text-xs">✓</span>
                  )}
                </div>
                <span>
                  Complete all {requiredLessons} lessons ({studied}/{requiredLessons})
                </span>
              </div>
              <div className="flex items-center gap-3 text-text-secondary">
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    meetsQuiz ? "border-emerald-500/60 bg-emerald-500/10" : "border-border"
                  }`}
                >
                  {meetsQuiz ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <span className="text-xs">✓</span>
                  )}
                </div>
                <span>
                  Pass the quiz (80%+) for at least {REQUIRED_QUIZ_COVERAGE_PCT} of the {requiredLessons} parts (
                  {Math.round(quizPct)}%)
                </span>
              </div>
              <div className="flex items-center gap-3 text-text-secondary">
                <div className="w-6 h-6 rounded-full border-2 border-emerald-500/60 bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                </div>
                <span>Maintain active student status</span>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-border">
              <p className="text-sm text-text-muted">
                <strong className="text-text">Current Progress:</strong> {studied} of {requiredLessons} lessons
                completed ({studiedPct}%)
              </p>
            </div>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}
