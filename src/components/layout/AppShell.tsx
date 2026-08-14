"use client";

import { type ReactNode } from "react";
import { BottomNav } from "@/components/BottomNav";
import { OnlineIndicator } from "@/components/OnlineIndicator";

type NavItem = "dashboard" | "expenses" | "envelopes" | "stats";

const NAV_TABS: { key: NavItem; label: string }[] = [
  { key: "dashboard", label: "Pulpit" },
  { key: "expenses", label: "Wydatki" },
  { key: "envelopes", label: "Koperty" },
  { key: "stats", label: "Statystyki" },
];

type AppShellProps = {
  activeNav: NavItem;
  onNavigate: (item: NavItem) => void;
  onFab: () => void;
  children: ReactNode;
};

export function AppShell({ activeNav, onNavigate, onFab, children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-ink pb-24 md:pb-8">
      {/* Online indicator */}
      <div className="fixed top-0 right-0 z-20 p-3">
        <OnlineIndicator />
      </div>

      {/* Desktop top nav — hidden on mobile */}
      <nav className="mx-auto hidden max-w-[960px] px-4 pt-2 md:block md:px-8">
        <div className="flex gap-1 rounded-xl bg-panel p-1" role="tablist">
          {NAV_TABS.map((tab) => (
            <button
              key={tab.key}
              role="tab"
              aria-selected={activeNav === tab.key}
              onClick={() => onNavigate(tab.key)}
              className={`flex-1 rounded-lg py-2 text-caption font-medium transition-colors
                focus-visible:ring-2 focus-visible:ring-brass focus-visible:ring-offset-2 focus-visible:ring-offset-ink
                ${
                  activeNav === tab.key
                    ? "bg-panel-2 text-brass"
                    : "text-muted hover:text-text"
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Content */}
      {children}

      {/* Bottom navigation — mobile only */}
      <div className="md:hidden">
        <BottomNav
          active={activeNav}
          onNavigate={onNavigate}
          onFab={onFab}
        />
      </div>

      {/* Desktop FAB */}
      <button
        onClick={onFab}
        className="fixed right-8 bottom-8 z-30 hidden h-14 w-14 items-center justify-center rounded-2xl bg-brass shadow-lg shadow-ink/50 active:opacity-90 md:flex
          focus-visible:ring-2 focus-visible:ring-brass focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
        aria-label="Dodaj wydatek"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 5V19M5 12H19" stroke="var(--color-ink)" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}
