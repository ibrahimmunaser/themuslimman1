"use client";

import { useEffect, useState } from "react";
import { X, Heart, Copy, Check } from "lucide-react";

const STORAGE_KEY = "seerah_share_popup_last_shown";
// Show again after 14 days
const COOLDOWN_MS = 14 * 24 * 60 * 60 * 1000;
// Delay before popup appears (ms)
const SHOW_DELAY_MS = 3000;

const SHARE_URL = "https://themuslimman.com";
const SHARE_TEXT = "I've been learning the Seerah of the Prophet ﷺ with Complete Seerah — it's been an amazing journey. Check it out!";
const INSTAGRAM_CAPTION = `I've been learning the Seerah of the Prophet ﷺ with Complete Seerah — it's been an amazing journey. If you want to learn his life story step by step, check it out 👇\n\nthemuslimman.com`;

export function SharePopup() {
  const [visible, setVisible] = useState(false);
  const [copiedId, setCopiedId] = useState<"link" | "instagram" | null>(null);

  useEffect(() => {
    const last = localStorage.getItem(STORAGE_KEY);
    const shouldShow = !last || Date.now() - Number(last) > COOLDOWN_MS;
    if (!shouldShow) return;

    const timer = setTimeout(() => setVisible(true), SHOW_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, String(Date.now()));
    setVisible(false);
  }

  async function copyText(text: string, id: "link" | "instagram") {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // clipboard unavailable
    }
  }

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-popup-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={dismiss}
        aria-hidden="true"
      />

      {/* Card */}
      <div className="relative w-full max-w-sm bg-surface border border-border rounded-2xl p-6 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300">
        <button
          onClick={dismiss}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-text-muted hover:text-text hover:bg-white/5 transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon */}
        <div className="w-12 h-12 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center mx-auto mb-4">
          <Heart className="w-6 h-6 text-gold" />
        </div>

        {/* Heading */}
        <h2 id="share-popup-title" className="text-lg font-bold text-text text-center mb-2">
          Enjoying the course so far?
        </h2>
        <p className="text-sm text-text-secondary text-center mb-5 leading-relaxed">
          Your recommendation means the world — and helps others discover the Seerah of the Prophet&nbsp;ﷺ.
          Please share it with friends and family!
        </p>

        {/* Share buttons — 2×2 grid */}
        <div className="grid grid-cols-2 gap-2">
          {/* WhatsApp */}
          <a
            href={`https://wa.me/?text=${encodeURIComponent(SHARE_TEXT + " " + SHARE_URL)}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={dismiss}
            className="flex flex-col items-center gap-2 px-3 py-3 rounded-xl bg-[#25D366]/10 border border-[#25D366]/20 text-[#25D366] hover:bg-[#25D366]/15 transition-colors text-xs font-medium"
          >
            <WhatsAppIcon />
            WhatsApp
          </a>

          {/* Facebook */}
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(SHARE_URL)}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={dismiss}
            className="flex flex-col items-center gap-2 px-3 py-3 rounded-xl bg-[#1877F2]/10 border border-[#1877F2]/20 text-[#1877F2] hover:bg-[#1877F2]/15 transition-colors text-xs font-medium"
          >
            <FacebookIcon />
            Facebook
          </a>

          {/* X / Twitter */}
          <a
            href={`https://x.com/intent/tweet?text=${encodeURIComponent(SHARE_TEXT)}&url=${encodeURIComponent(SHARE_URL)}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={dismiss}
            className="flex flex-col items-center gap-2 px-3 py-3 rounded-xl bg-white/5 border border-border text-text hover:bg-white/8 transition-colors text-xs font-medium"
          >
            <XIcon />
            Share on X
          </a>

          {/* Instagram — copy caption */}
          <button
            onClick={() => copyText(INSTAGRAM_CAPTION, "instagram")}
            className="flex flex-col items-center gap-2 px-3 py-3 rounded-xl bg-[#E1306C]/10 border border-[#E1306C]/20 text-[#E1306C] hover:bg-[#E1306C]/15 transition-colors text-xs font-medium"
          >
            <InstagramIcon />
            {copiedId === "instagram" ? "Copied!" : "Instagram"}
          </button>
        </div>

        {/* Copy link row */}
        <button
          onClick={() => copyText(SHARE_URL, "link")}
          className="mt-2 flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl bg-white/5 border border-border text-text-secondary hover:text-text hover:bg-white/8 transition-colors text-sm font-medium"
        >
          {copiedId === "link"
            ? <><Check className="w-4 h-4 shrink-0 text-emerald-400" /> Link copied!</>
            : <><Copy className="w-4 h-4 shrink-0" /> Copy link</>
          }
        </button>

        {/* Dismiss */}
        <button
          onClick={dismiss}
          className="mt-3 w-full text-xs text-text-muted hover:text-text-secondary transition-colors"
        >
          Maybe later
        </button>
      </div>
    </div>
  );
}

function WhatsAppIcon() {
  return (
    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  );
}
