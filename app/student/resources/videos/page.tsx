import { redirect } from "next/navigation";
import { requireStudent } from "@/lib/auth";
import { StudentLayout } from "@/components/student/student-layout";
import { prisma } from "@/lib/db";
import { PARTS } from "@/lib/content";
import { Video, Play, CheckCircle2, ArrowLeft } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Video Lessons | Resources" };
export const dynamic = "force-dynamic";

export default async function VideosPage() {
  const user = await requireStudent();
  if (!user.studentProfileId) redirect("/");

  const purchases = await prisma.purchase.findMany({
    where: { userId: user.id, status: "succeeded" },
  });

  if (purchases.length === 0) {
    redirect("/pricing");
  }

  const userPlan = "complete" as const;

  // Get progress for all parts
  const progress = await prisma.partProgress.findMany({
    where: { userId: user.id },
    select: {
      partNumber: true,
      videoWatchPercent: true,
      videoCompleted: true,
    },
  });

  const progressMap = Object.fromEntries(
    progress.map((p) => [p.partNumber, p])
  );

  return (
    <StudentLayout userPlan={userPlan} userName={user.fullName}>
      <div className="min-h-screen bg-[#0a0a0a]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Back Link */}
          <Link
            href="/student/resources"
            className="inline-flex items-center gap-2 text-text-secondary hover:text-text transition-colors text-sm mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Resources
          </Link>

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center">
                <Video className="w-5 h-5 text-gold" />
              </div>
              <h1 className="text-3xl font-bold text-text">Video Lessons</h1>
            </div>
            <p className="text-text-secondary">
              All 100 guided video lessons from the complete Seerah Masterclass
            </p>
          </div>

          {/* Video Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {PARTS.map((part) => {
              const partProgress = progressMap[part.partNumber];
              const watchPercent = partProgress?.videoWatchPercent || 0;
              const isCompleted = partProgress?.videoCompleted || watchPercent >= 85;

              return (
                <Link
                  key={part.id}
                  href={`/seerah/${part.id}`}
                  className="group block rounded-xl border border-border bg-surface hover:border-gold/30 hover:bg-surface-raised transition-all overflow-hidden"
                >
                  {/* Thumbnail placeholder */}
                  <div className="aspect-video bg-gradient-to-br from-zinc-800 to-zinc-900 relative flex items-center justify-center">
                    {isCompleted ? (
                      <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                      </div>
                    ) : watchPercent > 0 ? (
                      <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-400 text-xs font-medium">
                        {watchPercent}%
                      </div>
                    ) : null}
                    
                    <div className="w-14 h-14 rounded-full bg-black/40 border border-white/20 flex items-center justify-center group-hover:bg-gold/20 group-hover:border-gold/40 transition-all">
                      <Play className="w-6 h-6 text-white ml-1" />
                    </div>

                    {/* Progress bar */}
                    {watchPercent > 0 && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-800">
                        <div
                          className="h-full bg-gold"
                          style={{ width: `${watchPercent}%` }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-amber-500">
                        Part {part.partNumber}
                      </span>
                      {isCompleted && (
                        <span className="px-2 py-0.5 bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-medium rounded">
                          Completed
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-semibold text-text group-hover:text-gold transition-colors line-clamp-2">
                      {part.title}
                    </h3>
                    {part.subtitle && (
                      <p className="text-xs text-text-muted mt-1 line-clamp-1">
                        {part.subtitle}
                      </p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}
