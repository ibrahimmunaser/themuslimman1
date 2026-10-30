import type { CourseLang } from "@/lib/course-lang";
import { siteT } from "@/lib/site-copy";
import { APPLE_APP_STORE_URL, GOOGLE_PLAY_APP_URL } from "@/lib/store-links";

type StoreBadgesProps = {
  lang: CourseLang;
  className?: string;
  /** When true, shows a short label above the badges (footer brand column). */
  showLabel?: boolean;
};

const badgeClass =
  "group inline-flex h-14 w-max min-w-[13.5rem] shrink-0 items-center gap-3 rounded-xl border border-white/20 bg-black px-4 hover:border-gold/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50";

export function StoreBadges({ lang, className = "", showLabel = false }: StoreBadgesProps) {
  return (
    <div className={className}>
      {showLabel ? (
        <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-3">
          {siteT(lang, "footMobileApp")}
        </p>
      ) : null}
      <div className="flex flex-wrap items-center gap-3">
        <a
          href={APPLE_APP_STORE_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={siteT(lang, "storeAppStoreAria")}
          className={badgeClass}
        >
          <AppleIcon />
          <span className="flex flex-col items-start leading-none text-start">
            <span className="text-[11px] text-white/70 whitespace-nowrap">{siteT(lang, "storeDownloadOn")}</span>
            <span className="mt-1 text-base font-semibold text-white whitespace-nowrap">App Store</span>
          </span>
        </a>
        <a
          href={GOOGLE_PLAY_APP_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={siteT(lang, "storeGooglePlayAria")}
          className={badgeClass}
        >
          <GooglePlayIcon />
          <span className="flex flex-col items-start leading-none text-start">
            <span className="text-[11px] text-white/70 whitespace-nowrap">{siteT(lang, "storeGetItOn")}</span>
            <span className="mt-1 text-base font-semibold text-white whitespace-nowrap">Google Play</span>
          </span>
        </a>
      </div>
    </div>
  );
}

function AppleIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="h-7 w-7 shrink-0 text-white"
      fill="currentColor"
    >
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
  );
}

function GooglePlayIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="h-7 w-7 shrink-0">
      <path fill="#EA4335" d="M11.128 12.003 1.09 22.011a2.73 2.73 0 0 0 3.999 1.62l11.29-6.377-5.251-5.25Z" />
      <path fill="#FBBC04" d="m21.338 9.67-4.899-2.806-5.311 5.14 5.251 5.25 4.944-2.865a2.663 2.663 0 0 0 0-4.719h.015Z" />
      <path fill="#4285F4" d="M1.09 1.995c-.06.225-.091.457-.09.69V21.32c0 .233.03.465.09.69l10.038-10.007L1.09 1.995Z" />
      <path fill="#34A853" d="m11.128 12.003 5.311-5.139L5.126.383A2.79 2.79 0 0 0 3.723 0 2.73 2.73 0 0 0 1.09 1.988l10.038 10.015Z" />
    </svg>
  );
}
