"use client";

import { type ReactNode } from "react";

const variants = {
  default: "bg-panel-2 text-muted",
  brass: "bg-brass/15 text-brass",
  good: "bg-good/15 text-good",
  bad: "bg-bad/15 text-bad",
} as const;

type BadgeProps = {
  variant?: keyof typeof variants;
  children: ReactNode;
};

export function Badge({ variant = "default", children }: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center rounded-md px-1.5 py-0.5
        text-micro font-medium
        ${variants[variant]}
      `.trim()}
    >
      {children}
    </span>
  );
}
