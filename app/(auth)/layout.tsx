import Link from "next/link";
import { Video, FileText, Brain, Map, BarChart2 } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-ink flex flex-col">
      {/* Header */}
      <div className="border-b border-border/50 px-4 sm:px-6 py-3 flex-shrink-0">
        <Link href="/" className="inline-flex items-center group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/logoicon.png"
            alt="TheMuslimMan"
            style={{ height: "44px", width: "auto" }}
          />
        </Link>
      </div>

      {/* Content — stacked on mobile, split on lg+ */}
      <div className="flex-1 flex min-h-0">
        {/* Left: form */}
        <div className="flex-1 flex items-center justify-center p-6 py-10">
          <div className="w-full max-w-md">{children}</div>
        </div>

        {/* Right: inspirational panel — lg+ only */}
        <div
          className="hidden lg:flex flex-col items-center justify-center w-[420px] xl:w-[480px] border-l border-border/30 px-10 py-12 flex-shrink-0"
          style={{ background: "linear-gradient(160deg, rgba(200,169,110,0.04) 0%, transparent 60%)" }}
        >
          <div className="max-w-[300px] text-center">
            {/* Decorative mark */}
            <div className="text-gold/40 text-4xl mb-6 select-none" aria-hidden>
              ✦
            </div>
            <h2 className="text-xl font-bold text-text mb-2">Complete Seerah</h2>
            <p className="text-text-secondary text-sm leading-relaxed mb-8">
              A guided 100-part journey through the life of Prophet Muhammad&nbsp;ﷺ — from pre-Islamic Arabia to his final years.
            </p>

            <ul className="space-y-3 text-left mb-8">
              {[
                { Icon: Video,    text: "100 video lessons" },
                { Icon: FileText, text: "Briefings & study guides" },
                { Icon: Brain,    text: "Quizzes & flashcards" },
                { Icon: Map,      text: "Mind maps & slides" },
                { Icon: BarChart2, text: "Guided progress tracking" },
              ].map(({ Icon, text }) => (
                <li key={text} className="flex items-center gap-3 text-sm text-text-secondary">
                  <Icon className="w-4 h-4 text-gold/60 flex-shrink-0" aria-hidden />
                  {text}
                </li>
              ))}
            </ul>

            <div className="pt-5 border-t border-border/40">
              <p className="text-xs text-text-muted leading-relaxed">
                Self-paced · All formats included · Lifetime option available
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-border/50 px-4 py-4 text-center flex-shrink-0">
        <p className="text-xs text-text-muted">
          © {new Date().getFullYear()} TheMuslimMan · themuslimman.com
        </p>
      </div>
    </div>
  );
}
