/**
 * app/seerah/loading.tsx
 *
 * Next.js shows this file instantly while the dashboard page.tsx is rendering
 * on the server. Eliminates the blank-screen gap during:
 *   - Login → dashboard redirect
 *   - Post-payment "Start Learning" → dashboard
 *   - Profile switch → dashboard
 *   - Any link navigation to /seerah
 *
 * Server component — no imports, no client JS, pure Tailwind + animate-pulse.
 * Mirrors the StudentLayout (sidebar + main) since there is no shared layout.tsx
 * at this route segment.
 */
export default function SeerahLoading() {
  return (
    <div className="flex min-h-screen bg-background w-full">

      {/* ── Desktop sidebar placeholder ────────────────────────────────────────
          Mirrors StudentLayout's sidebar: lg:w-64, bg-surface, border-r.
          Hidden below lg breakpoint — on mobile the sidebar is an off-canvas
          drawer, so no space is reserved for it during loading either.       */}
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

        {/* ── Tab bar skeleton ──────────────────────────────────────────────────
            CourseDashboardTabs renders a sticky top-0 z-50 tab strip as the
            FIRST element inside <main>. It must appear in the skeleton or the
            real page's tab bar will push content down on load, causing CLS.

            Real classes (from course-dashboard-tabs.tsx):
              outer:  sticky top-0 z-50 border-b border-border bg-surface shadow-sm
              inner:  max-w-6xl mx-auto px-2 sm:px-6 lg:px-8
              button: flex-1 flex flex-col sm:flex-row items-center justify-center
                      gap-1 sm:gap-2 px-1 sm:px-6 py-3 sm:py-4 min-h-[44px]

            Five tabs on mobile (4 course + 1 Account that is lg:hidden);
            four tabs on desktop (Account tab hidden via lg:hidden).          */}
        <div className="sticky top-0 z-50 border-b border-border bg-surface shadow-sm">
          <div className="max-w-6xl mx-auto px-2 sm:px-6 lg:px-8">
            <div className="flex">
              {/* 4 main tab shimmer blocks — visible on all breakpoints */}
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
              {/* Account tab — mobile only (lg:hidden), matching the real button */}
              <div className="lg:hidden flex-1 flex flex-col items-center justify-center gap-1 px-1 py-3 min-h-[44px]">
                <div className="w-4 h-4 rounded bg-surface-raised animate-pulse" />
                <div className="h-3 w-8 rounded bg-surface-raised animate-pulse" />
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">

          {/* Welcome header — mirrors "Welcome back / [Name]" */}
          <div className="space-y-2">
            <div className="h-3.5 w-24 bg-surface-raised rounded animate-pulse" />
            <div className="h-8 w-44 bg-surface-raised rounded-lg animate-pulse" />
          </div>

          {/* "Start here / Continue learning" card */}
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

          {/* Stat cards — 2-col mobile, 4-col sm+ */}
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

            {/* Era/chapter rows */}
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
      </main>
    </div>
  );
}
