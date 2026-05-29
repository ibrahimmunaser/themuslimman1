/**
 * app/seerah/[partId]/loading.tsx
 *
 * Next.js shows this file instantly while the lesson page.tsx is rendering
 * on the server. Eliminates the blank-screen gap during:
 *   - Clicking a lesson from the dashboard
 *   - Clicking "Next Part" / "Previous Part" between lessons
 *   - Direct URL navigation to /seerah/part-N
 *
 * Server component — no imports, no client JS, pure Tailwind + animate-pulse.
 * Structure mirrors the real lesson page shell:
 *   StudentLayout (sidebar + main) → sticky header → PartTabsFallback-style content.
 *
 * The inner tab/video skeleton matches PartTabsFallback in page.tsx exactly so
 * the transition from loading → streamed content is imperceptible.
 */
export default function PartLoading() {
  return (
    <div className="flex min-h-screen bg-background w-full">

      {/* ── Desktop sidebar placeholder ────────────────────────────────────────
          Same as dashboard loading — lg:w-64, off-canvas on mobile.          */}
      <div className="hidden lg:flex flex-col lg:w-64 flex-shrink-0 bg-surface border-r border-border h-screen sticky top-0">

        {/* Logo row */}
        <div className="p-4 border-b border-border flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-surface-raised animate-pulse flex-shrink-0" />
          <div className="h-4 w-28 bg-surface-raised rounded animate-pulse" />
        </div>

        {/* User avatar + badge */}
        <div className="p-3 border-b border-border flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-surface-raised animate-pulse flex-shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 w-20 bg-surface-raised rounded animate-pulse" />
            <div className="h-4 w-16 bg-surface-raised rounded animate-pulse" />
          </div>
        </div>

        {/* Primary navigation items */}
        <div className="flex-1 py-3 px-3 space-y-1 min-h-0">
          <div className="h-2.5 w-12 bg-surface-raised rounded animate-pulse mb-3 mx-2" />
          {[88, 72, 96, 80].map((w, i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-lg">
              <div className="w-5 h-5 rounded bg-surface-raised animate-pulse flex-shrink-0" />
              <div className="h-4 bg-surface-raised rounded animate-pulse" style={{ width: w }} />
            </div>
          ))}
        </div>

        {/* Account footer items */}
        <div className="flex-shrink-0 border-t border-border px-3 pt-2 pb-3 space-y-0.5">
          <div className="h-2.5 w-16 bg-surface-raised rounded animate-pulse mb-2 mx-2" />
          {[56, 72, 64, 60].map((w, i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-lg">
              <div className="w-5 h-5 rounded bg-surface-raised animate-pulse flex-shrink-0" />
              <div className="h-3.5 bg-surface-raised rounded animate-pulse" style={{ width: w }} />
            </div>
          ))}
        </div>
      </div>

      {/* ── Main content area ─────────────────────────────────────────────────── */}
      <main className="flex-1 min-w-0 overflow-x-clip">
        <div className="min-h-screen bg-background">

          {/* ── Lesson header skeleton ─────────────────────────────────────────
              Mirrors: border-b border-border bg-surface sticky top-0 z-10
              with max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-2 sm:py-4       */}
          <div className="border-b border-border bg-surface sticky top-0 z-10">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-2 sm:py-4">

              {/* Top row: back link + part badge */}
              <div className="flex items-center justify-between gap-4 min-h-[44px]">
                <div className="h-4 w-20 bg-surface-raised rounded animate-pulse" />
                {/* Badge + gap for floating menu button on mobile (mr-10 sm:mr-0) */}
                <div className="flex items-center gap-2 mr-10 sm:mr-0">
                  <div className="h-6 w-14 bg-surface-raised rounded-md animate-pulse" />
                  <div className="hidden sm:block h-4 w-28 bg-surface-raised rounded animate-pulse" />
                </div>
              </div>

              {/* Title skeleton */}
              <div className="h-6 sm:h-8 w-72 max-w-full bg-surface-raised rounded animate-pulse mt-1" />

              {/* Subtitle (hidden on mobile, matches hidden sm:block) */}
              <div className="hidden sm:block h-4 w-52 bg-surface-raised rounded animate-pulse mt-0.5" />

              {/* Metadata row (hidden on mobile) */}
              <div className="hidden sm:flex items-center gap-2.5 mt-1.5">
                <div className="h-3 w-32 bg-surface-raised rounded animate-pulse" />
                <div className="h-3 w-16 bg-surface-raised rounded animate-pulse" />
              </div>

              {/* Progress badge row (hidden on mobile — matches PartProgressBadges) */}
              <div className="hidden sm:flex gap-1.5 mt-2 flex-wrap">
                {[48, 56, 44, 52, 40, 60, 56, 44].map((w, i) => (
                  <div
                    key={i}
                    className="h-6 bg-surface-raised rounded-md animate-pulse"
                    style={{ width: w }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* ── Tab content skeleton ───────────────────────────────────────────
              Matches PartTabsFallback from page.tsx exactly:
              — 8 mode-pill widths identical to the real tabs
              — 3 sub-tab pills
              — aspect-video placeholder
              — 2 text line skeletons                                          */}
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8">
            <div className="space-y-4">

              {/* Mode tab pills */}
              <div className="flex gap-2 overflow-x-auto pb-1">
                {[120, 96, 104, 88, 110, 92, 108, 80].map((w, i) => (
                  <div
                    key={i}
                    className="h-9 rounded-lg bg-surface-raised animate-pulse shrink-0"
                    style={{ width: w }}
                  />
                ))}
              </div>

              {/* Sub-tab pills */}
              <div className="flex gap-2 mb-1">
                {[80, 72, 68].map((w, i) => (
                  <div
                    key={i}
                    className="h-8 rounded-md bg-surface-raised animate-pulse"
                    style={{ width: w }}
                  />
                ))}
              </div>

              {/* Video / content area */}
              <div className="w-full aspect-video rounded-xl bg-surface-raised animate-pulse" />

              {/* Text description lines */}
              <div className="mt-3 space-y-2">
                <div className="h-4 w-3/4 bg-surface-raised rounded animate-pulse" />
                <div className="h-4 w-1/2 bg-surface-raised rounded animate-pulse" />
              </div>

            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
