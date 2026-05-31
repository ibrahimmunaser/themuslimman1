"use client";

import { clsx } from "clsx";
import {
  Video,
  BookOpen,
  FileText,
  BarChart2,
  Map,
  Image as ImageIcon,
  Layers,
  HelpCircle,
  Layers2,
} from "lucide-react";
import type { Part } from "@/lib/types";
import type { PartAssets as PartAssetUrls } from "@/lib/part-asset-cache";
import { LazyVideoPlayer } from "./lazy-video-player";
import { LazyListenOnTheGo } from "./lazy-listen-on-the-go";
import { TextViewer } from "./text-viewer";
import { FactsViewer } from "./facts-viewer";
import { LazyMindmapViewer } from "./lazy-mindmap-viewer";
import { QuizViewer } from "./quiz-viewer";
import { FlashcardsViewer } from "./flashcards-viewer";
import { SlidesPanel, InfographicPanel } from "./part-tabs";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LessonGalleryViewProps {
  part: Part;
  assetUrls: PartAssetUrls;
  previewMode?: boolean;
}

// ─── Section ──────────────────────────────────────────────────────────────────

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: React.FC<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3 border-b border-border/20 pb-2.5">
        <Icon className="w-3.5 h-3.5 text-gold/55" />
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-gold/50">
          {title}
        </p>
      </div>
      {children}
    </div>
  );
}

/** Same wrapper used by SubTabContent in part-tabs for components that need it. */
function Wrap({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-surface/60 p-4 sm:p-6">{children}</div>
  );
}

/** Caps tall text sections so they don't dominate the page. */
function ScrollableText({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-h-[520px] overflow-y-auto rounded-xl">
      {children}
    </div>
  );
}

// ─── Main gallery view ────────────────────────────────────────────────────────

export function LessonGalleryView({
  part,
  assetUrls,
  previewMode,
}: LessonGalleryViewProps) {
  const { assets } = part;

  const hasBriefing = !!assets.briefingText;
  const hasStudyGuide = !!assets.studyGuideText;
  const hasFacts = !!assets.statementOfFactsText;
  const hasSlides = !!(
    assets.slides?.presented.length ||
    assets.slides?.detailed.length ||
    assets.slides?.facts.length
  );
  const hasInfographic = !!(
    assets.infographics?.concise ||
    assets.infographics?.standard ||
    assets.infographics?.bentoGrid
  );
  const hasFlashcards = !!assets.flashcards;
  const hasQuiz = !!assets.quiz;

  return (
    <div className="space-y-8 animate-in fade-in-0 duration-200">

      {/* ── Video + Audio stacked ──────────────────────────────────────── */}
      <Section icon={Video} title="Video Lesson">
        <div className="space-y-4">
          <LazyVideoPlayer
            partNumber={part.partNumber}
            title={part.title}
            poster={assets.slides?.presented[0]?.medium}
            previewMode={previewMode}
            videoUrl={assetUrls.videoUrl}
          />
          <LazyListenOnTheGo
            partNumber={part.partNumber}
            title={part.title}
            previewMode={previewMode}
            audioUrl={assetUrls.audioUrl}
          />
        </div>
      </Section>

      {/* ── Briefing ──────────────────────────────────────────────────── */}
      {hasBriefing && (
        <Section icon={FileText} title="Lesson Briefing">
          <ScrollableText>
            <TextViewer
              content={assets.briefingText!}
              partNumber={part.partNumber}
              assetId="briefing"
              previewMode={previewMode}
              hasQuiz={false}
            />
          </ScrollableText>
        </Section>
      )}

      {/* ── Slides ────────────────────────────────────────────────────── */}
      {hasSlides && (
        <Section icon={Layers} title="Presentation Slides">
          <SlidesPanel part={part} previewMode={previewMode} />
        </Section>
      )}

      {/* ── Infographic + Mind Map side by side ───────────────────────── */}
      <div
        className={clsx(
          "grid grid-cols-1 gap-8",
          hasInfographic ? "lg:grid-cols-2" : ""
        )}
      >
        {hasInfographic && (
          <Section icon={ImageIcon} title="Infographic">
            <InfographicPanel part={part} previewMode={previewMode} />
          </Section>
        )}
        <Section icon={Map} title="Mind Map">
          <LazyMindmapViewer
            partNumber={part.partNumber}
            title={`Part ${part.partNumber} — Mindmap`}
            previewMode={previewMode}
            mindmapUrl={assetUrls.mindmapUrl}
          />
        </Section>
      </div>

      {/* ── Statement of Facts ────────────────────────────────────────── */}
      {hasFacts && (
        <Section icon={BarChart2} title="Statement of Facts">
          <Wrap>
            <FactsViewer
              content={assets.statementOfFactsText!}
              partNumber={part.partNumber}
              previewMode={previewMode}
            />
          </Wrap>
        </Section>
      )}

      {/* ── Flashcards (full width) ────────────────────────────────────── */}
      {hasFlashcards && (
        <Section icon={Layers2} title="Flashcards">
          <Wrap>
            <FlashcardsViewer
              flashcards={assets.flashcards!}
              partNumber={part.partNumber}
            />
          </Wrap>
        </Section>
      )}

      {/* ── Quiz (full width) ─────────────────────────────────────────── */}
      {hasQuiz && (
        <Section icon={HelpCircle} title="Knowledge Quiz">
          <Wrap>
            <QuizViewer
              quiz={assets.quiz!}
              partNumber={part.partNumber}
              previewMode={previewMode}
            />
          </Wrap>
        </Section>
      )}

      {/* ── Study Guide ───────────────────────────────────────────────── */}
      {hasStudyGuide && (
        <Section icon={BookOpen} title="Study Guide">
          <ScrollableText>
            <TextViewer
              content={assets.studyGuideText!}
              partNumber={part.partNumber}
              assetId="study_guide"
              previewMode={previewMode}
              hasQuiz={false}
            />
          </ScrollableText>
        </Section>
      )}

    </div>
  );
}
