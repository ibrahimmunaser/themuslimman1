"use client";

import { useState } from "react";
import { MessageCircle, Send, CheckCircle2, AlertCircle, RefreshCcw } from "lucide-react";
import { useSiteLang } from "@/components/site-lang";
import { siteT } from "@/lib/site-copy";

export function ContactForm() {
  const lang = useSiteLang();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.subject.trim() || !formData.message.trim()) {
      setStatus("error");
      setErrorMessage(siteT(lang, "contactErrorFillAll"));
      return;
    }

    setStatus("sending");
    setErrorMessage("");

    try {
      const response = await fetch("/api/support/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          subject: formData.subject.trim(),
          message: formData.message.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      setStatus("success");
      setFormData({ name: "", email: "", subject: "", message: "" });
    } catch {
      setStatus("error");
      setErrorMessage(siteT(lang, "contactErrorFailed"));
    }
  };

  if (status === "success") {
    return (
      <section className="py-16 border-t border-border bg-surface/30">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div
            className="bg-surface border border-green-500/30 rounded-2xl p-8 text-center"
            role="alert"
            aria-live="polite"
          >
            <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-text mb-2">{siteT(lang, "contactSuccessTitle")}</h2>
            <p className="text-text-secondary mb-1">{siteT(lang, "contactSuccessBody")}</p>
            <p className="text-sm text-text-muted">
              {siteT(lang, "contactSuccessFollowUp")}{" "}
              <a href="mailto:themuslimman77@gmail.com" className="text-gold hover:underline">
                {siteT(lang, "contactEmailCard")}
              </a>
              .
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 border-t border-border bg-surface/30">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10">
          <MessageCircle className="w-12 h-12 text-gold mx-auto mb-4" />
          <h2 className="text-2xl sm:text-3xl font-bold text-text mb-3">
            {siteT(lang, "contactFormHeading")}
          </h2>
          <p className="text-text-secondary">{siteT(lang, "contactFormSub")}</p>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-8">
          {status === "error" && (
            <div
              className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-3"
              role="alert"
              aria-live="assertive"
            >
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-400 font-medium mb-1">{siteT(lang, "contactErrorSendTitle")}</p>
                <p className="text-sm text-text-secondary">{errorMessage}</p>
                <p className="text-sm text-text-muted mt-2">
                  {siteT(lang, "contactErrorOrEmailPrefix")}{" "}
                  <a
                    href="mailto:themuslimman77@gmail.com"
                    dir="ltr"
                    className="text-gold hover:underline inline-block"
                  >
                    themuslimman77@gmail.com
                  </a>
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-text mb-2">
                  {siteT(lang, "contactYourName")}
                </label>
                <input
                  type="text"
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-ink border border-border rounded-lg text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent transition-all"
                  placeholder="Your name"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-text mb-2">
                  {siteT(lang, "contactYourEmail")}
                </label>
                <input
                  type="email"
                  id="email"
                  required
                  dir="ltr"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2.5 bg-ink border border-border rounded-lg text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent transition-all"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-text mb-2">
                {siteT(lang, "contactSubject")}
              </label>
              <input
                type="text"
                id="subject"
                required
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full px-4 py-2.5 bg-ink border border-border rounded-lg text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent transition-all"
                placeholder={siteT(lang, "contactPlaceholderSubject")}
              />
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-text mb-2">
                {siteT(lang, "contactMessage")}
              </label>
              <textarea
                id="message"
                required
                rows={6}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full px-4 py-2.5 bg-ink border border-border rounded-lg text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent transition-all resize-none"
                placeholder={siteT(lang, "contactPlaceholderMessage")}
              />
            </div>

            <button
              type="submit"
              disabled={status === "sending"}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-gold to-gold-light hover:from-gold-light hover:to-gold text-ink font-semibold rounded-lg transition-all shadow-lg shadow-gold/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {status === "sending" ? (
                <>
                  <RefreshCcw className="w-4 h-4 animate-spin" />
                  {siteT(lang, "contactSending")}
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  {siteT(lang, "contactSendMessage")}
                </>
              )}
            </button>

            <p className="text-xs text-text-muted text-center">{siteT(lang, "contactFormNote")}</p>
          </form>
        </div>
      </div>
    </section>
  );
}
