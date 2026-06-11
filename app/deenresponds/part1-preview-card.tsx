import { getPartById } from "@/lib/content";
import { getPartPageData } from "@/lib/part-content-cache";
import { Play, Clock, BookOpen } from "lucide-react";

/** Links to the Part 1 free preview on the main landing page. */
const FREE_LESSON_URL = "/#preview";

/**
 * Simple, lightweight Part 1 preview card for the /deenresponds landing page.
 * Replaces the full Part1FullPreview dashboard with a clear thumbnail + CTA.
 */
export async function Part1PreviewCard() {
  let thumbnailUrl: string | undefined;
  let title = "The World Before Islam";
  let subtitle: string | undefined;

  try {
    const partBase = getPartById("part-1");
    if (partBase) {
      title = partBase.title;
      subtitle = partBase.subtitle ?? undefined;
    }
    const data = await getPartPageData(1);
    thumbnailUrl = data.thumbnailUrl ?? undefined;
  } catch {
    // Render gracefully without data
  }

  return (
    <div className="max-w-2xl mx-auto rounded-2xl border border-gold/20 bg-surface overflow-hidden shadow-2xl shadow-black/40">
      {/* Thumbnail with play overlay */}
      <a
        href={FREE_LESSON_URL}
        className="group block relative aspect-video bg-zinc-900 overflow-hidden"
        aria-label={`Watch Part 1: ${title} — free lesson`}
      >
        {thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbnailUrl}
            alt={`Part 1: ${title}`}
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
            <BookOpen className="w-12 h-12 text-zinc-600" />
          </div>
        )}
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/35 group-hover:bg-black/20 transition-colors duration-300" />
        {/* Gold play button */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-gold/90 group-hover:bg-gold flex items-center justify-center shadow-2xl shadow-gold/30 group-hover:scale-110 transition-all duration-200">
            <Play className="w-7 h-7 text-ink fill-ink ml-0.5" />
          </div>
        </div>
        {/* FREE badge */}
        <div className="absolute top-3 right-3">
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-gold text-ink tracking-wide">
            FREE
          </span>
        </div>
        {/* "No signup" label */}
        <div className="absolute bottom-3 left-3">
          <span className="px-2.5 py-1 rounded-full text-xs text-gold/90 bg-black/50 border border-gold/20 backdrop-blur-sm">
            No signup required
          </span>
        </div>
      </a>

      {/* Card body */}
      <div className="p-5 sm:p-6">
        <p className="text-xs text-text-muted uppercase tracking-wider mb-1.5">Part 1 of 100</p>
        <h3 className="text-lg sm:text-xl font-bold mb-1">{title}</h3>
        {subtitle && (
          <p className="text-sm text-text-secondary mb-3">{subtitle}</p>
        )}
        <p className="text-sm text-text-secondary mb-5 leading-relaxed">
          Watch the full first lesson — including video, audio, quiz, and flashcards — before
          deciding to buy anything.
        </p>

        <div className="flex items-center gap-4 text-xs text-text-muted">
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            Full lesson + resources
          </span>
          <span className="flex items-center gap-1.5">
            <Play className="w-3.5 h-3.5" />
            Video &amp; audio included
          </span>
        </div>
      </div>
    </div>
  );
}
