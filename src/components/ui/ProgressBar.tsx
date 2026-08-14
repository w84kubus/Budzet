"use client";

const colorMap = {
  brass: "bg-brass",
  good: "bg-good",
  bad: "bg-bad",
  muted: "bg-muted",
} as const;

type ProgressBarProps = {
  /** 0–100 percentage */
  value: number;
  color?: keyof typeof colorMap;
  /** Height in Tailwind: "h-1", "h-1.5", "h-2" */
  height?: string;
  className?: string;
};

export function ProgressBar({
  value,
  color = "brass",
  height = "h-1.5",
  className = "",
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div
      className={`w-full overflow-hidden rounded-full bg-panel-2 ${height} ${className}`}
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={`${height} rounded-full transition-all duration-300 ${colorMap[color]}`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
