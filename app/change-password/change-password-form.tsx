"use client";

import { useState } from "react";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { changePasswordAndRedirect } from "./actions";

interface Props {
  userName: string;
  requireCurrentPassword?: boolean;
}

export function ChangePasswordForm({ userName, requireCurrentPassword = false }: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew]       = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError]           = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword]       = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (requireCurrentPassword && !currentPassword) {
      setError("Current password is required.");
      return;
    }
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await changePasswordAndRedirect(
        newPassword,
        requireCurrentPassword ? currentPassword : undefined,
      );
      if (res?.error) {
        setError(res.error);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <div className="w-12 h-12 mx-auto rounded-xl bg-gold/10 border border-gold/30 flex items-center justify-center mb-4">
          <ShieldCheck className="w-5 h-5 text-gold" />
        </div>
        <h1 className="text-2xl font-bold text-text mb-2">
          {requireCurrentPassword ? "Change your password" : "Set your password"}
        </h1>
        <p className="text-text-secondary text-sm">
          {requireCurrentPassword
            ? `Hi ${userName}. Enter your current password, then choose a new one.`
            : `Welcome, ${userName}. You must set a new password before continuing.`}
        </p>
      </div>

      <div className="bg-surface border border-border rounded-2xl p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-4">
          {requireCurrentPassword && (
            <div className="relative">
              <Input
                label="Current password"
                type={showCurrent ? "text" : "password"}
                placeholder="Your current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                autoComplete="current-password"
                autoFocus
                dir="ltr"
              />
              <button
                type="button"
                onClick={() => setShowCurrent((p) => !p)}
                className="absolute right-3 top-9 text-text-muted hover:text-text-secondary transition-colors"
                aria-label={showCurrent ? "Hide password" : "Show password"}
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          )}

          <div className="relative">
            <Input
              label="New password"
              type={showNew ? "text" : "password"}
              placeholder="At least 8 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              autoComplete="new-password"
              autoFocus={!requireCurrentPassword}
              dir="ltr"
            />
            <button
              type="button"
              onClick={() => setShowNew((p) => !p)}
              className="absolute right-3 top-9 text-text-muted hover:text-text-secondary transition-colors"
              aria-label={showNew ? "Hide password" : "Show password"}
            >
              {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <div className="relative">
            <Input
              label="Confirm new password"
              type={showConfirm ? "text" : "password"}
              placeholder="Repeat your new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
              dir="ltr"
            />
            <button
              type="button"
              onClick={() => setShowConfirm((p) => !p)}
              className="absolute right-3 top-9 text-text-muted hover:text-text-secondary transition-colors"
              aria-label={showConfirm ? "Hide password" : "Show password"}
            >
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={submitting}
            disabled={submitting}
            className="w-full justify-center mt-1"
          >
            {submitting ? "Saving…" : requireCurrentPassword ? "Update password" : "Set password and continue"}
          </Button>
        </form>
      </div>
    </div>
  );
}
