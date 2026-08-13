"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/use-auth";
import { useBudgetData } from "@/lib/hooks/use-budget-data";
import { usePinLock } from "@/lib/hooks/use-pin-lock";
import { useBudgetStore } from "@/stores/budget-store";
import { PinLock } from "@/components/PinLock";
import { OnlineIndicator } from "@/components/OnlineIndicator";

export default function Home() {
  const router = useRouter();
  const { user, loading, budgetId } = useAuth();
  useBudgetData(budgetId);
  const { isLocked } = usePinLock();
  const settings = useBudgetStore((s) => s.settings);
  const periods = useBudgetStore((s) => s.periods);
  const isDataLoaded = useBudgetStore((s) => s.isDataLoaded);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    // If user is logged in but has no settings, they need onboarding
    if (user && isDataLoaded && !settings) {
      router.push("/onboarding");
    }
  }, [user, isDataLoaded, settings, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted animate-pulse">Ładowanie…</div>
      </div>
    );
  }

  if (!user) return null;

  if (isLocked) {
    return <PinLock />;
  }

  const activePeriod = periods.find((p) => p.status === "open");

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="flex items-center justify-between px-4 pb-2 pt-[max(1rem,env(safe-area-inset-top))]">
        <div>
          <h1 className="font-display text-lg font-semibold text-text">
            {activePeriod?.label ?? "Budżet"}
          </h1>
        </div>
        <OnlineIndicator />
      </header>

      {/* Main content placeholder */}
      <main className="px-4">
        {!activePeriod ? (
          <div className="mt-20 text-center">
            <p className="mb-4 text-muted">
              Brak otwartego okresu budżetowego.
            </p>
            <button className="rounded-lg bg-brass px-6 py-2.5 text-sm font-medium text-ink">
              Rozpocznij okres
            </button>
          </div>
        ) : (
          <div className="mt-8 text-center text-muted">
            <p>Pulpit — w budowie (faza 3)</p>
          </div>
        )}
      </main>
    </div>
  );
}
