export default function SeerahDashboardLoading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">

        {/* Welcome + Stats */}
        <section>
          <div className="mb-6">
            <div className="h-3 w-24 bg-surface-raised rounded animate-pulse mb-2" />
            <div className="h-8 w-48 bg-surface-raised rounded animate-pulse" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-5 rounded-2xl border border-border bg-surface">
                <div className="h-3 w-20 bg-surface-raised rounded animate-pulse mb-3" />
                <div className="h-8 w-24 bg-surface-raised rounded animate-pulse" />
                <div className="h-3 w-28 bg-surface-raised rounded animate-pulse mt-2" />
              </div>
            ))}
          </div>
        </section>

        {/* Continue Learning card */}
        <section>
          <div className="h-5 w-32 bg-surface-raised rounded animate-pulse mb-4" />
          <div className="p-5 rounded-2xl border border-border bg-surface flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-surface-raised animate-pulse shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 bg-surface-raised rounded animate-pulse" />
              <div className="h-3 w-1/2 bg-surface-raised rounded animate-pulse" />
              <div className="h-2 w-full bg-surface-raised rounded-full animate-pulse mt-2" />
            </div>
          </div>
        </section>

        {/* Course Roadmap */}
        <section>
          <div className="h-5 w-36 bg-surface-raised rounded animate-pulse mb-4" />
          <div className="grid sm:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-5 rounded-2xl border border-border bg-surface space-y-3">
                <div className="flex items-start justify-between">
                  <div className="h-4 w-16 bg-surface-raised rounded animate-pulse" />
                  <div className="h-3 w-10 bg-surface-raised rounded animate-pulse" />
                </div>
                <div className="h-5 w-3/4 bg-surface-raised rounded animate-pulse" />
                <div className="h-3 w-full bg-surface-raised rounded animate-pulse" />
                <div className="h-3 w-16 bg-surface-raised rounded animate-pulse" />
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
