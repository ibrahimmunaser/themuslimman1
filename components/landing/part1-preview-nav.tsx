"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Video, FileText, Layers, Map, Layers2, HelpCircle, Image } from "lucide-react";
import type { CourseLang } from "@/lib/course-lang";

type ModeId = "watch" | "read" | "slides" | "mindmap" | "infographic" | "flashcards" | "quiz";

interface NavButton {
  id: ModeId;
  label: string;
  labelAr: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_BUTTONS: NavButton[] = [
  { id: "watch",       label: "Video",        labelAr: "فيديو",      icon: Video },
  { id: "slides",      label: "Slides",       labelAr: "شرائح",      icon: Layers },
  { id: "infographic", label: "Infographics", labelAr: "إنفوجرافيك", icon: Image },
  { id: "read",        label: "Reading",      labelAr: "قراءة",      icon: FileText },
  { id: "mindmap",     label: "Mind Map",     labelAr: "خريطة",      icon: Map },
  { id: "flashcards",  label: "Flashcards",   labelAr: "بطاقات",     icon: Layers2 },
  { id: "quiz",        label: "Quiz",         labelAr: "اختبار",     icon: HelpCircle },
];

export function Part1PreviewNav({ lang = "en" }: { lang?: CourseLang }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentMode = (searchParams.get("mode") as ModeId) || "watch";
  const isRtl = lang === "ar";
  const buttons = isRtl ? NAV_BUTTONS.filter((b) => b.id !== "mindmap") : NAV_BUTTONS;

  const handleModeChange = (modeId: ModeId) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("mode", modeId);
    router.push(`${pathname}?${params.toString()}#preview`, { scroll: false });
  };

  return (
    <div className="px-4 sm:px-6 py-3 border-b border-border/50 bg-surface-raised/40" dir={isRtl ? "rtl" : undefined}>
      <p className="text-sm font-semibold text-center text-text mb-3">
        {isRtl ? (
          <>
            كل درس يتبع مسارًا واحدًا:{" "}
            <span className="text-gold">شاهد ← ادرس ← راجع</span>
          </>
        ) : (
          <>
            Every lesson follows one simple path:{" "}
            <span className="text-gold">Watch → Study → Review</span>
          </>
        )}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        {buttons.map(({ id, label, labelAr, icon: Icon }) => {
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
              {isRtl ? labelAr : label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
