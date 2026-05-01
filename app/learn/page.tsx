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

  // Check if user has paid
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { hasPaid: true },
  });

  if (!dbUser?.hasPaid) {
    redirect("/pricing");
  }

  // Get all parts and group by era
  const partsByEra = PARTS.reduce((acc, part) => {
    const era = ERA_MAP[part.era as keyof typeof ERA_MAP] || part.era;
    if (!acc[era]) acc[era] = [];
    acc[era].push(part);
    return acc;
  }, {} as Record<string, typeof PARTS>);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-surface">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-text">
            Complete Seerah Academy
          </h1>
          <p className="text-text-secondary mt-2">
            All {PARTS.length}+ parts of the Prophet's ﷺ life in chronological order
          </p>
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
