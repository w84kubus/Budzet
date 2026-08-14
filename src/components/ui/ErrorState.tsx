"use client";

type ErrorStateProps = {
  /** What happened */
  message: string;
  /** What the user can do */
  action?: {
    label: string;
    onClick: () => void;
  };
};

export function ErrorState({ message, action }: ErrorStateProps) {
  return (
    <div className="rounded-xl border border-bad/20 bg-bad/5 p-5 text-center">
      <p className="text-sm text-text">{message}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="mt-3 min-h-11 rounded-lg bg-panel-2 px-4 text-caption font-medium text-text transition-colors hover:bg-line/30 focus-visible:ring-2 focus-visible:ring-brass focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
