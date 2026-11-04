"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Play } from "lucide-react";
import { LangToggle } from "@/components/part/lang-toggle";
import type { CourseLang } from "@/lib/course-lang";
import { isRtlLang, parseLang } from "@/lib/course-lang";
import { loc, locf } from "@/lib/loc";
import { siteT } from "@/lib/site-copy";
import { PLANS, formatPrice } from "@/lib/stripe-config";
import { FREE_PART_NUMBER } from "@/lib/free-part-number";

interface Part1PreviewData {
  title: string;
  subtitle: string | null;
  videoUrl: string | null;
  thumbnailUrl: string | null;
  lang?: CourseLang;
}

function readLangCookie(): CourseLang {
  if (typeof document === "undefined") return "en";
  const match = document.cookie.match(/(?:^|; )seerah_course_lang=([^;]+)/);
  return parseLang(match?.[1]);
}

export interface InlinePart1VideoProps {
  checkoutUrl: string;
  checkoutLabel?: string;
  hideCta?: boolean;
  onVideoStart?: () => void;
  onUnlockClick?: () => void;
}

export function InlinePart1Video({ checkoutUrl, checkoutLabel, hideCta = false, onVideoStart, onUnlockClick }: InlinePart1VideoProps) {
  const [lang, setLang]           = useState<CourseLang>("en");
  const [data, setData]           = useState<Part1PreviewData | null>(null);
  const [loading, setLoading]     = useState(true);
  const [failed, setFailed]       = useState(false);
  const [started, setStarted]     = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const pendingPlay = useRef(false);

  useEffect(() => {
    setLang(readLangCookie());
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setFailed(false);
    setStarted(false);
    fetch(`/api/preview/part1?lang=${lang}`)
      .then((r) => { if (!r.ok) throw new Error("fetch failed"); return r.json(); })
      .then((d: Part1PreviewData) => {
        if (cancelled) return;
        setData(d);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setFailed(true);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [lang]);

  function handlePlay() {
    if (!started) {
      setStarted(true);
      onVideoStart?.();
    }
  }

  function rememberTime(video: HTMLVideoElement) {
    if (!data?.videoUrl || video.currentTime < 1) return;
    try {
      sessionStorage.setItem(`seerah-preview-time:${data.videoUrl}`, String(video.currentTime));
    } catch {
      // Private mode can reject storage; playback still continues in the mounted player.
    }
  }

  function restoreTime(video: HTMLVideoElement) {
    if (!data?.videoUrl) return;
    try {
      const saved = Number(sessionStorage.getItem(`seerah-preview-time:${data.videoUrl}`) || 0);
      if (saved > 1 && video.duration && saved < video.duration - 1) {
        video.currentTime = saved;
        setStarted(true);
      }
    } catch {
      // Ignore unreadable storage.
    }
  }

  useEffect(() => {
    function onPlayRequest() {
      pendingPlay.current = true;
      document.getElementById("hero-player")?.scrollIntoView({ behavior: "smooth", block: "center" });
      const video = videoRef.current;
      if (!video) return;
      setStarted(true);
      void video.play();
      pendingPlay.current = false;
    }
    window.addEventListener("seerah-play-preview", onPlayRequest);
    return () => window.removeEventListener("seerah-play-preview", onPlayRequest);
  }, []);

  useEffect(() => {
    if (!pendingPlay.current || loading || !videoRef.current) return;
    setStarted(true);
    void videoRef.current.play();
    pendingPlay.current = false;
  });

  const isRtl = isRtlLang(lang);

  if (loading) {
    return (
      <div id="hero-player" className="rounded-2xl border border-border bg-surface overflow-hidden animate-pulse scroll-mt-24">
        <div className="p-4 bg-surface-raised border-b border-border">
          <div className="h-3 bg-surface w-1/3 rounded mb-2" />
          <div className="h-5 bg-surface w-2/3 rounded" />
        </div>
        <div className="aspect-video bg-surface-raised" />
        <div className="p-6">
          <div className="h-10 bg-surface-raised rounded-xl" />
        </div>
      </div>
    );
  }

  if (failed || !data?.videoUrl) {
    return (
      <div id="hero-player" className="rounded-2xl border border-border bg-surface p-6 text-center scroll-mt-24">
        <p className="text-sm text-text-secondary mb-3">
          {loc(lang, "Preview temporarily unavailable.", "المعاينة غير متاحة مؤقتًا.", "Aperçu temporairement indisponible.")}
        </p>
        <Link href="/watch-free" className="text-gold text-sm underline underline-offset-2 hover:text-gold/80">
          {loc(lang, "Open the free preview on its own page →", "افتح المعاينة المجانية في صفحة مستقلة ←", "Ouvrir l'aperçu gratuit sur sa propre page →")}
        </Link>
      </div>
    );
  }

  return (
    <div id="hero-player" className="rounded-2xl border border-gold/25 bg-surface overflow-hidden scroll-mt-24" dir={isRtl ? "rtl" : undefined}>

      <div className="px-5 py-4 bg-surface-raised border-b border-border flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold text-gold uppercase tracking-widest mb-0.5">
            {siteT(lang, "freeSampleKicker")}
          </p>
          <h3 className="text-base sm:text-lg font-bold text-text leading-snug">
            {locf(lang, "Part {n} — {title}", "الجزء {n} — {title}", "Partie {n} — {title}", { n: String(FREE_PART_NUMBER), title: data.title })}
          </h3>
          {data.subtitle && (
            <p className="text-sm text-text-secondary mt-0.5 leading-snug">{data.subtitle}</p>
          )}
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <LangToggle
            current={lang}
            partNumber={FREE_PART_NUMBER}
            prominent
            onChange={setLang}
          />
          <span className="text-xs font-bold bg-gold/15 border border-gold/30 text-gold px-2.5 py-1 rounded-full whitespace-nowrap">
            {siteT(lang, "previewFree")}
          </span>
        </div>
      </div>

      <div className="relative bg-black" dir="ltr">
        {!started && data.thumbnailUrl && (
          <button
            onClick={() => { videoRef.current?.play(); }}
            className="absolute inset-0 z-10 flex items-center justify-center group"
            aria-label={locf(lang, "Play Part {n}", "تشغيل الجزء {n}", "Lire la partie {n}", { n: String(FREE_PART_NUMBER) })}
          >
            <img
              src={data.thumbnailUrl}
              alt=""
              className="absolute inset-0 w-full h-full object-cover opacity-60"
            />
            <div className="relative z-10 w-16 h-16 rounded-full bg-gold/90 hover:bg-gold group-hover:scale-105 transition-transform flex items-center justify-center shadow-xl shadow-black/40">
              <Play className="w-7 h-7 fill-ink text-ink ml-0.5" />
            </div>
          </button>
        )}

        <video
          key={data.videoUrl}
          ref={videoRef}
          className="w-full aspect-video"
          controls
          poster={data.thumbnailUrl ?? undefined}
          preload="metadata"
          onPlay={handlePlay}
          onLoadedMetadata={(event) => restoreTime(event.currentTarget)}
          onTimeUpdate={(event) => rememberTime(event.currentTarget)}
          playsInline
        >
          <source src={data.videoUrl} type="video/mp4" />
        </video>
      </div>

      <div className="px-5 py-3 border-b border-border/40 bg-surface-raised/40 text-center">
        <p className="text-sm font-semibold text-text">
          {loc(lang, "Every lesson follows one path:", "كل درس يتبع مسارًا واحدًا:", "Chaque leçon suit un parcours :")}{" "}
          <span className="text-gold">{loc(lang, "Watch → Study → Review", "شاهد ← ادرس ← راجع", "Regarder → Étudier → Réviser")}</span>
        </p>
      </div>

      {!hideCta && (
        <div className="px-5 py-7 bg-surface text-center">
          <p className="text-base font-semibold text-text mb-1">
            {loc(lang, "Like this format? Continue the full 100-part path.", "أعجبك الأسلوب؟ تابع المسار الكامل.", "Vous aimez ce format ? Continuez le parcours complet en 100 parties.")}
          </p>
          <p className="text-sm text-text-secondary mb-5">
            {loc(lang, "Every lesson follows the same structure — video, reading, flashcards, quiz.", "كل درس بنفس البنية — فيديو وقراءة وبطاقات واختبار.", "Chaque leçon suit la même structure — vidéo, lecture, flashcards, quiz.")}
          </p>
          <Link
            href={checkoutUrl}
            onClick={onUnlockClick}
            className="flex items-center justify-center w-full py-5 rounded-xl bg-gold hover:bg-gold-light text-ink font-bold text-lg transition-colors shadow-lg shadow-gold/25 mb-2"
          >
            {!checkoutLabel || checkoutLabel.includes("$49") || checkoutLabel.includes("49 $") || checkoutLabel.includes("Only $99")
              ? `${loc(lang, "Subscribe", "اشترك", "S'abonner")} — ${formatPrice(PLANS.monthly.price)}/mo`
              : checkoutLabel}
          </Link>
          <p className="text-xs text-text-muted/70">
            {loc(lang, "Secure checkout · Instant access · One-time payment · 7-day refund guarantee", "دفع آمن · وصول فوري · دفعة واحدة · ضمان ٧ أيام", "Paiement sécurisé · Accès immédiat · Paiement unique · Garantie de 7 jours")}
          </p>
        </div>
      )}
    </div>
  );
}
