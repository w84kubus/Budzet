"use client";

type Tab<T extends string> = {
  key: T;
  label: string;
};

type TabsProps<T extends string> = {
  tabs: Tab<T>[];
  active: T;
  onChange: (key: T) => void;
  className?: string;
};

export function Tabs<T extends string>({
  tabs,
  active,
  onChange,
  className = "",
}: TabsProps<T>) {
  return (
    <div
      className={`flex gap-1 rounded-xl bg-panel p-1 ${className}`}
      role="tablist"
    >
      {tabs.map((tab) => (
        <button
          key={tab.key}
          role="tab"
          aria-selected={active === tab.key}
          onClick={() => onChange(tab.key)}
          className={`
            flex-1 rounded-lg py-2 text-caption font-medium transition-colors
            focus-visible:ring-2 focus-visible:ring-brass focus-visible:ring-offset-2 focus-visible:ring-offset-ink
            ${
              active === tab.key
                ? "bg-panel-2 text-text"
                : "text-muted hover:text-text"
            }
          `.trim()}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
