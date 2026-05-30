/**
 * app/seerah/[partId]/loading.tsx
 *
 * Next.js shows this instantly while the lesson page.tsx is rendering on the
 * server. Since app/seerah/layout.tsx keeps StudentLayout (sidebar) mounted
 * across navigations, this skeleton only needs to cover the CONTENT area —
 * the sidebar never tears down, so no sidebar skeleton is needed here.
 *
 * Structure mirrors the real lesson page content:
 *   sticky header → tab pills → video placeholder → text lines
 */
export default function PartLoading() {
  return (
    <div className="min-h-screen bg-background">

      {/* ── Lesson header skeleton ─────────────────────────────────────────
          Mirrors: border-b border-border bg-surface sticky top-0 z-10
          with max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-2 sm:py-4       */}
      <div className="border-b border-border bg-surface sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-2 sm:py-4">

          {/* Top row: back link + part badge */}
          <div className="flex items-center justify-between gap-4 min-h-[44px]">
            <div className="h-4 w-20 bg-surface-raised rounded animate-pulse" />
            <div className="flex items-center gap-2 mr-10 sm:mr-0">
              <div className="h-6 w-14 bg-surface-raised rounded-md animate-pulse" />
              <div className="hidden sm:block h-4 w-28 bg-surface-raised rounded animate-pulse" />
            </div>
          </div>

          {/* Title */}
          <div className="h-6 sm:h-8 w-72 max-w-full bg-surface-raised rounded animate-pulse mt-1" />

          {/* Subtitle */}
          <div className="hidden sm:block h-4 w-52 bg-surface-raised rounded animate-pulse mt-0.5" />

          {/* Metadata row */}
          <div className="hidden sm:flex items-center gap-2.5 mt-1.5">
            <div className="h-3 w-32 bg-surface-raised rounded animate-pulse" />
            <div className="h-3 w-16 bg-surface-raised rounded animate-pulse" />
          </div>

          {/* Progress badges */}
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

      {/* ── Tab content skeleton ────────────────────────────────────────────
          Matches PartTabsFallback from page.tsx:
          8 mode-pill widths · 3 sub-tab pills · aspect-video · text lines  */}
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

          {/* Text lines */}
          <div className="mt-3 space-y-2">
            <div className="h-4 w-3/4 bg-surface-raised rounded animate-pulse" />
            <div className="h-4 w-1/2 bg-surface-raised rounded animate-pulse" />
          </div>

        </div>
      </div>

    </div>
  );
}
