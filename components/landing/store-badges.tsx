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
  "group inline-flex h-11 min-w-[8.5rem] items-center justify-center gap-2.5 rounded-xl border border-border bg-surface/80 px-3.5 hover:border-gold/35 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50";

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
          <span className="flex flex-col items-center leading-tight text-center">
            <span className="text-[10px] text-text-muted">{siteT(lang, "storeDownloadOn")}</span>
            <span className="text-sm font-semibold text-text">App Store</span>
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
          <span className="flex flex-col items-center leading-tight text-center">
            <span className="text-[10px] text-text-muted">{siteT(lang, "storeGetItOn")}</span>
            <span className="text-sm font-semibold text-text">Google Play</span>
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
      className="h-7 w-7 shrink-0 text-text"
      fill="currentColor"
    >
      <path d="M16.365 1.43c0 1.14-.493 2.27-1.177 3.08-.744.89-1.99 1.57-3.047 1.47-.12-1.09.507-2.26 1.23-3.04.787-.84 2.173-1.48 3.2-1.51.013.33.02.67.02 1.01zm1.238 13.75c-.687-.81-1.988-1.16-3.127-1.16-1.416 0-2.698.67-3.477.67-.8 0-2.035-.64-3.35-.62-1.724.03-3.316 1.01-4.193 2.57-1.793 3.11-1.465 7.76 1.285 10.29.857.79 1.874 1.67 3.208 1.64 1.287-.05 1.776-.83 3.332-.83 1.544 0 1.989.83 3.35.8 1.386-.02 2.262-.79 3.106-1.59 1.224-1.12 1.728-2.2 1.753-2.26-.038-.02-3.365-1.29-3.395-5.12-.028-3.21 2.635-4.74 2.753-4.83-1.504-2.2-3.842-2.47-4.655-2.52z" />
    </svg>
  );
}

function GooglePlayIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="h-7 w-7 shrink-0" fill="none">
      <path d="M4 3.5v17l10.5-8.5L4 3.5z" fill="#00C1FF" />
      <path d="M14.5 12 4 21.5 19 12l-4.5-3.5L14.5 12z" fill="#FFCE00" />
      <path d="M4 3.5 14.5 12 19 8.5 4 3.5z" fill="#00E676" />
      <path d="M4 21.5 19 12 14.5 12 4 3.5v18z" fill="#FF3A44" />
    </svg>
  );
}
