import { Video, FileText, Image, Map, Layers, Brain, Headphones, ClipboardCheck, BookOpen, GraduationCap, BarChart2, Library } from "lucide-react";
import Link from "next/link";

interface CourseResourcesContentProps {
  userPlan: "essentials" | "complete";
}

export function CourseResourcesContent({ userPlan: _userPlan }: CourseResourcesContentProps) {
  const allResources = [
    { icon: Video, label: "Video Lessons", description: "Watch all 100 guided video lessons", href: "/seerah/resources/videos" },
    { icon: Headphones, label: "Listen on the Go", description: "Audio version of every lesson", href: "/seerah/resources/audio" },
    { icon: FileText, label: "Briefings", description: "Read briefings for each part", href: "/seerah/resources/briefings" },
    { icon: Layers, label: "Slides", description: "3 formats: Presented, Detailed, Facts", href: "/seerah/resources/slides" },
    { icon: Image, label: "Infographics", description: "3 formats: Concise, Standard, Bento Grid", href: "/seerah/resources/infographics" },
    { icon: Map, label: "Mind Maps", description: "Visual maps connecting people and events", href: "/seerah/resources/mind-maps" },
    { icon: Brain, label: "Flashcards", description: "Easy, Medium, and Hard flashcard sets", href: "/seerah/resources/flashcards" },
    { icon: ClipboardCheck, label: "Quizzes", description: "Test your knowledge for each part", href: "/seerah/resources/quizzes" },
    { icon: Library, label: "Reference Library", description: "Terms, people, places, battles, and more", href: "/reference" },
    { icon: BookOpen, label: "Reports", description: "Comprehensive reports for each lesson", href: "/seerah/resources/reports" },
    { icon: GraduationCap, label: "Study Guides", description: "Detailed study guides for review", href: "/seerah/resources/study-guides" },
    { icon: BarChart2, label: "Facts", description: "Quick reference facts for each part", href: "/seerah/resources/statement-of-facts" },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-white mb-4">Your Resources</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {allResources.map((resource) => {
            const Icon = resource.icon;
            return (
              <Link
                key={resource.label}
                href={resource.href}
                className="group p-6 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:border-amber-500/30 hover:bg-zinc-900 transition-all cursor-pointer"
              >
                <div className="w-12 h-12 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4 group-hover:bg-amber-500/15 transition-colors">
                  <Icon className="w-6 h-6 text-amber-500" />
                </div>
                <h3 className="text-white font-semibold mb-2 group-hover:text-amber-400 transition-colors">{resource.label}</h3>
                <p className="text-zinc-400 text-sm">{resource.description}</p>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
