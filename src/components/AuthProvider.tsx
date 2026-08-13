"use client";

import { type ReactNode } from "react";
import { useAuth } from "@/lib/hooks/use-auth";
import { useBudgetData } from "@/lib/hooks/use-budget-data";

export function AuthProvider({ children }: { children: ReactNode }) {
  const { loading, budgetId } = useAuth();
  useBudgetData(budgetId);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink">
        <div className="text-muted animate-pulse">Ładowanie…</div>
      </div>
    );
  }

  return <>{children}</>;
}

export function useRequireAuth() {
  const { user, loading } = useAuth();
  return { user, loading, isAuthenticated: !!user };
}
