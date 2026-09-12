"use client";

import { Headphones } from "lucide-react";
import { AudioPlayer } from "./audio-player";
import type { CourseLang } from "@/lib/course-lang";
import { loc } from "@/lib/loc";
import { t } from "@/lib/ui-strings";

interface ListenOnTheGoProps {
  audioUrl?: string;
  title?: string;
  partNumber?: number;
  previewMode?: boolean;
  videoCompleted?: boolean;
  isRtl?: boolean;
  lang?: CourseLang;
}

export function ListenOnTheGo({ audioUrl, title, partNumber, previewMode, videoCompleted, isRtl, lang = "en" }: ListenOnTheGoProps) {
  if (!audioUrl) return null;
  if (previewMode) return null;

  return (
    <div className="mt-4 space-y-2">
      <div className="flex items-center gap-2" dir={isRtl ? "rtl" : undefined}>
        <Headphones className="w-3.5 h-3.5 text-gold/70 flex-shrink-0" />
        <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
          {t(lang, "listenOnTheGo")}
        </p>
        <span className="text-[10px] text-text-muted/60">
          {loc(lang, "· Perfect for commutes and repetition", "· مثالي للتنقل والتكرار", "· Idéal pour les trajets et la révision")}
        </span>
      </div>
      <AudioPlayer src={audioUrl} title={title} partNumber={partNumber} compact previewMode={previewMode} videoCompleted={videoCompleted} isRtl={isRtl} lang={lang} />
    </div>
  );
}
