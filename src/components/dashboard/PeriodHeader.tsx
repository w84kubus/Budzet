"use client";

import { useRouter } from "next/navigation";
import type { Period } from "@/domain/types";
import { calculateDaysUntilPayday } from "@/domain/calculations";

type Props = {
  period: Period;
  periods: Period[];
  paydayDay: number;
  today: string;
  onChangePeriod: (periodId: string) => void;
};

export function PeriodHeader({
  period,
  periods,
  paydayDay,
  today,
  onChangePeriod,
}: Props) {
  const router = useRouter();
  const daysLeft = calculateDaysUntilPayday(
    today,
    period.startDate,
    paydayDay,
    period.endDate
  );

  const daysLabel =
    daysLeft === 0
      ? "okres zamknięty"
      : daysLeft === 1
        ? "1 dzień do wypłaty"
        : `${daysLeft} dni do wypłaty`;

  // Sort periods for navigation
  const sorted = [...periods].sort((a, b) => a.id.localeCompare(b.id));
  const currentIdx = sorted.findIndex((p) => p.id === period.id);
  const hasPrev = currentIdx > 0;
  const hasNext = currentIdx < sorted.length - 1;

  return (
    <header className="flex items-center justify-between pb-1 pt-2">
      <div className="flex items-center gap-2">
        {/* Previous period */}
        <button
          onClick={() => hasPrev && onChangePeriod(sorted[currentIdx - 1].id)}
          disabled={!hasPrev}
          className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
            hasPrev ? "text-muted hover:bg-panel active:bg-panel-2" : "text-line"
          }`}
          aria-label="Poprzedni okres"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <h1 className="font-display text-[17px] font-semibold tracking-tight text-text">
          {period.label}
        </h1>

        {/* Next period */}
        <button
          onClick={() => hasNext && onChangePeriod(sorted[currentIdx + 1].id)}
          disabled={!hasNext}
          className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
            hasNext ? "text-muted hover:bg-panel active:bg-panel-2" : "text-line"
          }`}
          aria-label="Następny okres"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M6 3L11 8L6 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-[13px] text-muted">{daysLabel}</span>

        {/* Settings */}
        <button
          onClick={() => router.push("/settings")}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-panel hover:text-text active:bg-panel-2"
          aria-label="Ustawienia"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M9 11.25C10.2426 11.25 11.25 10.2426 11.25 9C11.25 7.75736 10.2426 6.75 9 6.75C7.75736 6.75 6.75 7.75736 6.75 9C6.75 10.2426 7.75736 11.25 9 11.25Z" stroke="currentColor" strokeWidth="1.3" />
            <path d="M7.69 2.54L7.25 4.05C6.75 4.22 6.29 4.47 5.88 4.78L4.35 4.42L3.04 6.69L4.22 7.77C4.18 8.05 4.16 8.34 4.16 8.63L4.16 9C4.16 9.29 4.18 9.58 4.22 9.86L3.04 10.94L4.35 13.21L5.88 12.85C6.29 13.16 6.75 13.41 7.25 13.58L7.69 15.09H10.31L10.75 13.58C11.25 13.41 11.71 13.16 12.12 12.85L13.65 13.21L14.96 10.94L13.78 9.86C13.82 9.58 13.84 9.29 13.84 9C13.84 8.71 13.82 8.42 13.78 8.14L14.96 7.06L13.65 4.79L12.12 5.15C11.71 4.84 11.25 4.59 10.75 4.42L10.31 2.91L7.69 2.54Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </header>
  );
}
