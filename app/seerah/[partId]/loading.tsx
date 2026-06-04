/**
 * app/seerah/[partId]/loading.tsx
 *
 * Shown instantly by Next.js while the part page server component is rendering.
 * Mirrors the part page layout:
 *   sticky header → mode selector strip → video aspect-ratio box → controls
 *
 * The seerah/layout.tsx keeps StudentLayout mounted, so this skeleton only
 * needs to cover the content area (header bar + tabs + content block).
 */
export default function PartLoading() {
  return (
    <div className="min-h-screen bg-background">
      {/* Sticky header skeleton */}
      <div className="border-b border-border bg-surface sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-2 sm:py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="h-4 w-20 rounded bg-surface-raised animate-pulse" />
            <div className="flex items-center gap-2">
              <div className="h-6 w-14 rounded-md bg-surface-raised animate-pulse" />
              <div className="h-4 w-24 rounded bg-surface-raised animate-pulse hidden sm:block" />
            </div>
          </div>
          <div className="h-6 w-72 max-w-full rounded-lg bg-surface-raised animate-pulse mt-2" />
          <div className="h-4 w-48 rounded bg-surface-raised animate-pulse mt-1 hidden sm:block" />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
        {/* Mode selector strip */}
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {[88, 76, 80, 96, 88, 84, 80].map((w, i) => (
            <div
              key={i}
              className="h-14 rounded-xl bg-surface-raised animate-pulse flex-shrink-0"
              style={{ width: w }}
            />
          ))}
        </div>

        {/* Video player placeholder */}
        <div className="w-full aspect-video rounded-2xl bg-surface-raised animate-pulse" />

        {/* Audio section placeholder */}
        <div className="h-20 rounded-xl bg-surface-raised/60 animate-pulse" />

        {/* Nav buttons placeholder */}
        <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between gap-3">
          <div className="h-12 w-24 rounded-lg bg-surface-raised animate-pulse" />
          <div className="h-12 w-36 rounded-xl bg-surface-raised animate-pulse ml-auto" />
        </div>
      </div>
    </div>
  );
}
