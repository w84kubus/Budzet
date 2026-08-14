"use client";

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";

const variants = {
  default: "text-muted hover:text-text hover:bg-panel-2 active:bg-line/30",
  brass: "text-brass hover:text-brass hover:bg-brass/10 active:bg-brass/15",
  destructive: "text-bad hover:text-bad hover:bg-bad/10 active:bg-bad/15",
} as const;

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
  children: ReactNode;
  label: string;
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ variant = "default", label, className = "", children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        aria-label={label}
        className={`
          inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg transition-colors
          focus-visible:ring-2 focus-visible:ring-brass focus-visible:ring-offset-2 focus-visible:ring-offset-ink
          disabled:pointer-events-none disabled:opacity-40
          ${variants[variant]}
          ${className}
        `.trim()}
        {...props}
      >
        {children}
      </button>
    );
  }
);

IconButton.displayName = "IconButton";
