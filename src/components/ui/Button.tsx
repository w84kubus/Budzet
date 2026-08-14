"use client";

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";

const variants = {
  primary: "bg-brass text-ink font-medium hover:brightness-110 active:brightness-95",
  secondary: "bg-panel-2 text-text border border-line hover:bg-line/30 active:bg-line/50",
  ghost: "text-muted hover:text-text hover:bg-panel-2 active:bg-line/30",
  destructive: "bg-bad/10 text-bad border border-bad/20 hover:bg-bad/15 active:bg-bad/20",
} as const;

const sizes = {
  sm: "min-h-9 px-3 text-caption rounded-lg gap-1.5",
  md: "min-h-11 px-4 text-sm rounded-lg gap-2",
  lg: "min-h-12 px-5 text-body rounded-lg gap-2",
} as const;

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  children: ReactNode;
  fullWidth?: boolean;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", fullWidth, className = "", children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={`
          inline-flex items-center justify-center font-medium transition-colors
          focus-visible:ring-2 focus-visible:ring-brass focus-visible:ring-offset-2 focus-visible:ring-offset-ink
          disabled:pointer-events-none disabled:opacity-40
          ${variants[variant]}
          ${sizes[size]}
          ${fullWidth ? "w-full" : ""}
          ${className}
        `.trim()}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
