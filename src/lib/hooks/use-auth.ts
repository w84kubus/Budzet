"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { onAuthChange } from "@/lib/firebase/auth";

export function useAuth() {
  const { user, loading, setUser } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthChange((firebaseUser) => {
      setUser(firebaseUser);
    });
    return unsubscribe;
  }, [setUser]);

  return { user, loading, budgetId: user?.uid ?? null };
}
