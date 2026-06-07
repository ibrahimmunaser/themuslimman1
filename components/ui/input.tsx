import { clsx } from "clsx";
import type { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Input({ label, error, hint, className, id, value, ...props }: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
  
  // Ensure value is always a string to prevent "undefined" from rendering
  const safeValue = value ?? "";

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-text-secondary mb-1.5"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        value={safeValue}
        className={clsx(
          "w-full px-4 py-3 rounded-lg bg-surface border transition-all duration-200",
          // text-base (16px) prevents iOS Safari from auto-zooming the viewport on focus.
          // Anything below 16px triggers the built-in zoom behaviour which breaks layout.
          "text-text placeholder:text-text-muted text-base sm:text-sm",
          "focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold/50",
          error
            ? "border-error/60 focus:ring-error/50 focus:border-error/60"
            : "border-border hover:border-border-subtle",
          className
        )}
        {...props}
      />
      {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
      {hint && !error && <p className="mt-1.5 text-xs text-text-muted">{hint}</p>}
    </div>
  );
}
