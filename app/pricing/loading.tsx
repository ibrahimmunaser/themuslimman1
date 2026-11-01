/**
 * app/pricing/loading.tsx
 *
 * Shown instantly by Next.js while the pricing page server component renders.
 * Mirrors the page structure: navbar strip → hero → feature grid → pricing cards.
 */
export default function PricingLoading() {
  return (
    <div className="min-h-screen bg-ink">
      {/* Navbar skeleton */}
      <div className="border-b border-border bg-surface/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="h-6 w-32 rounded bg-surface-raised animate-pulse" />
          <div className="flex gap-3">
            <div className="h-8 w-16 rounded-md bg-surface-raised animate-pulse hidden sm:block" />
            <div className="h-8 w-20 rounded-md bg-surface-raised animate-pulse" />
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">

        {/* Hero skeleton */}
        <div className="text-center space-y-4">
          <div className="h-3 w-28 rounded bg-surface-raised animate-pulse mx-auto" />
          <div className="h-10 w-3/4 max-w-xl rounded-lg bg-surface-raised animate-pulse mx-auto" />
          <div className="h-5 w-1/2 max-w-md rounded bg-surface-raised animate-pulse mx-auto" />
        </div>

        {/* Feature stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="rounded-xl border border-border bg-surface p-4 space-y-2">
              <div className="h-5 w-5 rounded bg-surface-raised animate-pulse" />
              <div className="h-6 w-12 rounded bg-surface-raised animate-pulse" />
              <div className="h-3 w-16 rounded bg-surface-raised animate-pulse" />
            </div>
          ))}
        </div>

        {/* Pricing cards skeleton */}
        <div className="grid sm:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-border bg-surface p-8 space-y-5"
            >
              <div className="space-y-2">
                <div className="h-6 w-24 rounded bg-surface-raised animate-pulse" />
                <div className="h-9 w-32 rounded-lg bg-surface-raised animate-pulse" />
                <div className="h-4 w-48 rounded bg-surface-raised animate-pulse" />
              </div>
              <div className="space-y-2.5">
                {[1, 2, 3, 4, 5].map((j) => (
                  <div key={j} className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded-full bg-surface-raised animate-pulse flex-shrink-0" />
                    <div
                      className="h-3.5 rounded bg-surface-raised animate-pulse"
                      style={{ width: `${55 + j * 8}%` }}
                    />
                  </div>
                ))}
              </div>
              <div className="h-12 w-full rounded-xl bg-surface-raised animate-pulse" />
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
