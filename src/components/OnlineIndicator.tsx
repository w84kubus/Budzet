"use client";

import { useBudgetStore } from "@/stores/budget-store";

export function OnlineIndicator() {
  const isOnline = useBudgetStore((s) => s.isOnline);

  if (isOnline) return null;

  return (
    <div className="flex items-center gap-2 rounded-lg bg-panel-2 px-3 py-1.5 text-xs text-muted">
      <span className="h-2 w-2 rounded-full bg-bad" />
      Offline — zmiany zapiszą się później
    </div>
  );
}
