import { redirect } from "next/navigation";
import { requireStudent } from "@/lib/auth";
import { StudentLayout } from "@/components/student/student-layout";
import { prisma } from "@/lib/db";
import { PARTS } from "@/lib/content";
import { ERA_MAP } from "@/lib/types";
import { Video, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { PartThumbnail } from "@/components/ui/part-thumbnail";

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

              const eraInfo = ERA_MAP[part.era as keyof typeof ERA_MAP];

              return (
                <Link
                  key={part.id}
                  href={`/seerah/${part.id}`}
                  className="group block rounded-xl border border-border bg-surface hover:border-gold/30 transition-all overflow-hidden"
                >
                  <PartThumbnail
                    partNumber={part.partNumber}
                    era={part.era}
                    eraLabel={eraInfo?.label ?? part.era}
                    watchPercent={watchPercent}
                    isCompleted={isCompleted}
                  />

                  <div className="p-3">
                    <p className="text-xs font-medium text-gold mb-0.5">
                      Part {part.partNumber}
                    </p>
                    <h3 className="text-sm font-semibold text-text group-hover:text-gold transition-colors line-clamp-2 leading-snug">
                      {part.title}
                    </h3>
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
