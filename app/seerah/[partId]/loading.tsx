export default function PartPageLoading() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header skeleton */}
      <div className="border-b border-border bg-surface sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 pr-20 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="h-4 w-24 bg-surface-raised rounded animate-pulse" />
            <div className="flex items-center gap-3">
              <div className="h-5 w-14 bg-surface-raised rounded animate-pulse" />
              <div className="h-4 w-28 bg-surface-raised rounded animate-pulse hidden sm:block" />
            </div>
          </div>
          <div className="h-7 w-2/3 bg-surface-raised rounded animate-pulse mt-3" />
          <div className="h-4 w-1/3 bg-surface-raised rounded animate-pulse mt-2" />
        </div>
      </div>

      {/* Content skeleton */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Mode tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {[120, 96, 104, 88, 110, 92, 108, 80].map((w, i) => (
            <div
              key={i}
              className="h-9 rounded-lg bg-surface-raised animate-pulse shrink-0"
              style={{ width: w }}
            />
          ))}
        </div>

        {/* Sub-tabs */}
        <div className="flex gap-2 mb-5">
          {[80, 72, 68].map((w, i) => (
            <div
              key={i}
              className="h-8 rounded-md bg-surface-raised animate-pulse"
              style={{ width: w }}
            />
          ))}
        </div>

        {/* Main content area — video player placeholder */}
        <div className="w-full aspect-video rounded-xl bg-surface-raised animate-pulse" />

        {/* Below-video description */}
        <div className="mt-4 space-y-2">
          <div className="h-4 w-3/4 bg-surface-raised rounded animate-pulse" />
          <div className="h-4 w-1/2 bg-surface-raised rounded animate-pulse" />
        </div>

        {/* Nav buttons */}
        <div className="mt-8 pt-6 border-t border-border flex items-center justify-between gap-4">
          <div className="h-10 w-32 bg-surface-raised rounded-lg animate-pulse" />
          <div className="h-10 w-32 bg-surface-raised rounded-lg animate-pulse" />
        </div>
      </div>
    </div>
  );
}
