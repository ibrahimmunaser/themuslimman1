import { redirect } from "next/navigation";
import Link from "next/link";
import { requireStudent } from "@/lib/auth";
import { PARTS } from "@/lib/content";
import { ERA_MAP } from "@/lib/types";
import { ChevronRight, Play, CheckCircle2, BookOpen } from "lucide-react";
import { prisma } from "@/lib/db";

export const metadata = { title: "Complete Seerah Series" };

export default async function LearnIndexPage() {
  const user = await requireStudent();
  if (!user.studentProfileId) redirect("/");

  // Check user's purchases
  const purchases = await prisma.purchase.findMany({
    where: {
      userId: user.id,
      status: "succeeded",
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (purchases.length === 0) {
    redirect("/pricing");
  }

  // Get the highest tier plan purchased (complete > essentials)
  const hasCompletePlan = purchases.some(p => p.planId === "complete");
  const hasEssentialsPlan = purchases.some(p => p.planId === "essentials");
  const userPlan = hasCompletePlan ? "complete" : hasEssentialsPlan ? "essentials" : null;

  if (!userPlan) {
    redirect("/pricing");
  }

  // Filter parts based on user's plan
  const accessibleParts = PARTS.filter(part => {
    if (userPlan === "complete") return true; // Complete plan gets everything
    if (userPlan === "essentials") return part.includedInEssentials;
    return false;
  });

  // Group accessible parts by era
  const partsByEra = accessibleParts.reduce((acc, part) => {
    const era = ERA_MAP[part.era as keyof typeof ERA_MAP]?.label || part.era;
    if (!acc[era]) acc[era] = [];
    acc[era].push(part);
    return acc;
  }, {} as Record<string, typeof PARTS>);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-surface">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-text">
                {userPlan === "complete" ? "Complete Seerah Academy" : "Seerah Starter"}
              </h1>
              <p className="text-text-secondary mt-2">
                {userPlan === "complete" 
                  ? `All ${PARTS.length}+ parts of the Prophet's ﷺ life in chronological order`
                  : `${accessibleParts.length} core parts of the Seerah`
                }
              </p>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-gold/10 border border-gold/20 text-gold text-sm font-medium whitespace-nowrap">
              {userPlan === "complete" ? "Complete Plan" : "Essentials Plan"}
            </div>
          </div>

          {userPlan === "essentials" && (
            <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-gold/5 to-gold/10 border border-gold/20">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-text font-medium">Want access to all {PARTS.length}+ parts?</p>
                  <p className="text-text-secondary text-sm mt-1">
                    Upgrade to Complete Seerah Academy for the full experience
                  </p>
                </div>
                <Link 
                  href="/pricing"
                  className="px-4 py-2 bg-gold text-ink rounded-lg font-medium hover:bg-gold-light transition-colors whitespace-nowrap flex-shrink-0"
                >
                  Upgrade Now
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {Object.entries(partsByEra).map(([era, parts]) => (
          <div key={era} className="mb-12">
            <h2 className="text-xl font-semibold text-text mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-gold" />
              {era}
            </h2>
            <div className="grid gap-3">
              {parts.map((part) => (
                <Link
                  key={part.id}
                  href={`/learn/${part.id}`}
                  className="group block p-4 rounded-xl border border-border bg-surface hover:border-gold/30 hover:bg-surface-raised transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center flex-shrink-0 group-hover:border-gold/40 transition-colors">
                      <Play className="w-5 h-5 text-gold" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-gold">
                          Part {part.partNumber}
                        </span>
                      </div>
                      <p className="text-text font-medium group-hover:text-gold transition-colors truncate">
                        {part.title}
                      </p>
                      {part.subtitle && (
                        <p className="text-sm text-text-secondary truncate">
                          {part.subtitle}
                        </p>
                      )}
                    </div>
                    <ChevronRight className="w-5 h-5 text-text-muted group-hover:text-gold transition-colors flex-shrink-0" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
