"use client";

import { useState } from "react";
import { Mail, MessageCircle, Send } from "lucide-react";

export function ContactSupportForm() {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!subject.trim() || !message.trim()) {
      setErrorMessage("Please fill in all fields");
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
        throw new Error(data.error || "Failed to send message");
      }

      setStatus("success");
      setSubject("");
      setMessage("");
      
      // Reset success message after 5 seconds
      setTimeout(() => {
        setStatus("idle");
      }, 5000);
    } catch (error) {
      console.error("Contact form error:", error);
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Failed to send message. Please try again.");
    }
  };

  if (status === "success") {
    return (
      <div className="p-6 rounded-xl bg-gradient-to-b from-green-500/15 to-green-500/5 border border-green-500/30">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-lg bg-green-500/20 border border-green-500/30 flex items-center justify-center flex-shrink-0">
            <MessageCircle className="w-6 h-6 text-green-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-text mb-2">Message Sent!</h3>
            <p className="text-text-secondary">
              We've received your message and will get back to you as soon as possible.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-xl bg-gradient-to-b from-gold/15 to-gold/5 border border-gold/30">
      <div className="flex items-start gap-4 mb-6">
        <div className="w-12 h-12 rounded-lg bg-gold/20 border border-gold/30 flex items-center justify-center flex-shrink-0">
          <Mail className="w-6 h-6 text-gold" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-text mb-2">Need More Help?</h3>
          <p className="text-text-secondary">
            Can't find what you're looking for? Our support team is here to help.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-text mb-2">
            Subject
          </label>
          <input
            type="text"
            id="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="What do you need help with?"
            className="w-full px-4 py-2.5 rounded-lg bg-surface border border-border text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold"
            disabled={status === "sending"}
          />
        </div>

        <div>
          <label htmlFor="message" className="block text-sm font-medium text-text mb-2">
            Message
          </label>
          <textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Describe your issue or question..."
            rows={5}
            className="w-full px-4 py-2.5 rounded-lg bg-surface border border-border text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold resize-none"
            disabled={status === "sending"}
          />
        </div>

        {status === "error" && errorMessage && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
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
              Sending...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Send Message
            </>
          )}
        </button>
      </form>
    </div>
  );
}
