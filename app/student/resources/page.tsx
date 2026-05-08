import { redirect } from "next/navigation";
import { requireStudent } from "@/lib/auth";
import { StudentLayout } from "@/components/student/student-layout";
import { prisma } from "@/lib/db";
import { Video, Headphones, FileText, Image, Map, Layers, Brain, ClipboardCheck, GraduationCap, BarChart2 } from "lucide-react";
import Link from "next/link";

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

  const userPlan = "complete" as const;

  const allResources = [
    { icon: Video, label: "Video Lessons", description: "Watch all 100 guided video lessons", href: "/seerah/resources/videos" },
    { icon: Headphones, label: "Listen on the Go", description: "Audio version of every lesson", href: "/seerah/resources/audio" },
    { icon: FileText, label: "Briefings", description: "Read briefings for each part", href: "/seerah/resources/briefings" },
    { icon: Layers, label: "Slides", description: "3 formats: Presented, Detailed, Facts", href: "/seerah/resources/slides" },
    { icon: Image, label: "Infographics", description: "3 formats: Concise, Standard, Bento Grid", href: "/seerah/resources/infographics" },
    { icon: Map, label: "Mind Maps", description: "Visual maps connecting people and events", href: "/seerah/resources/mind-maps" },
    { icon: Brain, label: "Flashcards", description: "Easy, Medium, and Hard flashcard sets", href: "/seerah/resources/flashcards" },
    { icon: ClipboardCheck, label: "Quizzes", description: "Test your knowledge for each part", href: "/seerah/resources/quizzes" },
    { icon: GraduationCap, label: "Study Guides", description: "Detailed study guides for review", href: "/seerah/resources/study-guides" },
    { icon: BarChart2, label: "Facts", description: "Quick reference facts for each part", href: "/seerah/resources/statement-of-facts" },
  ];

  return (
    <StudentLayout userPlan={userPlan} userName={user.fullName}>
      <div className="min-h-screen bg-[#0a0a0a]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-text mb-2">Resource Library</h1>
            <p className="text-text-secondary">
              Browse all your learning materials by type — available for every part across the entire course
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-text mb-4">Your Resources</h2>
            <p className="text-text-muted text-sm mb-6">
              Browse all resources by type. Click any card to explore that resource across all 100 parts.
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {allResources.map((resource) => {
                const Icon = resource.icon;
                return (
                  <Link
                    key={resource.label}
                    href={resource.href}
                    className="group rounded-xl border border-border bg-surface hover:border-gold/30 hover:bg-surface-raised transition-all overflow-hidden"
                  >
                    {/* Thumbnail */}
                    <div className="aspect-video bg-gradient-to-br from-zinc-800 to-zinc-900 relative flex items-center justify-center">
                      <div className="absolute inset-0 bg-gradient-to-br from-gold/0 via-gold/0 to-gold/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      
                      <div className="relative w-16 h-16 rounded-full bg-black/40 border border-white/20 flex items-center justify-center group-hover:bg-gold/20 group-hover:border-gold/40 transition-all">
                        <Icon className="w-7 h-7 text-white" />
                      </div>
                    </div>
                    
                    {/* Info */}
                    <div className="p-4">
                      <h3 className="text-sm font-semibold text-text mb-2 group-hover:text-gold transition-colors line-clamp-1">
                        {resource.label}
                      </h3>
                      <p className="text-xs text-text-secondary line-clamp-2">
                        {resource.description}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}
