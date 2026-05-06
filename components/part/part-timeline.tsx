import Link from "next/link";
import { ChevronRight, Lock, Play } from "lucide-react";
import { PARTS } from "@/lib/content";
import { ERA_MAP } from "@/lib/types";
import { getTimelineForPart } from "@/lib/timeline-data";
import { getEraVisual } from "@/lib/era-visuals";

interface Props {
  partId: string;
  partNumber: number;
  era: string;
  userPlan: "complete" | "essentials";
}

export function PartTimeline({ partId, partNumber, era, userPlan }: Props) {
  const tl = getTimelineForPart(partNumber);
  if (!tl) return null;

  const eraInfo = ERA_MAP[era as keyof typeof ERA_MAP];
  const eraVis = getEraVisual(era);
  const eraParts = PARTS.filter((p) => p.era === era);
  const eraIdx = eraParts.findIndex((p) => p.partNumber === partNumber);
  const eraPos = eraIdx + 1;
  const eraTotal = eraParts.length;
  const eraPercent = Math.round((eraPos / eraTotal) * 100);
  const seerahPercent = Math.round((partNumber / 100) * 100);

  const c = eraInfo?.color ?? "#C8A96E";

  return (
    <div className="mt-10">

      {/* Section label */}
      <div className="flex items-center gap-3 mb-6">
        <div className="h-px flex-1" style={{ background: `linear-gradient(90deg, ${c}50, transparent)` }} />
        <p
          className="text-[10px] font-black uppercase tracking-[0.22em] flex items-center gap-2"
          style={{ color: c }}
        >
          <span
            className="inline-block w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: c, boxShadow: `0 0 6px ${c}` }}
          />
          Where This Part Fits
        </p>
        <div className="h-px flex-1" style={{ background: `linear-gradient(270deg, ${c}50, transparent)` }} />
      </div>

      {/* Cinematic hero band */}
      <div
        className="relative rounded-2xl overflow-hidden"
        style={{
          backgroundImage: [
            `radial-gradient(ellipse 80% 80% at 50% 50%, ${c}28 0%, transparent 70%)`,
            `radial-gradient(ellipse 50% 60% at 85% 5%, ${eraVis.colorA}1C 0%, transparent 55%)`,
            `radial-gradient(ellipse 40% 50% at 10% 90%, ${eraVis.colorB}14 0%, transparent 50%)`,
            `radial-gradient(${eraVis.patternColor} 1px, transparent 1px)`,
          ].join(", "),
          backgroundSize: "auto, auto, auto, 24px 24px",
          backgroundColor: "#0a0a0a",
          border: `1px solid ${c}20`,
        }}
      >
        {/* Vignette bottom */}
        <div
          className="absolute bottom-0 left-0 right-0 h-12 pointer-events-none"
          style={{ background: "linear-gradient(to bottom, transparent, #0a0a0a)" }}
        />

        <div className="relative p-5 sm:p-7">

          {/* Era + title row */}
          <div className="flex items-center justify-between gap-3 mb-6">
            <p
              className="text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-2"
              style={{ color: c }}
            >
              <span
                className="inline-block w-1 h-1 rounded-full"
                style={{ backgroundColor: c, boxShadow: `0 0 5px ${c}` }}
              />
              {eraInfo?.label}
            </p>
            <span
              className="text-[10px] font-bold px-2.5 py-1 rounded-full border"
              style={{ color: c, borderColor: `${c}50`, background: `${c}18` }}
            >
              Part {partNumber} of 100
            </span>
          </div>

          {/* Journey path */}
          <div className="relative">

            {/* Connecting line */}
            <div
              className="absolute hidden md:block pointer-events-none"
              style={{
                top: "26px",
                left: "13%",
                right: "13%",
                height: "1px",
                background: `linear-gradient(90deg, transparent, ${c}50 20%, ${c}90 50%, ${c}50 80%, transparent)`,
              }}
            />
            {/* Shimmer */}
            <div
              className="absolute hidden md:block pointer-events-none overflow-hidden"
              style={{ top: "25px", left: "13%", right: "13%", height: "3px" }}
            >
              <div
                className="absolute inset-y-0 w-1/3"
                style={{
                  background: `linear-gradient(90deg, transparent, ${c}DD, transparent)`,
                  animation: "shimmer 4s ease-in-out infinite",
                }}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[1fr_1.6fr_1fr] gap-3">

              {/* ─ BEFORE ─ */}
              <div className="flex flex-col">
                <div className="hidden md:flex justify-center items-center h-14 relative z-10">
                  {tl.previousEventTitle ? (
                    <div
                      className="w-3.5 h-3.5 rotate-45 border-2"
                      style={{ borderColor: `${c}70`, background: "#0a0a0a", boxShadow: `0 0 8px ${c}40` }}
                    />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-white/20" />
                  )}
                </div>

                {tl.previousEventTitle ? (
                  <Link
                    href={tl.prevLessonHref ?? "#"}
                    className="group flex-1 flex flex-col rounded-xl border p-4 transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                    style={{
                      borderColor: `${c}28`,
                      background: `linear-gradient(145deg, ${c}10 0%, ${c}05 100%)`,
                    }}
                  >
                    <div className="mb-2.5">
                      <span
                        className="text-[8px] font-black uppercase tracking-[0.18em] px-2 py-0.5 rounded"
                        style={{ color: c, background: `${c}1C` }}
                      >
                        Before
                      </span>
                    </div>
                    <p className="text-[10px] font-semibold mb-1" style={{ color: c }}>
                      Part {partNumber - 1}
                    </p>
                    <p className="text-sm font-semibold text-white/65 leading-snug mb-2 flex-1 group-hover:text-white/85 transition-colors">
                      {tl.previousEventTitle}
                    </p>
                    <p className="text-xs text-white/40 leading-relaxed line-clamp-2 mb-3">
                      {tl.previousEventSummary}
                    </p>
                    <div className="inline-flex items-center gap-1 text-[10px] font-semibold" style={{ color: c }}>
                      <ChevronRight className="w-3 h-3 rotate-180" />
                      Part {partNumber - 1}
                    </div>
                  </Link>
                ) : (
                  <div
                    className="flex-1 flex items-center justify-center rounded-xl border p-4"
                    style={{ borderColor: `${c}18`, background: `${c}06` }}
                  >
                    <p className="text-xs text-white/30 italic text-center">The Seerah begins here.</p>
                  </div>
                )}
              </div>

              {/* ─ CURRENT ─ */}
              <div className="flex flex-col">
                <div className="hidden md:flex justify-center items-center h-14 relative z-10">
                  <div className="relative flex items-center justify-center">
                    <div
                      className="absolute w-12 h-12 rounded-full"
                      style={{
                        background: `radial-gradient(circle, ${c}40 0%, transparent 70%)`,
                        animation: "pulse-glow 3s ease-in-out infinite",
                      }}
                    />
                    <div
                      className="relative w-6 h-6 rounded-full z-10 flex items-center justify-center"
                      style={{
                        background: `linear-gradient(135deg, ${eraVis.colorA}, ${c})`,
                        boxShadow: `0 0 0 2px #0a0a0a, 0 0 0 3px ${c}70, 0 0 20px ${c}90, 0 0 40px ${c}50`,
                      }}
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-white/80" />
                    </div>
                  </div>
                </div>

                <div
                  className="flex-1 flex flex-col rounded-xl border-2 p-5 relative overflow-hidden transition-all duration-300 hover:-translate-y-1"
                  style={{
                    borderColor: `${c}65`,
                    background: `linear-gradient(145deg, ${c}25 0%, ${c}12 40%, #0c0c0c 100%)`,
                    boxShadow: `0 0 0 1px ${c}20, 0 6px 40px ${c}22`,
                  }}
                >
                  <div
                    className="absolute top-0 left-4 right-4 h-px pointer-events-none"
                    style={{ background: `linear-gradient(90deg, transparent, ${c}55, transparent)` }}
                  />
                  <div
                    className="absolute -top-10 -right-10 w-36 h-36 rounded-full pointer-events-none"
                    style={{ background: `radial-gradient(circle, ${c}25 0%, transparent 70%)` }}
                  />

                  <div className="flex items-start justify-between gap-2 mb-4 relative z-10">
                    <span
                      className="text-[8px] font-black uppercase tracking-[0.18em] px-2 py-1 rounded-lg"
                      style={{ color: c, background: `${c}28`, border: `1px solid ${c}50` }}
                    >
                      Current Lesson
                    </span>
                    <span className="text-[10px] font-bold" style={{ color: c }}>
                      Part {partNumber}
                    </span>
                  </div>

                  <h3 className="text-lg sm:text-xl font-black text-white leading-tight mb-2 relative z-10">
                    {tl.currentEventTitle}
                  </h3>
                  {tl.currentEventSubtitle && (
                    <p className="text-xs font-medium italic mb-4 relative z-10" style={{ color: c }}>
                      {tl.currentEventSubtitle}
                    </p>
                  )}

                  <p className="text-xs text-white/70 leading-relaxed flex-1 relative z-10">
                    {tl.currentEventSummary}
                  </p>

                  <div
                    className="my-4 h-px relative z-10"
                    style={{ background: `linear-gradient(90deg, ${c}55, ${c}20, transparent)` }}
                  />

                  <Link
                    href={`/seerah/${partId}`}
                    className="relative z-10 inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-bold text-xs text-black transition-all hover:scale-[1.02]"
                    style={{
                      background: `linear-gradient(135deg, ${eraVis.colorA}, ${c})`,
                      boxShadow: `0 3px 20px ${c}50`,
                    }}
                  >
                    <Play className="w-3 h-3" fill="currentColor" />
                    Continue Lesson
                  </Link>
                </div>
              </div>

              {/* ─ NEXT ─ */}
              <div className="flex flex-col">
                <div className="hidden md:flex justify-center items-center h-14 relative z-10">
                  {tl.nextEventTitle ? (
                    <div
                      className="w-3.5 h-3.5 rotate-45 border-2"
                      style={{ borderColor: `${c}70`, background: "#0a0a0a", boxShadow: `0 0 8px ${c}40` }}
                    />
                  ) : (
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center"
                      style={{ border: `2px solid ${c}55`, background: `${c}20` }}
                    >
                      <span className="text-[7px]" style={{ color: c }}>✦</span>
                    </div>
                  )}
                </div>

                {tl.nextEventTitle ? (
                  <Link
                    href={tl.nextLessonHref ?? "#"}
                    className="group flex-1 flex flex-col rounded-xl border p-4 transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                    style={{
                      borderColor: `${c}28`,
                      background: `linear-gradient(145deg, ${c}10 0%, ${c}05 100%)`,
                    }}
                  >
                    <div className="mb-2.5">
                      <span
                        className="text-[8px] font-black uppercase tracking-[0.18em] px-2 py-0.5 rounded"
                        style={{ color: c, background: `${c}1C` }}
                      >
                        Next
                      </span>
                    </div>
                    <p className="text-[10px] font-semibold mb-1" style={{ color: c }}>
                      Part {partNumber + 1}
                    </p>
                    <p className="text-sm font-semibold text-white/65 leading-snug mb-2 flex-1 group-hover:text-white/85 transition-colors">
                      {tl.nextEventTitle}
                    </p>
                    <p className="text-xs text-white/40 leading-relaxed line-clamp-2 mb-3">
                      {tl.nextEventSummary}
                    </p>
                    <div className="inline-flex items-center gap-1 text-[10px] font-semibold" style={{ color: c }}>
                      Part {partNumber + 1}
                      <ChevronRight className="w-3 h-3" />
                    </div>
                  </Link>
                ) : (
                  <div
                    className="flex-1 flex flex-col items-center justify-center rounded-xl border p-5"
                    style={{ borderColor: `${c}30`, background: `linear-gradient(145deg, ${c}12 0%, transparent 100%)` }}
                  >
                    <span className="text-lg mb-2" style={{ color: c }}>✦</span>
                    <p className="text-xs font-bold text-center" style={{ color: c }}>Journey Complete</p>
                    <p className="text-xs text-white/40 text-center mt-1">Part 100 closes the Seerah.</p>
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* Why this part matters */}
          <div
            className="mt-5 relative rounded-xl overflow-hidden p-5 sm:p-6"
            style={{
              background: `linear-gradient(135deg, ${c}1C 0%, ${c}0A 50%, transparent 100%)`,
              border: `1px solid ${c}35`,
            }}
          >
            <div
              className="absolute left-0 top-4 bottom-4 w-[2px] rounded-full"
              style={{ background: `linear-gradient(180deg, transparent, ${c}, transparent)` }}
            />
            <p
              className="text-[8px] font-black uppercase tracking-[0.2em] mb-3 flex items-center gap-2.5"
              style={{ color: c }}
            >
              <span className="w-4 h-px" style={{ background: c }} />
              Why This Part Matters
            </p>
            <p className="text-sm sm:text-base font-semibold text-white/88 leading-relaxed max-w-3xl">
              {tl.whyItMatters}
            </p>
            <p className="mt-3 text-xs text-white/40 italic">{eraVis.atmosphere}</p>
          </div>

        </div>
      </div>

      {/* Progress bars — compact row */}
      <div className="grid sm:grid-cols-2 gap-3 mt-3">

        <div
          className="rounded-xl border px-5 py-4"
          style={{ borderColor: `${c}28`, background: `linear-gradient(135deg, ${c}12 0%, ${c}06 100%)` }}
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[8px] font-black uppercase tracking-[0.18em]" style={{ color: c }}>
                Era Journey
              </p>
              <p className="text-xs font-semibold text-white/75 mt-0.5">{eraInfo?.label}</p>
            </div>
            <span className="text-2xl font-black" style={{ color: c }}>{eraPercent}<span className="text-xs" style={{ color: `${c}AA` }}>%</span></span>
          </div>
          <div className="relative mb-2">
            <div
              className="absolute h-2 w-2 rounded-full -top-0.5 border border-[#0a0a0a]"
              style={{ left: `${eraPercent}%`, transform: "translateX(-50%)", background: c, boxShadow: `0 0 8px ${c}` }}
            />
          </div>
          <div className="h-[2px] rounded-full mb-2" style={{ background: "rgba(255,255,255,0.10)" }}>
            <div
              className="h-full rounded-full"
              style={{ width: `${eraPercent}%`, background: `linear-gradient(90deg, ${c}80, ${c})`, boxShadow: `0 0 8px ${c}90` }}
            />
          </div>
          <div className="flex justify-between text-[9px]" style={{ color: "rgba(255,255,255,0.38)" }}>
            <span>Start of era</span>
            <span style={{ color: c }}>Part {eraPos} of {eraTotal}</span>
            <span>End of era</span>
          </div>
        </div>

        <div
          className="rounded-xl border px-5 py-4"
          style={{ borderColor: "rgba(212,168,67,0.28)", background: "linear-gradient(135deg, rgba(212,168,67,0.10) 0%, rgba(212,168,67,0.04) 100%)" }}
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[8px] font-black uppercase tracking-[0.18em] text-yellow-400">
                Full Seerah
              </p>
              <p className="text-xs font-semibold text-white/75 mt-0.5">Part 1 → Part 100</p>
            </div>
            <span className="text-2xl font-black text-yellow-400">{seerahPercent}<span className="text-xs text-yellow-400/70">%</span></span>
          </div>
          <div className="relative mb-2">
            <div
              className="absolute h-2 w-2 rounded-full -top-0.5 border border-[#0a0a0a]"
              style={{ left: `${seerahPercent}%`, transform: "translateX(-50%)", background: c, boxShadow: `0 0 8px ${c}` }}
            />
          </div>
          <div className="h-[2px] rounded-full mb-2" style={{ background: "rgba(255,255,255,0.10)" }}>
            <div
              className="h-full rounded-full"
              style={{ width: `${seerahPercent}%`, background: `linear-gradient(90deg, #8B6F4575, ${c}90, ${c})`, boxShadow: `0 0 8px ${c}90` }}
            />
          </div>
          <div className="flex justify-between text-[9px] text-white/38">
            <span>Pre-Islamic Arabia</span>
            <span className="text-yellow-400">Part {partNumber} of 100</span>
            <span>Legacy</span>
          </div>
        </div>

      </div>

      {/* Essentials upsell — subtle, one line */}
      {userPlan === "essentials" && (
        <div
          className="mt-3 flex items-center justify-between gap-4 px-5 py-3.5 rounded-xl border"
          style={{ borderColor: "rgba(212,168,67,0.22)", background: "rgba(212,168,67,0.07)" }}
        >
          <div className="flex items-center gap-3">
            <Lock className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" />
            <p className="text-xs text-white/60">
              Quizzes, flashcards, and mastery insights are available in Complete.
            </p>
          </div>
          <Link
            href="/pricing"
            className="flex-shrink-0 text-[11px] font-bold text-yellow-400 hover:text-yellow-300 transition-colors"
          >
            Upgrade →
          </Link>
        </div>
      )}

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
    </div>
  );
}
