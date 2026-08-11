import { Video, FileText, Image, Map, Layers, Brain, Headphones, ClipboardCheck, BookOpen, GraduationCap, BarChart2 } from "lucide-react";
import Link from "next/link";
import type { CourseLang } from "@/lib/course-lang";
import { t } from "@/lib/ui-strings";
import type { UiStringKey } from "@/lib/ui-strings";

interface CourseResourcesContentProps {
  userPlan: "essentials" | "complete";
  lang?: CourseLang;
}

export function CourseResourcesContent({ userPlan: _userPlan, lang = "en" }: CourseResourcesContentProps) {
  const isRtl = lang === "ar";
  const allResources: { icon: React.ComponentType<{ className?: string }>; labelKey: UiStringKey; descKey: UiStringKey; href: string }[] = [
    { icon: Video,          labelKey: "videoLessons",  descKey: "videoLessonsDesc", href: "/seerah/resources/videos"              },
    { icon: Headphones,     labelKey: "listenOnTheGo", descKey: "listenGoDesc",     href: "/seerah/resources/audio"               },
    { icon: FileText,       labelKey: "briefings",     descKey: "briefingsDesc",    href: "/seerah/resources/briefings"           },
    { icon: Layers,         labelKey: "slides",        descKey: "slidesDesc",       href: "/seerah/resources/slides"              },
    { icon: Image,          labelKey: "infographics",  descKey: "infographicsDesc", href: "/seerah/resources/infographics"        },
    ...(!isRtl ? [{ icon: Map, labelKey: "mindMaps" as UiStringKey, descKey: "mindMapsDesc" as UiStringKey, href: "/seerah/resources/mind-maps" }] : []),
    { icon: Brain,          labelKey: "flashcards",    descKey: "flashcardsDesc",   href: "/seerah/resources/flashcards"          },
    { icon: ClipboardCheck, labelKey: "quizzes",       descKey: "quizzesDesc",      href: "/seerah/resources/quizzes"             },
    { icon: BookOpen,       labelKey: "reports",       descKey: "reportsDesc",      href: "/seerah/resources/reports"             },
    { icon: GraduationCap,  labelKey: "studyGuides",   descKey: "studyGuidesDesc",  href: "/seerah/resources/study-guides"        },
    { icon: BarChart2,      labelKey: "facts",         descKey: "factsDesc",        href: "/seerah/resources/statement-of-facts"  },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-white mb-4">{t(lang, "yourResources")}</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {allResources.map((resource) => {
            const Icon = resource.icon;
            return (
              <Link
                key={resource.labelKey}
                href={resource.href}
                className="group p-6 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:border-amber-500/30 hover:bg-zinc-900 transition-all cursor-pointer"
              >
                <div className="w-12 h-12 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4 group-hover:bg-amber-500/15 transition-colors">
                  <Icon className="w-6 h-6 text-amber-500" />
                </div>
                <h3 className="text-white font-semibold mb-2 group-hover:text-amber-400 transition-colors">{t(lang, resource.labelKey)}</h3>
                <p className="text-zinc-400 text-sm">{t(lang, resource.descKey)}</p>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
