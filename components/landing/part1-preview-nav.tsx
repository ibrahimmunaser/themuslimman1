"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Video, FileText, Layers, Map, Layers2, HelpCircle, Image } from "lucide-react";
import type { CourseLang } from "@/lib/course-lang";
import { isRtlLang } from "@/lib/course-lang";
import { loc } from "@/lib/loc";

type ModeId = "watch" | "read" | "slides" | "mindmap" | "infographic" | "flashcards" | "quiz";

interface NavButton {
  id: ModeId;
  label: string;
  labelAr: string;
  labelFr: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_BUTTONS: NavButton[] = [
  { id: "watch",       label: "Video",        labelAr: "فيديو",      labelFr: "Vidéo",        icon: Video },
  { id: "slides",      label: "Slides",       labelAr: "شرائح",      labelFr: "Diapositives", icon: Layers },
  { id: "infographic", label: "Infographics", labelAr: "إنفوجرافيك", labelFr: "Infographies", icon: Image },
  { id: "read",        label: "Reading",      labelAr: "قراءة",      labelFr: "Lecture",      icon: FileText },
  { id: "mindmap",     label: "Mind Map",     labelAr: "خريطة",      labelFr: "Carte mentale", icon: Map },
  { id: "flashcards",  label: "Flashcards",   labelAr: "بطاقات",     labelFr: "Flashcards",   icon: Layers2 },
  { id: "quiz",        label: "Quiz",         labelAr: "اختبار",     labelFr: "Quiz",         icon: HelpCircle },
];

export function Part1PreviewNav({ lang = "en" }: { lang?: CourseLang }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentMode = (searchParams.get("mode") as ModeId) || "watch";
  const isRtl = isRtlLang(lang);
  const buttons = isRtl ? NAV_BUTTONS.filter((b) => b.id !== "mindmap") : NAV_BUTTONS;

  const handleModeChange = (modeId: ModeId) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("mode", modeId);
    router.push(`${pathname}?${params.toString()}#preview`, { scroll: false });
  };

  return (
    <div className="px-4 sm:px-6 py-3 border-b border-border/50 bg-surface-raised/40" dir={isRtl ? "rtl" : undefined}>
      <p className="text-sm font-semibold text-center text-text mb-3">
        {loc(lang, "Every lesson follows one simple path:", "كل درس يتبع مسارًا واحدًا:", "Chaque leçon suit un parcours simple :")}{" "}
        <span className="text-gold">
          {loc(lang, "Watch → Study → Review", "شاهد ← ادرس ← راجع", "Regarder → Étudier → Réviser")}
        </span>
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        {buttons.map(({ id, label, labelAr, labelFr, icon: Icon }) => {
          const isActive = currentMode === id;
          return (
            <button
              key={id}
              onClick={() => handleModeChange(id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                isActive
                  ? "border-gold/60 bg-gold/10 text-gold"
                  : "border-border bg-surface hover:border-gold/40 hover:bg-surface-raised text-text-secondary hover:text-text"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {loc(lang, label, labelAr, labelFr)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
