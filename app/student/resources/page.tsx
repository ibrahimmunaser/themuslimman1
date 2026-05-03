import { redirect } from "next/navigation";
import Link from "next/link";
import { requireStudent } from "@/lib/auth";
import { StudentLayout } from "@/components/student/student-layout";
import { prisma } from "@/lib/db";
import { FolderOpen, FileText, Image, Map, Layers, Brain, Lock, Sparkles } from "lucide-react";

export const metadata = { title: "Resources | Seerah Masterclass" };
export const dynamic = "force-dynamic";

export default async function ResourcesPage() {
  const user = await requireStudent();
  if (!user.studentProfileId) redirect("/");

  // Check user's purchases
  const purchases = await prisma.purchase.findMany({
    where: {
      userId: user.id,
      status: "succeeded",
    },
  });

  if (purchases.length === 0) {
    redirect("/pricing");
  }

  const hasCompletePlan = purchases.some(p => p.planId === "complete");
  const userPlan = hasCompletePlan ? "complete" : "essentials";

  const essentialsResources = [
    { icon: FileText, label: "Video Lessons", description: "Watch all guided video lessons", available: true },
    { icon: Layers, label: "Slides", description: "Access slide decks for all parts", available: true },
    { icon: Brain, label: "Quizzes", description: "Test your knowledge", available: true },
  ];

  const completeResources = [
    { icon: FileText, label: "Briefings", description: "Read comprehensive briefings for each part", available: userPlan === "complete" },
    { icon: Map, label: "Mind Maps", description: "Visual maps connecting people and events", available: userPlan === "complete" },
    { icon: Brain, label: "Flashcards", description: "Easy, Medium, and Hard flashcard sets", available: userPlan === "complete" },
    { icon: Image, label: "Infographics", description: "3 formats: Concise, Standard, Bento Grid", available: userPlan === "complete" },
    { icon: FileText, label: "Statement of Facts", description: "Quick reference facts for each part", available: userPlan === "complete" },
  ];

  return (
    <StudentLayout userPlan={userPlan} userName={user.fullName}>
      <div className="min-h-screen bg-[#0a0a0a]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-text mb-2">Study Resources</h1>
            <p className="text-text-secondary">
              Access all your learning materials and study aids
            </p>
          </div>

          {/* Essentials Resources */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-text mb-4">Your Resources</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {essentialsResources.map((resource) => {
                const Icon = resource.icon;
                return (
                  <div
                    key={resource.label}
                    className="p-6 rounded-xl border border-border bg-surface hover:border-gold/25 transition-all"
                  >
                    <div className="w-12 h-12 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-gold" />
                    </div>
                    <h3 className="text-text font-semibold mb-2">{resource.label}</h3>
                    <p className="text-text-secondary text-sm">{resource.description}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Complete Resources */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-text">Complete Seerah Resources</h2>
              {userPlan === "essentials" && (
                <Link
                  href="/pricing"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gold/10 text-gold text-sm font-semibold hover:bg-gold/20 transition-colors"
                >
                  <Sparkles className="w-4 h-4" />
                  Upgrade
                </Link>
              )}
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {completeResources.map((resource) => {
                const Icon = resource.icon;
                const isLocked = !resource.available;

                return (
                  <div
                    key={resource.label}
                    className={`p-6 rounded-xl border ${
                      isLocked
                        ? "border-border/50 bg-surface/50 opacity-60"
                        : "border-border bg-surface hover:border-gold/25"
                    } transition-all relative`}
                  >
                    {isLocked && (
                      <div className="absolute top-4 right-4">
                        <Lock className="w-5 h-5 text-text-muted" />
                      </div>
                    )}
                    <div className={`w-12 h-12 rounded-lg ${
                      isLocked ? "bg-surface-raised" : "bg-gold/10 border border-gold/20"
                    } flex items-center justify-center mb-4`}>
                      <Icon className={`w-6 h-6 ${isLocked ? "text-text-muted" : "text-gold"}`} />
                    </div>
                    <h3 className="text-text font-semibold mb-2">{resource.label}</h3>
                    <p className="text-text-secondary text-sm">{resource.description}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Upgrade CTA for Essentials */}
          {userPlan === "essentials" && (
            <div className="mt-8 p-6 rounded-xl bg-gradient-to-b from-gold/15 to-gold/5 border border-gold/30">
              <div className="max-w-2xl">
                <h3 className="text-xl font-bold text-text mb-2">Unlock All Resources</h3>
                <p className="text-text-secondary mb-4">
                  Upgrade to Complete Seerah for only $30 more and get access to mind maps, flashcards, briefings, infographics, and the full 100-part system.
                </p>
                <Link
                  href="/pricing"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gold text-ink font-semibold hover:bg-gold/90 transition-colors"
                >
                  Upgrade to Complete
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </StudentLayout>
  );
}
