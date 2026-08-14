"use client";

import { forwardRef, type InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", id, ...props }, ref) => {
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
        <input
          ref={ref}
          id={inputId}
          className={`
            min-h-11 rounded-lg border border-line bg-panel-2 px-3 text-sm text-text
            placeholder:text-muted/50
            focus:border-brass focus:outline-none focus:ring-1 focus:ring-brass
            disabled:opacity-40
            ${error ? "border-bad focus:border-bad focus:ring-bad" : ""}
            ${className}
          `.trim()}
          {...props}
        />
        {error && (
          <p className="text-micro text-bad">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
