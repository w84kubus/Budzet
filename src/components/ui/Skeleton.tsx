"use client";

type SkeletonProps = {
  className?: string;
  /** "text" for rounded rect, "circle" for avatar, "card" for full card */
  variant?: "text" | "circle" | "card";
};

export function Skeleton({ className = "", variant = "text" }: SkeletonProps) {
  const base = "animate-pulse bg-panel-2";

  switch (variant) {
    case "circle":
      return <div className={`${base} rounded-full ${className}`} />;
    case "card":
      return <div className={`${base} rounded-xl ${className}`} />;
    default:
      return <div className={`${base} rounded-md ${className}`} />;
  }
}

/** Pre-built skeleton for a dashboard loading state */
export function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-[960px] px-4 pt-4 md:px-8">
      <Skeleton className="mb-4 h-6 w-48" />
      <Skeleton variant="card" className="mb-4 h-32" />
      <div className="flex gap-2 mb-4">
        <Skeleton className="h-11 flex-1 rounded-lg" />
        <Skeleton className="h-11 flex-1 rounded-lg" />
      </div>
      <Skeleton variant="card" className="mb-4 h-44" />
      <Skeleton variant="card" className="h-36" />
    </div>
  );
}
