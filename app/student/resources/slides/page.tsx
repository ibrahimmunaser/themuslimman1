import { redirect } from "next/navigation";
import { requireStudent } from "@/lib/auth";
import { StudentLayout } from "@/components/student/student-layout";
import { prisma } from "@/lib/db";
import { PARTS } from "@/lib/content";
import { Layers, CheckCircle2, ArrowLeft } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Slides | Resources" };
export const dynamic = "force-dynamic";

export default async function SlidesPage() {
  const user = await requireStudent();
  if (!user.studentProfileId) redirect("/");

  const purchases = await prisma.purchase.findMany({
    where: { userId: user.id, status: "succeeded" },
  });

  if (purchases.length === 0) {
    redirect("/pricing");
  }

  const userPlan = "complete" as const;

  const progress = await prisma.partProgress.findMany({
    where: { userId: user.id },
    select: {
      partNumber: true,
      openedAssets: true,
    },
  });

  const progressMap = Object.fromEntries(
    progress.map((p) => {
      const opened = JSON.parse(p.openedAssets || "[]");
      return [p.partNumber, opened.includes("slides")];
    })
  );

  return (
    <StudentLayout userPlan={userPlan} userName={user.fullName}>
      <div className="min-h-screen bg-[#0a0a0a]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link
            href="/student/resources"
            className="inline-flex items-center gap-2 text-text-secondary hover:text-text transition-colors text-sm mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Resources
          </Link>

          <div className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center">
                <Layers className="w-5 h-5 text-gold" />
              </div>
              <h1 className="text-3xl font-bold text-text">Slides</h1>
            </div>
            <p className="text-text-secondary">
              Professional slide decks in three formats: Presented, Detailed, and Facts
            </p>
          </div>

          <div className="space-y-3">
            {PARTS.map((part) => {
              const isViewed = progressMap[part.partNumber] || false;

              return (
                <Link
                  key={part.id}
                  href={`/seerah/${part.id}`}
                  className="group block p-4 rounded-xl border border-border bg-surface hover:border-gold/30 hover:bg-surface-raised transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center group-hover:bg-gold/15 transition-colors">
                      <Layers className="w-5 h-5 text-gold" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-amber-500">
                          Part {part.partNumber}
                        </span>
                        {isViewed && (
                          <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                        )}
                      </div>
                      <h3 className="text-sm font-semibold text-text group-hover:text-gold transition-colors">
                        {part.title}
                      </h3>
                      {part.subtitle && (
                        <p className="text-xs text-text-muted mt-0.5 truncate">
                          {part.subtitle}
                        </p>
                      )}
                    </div>

                    <div className="flex-shrink-0">
                      <span className="text-xs text-text-muted group-hover:text-text-secondary transition-colors">
                        {isViewed ? "Viewed" : "New"}
                      </span>
                    </div>
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
