"use client";

import { useState } from "react";
import Link from "next/link";

type DisplayPref = "full-name" | "first-name" | "initials" | "anonymous";

interface FormState {
  name: string;
  email: string;
  whatMadeYouTry: string;
  mostHelpful: string;
  whoWouldRecommend: string;
  canUseWords: "yes" | "no" | "";
  displayPref: DisplayPref | "";
}

const INITIAL: FormState = {
  name: "",
  email: "",
  whatMadeYouTry: "",
  mostHelpful: "",
  whoWouldRecommend: "",
  canUseWords: "",
  displayPref: "",
};

export function TestimonialForm() {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  function set(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.email || !form.whatMadeYouTry || !form.mostHelpful || !form.canUseWords || !form.displayPref) {
      setErrorMsg("Please fill in all required fields.");
      return;
    }
    setErrorMsg("");
    setStatus("submitting");
    try {
      const res = await fetch("/api/testimonial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Server error");
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="max-w-lg mx-auto px-4 text-center py-16">
        <div className="w-16 h-16 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center mx-auto mb-6">
          <span className="text-2xl">✓</span>
        </div>
        <h1 className="text-2xl font-bold text-text mb-3">JazakAllahu Khayran</h1>
        <p className="text-text-secondary mb-6">
          Your feedback has been received. We review every submission before publishing anything publicly.
          We appreciate you taking the time to share your experience.
        </p>
        <Link
          href="/seerah"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gold text-ink font-semibold hover:bg-gold/90 transition-colors"
        >
          Back to the Course
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6">
      <div className="mb-10">
        <h1 className="text-2xl sm:text-3xl font-bold text-text mb-3">Share Your Experience</h1>
        <p className="text-text-secondary leading-relaxed">
          After using the course, we&rsquo;d love to hear what you thought. Your feedback helps us
          improve and — with your permission — may be shared with others considering the course.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-text mb-1.5">
            Name <span className="text-gold">*</span>
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Your name"
            className="w-full px-4 py-3 rounded-lg bg-surface border border-border text-text placeholder:text-text-muted focus:outline-none focus:border-gold/50 transition-colors"
            required
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-text mb-1.5">
            Email <span className="text-gold">*</span>
          </label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            placeholder="your@email.com"
            className="w-full px-4 py-3 rounded-lg bg-surface border border-border text-text placeholder:text-text-muted focus:outline-none focus:border-gold/50 transition-colors"
            required
          />
          <p className="text-xs text-text-muted mt-1.5">Your email is not published. We use it only to verify authenticity if needed.</p>
        </div>

        {/* What made you try */}
        <div>
          <label className="block text-sm font-medium text-text mb-1.5">
            What made you try the course? <span className="text-gold">*</span>
          </label>
          <textarea
            value={form.whatMadeYouTry}
            onChange={(e) => set("whatMadeYouTry", e.target.value)}
            rows={3}
            placeholder="e.g. I wanted to understand the Seerah properly rather than just knowing scattered stories..."
            className="w-full px-4 py-3 rounded-lg bg-surface border border-border text-text placeholder:text-text-muted focus:outline-none focus:border-gold/50 transition-colors resize-none"
            required
          />
        </div>

        {/* Most helpful */}
        <div>
          <label className="block text-sm font-medium text-text mb-1.5">
            What was most helpful? <span className="text-gold">*</span>
          </label>
          <textarea
            value={form.mostHelpful}
            onChange={(e) => set("mostHelpful", e.target.value)}
            rows={3}
            placeholder="e.g. The sequential structure helped me see how each event connected to the next..."
            className="w-full px-4 py-3 rounded-lg bg-surface border border-border text-text placeholder:text-text-muted focus:outline-none focus:border-gold/50 transition-colors resize-none"
            required
          />
        </div>

        {/* Who would you recommend it to */}
        <div>
          <label className="block text-sm font-medium text-text mb-1.5">
            Who would you recommend this course to?
          </label>
          <textarea
            value={form.whoWouldRecommend}
            onChange={(e) => set("whoWouldRecommend", e.target.value)}
            rows={2}
            placeholder="e.g. Any Muslim who wants to understand the Seerah as a connected story, not just isolated events..."
            className="w-full px-4 py-3 rounded-lg bg-surface border border-border text-text placeholder:text-text-muted focus:outline-none focus:border-gold/50 transition-colors resize-none"
          />
        </div>

        {/* Can we use your words */}
        <div>
          <label className="block text-sm font-medium text-text mb-2">
            Can we use your words on the website? <span className="text-gold">*</span>
          </label>
          <div className="flex gap-3">
            {(["yes", "no"] as const).map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => set("canUseWords", val)}
                className={`px-5 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                  form.canUseWords === val
                    ? "border-gold bg-gold/10 text-gold"
                    : "border-border bg-surface text-text-muted hover:border-gold/40"
                }`}
              >
                {val === "yes" ? "Yes, you can" : "No, keep it private"}
              </button>
            ))}
          </div>
          <p className="text-xs text-text-muted mt-1.5">
            We review everything before publishing. Nothing appears publicly without manual approval.
          </p>
        </div>

        {/* Display preference */}
        <div>
          <label className="block text-sm font-medium text-text mb-2">
            If published, how should your name appear? <span className="text-gold">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                { val: "full-name", label: "Full name" },
                { val: "first-name", label: "First name only" },
                { val: "initials", label: "Initials only" },
                { val: "anonymous", label: "Anonymous" },
              ] as { val: DisplayPref; label: string }[]
            ).map(({ val, label }) => (
              <button
                key={val}
                type="button"
                onClick={() => set("displayPref", val)}
                className={`px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors text-left ${
                  form.displayPref === val
                    ? "border-gold bg-gold/10 text-gold"
                    : "border-border bg-surface text-text-muted hover:border-gold/40"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {errorMsg && (
          <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
            {errorMsg}
          </p>
        )}

        {status === "error" && (
          <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
            Something went wrong. Please try again or email us directly at{" "}
            <a href="mailto:themuslimman77@gmail.com" className="underline">
              themuslimman77@gmail.com
            </a>
            .
          </p>
        )}

        <button
          type="submit"
          disabled={status === "submitting"}
          className="w-full px-6 py-3.5 rounded-lg bg-gold text-ink font-semibold hover:bg-gold/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {status === "submitting" ? "Submitting…" : "Submit Feedback"}
        </button>
      </form>
    </div>
  );
}
