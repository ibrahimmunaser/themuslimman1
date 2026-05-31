"use client";

import { useState } from "react";
import { Mail, Check, X, AlertCircle, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";

interface ParentEmailSettingsProps {
  currentParentEmail: string | null;
  parentEmailVerified: boolean;
  studentName: string | null;
  sendWeeklyReports: boolean;
}

export function ParentEmailSettings({
  currentParentEmail,
  parentEmailVerified,
  studentName,
  sendWeeklyReports,
}: ParentEmailSettingsProps) {
  const [parentEmail, setParentEmail] = useState(currentParentEmail || "");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleAddParentEmail = async () => {
    if (!parentEmail.trim() || !parentEmail.includes("@")) {
      setMessage({ type: "error", text: "Please enter a valid email address" });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/student/parent-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parentEmail: parentEmail.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({
          type: "success",
          text: "Verification email sent! Check the parent's inbox to verify.",
        });
      } else {
        setMessage({ type: "error", text: data.error || "Failed to add parent email" });
      }
    } catch (_error) {
      setMessage({ type: "error", text: "Something went wrong. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const handleRequestRemoval = async () => {
    if (!confirm("This will send a confirmation email to the parent. They must approve the removal.")) {
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/student/parent-email/request-removal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({
          type: "success",
          text: "Removal request sent to parent. They must confirm before email is removed.",
        });
      } else {
        setMessage({ type: "error", text: data.error || "Failed to request removal" });
      }
    } catch (_error) {
      setMessage({ type: "error", text: "Something went wrong. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleWeeklyReports = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/student/parent-email/toggle-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sendWeeklyReports: !sendWeeklyReports }),
      });

      if (response.ok) {
        window.location.reload();
      } else {
        setMessage({ type: "error", text: "Failed to update setting" });
      }
    } catch (_error) {
      setMessage({ type: "error", text: "Something went wrong" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 rounded-xl border border-border bg-surface">
      <div className="flex items-center gap-3 mb-6">
        <Mail className="w-5 h-5 text-gold" />
        <h2 className="text-lg font-semibold text-text">Parent Progress Reports</h2>
      </div>

      {message && (
        <div
          className={`mb-4 p-4 rounded-lg border flex items-start gap-3 ${
            message.type === "success"
              ? "bg-green-500/10 border-green-500/20 text-green-400"
              : "bg-red-500/10 border-red-500/20 text-red-400"
          }`}
        >
          {message.type === "success" ? (
            <Check className="w-5 h-5 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          )}
          <p className="text-sm">{message.text}</p>
        </div>
      )}

      {!currentParentEmail || !parentEmailVerified ? (
        <>
          <p className="text-text-secondary text-sm mb-4">
            Add a parent or guardian email to receive weekly progress reports about your learning journey.
          </p>

          <div className="space-y-4">
            {studentName && (
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Student Name (Optional)
                </label>
                <input
                  type="text"
                  value={studentName || ""}
                  disabled
                  className="w-full px-4 py-2 rounded-lg bg-surface-raised border border-border text-text-muted cursor-not-allowed"
                />
                <p className="text-xs text-text-muted mt-1.5">
                  This appears in progress reports. Contact support to update.
                </p>
              </div>
            )}

            <div>
              <Input
                label="Parent / Guardian Email"
                type="email"
                placeholder="parent@example.com"
                value={parentEmail}
                onChange={(e) => setParentEmail(e.target.value)}
                disabled={!!currentParentEmail && !parentEmailVerified}
              />
              {currentParentEmail && !parentEmailVerified && (
                <p className="text-xs text-amber-400 mt-1.5 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Verification pending. Check the parent&apos;s inbox for the verification email.
                </p>
              )}
            </div>

            <button
              onClick={handleAddParentEmail}
              disabled={loading || (!!currentParentEmail && !parentEmailVerified)}
              className="w-full px-4 py-3 rounded-lg bg-gold text-ink font-semibold hover:bg-gold/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4" />
                  {currentParentEmail && !parentEmailVerified ? "Resend Verification" : "Add Parent Email"}
                </>
              )}
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="text-text-secondary text-sm mb-4">
            Parent email is verified and locked. Progress reports can be sent to this email.
          </p>

          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-surface-raised border border-green-500/20">
              <div className="flex items-center gap-3 mb-2">
                <Check className="w-5 h-5 text-green-400" />
                <p className="text-text font-medium">{currentParentEmail}</p>
              </div>
              <p className="text-xs text-text-secondary">
                Verified parent email - Progress reports can be sent
              </p>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-surface-raised">
              <div>
                <p className="text-text font-medium">Weekly Progress Reports</p>
                <p className="text-text-secondary text-sm">
                  {sendWeeklyReports ? "Enabled - Reports sent every Sunday" : "Disabled"}
                </p>
              </div>
              <button
                onClick={handleToggleWeeklyReports}
                disabled={loading}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  sendWeeklyReports
                    ? "bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20"
                    : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                }`}
              >
                {sendWeeklyReports ? "ON" : "OFF"}
              </button>
            </div>

            <button
              onClick={handleRequestRemoval}
              disabled={loading}
              className="w-full px-4 py-3 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 font-semibold hover:bg-red-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <X className="w-4 h-4" />
                  Request Parent Email Removal
                </>
              )}
            </button>

            <p className="text-xs text-text-muted">
              To remove the parent email, a confirmation email will be sent to the parent. They must approve the
              removal.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
