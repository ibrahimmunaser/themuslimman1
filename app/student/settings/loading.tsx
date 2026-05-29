export default function SettingsLoading() {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="mb-8">
          <div className="h-8 w-48 bg-surface-raised rounded animate-pulse mb-2" />
          <div className="h-4 w-64 bg-surface-raised rounded animate-pulse" />
        </div>
        {/* Profile info card */}
        <div className="p-6 rounded-xl border border-border bg-surface space-y-4">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-5 h-5 rounded bg-surface-raised animate-pulse" />
            <div className="h-5 w-40 bg-surface-raised rounded animate-pulse" />
          </div>
          <div className="space-y-4">
            <div>
              <div className="h-3 w-20 bg-surface-raised rounded animate-pulse mb-2" />
              <div className="h-10 w-full bg-surface-raised rounded-lg animate-pulse" />
            </div>
            <div>
              <div className="h-3 w-24 bg-surface-raised rounded animate-pulse mb-2" />
              <div className="h-10 w-full bg-surface-raised rounded-lg animate-pulse" />
            </div>
          </div>
        </div>
        {/* Security card */}
        <div className="p-6 rounded-xl border border-border bg-surface space-y-4">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-5 h-5 rounded bg-surface-raised animate-pulse" />
            <div className="h-5 w-24 bg-surface-raised rounded animate-pulse" />
          </div>
          <div className="h-10 w-full bg-surface-raised rounded-lg animate-pulse" />
          <div className="h-10 w-32 bg-surface-raised rounded-lg animate-pulse" />
        </div>
        {/* Plan card */}
        <div className="p-6 rounded-xl border border-border bg-surface space-y-3">
          <div className="h-5 w-28 bg-surface-raised rounded animate-pulse" />
          <div className="h-4 w-56 bg-surface-raised rounded animate-pulse" />
          <div className="h-3 w-48 bg-surface-raised rounded animate-pulse" />
        </div>
      </div>
    </div>
  );
}
