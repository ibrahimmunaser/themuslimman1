"use client";

import { useState, useEffect } from "react";
import { Mail, Check, Clock, Calendar } from "lucide-react";

interface SendProgressReportButtonProps {
  userPlan: "essentials" | "complete";
  hasParentEmail: boolean;
  parentEmail?: string;
  studentName?: string;
  sendWeeklyReports: boolean;
}

const COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes cooldown

export function SendProgressReportButton({
  userPlan: _userPlan,
  hasParentEmail,
  parentEmail,
  studentName: _studentName,
  sendWeeklyReports,
}: SendProgressReportButtonProps) {
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error" | "cooldown"; text: string } | null>(null);
  const [lastSent, setLastSent] = useState<number | null>(null);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  // Load last sent time from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("lastReportSent");
    if (stored) {
      const timestamp = parseInt(stored, 10);
      setLastSent(timestamp);
      
      const elapsed = Date.now() - timestamp;
      if (elapsed < COOLDOWN_MS) {
        setCooldownRemaining(Math.ceil((COOLDOWN_MS - elapsed) / 1000));
      }
    }
  }, []);

  // Countdown timer
  useEffect(() => {
    if (cooldownRemaining > 0) {
      const timer = setInterval(() => {
        setCooldownRemaining((prev) => {
          if (prev <= 1) {
            setMessage(null);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [cooldownRemaining]);

  const handleSend = async () => {
    // Check cooldown
    if (lastSent && Date.now() - lastSent < COOLDOWN_MS) {
      const remainingSeconds = Math.ceil((COOLDOWN_MS - (Date.now() - lastSent)) / 1000);
      setCooldownRemaining(remainingSeconds);
      setMessage({
        type: "cooldown",
        text: `Please wait ${Math.ceil(remainingSeconds / 60)} minute(s) before sending another report.`,
      });
      return;
    }

    setSending(true);
    setMessage(null);

    try {
      const response = await fetch("/api/student/send-progress-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();

      if (response.ok) {
        const now = Date.now();
        setLastSent(now);
        localStorage.setItem("lastReportSent", now.toString());
        setCooldownRemaining(COOLDOWN_MS / 1000);
        
        setMessage({
          type: "success",
          text: "Progress report sent successfully!",
        });
      } else {
        setMessage({
          type: "error",
          text: data.error || "Failed to send report",
        });
      }
    } catch (_error) {
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

  // Calculate next Sunday for weekly reports
  const getNextSunday = () => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const daysUntilSunday = dayOfWeek === 0 ? 7 : 7 - dayOfWeek;
    const nextSunday = new Date(now);
    nextSunday.setDate(now.getDate() + daysUntilSunday);
    return nextSunday.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  };

  const isOnCooldown = cooldownRemaining > 0;

  return (
    <div className="space-y-4">
      {/* Report Status */}
      <div className="p-6 rounded-xl border border-border bg-surface">
        <div className="flex items-center gap-3 mb-4">
          <Mail className="w-5 h-5 text-gold" />
          <h3 className="text-lg font-semibold text-text">Parent Progress Reports</h3>
        </div>

        <div className="space-y-3">
          {/* Parent Email */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-surface-raised">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-400" />
              <span className="text-sm text-text-secondary">Parent Email:</span>
            </div>
            <span className="text-sm font-medium text-text truncate max-w-[160px] sm:max-w-xs">{parentEmail}</span>
          </div>

          {/* Weekly Reports Status */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-surface-raised">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-text-secondary">Weekly Reports:</span>
            </div>
            <span className={`text-sm font-medium ${sendWeeklyReports ? "text-green-400" : "text-text-muted"}`}>
              {sendWeeklyReports ? "Enabled" : "Disabled"}
            </span>
          </div>

          {/* Next Scheduled Report */}
          {sendWeeklyReports && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-surface-raised">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <span className="text-sm text-text-secondary">Next Report:</span>
              </div>
              <span className="text-sm font-medium text-text">{getNextSunday()}</span>
            </div>
          )}
        </div>
      </div>

      {/* Send Report Now */}
      <div className="p-6 rounded-xl border border-border bg-surface">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1">
            <h4 className="text-base font-semibold text-text mb-1">Send Report Now</h4>
            <p className="text-sm text-text-secondary">
              Generate and email current progress report to {parentEmail}
            </p>
          </div>

          <button
            onClick={handleSend}
            disabled={sending || isOnCooldown}
            className="px-6 py-3 rounded-lg bg-gold text-ink font-semibold hover:bg-gold/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
          >
            <Mail className="w-4 h-4" />
            {sending ? "Sending..." : isOnCooldown ? `Wait ${Math.ceil(cooldownRemaining / 60)}m` : "Send Report Now"}
          </button>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`mt-4 p-4 rounded-lg border flex items-start gap-3 ${
              message.type === "success"
                ? "bg-green-500/10 border-green-500/20 text-green-400"
                : message.type === "cooldown"
                ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                : "bg-red-500/10 border-red-500/20 text-red-400"
            }`}
          >
            {message.type === "success" ? (
              <Check className="w-5 h-5 flex-shrink-0 mt-0.5" />
            ) : message.type === "cooldown" ? (
              <Clock className="w-5 h-5 flex-shrink-0 mt-0.5" />
            ) : (
              <Mail className="w-5 h-5 flex-shrink-0 mt-0.5" />
            )}
            <p className="text-sm">{message.text}</p>
          </div>
        )}
      </div>
    </div>
  );
}
