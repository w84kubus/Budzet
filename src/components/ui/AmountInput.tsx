"use client";

import { forwardRef, type InputHTMLAttributes } from "react";

type AmountInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label?: string;
  error?: string;
  suffix?: string;
};

export const AmountInput = forwardRef<HTMLInputElement, AmountInputProps>(
  ({ label, error, suffix = "zł", className = "", id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-caption font-medium text-muted"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            type="text"
            inputMode="decimal"
            className={`
              min-h-11 w-full rounded-lg border border-line bg-panel-2 px-3 pr-10
              font-mono text-sm font-medium tabular-nums text-text
              placeholder:text-muted/50
              focus:border-brass focus:outline-none focus:ring-1 focus:ring-brass
              disabled:opacity-40
              ${error ? "border-bad focus:border-bad focus:ring-bad" : ""}
              ${className}
            `.trim()}
            {...props}
          />
          {suffix && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted pointer-events-none">
              {suffix}
            </span>
          )}
        </div>
        {error && (
          <p className="text-micro text-bad">{error}</p>
        )}
      </div>
    );
  }
);

AmountInput.displayName = "AmountInput";
