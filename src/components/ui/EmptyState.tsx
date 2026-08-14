"use client";

import { type ReactNode } from "react";

type EmptyStateProps = {
  /** Main message */
  message: string;
  /** Call to action button */
  action?: {
    label: string;
    onClick: () => void;
  };
  /** Optional icon/emoji */
  icon?: ReactNode;
};

export function EmptyState({ message, action, icon }: EmptyStateProps) {
  return (
    <div className="rounded-xl bg-panel p-6 text-center">
      {icon && (
        <div className="mb-2 text-2xl" aria-hidden="true">
          {icon}
        </div>
      )}
      <p className="text-sm text-muted">{message}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="mt-3 text-caption font-medium text-brass hover:text-text transition-colors focus-visible:ring-2 focus-visible:ring-brass focus-visible:ring-offset-2 focus-visible:ring-offset-ink rounded-md px-2 py-1"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
