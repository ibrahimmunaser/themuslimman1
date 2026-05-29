"use client";

import { useState } from "react";
import { MessageCircle, Send, CheckCircle2, AlertCircle, RefreshCcw } from "lucide-react";

export function ContactForm() {
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

    // Reject whitespace-only fields
    if (!formData.name.trim() || !formData.subject.trim() || !formData.message.trim()) {
      setStatus("error");
      setErrorMessage("Please fill in all fields with actual content.");
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
      // No auto-reset — let the user read the confirmation at their own pace.
    } catch {
      setStatus("error");
      setErrorMessage("Failed to send message. Please try again or email us directly.");
    }
  };

  // Replace the whole card with a clear confirmation so users can't miss it.
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
            <h2 className="text-xl font-bold text-text mb-2">Message Sent!</h2>
            <p className="text-text-secondary mb-1">
              We&apos;ve received your message and will respond within 24–48 hours.
            </p>
            <p className="text-sm text-text-muted">
              Didn&apos;t get a confirmation email?{" "}
              <a href="mailto:themuslimman77@gmail.com" className="text-gold hover:underline">
                Email us directly
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
            Still Need Help?
          </h2>
          <p className="text-text-secondary">
            Send us a message and we&apos;ll get back to you as soon as possible.
          </p>
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
                <p className="text-red-400 font-medium mb-1">Couldn&apos;t send message</p>
                <p className="text-sm text-text-secondary">{errorMessage}</p>
                <p className="text-sm text-text-muted mt-2">
                  Or email us directly at:{" "}
                  <a href="mailto:themuslimman77@gmail.com" className="text-gold hover:underline">
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
                  Your Name
                </label>
                <input
                  type="text"
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-ink border border-border rounded-lg text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent transition-all"
                  placeholder="Ibrahim Munaser"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-text mb-2">
                  Your Email
                </label>
                <input
                  type="email"
                  id="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2.5 bg-ink border border-border rounded-lg text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent transition-all"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-text mb-2">
                Subject
              </label>
              <input
                type="text"
                id="subject"
                required
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full px-4 py-2.5 bg-ink border border-border rounded-lg text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent transition-all"
                placeholder="What do you need help with?"
              />
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-text mb-2">
                Message
              </label>
              <textarea
                id="message"
                required
                rows={6}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full px-4 py-2.5 bg-ink border border-border rounded-lg text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent transition-all resize-none"
                placeholder="Please describe your question or issue in detail..."
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
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send Message
                </>
              )}
            </button>

            <p className="text-xs text-text-muted text-center">
              We typically respond within 24-48 hours on business days.
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}
