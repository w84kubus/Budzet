"use client";

type NavItem = "dashboard" | "expenses" | "envelopes" | "stats";

type Props = {
  active: NavItem;
  onNavigate: (item: NavItem) => void;
  onFab: () => void;
};

function NavIcon({ item, isActive }: { item: NavItem; isActive: boolean }) {
  const color = isActive ? "var(--color-brass)" : "var(--color-muted)";

  switch (item) {
    case "dashboard":
      return (
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <rect x="2" y="2" width="8" height="8" rx="2" stroke={color} strokeWidth="1.5" />
          <rect x="12" y="2" width="8" height="4" rx="1.5" stroke={color} strokeWidth="1.5" />
          <rect x="12" y="8" width="8" height="12" rx="2" stroke={color} strokeWidth="1.5" />
          <rect x="2" y="12" width="8" height="8" rx="2" stroke={color} strokeWidth="1.5" />
        </svg>
      );
    case "expenses":
      return (
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <path d="M3 6H19M3 11H19M3 16H13" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case "envelopes":
      return (
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <rect x="3" y="5" width="16" height="12" rx="2" stroke={color} strokeWidth="1.5" />
          <path d="M3 9L11 13L19 9" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
      );
    case "stats":
      return (
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <path d="M4 18V12M9 18V8M14 18V10M19 18V4" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
  }
}

const labels: Record<NavItem, string> = {
  dashboard: "Pulpit",
  expenses: "Wydatki",
  envelopes: "Koperty",
  stats: "Statystyki",
};

export function BottomNav({ active, onNavigate, onFab }: Props) {
  const items: NavItem[] = ["dashboard", "expenses", "envelopes", "stats"];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-panel safe-bottom">
      <div className="relative mx-auto flex max-w-[430px] items-end justify-around px-2 pb-1 pt-1">
        {items.map((item, i) => (
          <div key={item} className="flex flex-col items-center" style={{ order: i >= 2 ? i + 1 : i }}>
            <button
              onClick={() => onNavigate(item)}
              className="flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-0.5 px-3"
            >
              <NavIcon item={item} isActive={active === item} />
              <span
                className={`text-micro font-medium ${
                  active === item ? "text-brass" : "text-muted"
                }`}
              >
                {labels[item]}
              </span>
            </button>
          </div>
        ))}

        {/* FAB — center, raised */}
        <div className="flex flex-col items-center" style={{ order: 2 }}>
          <button
            onClick={onFab}
            className="-mt-5 flex h-[52px] w-[52px] items-center justify-center rounded-full bg-brass shadow-lg shadow-brass/20 active:opacity-90"
            aria-label="Dodaj wydatek"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 5V19M5 12H19"
                stroke="var(--color-ink)"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
          <span className="h-3" /> {/* spacer to align with nav labels */}
        </div>
      </div>
    </nav>
  );
}
