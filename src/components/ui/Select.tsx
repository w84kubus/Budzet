"use client";

import { forwardRef, type SelectHTMLAttributes } from "react";

type Option = {
  value: string;
  label: string;
};

type SelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, "children"> & {
  label?: string;
  error?: string;
  options: Option[];
  placeholder?: string;
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, placeholder, className = "", id, ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={selectId}
            className="text-caption font-medium text-muted"
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={`
            min-h-11 rounded-lg border border-line bg-panel-2 px-3 text-sm text-text
            appearance-none
            focus:border-brass focus:outline-none focus:ring-1 focus:ring-brass
            disabled:opacity-40
            ${error ? "border-bad focus:border-bad focus:ring-bad" : ""}
            ${className}
          `.trim()}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && (
          <p className="text-micro text-bad">{error}</p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";
