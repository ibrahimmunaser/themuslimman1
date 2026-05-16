import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-ink flex flex-col">
      {/* Header */}
      <div className="border-b border-border/50 px-4 sm:px-6 py-3">
        <Link href="/" className="inline-flex items-center group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/logoicon.png"
            alt="TheMuslimMan"
            style={{ height: "44px", width: "auto" }}
          />
        </Link>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-4 py-12">
        <div className="w-full max-w-md">{children}</div>
      </div>

      {/* Footer */}
      <div className="border-t border-border/50 px-4 py-4 text-center">
        <p className="text-xs text-text-muted">
          © {new Date().getFullYear()} TheMuslimMan · themuslimman.com
        </p>
      </div>
    </div>
  );
}
