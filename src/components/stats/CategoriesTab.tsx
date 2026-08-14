"use client";

import { useMemo, useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatAmount } from "@/domain/money";
import { calculateCategoryHistory } from "@/domain/statistics";
import type {
  Period,
  Transaction,
  FixedExpenseDef,
  FixedExpenseInstance,
  Envelope,
} from "@/domain/types";

type Props = {
  periods: Period[];
  allTransactions: Transaction[];
  allInstances: FixedExpenseInstance[];
  fixedExpenseDefs: FixedExpenseDef[];
  envelopes: Envelope[];
  currentPeriodId: string;
};

function SparkLine({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return null;

  const max = Math.max(...data, 1);
  const width = 80;
  const height = 24;
  const points = data.map((val, i) => ({
    x: (i / (data.length - 1)) * width,
    y: height - (val / max) * height,
  }));
  const path = points
    .map((p, i) => (i === 0 ? `M${p.x},${p.y}` : `L${p.x},${p.y}`))
    .join(" ");

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="flex-shrink-0"
    >
      <path d={path} fill="none" stroke={color} strokeWidth={1.5} />
      {/* Current dot */}
      <circle
        cx={points[points.length - 1].x}
        cy={points[points.length - 1].y}
        r={2.5}
        fill={color}
      />
    </svg>
  );
}

export function CategoriesTab({
  periods,
  allTransactions,
  allInstances,
  fixedExpenseDefs,
  envelopes,
  currentPeriodId,
}: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const categoryHistory = useMemo(
    () =>
      calculateCategoryHistory(
        periods,
        allTransactions,
        allInstances,
        fixedExpenseDefs,
        envelopes,
        currentPeriodId
      ),
    [
      periods,
      allTransactions,
      allInstances,
      fixedExpenseDefs,
      envelopes,
      currentPeriodId,
    ]
  );

  if (categoryHistory.length === 0) {
    return (
      <div className="rounded-xl bg-panel p-8 text-center">
        <p className="text-sm text-muted">
          Brak danych o wydatkach w tym okresie.
        </p>
      </div>
    );
  }

  // Top chart data — top 8 categories
  const top8 = categoryHistory.slice(0, 8);
  const chartData = top8.map((cat) => ({
    name: cat.emoji + " " + (cat.name.length > 10 ? cat.name.substring(0, 10) + "…" : cat.name),
    value: cat.currentAmount,
  }));

  // Most increased / decreased
  const withChange = categoryHistory.filter((c) => c.changePercent !== null);
  const increased = withChange
    .filter((c) => c.changePercent! > 0)
    .sort((a, b) => b.changePercent! - a.changePercent!)
    .slice(0, 3);
  const decreased = withChange
    .filter((c) => c.changePercent! < 0)
    .sort((a, b) => a.changePercent! - b.changePercent!)
    .slice(0, 3);

  return (
    <div className="space-y-4">
      {/* Bar chart — top categories */}
      {mounted && chartData.length > 0 && (
        <div className="rounded-xl bg-panel p-4">
          <h3 className="mb-3 text-caption font-medium uppercase tracking-wider text-muted">
            Ranking kategorii
          </h3>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" barSize={12}>
                <XAxis
                  type="number"
                  tickFormatter={(v) => `${(v / 100).toFixed(0)}`}
                  tick={{ fontSize: 11, fill: "var(--color-muted)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "var(--color-text)" }}
                  axisLine={false}
                  tickLine={false}
                  width={110}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--color-panel-2)",
                    border: "1px solid var(--color-line)",
                    borderRadius: "8px",
                    padding: "8px 12px",
                  }}
                  labelStyle={{ color: "var(--color-muted)", fontSize: 11 }}
                  formatter={(value) => [
                    `${formatAmount(Number(value ?? 0))} zł`,
                    "Wydano",
                  ]}
                  cursor={{ fill: "var(--color-line)", opacity: 0.3 }}
                />
                <Bar
                  dataKey="value"
                  fill="var(--color-brass)"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Full category list with sparklines */}
      <div className="rounded-xl bg-panel p-4">
        <h3 className="mb-3 text-caption font-medium uppercase tracking-wider text-muted">
          Wszystkie kategorie
        </h3>
        <div className="space-y-2">
          {categoryHistory.map((cat) => (
            <div
              key={cat.id}
              className="flex items-center gap-3 rounded-lg bg-panel-2 px-3 py-2.5"
            >
              <span className="text-body">{cat.emoji}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-caption text-text">{cat.name}</p>
                {cat.changePercent !== null && (
                  <p
                    className={`text-micro ${
                      cat.changePercent > 0
                        ? "text-bad"
                        : cat.changePercent < 0
                        ? "text-good"
                        : "text-muted"
                    }`}
                  >
                    {cat.changePercent > 0 ? "+" : ""}
                    {cat.changePercent}% vs poprzedni
                  </p>
                )}
              </div>
              <SparkLine
                data={cat.sparkline}
                color={
                  cat.changePercent !== null && cat.changePercent > 20
                    ? "var(--color-bad)"
                    : "var(--color-muted)"
                }
              />
              <span className="font-mono text-caption tabular-nums text-text">
                {formatAmount(cat.currentAmount)} zł
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Most increased / decreased */}
      {(increased.length > 0 || decreased.length > 0) && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {increased.length > 0 && (
            <div className="rounded-xl border border-bad/15 bg-bad/5 p-4">
              <h4 className="mb-2 text-micro font-medium uppercase tracking-wider text-bad">
                📈 Najbardziej wzrosło
              </h4>
              <div className="space-y-1.5">
                {increased.map((cat) => (
                  <div
                    key={cat.id}
                    className="flex items-baseline justify-between"
                  >
                    <span className="text-caption text-text">
                      {cat.emoji} {cat.name}
                    </span>
                    <span className="font-mono text-micro tabular-nums text-bad">
                      +{cat.changePercent}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {decreased.length > 0 && (
            <div className="rounded-xl border border-good/15 bg-good/5 p-4">
              <h4 className="mb-2 text-micro font-medium uppercase tracking-wider text-good">
                📉 Najbardziej spadło
              </h4>
              <div className="space-y-1.5">
                {decreased.map((cat) => (
                  <div
                    key={cat.id}
                    className="flex items-baseline justify-between"
                  >
                    <span className="text-caption text-text">
                      {cat.emoji} {cat.name}
                    </span>
                    <span className="font-mono text-micro tabular-nums text-good">
                      {cat.changePercent}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
