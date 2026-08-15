"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/use-auth";
import { useBudgetData } from "@/lib/hooks/use-budget-data";
import { usePinLock } from "@/lib/hooks/use-pin-lock";
import { useBudgetStore } from "@/stores/budget-store";
import { PinLock } from "@/components/PinLock";
import { AppShell } from "@/components/layout/AppShell";
import { SheetProvider } from "@/lib/contexts/sheet-context";
import { DashboardSkeleton } from "@/components/ui";

export default function MainLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user, loading, budgetId } = useAuth();
  useBudgetData(budgetId);
  const { isLocked } = usePinLock();

  const settings = useBudgetStore((s) => s.settings);
  const isDataLoaded = useBudgetStore((s) => s.isDataLoaded);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user && isDataLoaded && !settings) {
      router.push("/onboarding");
    }
  }, [user, isDataLoaded, settings, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-ink">
        <DashboardSkeleton />
      </div>
    );
  }

  if (!user) return null;
  if (isLocked) return <PinLock />;

  return (
    <SheetProvider>
      <AppShell>
        {children}
      </AppShell>
    </SheetProvider>
  );
}
