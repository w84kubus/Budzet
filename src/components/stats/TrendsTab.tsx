"use client";

import { useMemo, useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import { formatAmount } from "@/domain/money";
import { calculateTrends } from "@/domain/statistics";
import type {
  Period,
  Transaction,
  FixedExpenseInstance,
} from "@/domain/types";

type Props = {
  periods: Period[];
  allTransactions: Transaction[];
  allInstances: FixedExpenseInstance[];
};

type ChartView = "savings" | "expenses" | "impulses" | "rate";

const CHART_CONFIG: Record<
  ChartView,
  { label: string; dataKey: string; color: string; unit: string; isPercent?: boolean }
> = {
  savings: {
    label: "Oszczędności",
    dataKey: "totalSavings",
    color: "var(--color-good)",
    unit: " zł",
  },
  expenses: {
    label: "Wydatki",
    dataKey: "totalExpenses",
    color: "var(--color-text)",
    unit: " zł",
  },
  impulses: {
    label: "Impulsy",
    dataKey: "impulseExpenses",
    color: "var(--color-bad)",
    unit: " zł",
  },
  rate: {
    label: "Stopa oszcz.",
    dataKey: "savingsRate",
    color: "var(--color-brass)",
    unit: "%",
    isPercent: true,
  },
};

function CustomTooltip({
  active,
  payload,
  config,
}: {
  active?: boolean;
  payload?: Array<{ value: number; payload: { label: string } }>;
  config: (typeof CHART_CONFIG)[ChartView];
}) {
  if (!active || !payload?.[0]) return null;
  const val = payload[0].value;
  return (
    <div className="rounded-lg bg-panel-2 px-3 py-2 shadow-lg">
      <p className="text-micro text-muted">{payload[0].payload.label}</p>
      <p className="font-mono text-sm font-semibold tabular-nums text-text">
        {config.isPercent ? `${val}%` : `${formatAmount(val)} zł`}
      </p>
    </div>
  );
}

export function TrendsTab({
  periods,
  allTransactions,
  allInstances,
}: Props) {
  const [activeView, setActiveView] = useState<ChartView>("savings");
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const trends = useMemo(
    () => calculateTrends(periods, allTransactions, allInstances),
    [periods, allTransactions, allInstances]
  );

  if (trends.length === 0) {
    return (
      <div className="rounded-xl bg-panel p-8 text-center">
        <p className="text-sm text-muted">
          Brak danych — zamknij przynajmniej jeden okres.
        </p>
      </div>
    );
  }

  const config = CHART_CONFIG[activeView];
  const chartData = trends.map((t) => ({
    label: t.label,
    [config.dataKey]: config.isPercent
      ? t[config.dataKey as keyof typeof t]
      : t[config.dataKey as keyof typeof t],
  }));

  // Format Y axis
  const formatYAxis = (value: number) => {
    if (config.isPercent) return `${value}%`;
    if (value >= 100000) return `${(value / 100).toFixed(0)}`;
    if (value >= 10000) return `${(value / 100).toFixed(0)}`;
    return `${(value / 100).toFixed(0)}`;
  };

  return (
    <div className="space-y-4">
      {/* Chart selector tabs */}
      <div className="flex gap-1 rounded-xl bg-panel p-1">
        {(Object.keys(CHART_CONFIG) as ChartView[]).map((view) => (
          <button
            key={view}
            onClick={() => setActiveView(view)}
            className={`flex-1 rounded-lg py-2 text-micro font-medium transition-colors ${
              activeView === view
                ? "bg-panel-2 text-text"
                : "text-muted hover:text-text"
            }`}
          >
            {CHART_CONFIG[view].label}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="rounded-xl bg-panel p-4">
        <h3 className="mb-1 text-body font-medium text-text">
          {config.label}
        </h3>
        <p className="mb-4 text-micro text-muted">
          Ostatnie {trends.length}{" "}
          {trends.length === 1
            ? "okres"
            : trends.length < 5
            ? "okresy"
            : "okresów"}
        </p>

        {mounted && (
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              {activeView === "savings" ? (
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient
                      id="savingsGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="var(--color-good)"
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="100%"
                        stopColor="var(--color-good)"
                        stopOpacity={0.02}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--color-line)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: "var(--color-muted)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={formatYAxis}
                    tick={{ fontSize: 11, fill: "var(--color-muted)" }}
                    axisLine={false}
                    tickLine={false}
                    width={50}
                  />
                  <Tooltip
                    content={
                      <CustomTooltip config={config} />
                    }
                  />
                  <Area
                    type="monotone"
                    dataKey={config.dataKey}
                    stroke={config.color}
                    strokeWidth={2}
                    fill="url(#savingsGradient)"
                    dot={{ fill: config.color, r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </AreaChart>
              ) : (
                <LineChart data={chartData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--color-line)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: "var(--color-muted)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={formatYAxis}
                    tick={{ fontSize: 11, fill: "var(--color-muted)" }}
                    axisLine={false}
                    tickLine={false}
                    width={50}
                  />
                  <Tooltip
                    content={
                      <CustomTooltip config={config} />
                    }
                  />
                  <Line
                    type="monotone"
                    dataKey={config.dataKey}
                    stroke={config.color}
                    strokeWidth={2}
                    dot={{ fill: config.color, r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Current values summary */}
      {trends.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-panel p-3">
            <p className="text-micro text-muted">Suma oszczędności</p>
            <p className="mt-1 font-mono text-body-lg font-semibold tabular-nums text-good">
              {formatAmount(trends[trends.length - 1].totalSavings)} zł
            </p>
          </div>
          <div className="rounded-xl bg-panel p-3">
            <p className="text-micro text-muted">Ostatnie wydatki</p>
            <p className="mt-1 font-mono text-body-lg font-semibold tabular-nums text-text">
              {formatAmount(trends[trends.length - 1].totalExpenses)} zł
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
