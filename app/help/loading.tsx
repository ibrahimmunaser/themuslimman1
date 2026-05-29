export default function HelpLoading() {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="mb-8">
          <div className="h-8 w-36 bg-surface-raised rounded animate-pulse mb-2" />
          <div className="h-4 w-72 bg-surface-raised rounded animate-pulse" />
        </div>
        {/* Contact form skeleton */}
        <div className="p-6 rounded-xl border border-border bg-surface space-y-4">
          <div className="h-5 w-32 bg-surface-raised rounded animate-pulse" />
          <div className="h-10 w-full bg-surface-raised rounded-lg animate-pulse" />
          <div className="h-24 w-full bg-surface-raised rounded-lg animate-pulse" />
          <div className="h-10 w-28 bg-surface-raised rounded-lg animate-pulse" />
        </div>
        {/* FAQ category skeletons */}
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-6 rounded-xl border border-border bg-surface space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded bg-surface-raised animate-pulse" />
              <div className="h-5 w-40 bg-surface-raised rounded animate-pulse" />
            </div>
            <div className="space-y-4">
              <div className="h-4 w-3/4 bg-surface-raised rounded animate-pulse" />
              <div className="h-3 w-full bg-surface-raised rounded animate-pulse" />
              <div className="h-3 w-5/6 bg-surface-raised rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
