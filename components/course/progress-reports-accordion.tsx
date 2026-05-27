"use client";

import { useState } from "react";
import { Mail, ChevronDown } from "lucide-react";

interface ProgressReportsAccordionProps {
  hasParentEmail: boolean;
  parentEmail?: string;
  sendWeeklyReports?: boolean;
  children: React.ReactNode;
}

export function ProgressReportsAccordion({
  hasParentEmail,
  parentEmail,
  sendWeeklyReports = false,
  children,
}: ProgressReportsAccordionProps) {
  const [open, setOpen] = useState(false);

  // Collapsed summary line
  const summary = hasParentEmail
    ? `${parentEmail} · ${sendWeeklyReports ? "Weekly enabled" : "Weekly disabled"}`
    : "Not configured";

  return (
    <div className="rounded-xl border border-border/60 bg-surface/40 overflow-hidden">
      {/* Accordion trigger */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 min-h-[48px] text-left hover:bg-surface-raised/40 transition-colors"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <Mail className="w-4 h-4 text-text-muted/60 flex-shrink-0" />
          <div className="min-w-0">
            <span className="text-sm font-medium text-text-secondary">Progress Reports</span>
            <p className="text-[11px] text-text-muted/60 truncate mt-0.5">{summary}</p>
          </div>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-text-muted/50 flex-shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* Expanded content */}
      {open && (
        <div className="border-t border-border/40 px-4 py-4">
          {children}
        </div>
      )}
    </div>
  );
}
