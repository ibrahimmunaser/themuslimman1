"use client";

import { useState } from "react";
import { Mail } from "lucide-react";

interface SendProgressReportButtonProps {
  userPlan: "essentials" | "complete";
  hasParentEmail: boolean;
  parentEmail?: string;
  studentName?: string;
}

export function SendProgressReportButton({
  userPlan,
  hasParentEmail,
  parentEmail,
  studentName,
}: SendProgressReportButtonProps) {
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSend = async () => {
    setSending(true);
    setMessage(null);

    try {
      const response = await fetch("/api/student/send-progress-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({
          type: "success",
          text: `Progress report sent to ${parentEmail || "parent email"}!`,
        });
      } else {
        setMessage({
          type: "error",
          text: data.error || "Failed to send report",
        });
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: "Something went wrong. Please try again.",
      });
    } finally {
      setSending(false);
    }
  };

  if (!hasParentEmail) {
    return null;
  }

  return (
    <div className="p-6 rounded-xl border border-border bg-surface">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white mb-2">Send Progress Report</h3>
          <p className="text-zinc-400 text-sm mb-4">
            Send {studentName ? `${studentName}'s` : "a"} current progress report to {parentEmail || "the parent email"}.
          </p>
          {message && (
            <p
              className={`text-sm mb-4 ${
                message.type === "success" ? "text-green-400" : "text-red-400"
              }`}
            >
              {message.text}
            </p>
          )}
        </div>
        <button
          onClick={handleSend}
          disabled={sending}
          className="px-6 py-3 rounded-lg bg-amber-500 hover:bg-amber-600 text-black font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
        >
          <Mail className="w-4 h-4" />
          {sending ? "Sending..." : "Send Report"}
        </button>
      </div>
    </div>
  );
}
