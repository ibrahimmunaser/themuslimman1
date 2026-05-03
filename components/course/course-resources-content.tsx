import Link from "next/link";
import { FileText, Image, Map, Layers, Brain, Lock, Sparkles, Headphones } from "lucide-react";

interface CourseResourcesContentProps {
  userPlan: "essentials" | "complete";
}

export function CourseResourcesContent({ userPlan }: CourseResourcesContentProps) {
  const essentialsResources = [
    { icon: FileText, label: "Video Lessons", description: "Watch all 100 guided video lessons", available: true },
    { icon: Headphones, label: "Listen on the Go", description: "Audio version of every lesson", available: true },
    { icon: FileText, label: "Briefings", description: "Read briefings for each part", available: true },
  ];

  const completeResources = [
    { icon: Layers, label: "Slides", description: "3 formats: Presented, Detailed, Facts", available: userPlan === "complete" },
    { icon: Image, label: "Infographics", description: "3 formats: Concise, Standard, Bento Grid", available: userPlan === "complete" },
    { icon: Map, label: "Mind Maps", description: "Visual maps connecting people and events", available: userPlan === "complete" },
    { icon: Brain, label: "Flashcards", description: "Easy, Medium, and Hard flashcard sets", available: userPlan === "complete" },
    { icon: Brain, label: "Quizzes", description: "Test your knowledge for each part", available: userPlan === "complete" },
    { icon: FileText, label: "Reports", description: "Comprehensive reports for each lesson", available: userPlan === "complete" },
    { icon: FileText, label: "Study Guides", description: "Detailed study guides for review", available: userPlan === "complete" },
    { icon: FileText, label: "Statement of Facts", description: "Quick reference facts for each part", available: userPlan === "complete" },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Essentials Resources */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-white mb-4">Your Resources</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {essentialsResources.map((resource) => {
            const Icon = resource.icon;
            return (
              <div
                key={resource.label}
                className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:border-amber-500/25 transition-all"
              >
                <div className="w-12 h-12 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-amber-500" />
                </div>
                <h3 className="text-white font-semibold mb-2">{resource.label}</h3>
                <p className="text-zinc-400 text-sm">{resource.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Complete Resources */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Complete Seerah Resources</h2>
          {userPlan === "essentials" && (
            <Link
              href="/pricing"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500/10 text-amber-500 text-sm font-semibold hover:bg-amber-500/20 transition-colors"
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
                    ? "border-zinc-800/50 bg-zinc-900/30 opacity-60"
                    : "border-zinc-800 bg-zinc-900/50 hover:border-amber-500/25"
                } transition-all relative`}
              >
                {isLocked && (
                  <div className="absolute top-4 right-4">
                    <Lock className="w-5 h-5 text-zinc-600" />
                  </div>
                )}
                <div className={`w-12 h-12 rounded-lg ${
                  isLocked ? "bg-zinc-800" : "bg-amber-500/10 border border-amber-500/20"
                } flex items-center justify-center mb-4`}>
                  <Icon className={`w-6 h-6 ${isLocked ? "text-zinc-600" : "text-amber-500"}`} />
                </div>
                <h3 className="text-white font-semibold mb-2">{resource.label}</h3>
                <p className="text-zinc-400 text-sm">{resource.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Upgrade CTA for Essentials */}
      {userPlan === "essentials" && (
        <div className="mt-8 p-6 rounded-xl bg-gradient-to-b from-amber-500/15 to-amber-500/5 border border-amber-500/30">
          <div className="max-w-2xl">
            <h3 className="text-xl font-bold text-white mb-2">Unlock the Full Mastery System</h3>
            <p className="text-zinc-300 mb-4">
              Upgrade to Complete Seerah for only $30 more and add slides, infographics, mind maps, flashcards, quizzes, reports, study guides, and statement of facts to every lesson.
            </p>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-amber-500 text-black font-semibold hover:bg-amber-600 transition-colors"
            >
              Upgrade to Complete
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
