export default function BillingLoading() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <div>
        <div className="h-7 w-36 bg-surface-raised rounded animate-pulse mb-2" />
        <div className="h-4 w-56 bg-surface-raised rounded animate-pulse" />
      </div>
      {/* Plan card */}
      <div className="rounded-2xl border border-border p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-surface-raised animate-pulse" />
            <div className="space-y-2">
              <div className="h-4 w-32 bg-surface-raised rounded animate-pulse" />
              <div className="h-3 w-48 bg-surface-raised rounded animate-pulse" />
            </div>
          </div>
          <div className="space-y-1 text-right">
            <div className="h-3 w-24 bg-surface-raised rounded animate-pulse" />
            <div className="h-4 w-20 bg-surface-raised rounded animate-pulse" />
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-y-2 gap-x-4 pt-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-4 bg-surface-raised rounded animate-pulse" />
          ))}
        </div>
      </div>
      {/* Purchase history */}
      <div>
        <div className="h-5 w-36 bg-surface-raised rounded animate-pulse mb-4" />
        <div className="rounded-xl border border-border overflow-hidden">
          {[1, 2].map((i) => (
            <div key={i} className={`flex items-center gap-4 px-5 py-4 ${i > 1 ? "border-t border-border" : ""}`}>
              <div className="w-8 h-8 rounded-lg bg-surface-raised animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-40 bg-surface-raised rounded animate-pulse" />
                <div className="h-3 w-24 bg-surface-raised rounded animate-pulse" />
              </div>
              <div className="h-4 w-16 bg-surface-raised rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
