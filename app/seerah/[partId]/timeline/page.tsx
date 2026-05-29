import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { requireStudent } from "@/lib/auth";
import { hasActiveCourseAccess } from "@/lib/access";
import { getActiveProfileId } from "@/app/actions/profiles";
import { getPartById, PARTS } from "@/lib/content";
import { ERA_MAP } from "@/lib/types";
import { getTimelineForPart } from "@/lib/timeline-data";
import { getEraVisual } from "@/lib/era-visuals";
import { prisma } from "@/lib/db";
import { StudentLayout } from "@/components/student/student-layout";
import { ArrowLeft, ChevronRight, Lock, Play } from "lucide-react";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ partId: string }>;
}

export async function generateMetadata(props: Props) {
  const { partId } = await props.params;
  const part = getPartById(partId);
  if (!part) return { title: "Timeline" };
  return { title: `Part ${part.partNumber} — Seerah Timeline` };
}

export default async function TimelinePage(props: Props) {
  const user = await requireStudent();
  if (!user.studentProfileId) notFound();

  const { partId } = await props.params;
  const partBase = getPartById(partId);
  if (!partBase) notFound();

  const hasAccess = await hasActiveCourseAccess(user.id, user.hasPaid);
  if (!hasAccess) redirect("/pricing");

  const userPlan = "complete" as const;

  // Scope progress to the active learner profile.
  const learnerProfileId = user.activeProfileId ?? await getActiveProfileId(user.id);

  // Get progress to check completion status
  const partProgress = await prisma.partProgress.findMany({
    where: { learnerProfileId },
    orderBy: { partNumber: 'asc' },
    select: { partNumber: true, status: true },
  });
  const completedParts = partProgress
    .filter(p => p.status === 'completed' || p.status === 'mastered')
    .map(p => p.partNumber);

  const tl = getTimelineForPart(partBase.partNumber);
  if (!tl) notFound();

  const eraInfo = ERA_MAP[partBase.era as keyof typeof ERA_MAP];
  const eraVis = getEraVisual(partBase.era);
  const eraParts = PARTS.filter((p) => p.era === partBase.era);
  const eraIdx = eraParts.findIndex((p) => p.partNumber === partBase.partNumber);
  const eraPos = eraIdx + 1;
  const eraTotal = eraParts.length;
  const eraPercent = Math.round((eraPos / eraTotal) * 100);
  const seerahPercent = Math.round((partBase.partNumber / 100) * 100);

  const c = eraInfo.color;

  // Calculate previous and next parts for timeline navigation
  const allParts = PARTS;
  const currentIndex = allParts.findIndex((p) => p.id === partId);
  const prevPart = currentIndex > 0 ? allParts[currentIndex - 1] : null;
  const nextPart = currentIndex < allParts.length - 1 ? allParts[currentIndex + 1] : null;

  // All parts navigable — progress is a guide, not a gate
  const isPrevPartAccessible = !!prevPart;
  const isNextPartAccessible = !!nextPart;

  return (
    <StudentLayout userPlan={userPlan} userName={user.fullName} activeProfileName={user.activeProfileName} planType={user.planType}>
      <div className="min-h-screen bg-[#0a0a0a]">

        {/* ── Top bar ─────────────────────────────────────────────────────── */}
        <div className="sticky top-0 z-30 border-b border-white/10 bg-[#0a0a0a]/95 backdrop-blur-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
            <Link
              href={`/seerah/${partId}`}
              className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Lesson
            </Link>
            <div className="flex items-center gap-3">
              <div
                className="text-[11px] font-bold px-3 py-1.5 rounded-full border"
                style={{ color: c, borderColor: `${c}60`, background: `${c}20` }}
              >
                Part {partBase.partNumber} of 100
              </div>
            </div>
          </div>
        </div>

        {/* ── Cinematic hero ───────────────────────────────────────────────── */}
        <div
          className="relative overflow-hidden"
          style={{
            backgroundImage: [
              `radial-gradient(ellipse 70% 70% at 50% 55%, ${c}30 0%, transparent 65%)`,
              `radial-gradient(ellipse 45% 55% at 80% 10%, ${eraVis.colorA}22 0%, transparent 55%)`,
              `radial-gradient(ellipse 35% 45% at 15% 85%, ${eraVis.colorB}18 0%, transparent 50%)`,
              `radial-gradient(${eraVis.patternColor} 1.2px, transparent 1.2px)`,
            ].join(", "),
            backgroundSize: "auto, auto, auto, 28px 28px",
            backgroundColor: "#0a0a0a",
          }}
        >
          {/* Compass rose — atmospheric decoration */}
          <div
            className="absolute top-1/2 right-6 lg:right-16 -translate-y-1/2 pointer-events-none select-none hidden xl:block"
            style={{ opacity: 0.08, color: c }}
          >
            <svg width="160" height="160" viewBox="0 0 120 120" fill="none" stroke="currentColor">
              <circle cx="60" cy="60" r="57" strokeWidth="0.6" />
              <circle cx="60" cy="60" r="42" strokeWidth="0.4" />
              <circle cx="60" cy="60" r="24" strokeWidth="0.4" />
              <circle cx="60" cy="60" r="3" fill="currentColor" strokeWidth="0" />
              <line x1="60" y1="3" x2="60" y2="117" strokeWidth="0.5" />
              <line x1="3" y1="60" x2="117" y2="60" strokeWidth="0.5" />
              <line x1="18" y1="18" x2="102" y2="102" strokeWidth="0.3" />
              <line x1="102" y1="18" x2="18" y2="102" strokeWidth="0.3" />
              <polygon points="60,6 57,28 60,34 63,28" fill="currentColor" stroke="none" />
            </svg>
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-b from-transparent to-[#0a0a0a] pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-14">

            {/* Title */}
            <div className="mb-10">
              <p
                className="text-[10px] font-bold uppercase tracking-[0.2em] mb-3 flex items-center gap-2.5"
                style={{ color: c }}
              >
                <span
                  className="inline-block w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: c, boxShadow: `0 0 8px ${c}` }}
                />
                {eraInfo.label}
              </p>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-none mb-3 tracking-tight">
                Where Part {partBase.partNumber} Fits
              </h1>
              <p className="text-white/65 text-base sm:text-lg max-w-2xl leading-relaxed">
                {tl.currentEventTitle}
              </p>
            </div>

            {/* Journey path */}
            <div className="relative">

              {/* Connecting line */}
              <div
                className="absolute hidden md:block pointer-events-none"
                style={{
                  top: "28px",
                  left: "14%",
                  right: "14%",
                  height: "1px",
                  background: `linear-gradient(90deg, transparent, ${c}50 20%, ${c}90 50%, ${c}50 80%, transparent)`,
                }}
              />
              {/* Shimmer on line */}
              <div
                className="absolute hidden md:block pointer-events-none overflow-hidden"
                style={{ top: "27px", left: "14%", right: "14%", height: "3px" }}
              >
                <div
                  className="absolute inset-y-0 w-1/3"
                  style={{
                    background: `linear-gradient(90deg, transparent, ${c}DD, transparent)`,
                    animation: "shimmer 4s ease-in-out infinite",
                  }}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-[1fr_1.6fr_1fr] gap-4">

                {/* ─ BEFORE ─ */}
                <div className="flex flex-col">
                  <div className="hidden md:flex justify-center items-center h-14 relative z-10">
                    {tl.previousEventTitle ? (
                      <div
                        className="w-4 h-4 rotate-45 border-2"
                        style={{
                          borderColor: `${c}70`,
                          background: "#0a0a0a",
                          boxShadow: `0 0 10px ${c}40`,
                        }}
                      />
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-white/20" />
                    )}
                  </div>

                  {tl.previousEventTitle ? (
                    isPrevPartAccessible ? (
                      <Link
                        href={prevPart ? `/seerah/${prevPart.id}/timeline` : "#"}
                        className="group flex-1 flex flex-col rounded-2xl border p-5 transition-all duration-300 hover:-translate-y-1.5 cursor-pointer"
                        style={{
                          borderColor: `${c}30`,
                          background: `linear-gradient(145deg, ${c}12 0%, ${c}06 100%)`,
                          backdropFilter: "blur(12px)",
                        }}
                      >
                        <div className="mb-3">
                          <span
                            className="text-[9px] font-black uppercase tracking-[0.18em] px-2 py-1 rounded"
                            style={{ color: c, background: `${c}20` }}
                          >
                            Before
                          </span>
                        </div>
                        <p className="text-[11px] font-semibold mb-1.5" style={{ color: c }}>
                          Part {partBase.partNumber - 1}
                        </p>
                        <p className="text-sm font-semibold text-white/70 leading-snug mb-3 flex-1 group-hover:text-white/90 transition-colors">
                          {tl.previousEventTitle}
                        </p>
                        {tl.previousEventSubtitle && (
                          <p className="text-xs text-white/45 italic mb-3 leading-relaxed">
                            {tl.previousEventSubtitle}
                          </p>
                        )}
                        <p className="text-xs text-white/45 leading-relaxed line-clamp-3 mb-4">
                          {tl.previousEventSummary}
                        </p>
                        <div
                          className="inline-flex items-center gap-1 text-[11px] font-semibold"
                          style={{ color: c }}
                        >
                          <ChevronRight className="w-3 h-3 rotate-180" />
                          Part {partBase.partNumber - 1}
                        </div>
                      </Link>
                    ) : (
                      <div
                        className="relative flex-1 flex flex-col rounded-2xl border p-5 overflow-hidden"
                        style={{
                          borderColor: `${c}20`,
                          background: `linear-gradient(145deg, ${c}08 0%, ${c}03 100%)`,
                          backdropFilter: "blur(12px)",
                        }}
                      >
                        {/* Shiny lock overlay */}
                        <div
                          className="absolute inset-0 pointer-events-none"
                          style={{
                            background: `radial-gradient(circle at 30% 30%, rgba(255,223,0,0.15) 0%, transparent 60%)`,
                          }}
                        />
                        <div className="absolute top-3 right-3 z-10">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{
                              background: "linear-gradient(135deg, rgba(255,223,0,0.25) 0%, rgba(200,169,110,0.20) 100%)",
                              border: "1px solid rgba(255,223,0,0.35)",
                              boxShadow: "0 0 20px rgba(255,223,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)",
                            }}
                          >
                            <Lock className="w-4 h-4 text-yellow-300" />
                          </div>
                        </div>
                        <div className="mb-3 relative z-10">
                          <span
                            className="text-[9px] font-black uppercase tracking-[0.18em] px-2 py-1 rounded"
                            style={{ color: `${c}80`, background: `${c}15` }}
                          >
                            Before
                          </span>
                        </div>
                        <p className="text-[11px] font-semibold mb-1.5 relative z-10" style={{ color: `${c}70` }}>
                          Part {partBase.partNumber - 1}
                        </p>
                        <p className="text-sm font-semibold text-white/40 leading-snug mb-3 flex-1 relative z-10">
                          {tl.previousEventTitle}
                        </p>
                        {tl.previousEventSubtitle && (
                          <p className="text-xs text-white/30 italic mb-3 leading-relaxed relative z-10">
                            {tl.previousEventSubtitle}
                          </p>
                        )}
                        <p className="text-xs text-white/25 leading-relaxed line-clamp-3 mb-4 relative z-10">
                          {tl.previousEventSummary}
                        </p>
                        <div className="flex items-center gap-2 text-[11px] font-semibold text-yellow-400/80 relative z-10">
                          <Lock className="w-3 h-3" />
                          <span>Complete previous parts to unlock</span>
                        </div>
                      </div>
                    )
                  ) : (
                    <div
                      className="flex-1 flex items-center justify-center rounded-2xl border p-5"
                      style={{ borderColor: `${c}20`, background: `${c}08` }}
                    >
                      <p className="text-xs text-white/35 italic text-center">
                        The Seerah begins here.
                      </p>
                    </div>
                  )}
                </div>

                {/* ─ CURRENT ─ */}
                <div className="flex flex-col">
                  <div className="hidden md:flex justify-center items-center h-14 relative z-10">
                    <div className="relative flex items-center justify-center">
                      <div
                        className="absolute w-14 h-14 rounded-full"
                        style={{
                          background: `radial-gradient(circle, ${c}40 0%, transparent 70%)`,
                          animation: "pulse-glow 3s ease-in-out infinite",
                        }}
                      />
                      <div
                        className="relative w-7 h-7 rounded-full z-10 flex items-center justify-center"
                        style={{
                          background: `linear-gradient(135deg, ${eraVis.colorA}, ${c})`,
                          boxShadow: `0 0 0 2px #0a0a0a, 0 0 0 4px ${c}70, 0 0 28px ${c}90, 0 0 56px ${c}50`,
                        }}
                      >
                        <div className="w-2 h-2 rounded-full bg-white/80" />
                      </div>
                    </div>
                  </div>

                  <div
                    className="flex-1 flex flex-col rounded-2xl border-2 p-7 relative overflow-hidden transition-all duration-300 hover:-translate-y-2"
                    style={{
                      borderColor: `${c}70`,
                      background: `linear-gradient(145deg, ${c}28 0%, ${c}14 35%, #0c0c0c 100%)`,
                      boxShadow: `0 0 0 1px ${c}25, 0 8px 60px ${c}25, 0 32px 80px rgba(0,0,0,0.6)`,
                    }}
                  >
                    <div
                      className="absolute -top-12 -right-12 w-48 h-48 rounded-full pointer-events-none"
                      style={{ background: `radial-gradient(circle, ${c}28 0%, transparent 70%)` }}
                    />
                    <div
                      className="absolute top-0 left-6 right-6 h-px pointer-events-none"
                      style={{ background: `linear-gradient(90deg, transparent, ${c}60, transparent)` }}
                    />

                    <div className="flex items-start justify-between gap-2 mb-5 relative z-10">
                      <span
                        className="text-[9px] font-black uppercase tracking-[0.18em] px-2.5 py-1.5 rounded-lg"
                        style={{
                          color: c,
                          background: `${c}30`,
                          border: `1px solid ${c}55`,
                        }}
                      >
                        Current Lesson
                      </span>
                      <span className="text-xs font-bold" style={{ color: c }}>
                        Part {partBase.partNumber}
                      </span>
                    </div>

                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-white leading-tight mb-2 relative z-10">
                      {tl.currentEventTitle}
                    </h2>
                    {tl.currentEventSubtitle && (
                      <p
                        className="text-sm font-medium italic mb-5 relative z-10"
                        style={{ color: c }}
                      >
                        {tl.currentEventSubtitle}
                      </p>
                    )}

                    <p className="text-sm text-white/75 leading-relaxed flex-1 relative z-10">
                      {tl.currentEventSummary}
                    </p>

                    <div
                      className="my-6 h-px relative z-10"
                      style={{ background: `linear-gradient(90deg, ${c}60, ${c}25, transparent)` }}
                    />

                    <Link
                      href={`/seerah/${partId}`}
                      className="relative z-10 inline-flex items-center gap-2.5 px-6 py-3 rounded-xl font-bold text-sm text-black transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                      style={{
                        background: `linear-gradient(135deg, ${eraVis.colorA}, ${c})`,
                        boxShadow: `0 4px 28px ${c}55, 0 2px 8px ${c}40`,
                      }}
                    >
                      <Play className="w-3.5 h-3.5" fill="currentColor" />
                      Continue Lesson
                    </Link>
                  </div>
                </div>

                {/* ─ NEXT ─ */}
                <div className="flex flex-col">
                  <div className="hidden md:flex justify-center items-center h-14 relative z-10">
                    {tl.nextEventTitle ? (
                      <div
                        className="w-4 h-4 rotate-45 border-2"
                        style={{
                          borderColor: `${c}70`,
                          background: "#0a0a0a",
                          boxShadow: `0 0 10px ${c}40`,
                        }}
                      />
                    ) : (
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center"
                        style={{ border: `2px solid ${c}60`, background: `${c}25` }}
                      >
                        <span className="text-[8px]" style={{ color: c }}>✦</span>
                      </div>
                    )}
                  </div>

                  {tl.nextEventTitle ? (
                    isNextPartAccessible ? (
                      <Link
                        href={nextPart ? `/seerah/${nextPart.id}/timeline` : "#"}
                        className="group flex-1 flex flex-col rounded-2xl border p-5 transition-all duration-300 hover:-translate-y-1.5 cursor-pointer"
                        style={{
                          borderColor: `${c}30`,
                          background: `linear-gradient(145deg, ${c}12 0%, ${c}06 100%)`,
                          backdropFilter: "blur(12px)",
                        }}
                      >
                        <div className="mb-3">
                          <span
                            className="text-[9px] font-black uppercase tracking-[0.18em] px-2 py-1 rounded"
                            style={{ color: c, background: `${c}20` }}
                          >
                            Next
                          </span>
                        </div>
                        <p className="text-[11px] font-semibold mb-1.5" style={{ color: c }}>
                          Part {partBase.partNumber + 1}
                        </p>
                        <p className="text-sm font-semibold text-white/70 leading-snug mb-3 flex-1 group-hover:text-white/90 transition-colors">
                          {tl.nextEventTitle}
                        </p>
                        {tl.nextEventSubtitle && (
                          <p className="text-xs text-white/45 italic mb-3 leading-relaxed">
                            {tl.nextEventSubtitle}
                          </p>
                        )}
                        <p className="text-xs text-white/45 leading-relaxed line-clamp-3 mb-4">
                          {tl.nextEventSummary}
                        </p>
                        <div
                          className="inline-flex items-center gap-1 text-[11px] font-semibold"
                          style={{ color: c }}
                        >
                          Part {partBase.partNumber + 1}
                          <ChevronRight className="w-3 h-3" />
                        </div>
                      </Link>
                    ) : (
                      <div
                        className="relative flex-1 flex flex-col rounded-2xl border p-5 overflow-hidden"
                        style={{
                          borderColor: `${c}20`,
                          background: `linear-gradient(145deg, ${c}08 0%, ${c}03 100%)`,
                          backdropFilter: "blur(12px)",
                        }}
                      >
                        {/* Shiny lock overlay */}
                        <div
                          className="absolute inset-0 pointer-events-none"
                          style={{
                            background: `radial-gradient(circle at 70% 30%, rgba(255,223,0,0.15) 0%, transparent 60%)`,
                          }}
                        />
                        <div className="absolute top-3 right-3 z-10">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{
                              background: "linear-gradient(135deg, rgba(255,223,0,0.25) 0%, rgba(200,169,110,0.20) 100%)",
                              border: "1px solid rgba(255,223,0,0.35)",
                              boxShadow: "0 0 20px rgba(255,223,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)",
                            }}
                          >
                            <Lock className="w-4 h-4 text-yellow-300" />
                          </div>
                        </div>
                        <div className="mb-3 relative z-10">
                          <span
                            className="text-[9px] font-black uppercase tracking-[0.18em] px-2 py-1 rounded"
                            style={{ color: `${c}80`, background: `${c}15` }}
                          >
                            Next
                          </span>
                        </div>
                        <p className="text-[11px] font-semibold mb-1.5 relative z-10" style={{ color: `${c}70` }}>
                          Part {partBase.partNumber + 1}
                        </p>
                        <p className="text-sm font-semibold text-white/40 leading-snug mb-3 flex-1 relative z-10">
                          {tl.nextEventTitle}
                        </p>
                        {tl.nextEventSubtitle && (
                          <p className="text-xs text-white/30 italic mb-3 leading-relaxed relative z-10">
                            {tl.nextEventSubtitle}
                          </p>
                        )}
                        <p className="text-xs text-white/25 leading-relaxed line-clamp-3 mb-4 relative z-10">
                          {tl.nextEventSummary}
                        </p>
                        <div className="flex items-center gap-2 text-[11px] font-semibold text-yellow-400/80 relative z-10">
                          <Lock className="w-3 h-3" />
                          <span>Complete Part {partBase.partNumber} to continue</span>
                        </div>
                      </div>
                    )
                  ) : (
                    <div
                      className="flex-1 flex flex-col items-center justify-center rounded-2xl border p-6"
                      style={{
                        borderColor: `${c}35`,
                        background: `linear-gradient(145deg, ${c}15 0%, transparent 100%)`,
                      }}
                    >
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center mb-3"
                        style={{ background: `${c}20`, border: `1px solid ${c}45` }}
                      >
                        <span className="text-lg" style={{ color: c }}>✦</span>
                      </div>
                      <p className="text-xs font-bold mb-1 text-center" style={{ color: c }}>
                        Journey Complete
                      </p>
                      <p className="text-xs text-white/45 text-center">
                        Part 100 closes the Seerah.
                      </p>
                    </div>
                  )}
                </div>

              </div>
            </div>
          </div>
        </div>

        {/* ── Story context chips ─────────────────────────────────────────── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7">
          <div className="flex flex-wrap gap-2.5">
            {[
              { label: "Era", value: eraInfo.label },
              { label: "Mood", value: eraVis.mood },
              { label: "Position", value: `Part ${eraPos} of ${eraTotal} in this era` },
              { label: "Journey", value: `Part ${partBase.partNumber} of 100` },
              ...eraVis.themeWords.slice(0, 2).map((w) => ({ label: "Theme", value: w })),
            ].map(({ label, value }, i) => (
              <div
                key={`${label}-${i}`}
                className="flex items-center gap-2 px-4 py-2 rounded-full border"
                style={{ borderColor: `${c}35`, background: `${c}12` }}
              >
                <span
                  className="text-[9px] font-black uppercase tracking-[0.15em]"
                  style={{ color: c }}
                >
                  {label}
                </span>
                <span className="text-white/70 text-xs">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Journey progress bars ───────────────────────────────────────── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
          <div className="grid sm:grid-cols-2 gap-5">

            {/* Era Journey */}
            <div
              className="rounded-2xl border p-6"
              style={{
                borderColor: `${c}30`,
                background: `linear-gradient(135deg, ${c}15 0%, ${c}08 100%)`,
              }}
            >
              <div className="flex items-start justify-between mb-5">
                <div>
                  <p
                    className="text-[9px] font-black uppercase tracking-[0.18em] mb-1.5"
                    style={{ color: c }}
                  >
                    Era Journey
                  </p>
                  <p className="text-sm font-semibold text-white/80">{eraInfo.label}</p>
                  <p className="text-xs text-white/50 mt-0.5">{eraInfo.description}</p>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-black" style={{ color: c }}>
                    {eraPercent}
                  </span>
                  <span className="text-sm font-bold" style={{ color: `${c}cc` }}>%</span>
                </div>
              </div>

              {/* Position marker */}
              <div className="relative mb-2">
                <div
                  className="absolute h-2.5 w-2.5 rounded-full -top-0.5 border-2 border-[#0a0a0a]"
                  style={{
                    left: `${eraPercent}%`,
                    transform: "translateX(-50%)",
                    background: c,
                    boxShadow: `0 0 10px ${c}, 0 0 4px ${c}`,
                  }}
                />
              </div>

              {/* Track */}
              <div className="h-[2px] rounded-full overflow-visible relative mb-3" style={{ background: "rgba(255,255,255,0.12)" }}>
                <div
                  className="absolute left-0 top-0 h-full rounded-full"
                  style={{
                    width: `${eraPercent}%`,
                    background: `linear-gradient(90deg, ${c}80, ${c})`,
                    boxShadow: `0 0 10px ${c}90`,
                  }}
                />
              </div>

              <div className="flex justify-between text-[10px]" style={{ color: "rgba(255,255,255,0.40)" }}>
                <span>Start of era</span>
                <span style={{ color: c }}>Part {eraPos} of {eraTotal}</span>
                <span>End of era</span>
              </div>
            </div>

            {/* Full Seerah Journey */}
            <div
              className="rounded-2xl border p-6"
              style={{
                borderColor: "rgba(212,168,67,0.30)",
                background: "linear-gradient(135deg, rgba(212,168,67,0.12) 0%, rgba(212,168,67,0.05) 100%)",
              }}
            >
              <div className="flex items-start justify-between mb-5">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.18em] mb-1.5 text-yellow-400">
                    Full Seerah Journey
                  </p>
                  <p className="text-sm font-semibold text-white/80">From revelation to legacy</p>
                  <p className="text-xs text-white/50 mt-0.5">Part 1 → Part 100</p>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-black text-yellow-400">{seerahPercent}</span>
                  <span className="text-sm font-bold text-yellow-400/70">%</span>
                </div>
              </div>

              <div className="relative mb-2">
                <div
                  className="absolute h-2.5 w-2.5 rounded-full -top-0.5 border-2 border-[#0a0a0a]"
                  style={{
                    left: `${seerahPercent}%`,
                    transform: "translateX(-50%)",
                    background: c,
                    boxShadow: `0 0 10px ${c}, 0 0 4px ${c}`,
                  }}
                />
              </div>

              <div className="h-[2px] rounded-full overflow-visible relative mb-3" style={{ background: "rgba(255,255,255,0.12)" }}>
                <div
                  className="absolute left-0 top-0 h-full rounded-full"
                  style={{
                    width: `${seerahPercent}%`,
                    background: `linear-gradient(90deg, #8B6F4580, ${c}99, ${c})`,
                    boxShadow: `0 0 10px ${c}90`,
                  }}
                />
              </div>

              <div className="flex justify-between text-[10px] text-white/40">
                <span>Pre-Islamic Arabia</span>
                <span className="text-yellow-400">Part {partBase.partNumber} of 100</span>
                <span>Legacy</span>
              </div>
            </div>

          </div>
        </div>

        {/* ── Why this part matters ────────────────────────────────────────── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
          <div
            className="relative rounded-2xl overflow-hidden p-8 sm:p-10"
            style={{
              background: `linear-gradient(135deg, ${c}22 0%, ${c}10 40%, #0c0c0c 100%)`,
              border: `1px solid ${c}40`,
            }}
          >
            <div
              className="absolute left-0 top-6 bottom-6 w-[3px] rounded-full"
              style={{ background: `linear-gradient(180deg, transparent, ${c}, transparent)` }}
            />
            <div
              className="absolute -bottom-8 -right-8 w-48 h-48 rounded-full pointer-events-none"
              style={{ background: `radial-gradient(circle, ${c}22 0%, transparent 70%)` }}
            />

            <p
              className="text-[9px] font-black uppercase tracking-[0.2em] mb-5 flex items-center gap-3"
              style={{ color: c }}
            >
              <span className="w-6 h-px" style={{ background: c }} />
              Why This Part Matters
            </p>
            <p className="text-xl sm:text-2xl font-semibold text-white/90 leading-relaxed relative z-10 max-w-3xl">
              {tl.whyItMatters}
            </p>
            <p className="mt-6 text-sm text-white/45 italic relative z-10 max-w-2xl">
              {eraVis.atmosphere}
            </p>
          </div>
        </div>


        {/* ── Bottom navigation ─────────────────────────────────────────────── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <div
            className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-6 border-t"
            style={{ borderColor: "rgba(255,255,255,0.10)" }}
          >
            {/* Previous timeline or Back to Lesson */}
            {prevPart && isPrevPartAccessible ? (
              <Link
                href={`/seerah/${prevPart.id}/timeline`}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border text-sm font-semibold text-white/65 hover:text-white transition-all"
                style={{ borderColor: "rgba(255,255,255,0.14)", background: "rgba(255,255,255,0.05)" }}
              >
                <ArrowLeft className="w-4 h-4" />
                <div className="text-left">
                  <p className="text-[10px] text-white/40">Previous Timeline</p>
                  <p className="font-bold">Part {prevPart.partNumber}</p>
                </div>
              </Link>
            ) : (
              <Link
                href={`/seerah/${partId}`}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border text-sm font-semibold text-white/65 hover:text-white transition-all"
                style={{ borderColor: "rgba(255,255,255,0.14)", background: "rgba(255,255,255,0.05)" }}
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Lesson {partBase.partNumber}
              </Link>
            )}

            {/* Next timeline */}
            {nextPart && isNextPartAccessible && (
              <Link
                href={`/seerah/${nextPart.id}/timeline`}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-black transition-all hover:opacity-90 hover:scale-[1.02]"
                style={{
                  background: `linear-gradient(135deg, ${eraVis.colorA}, ${c})`,
                  boxShadow: `0 4px 24px ${c}45`,
                }}
              >
                <div className="text-right">
                  <p className="text-[10px] text-black/60">Next Timeline</p>
                  <p className="font-bold">Part {nextPart.partNumber}</p>
                </div>
                <ChevronRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>

      </div>

      <style>{`
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.5; transform: scale(0.9); }
          50%       { opacity: 1;   transform: scale(1.2); }
        }
        @keyframes shimmer {
          0%   { left: -35%; }
          100% { left: 100%; }
        }
      `}</style>
    </StudentLayout>
  );
}
