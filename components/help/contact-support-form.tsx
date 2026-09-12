"use client";

import { useState } from "react";
import { Mail, MessageCircle, Send } from "lucide-react";
import type { CourseLang } from "@/lib/course-lang";
import { loc } from "@/lib/loc";

export function ContactSupportForm({
  lang = "en",
  /** @deprecated use lang */
  isRtl,
}: {
  lang?: CourseLang;
  isRtl?: boolean;
}) {
  const resolvedLang: CourseLang = lang ?? (isRtl ? "ar" : "en");
  const rtl = resolvedLang === "ar";

  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!subject.trim() || !message.trim()) {
      setErrorMessage(
        loc(resolvedLang, "Please fill in all fields", "يرجى ملء جميع الحقول", "Veuillez remplir tous les champs"),
      );
      setStatus("error");
      return;
    }

    setStatus("sending");
    setErrorMessage("");

    try {
      const response = await fetch("/api/support/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, message }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            loc(resolvedLang, "Failed to send message", "فشل إرسال الرسالة", "Échec de l'envoi du message"),
        );
      }

      setStatus("success");
      setSubject("");
      setMessage("");

      setTimeout(() => {
        setStatus("idle");
      }, 5000);
    } catch (error) {
      console.error("Contact form error:", error);
      setStatus("error");
      setErrorMessage(
        error instanceof Error
          ? error.message
          : loc(
              resolvedLang,
              "Failed to send message. Please try again.",
              "فشل إرسال الرسالة. يرجى المحاولة مرة أخرى.",
              "Échec de l'envoi du message. Veuillez réessayer.",
            ),
      );
    }
  };

  if (status === "success") {
    return (
      <div
        className="p-6 rounded-xl bg-gradient-to-b from-green-500/15 to-green-500/5 border border-green-500/30"
        role="alert"
        aria-live="polite"
        dir={rtl ? "rtl" : undefined}
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-lg bg-green-500/20 border border-green-500/30 flex items-center justify-center flex-shrink-0">
            <MessageCircle className="w-6 h-6 text-green-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-text mb-2">
              {loc(resolvedLang, "Message Sent!", "تم إرسال الرسالة!", "Message envoyé !")}
            </h3>
            <p className="text-text-secondary">
              {loc(
                resolvedLang,
                "We've received your message and will get back to you as soon as possible.",
                "استلمنا رسالتك وسنرد عليك في أقرب وقت ممكن.",
                "Nous avons reçu votre message et vous répondrons dès que possible.",
              )}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="p-6 rounded-xl bg-gradient-to-b from-gold/15 to-gold/5 border border-gold/30"
      dir={rtl ? "rtl" : undefined}
    >
      <div className="flex items-start gap-4 mb-6">
        <div className="w-12 h-12 rounded-lg bg-gold/20 border border-gold/30 flex items-center justify-center flex-shrink-0">
          <Mail className="w-6 h-6 text-gold" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-text mb-2">
            {loc(resolvedLang, "Need More Help?", "هل تحتاج مساعدة إضافية؟", "Besoin d'aide supplémentaire ?")}
          </h3>
          <p className="text-text-secondary">
            {loc(
              resolvedLang,
              "Can't find what you're looking for? Our support team is here to help.",
              "لم تجد ما تبحث عنه؟ فريق الدعم هنا لمساعدتك.",
              "Vous ne trouvez pas ce que vous cherchez ? Notre équipe de support est là pour vous aider.",
            )}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-text mb-2">
            {loc(resolvedLang, "Subject", "الموضوع", "Objet")}
          </label>
          <input
            type="text"
            id="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder={loc(
              resolvedLang,
              "What do you need help with?",
              "بماذا تحتاج المساعدة؟",
              "En quoi avons-nous besoin de vous aider ?",
            )}
            className="w-full px-4 py-2.5 rounded-lg bg-surface border border-border text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold"
            disabled={status === "sending"}
          />
        </div>

        <div>
          <label htmlFor="message" className="block text-sm font-medium text-text mb-2">
            {loc(resolvedLang, "Message", "الرسالة", "Message")}
          </label>
          <textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={loc(
              resolvedLang,
              "Describe your issue or question...",
              "صف مشكلتك أو سؤالك...",
              "Décrivez votre problème ou votre question…",
            )}
            rows={5}
            className="w-full px-4 py-2.5 rounded-lg bg-surface border border-border text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold resize-none"
            disabled={status === "sending"}
          />
        </div>

        {status === "error" && errorMessage && (
          <div
            className="p-3 rounded-lg bg-red-500/10 border border-red-500/30"
            role="alert"
            aria-live="assertive"
          >
            <p className="text-sm text-red-400">{errorMessage}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={status === "sending"}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-gold text-ink font-semibold hover:bg-gold/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {status === "sending" ? (
            <>
              <div className="w-4 h-4 border-2 border-ink/30 border-t-ink rounded-full animate-spin" />
              {loc(resolvedLang, "Sending...", "جارٍ الإرسال...", "Envoi…")}
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              {loc(resolvedLang, "Send Message", "إرسال الرسالة", "Envoyer le message")}
            </>
          )}
        </button>
      </form>
    </div>
  );
}
