/**
 * app/seerah/loading.tsx
 *
 * Next.js shows this instantly while the dashboard page.tsx is rendering.
 * Since app/seerah/layout.tsx keeps StudentLayout (sidebar) mounted, this
 * skeleton only needs to cover the CONTENT area inside the sidebar layout.
 *
 * Mirrors the dashboard page content:
 *   tab bar → welcome header → continue card → stat cards → roadmap rows
 */
export default function SeerahLoading() {
  return (
    <div className="flex-1 min-w-0 overflow-x-clip">

      {/* ── Tab bar skeleton ──────────────────────────────────────────────────
          CourseDashboardTabs: sticky top-0 z-50 border-b bg-surface        */}
      <div className="sticky top-0 z-50 border-b border-border bg-surface shadow-sm">
        <div className="max-w-6xl mx-auto px-2 sm:px-6 lg:px-8">
          <div className="flex">
            {[52, 56, 60, 52].map((labelW, i) => (
              <div
                key={i}
                className="flex-1 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-1 sm:px-6 py-3 sm:py-4 min-h-[44px]"
              >
                <div className="w-4 h-4 rounded bg-surface-raised animate-pulse flex-shrink-0" />
                <div
                  className="h-3 rounded bg-surface-raised animate-pulse"
                  style={{ width: labelW }}
                />
              </div>
            ))}
            {/* Account tab — mobile only */}
            <div className="lg:hidden flex-1 flex flex-col items-center justify-center gap-1 px-1 py-3 min-h-[44px]">
              <div className="w-4 h-4 rounded bg-surface-raised animate-pulse" />
              <div className="h-3 w-8 rounded bg-surface-raised animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">

        {/* Welcome header */}
        <div className="space-y-2">
          <div className="h-3.5 w-24 bg-surface-raised rounded animate-pulse" />
          <div className="h-8 w-44 bg-surface-raised rounded-lg animate-pulse" />
        </div>

        {/* Continue learning card */}
        <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8 space-y-3">
          <div className="h-3 w-20 bg-surface-raised rounded animate-pulse" />
          <div className="h-7 w-72 max-w-full bg-surface-raised rounded-lg animate-pulse" />
          <div className="h-4 w-full max-w-sm bg-surface-raised rounded animate-pulse" />
          <div className="h-4 w-4/5 max-w-xs bg-surface-raised rounded animate-pulse" />
          <div className="flex gap-3 pt-2 flex-wrap">
            <div className="h-10 w-36 bg-surface-raised rounded-xl animate-pulse" />
            <div className="h-10 w-28 bg-surface-raised rounded-xl animate-pulse" />
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-xl border border-border bg-surface p-4 space-y-2.5">
              <div className="h-3 w-16 bg-surface-raised rounded animate-pulse" />
              <div className="h-7 w-12 bg-surface-raised rounded animate-pulse" />
              <div className="h-1.5 w-full rounded-full bg-surface-raised animate-pulse" />
            </div>
          ))}
        </div>

        {/* Course roadmap section */}
        <div className="space-y-4">
          <div>
            <div className="h-7 w-40 bg-surface-raised rounded animate-pulse mb-2" />
            <div className="h-4 w-full max-w-lg bg-surface-raised rounded animate-pulse" />
          </div>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-xl border border-border bg-surface p-4 sm:p-5 flex items-center gap-4"
            >
              <div className="w-10 h-10 rounded-lg bg-surface-raised animate-pulse flex-shrink-0" />
              <div className="flex-1 space-y-2 min-w-0">
                <div className="h-4 w-40 bg-surface-raised rounded animate-pulse" />
                <div className="h-1.5 w-full rounded-full bg-surface-raised animate-pulse" />
                <div className="h-3 w-24 bg-surface-raised rounded animate-pulse" />
              </div>
              <div className="h-6 w-10 bg-surface-raised rounded animate-pulse flex-shrink-0" />
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
