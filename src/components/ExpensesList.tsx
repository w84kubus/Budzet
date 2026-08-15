"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { formatAmount } from "@/domain/money";
import { pluralTransakcje } from "@/lib/format";
import { getCategoryById, EXPENSE_CATEGORIES } from "@/domain/constants";
import type {
  Transaction,
  FixedExpenseDef,
  Envelope,
  Period,
} from "@/domain/types";

type Props = {
  transactions: Transaction[];
  allTransactions: Transaction[];
  fixedExpenseDefs: FixedExpenseDef[];
  envelopes: Envelope[];
  periods: Period[];
  activePeriodId: string;
  onDelete: (txId: string) => void;
};

type Filter = {
  periodId: string;
  search: string;
  envelopeId: string | null;
  fixedDefId: string | null;
  categoryId: string | null;
  onlyImpulse: boolean;
};

const TRANSACTION_KIND_LABELS: Record<string, string> = {
  income: "Przychód",
  fixedExpense: "Wydatek stały",
  envelopeExpense: "Wydatek z koperty",
  allocation: "Alokacja",
  envelopeTransfer: "Transfer",
  withdrawal: "Wypłata z koperty",
  adjustment: "Korekta",
};

export function ExpensesList({
  transactions,
  allTransactions,
  fixedExpenseDefs,
  envelopes,
  periods,
  activePeriodId,
  onDelete,
}: Props) {
  const [filter, setFilter] = useState<Filter>({
    periodId: activePeriodId,
    search: "",
    envelopeId: null,
    fixedDefId: null,
    categoryId: null,
    onlyImpulse: false,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [swipedId, setSwipedId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(50);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Virtual scrolling with IntersectionObserver
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prev) => prev + 50);
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  // Build lookup maps
  const envelopeMap = useMemo(
    () => new Map(envelopes.map((e) => [e.id, e])),
    [envelopes]
  );
  const defMap = useMemo(
    () => new Map(fixedExpenseDefs.map((d) => [d.id, d])),
    [fixedExpenseDefs]
  );

  // Filter transactions
  const sourceTxs =
    filter.periodId === "__all__"
      ? allTransactions
      : (filter.periodId === activePeriodId
          ? transactions
          : allTransactions.filter((t) => t.periodId === filter.periodId));

  const filtered = useMemo(() => {
    let result = [...sourceTxs];

    // Only expense-like kinds by default
    result = result.filter(
      (t) =>
        t.kind === "fixedExpense" ||
        t.kind === "envelopeExpense" ||
        t.kind === "income" ||
        t.kind === "allocation" ||
        t.kind === "withdrawal" ||
        t.kind === "envelopeTransfer" ||
        t.kind === "adjustment"
    );

    if (filter.search) {
      const q = filter.search.toLowerCase();
      result = result.filter((t) => {
        const note = t.note?.toLowerCase() ?? "";
        const amount = formatAmount(t.amount).toLowerCase();
        const env = t.envelopeId
          ? envelopeMap.get(t.envelopeId)?.name.toLowerCase() ?? ""
          : "";
        const def = t.fixedExpenseDefId
          ? defMap.get(t.fixedExpenseDefId)?.name.toLowerCase() ?? ""
          : "";
        return (
          note.includes(q) ||
          amount.includes(q) ||
          env.includes(q) ||
          def.includes(q)
        );
      });
    }

    if (filter.envelopeId) {
      result = result.filter((t) => t.envelopeId === filter.envelopeId);
    }
    if (filter.fixedDefId) {
      result = result.filter(
        (t) => t.fixedExpenseDefId === filter.fixedDefId
      );
    }
    if (filter.categoryId) {
      result = result.filter((t) => t.subcategory === filter.categoryId);
    }
    if (filter.onlyImpulse) {
      result = result.filter((t) => t.isImpulse);
    }

    // Sort by date desc, then createdAt desc
    result.sort((a, b) => {
      const dateCmp = b.date.localeCompare(a.date);
      if (dateCmp !== 0) return dateCmp;
      return b.createdAt.localeCompare(a.createdAt);
    });

    return result;
  }, [sourceTxs, filter, envelopeMap, defMap]);

  // Group by date
  const grouped = useMemo(() => {
    const groups: { date: string; txs: Transaction[]; total: number }[] = [];
    let currentDate = "";
    let currentGroup: Transaction[] = [];

    for (const tx of filtered) {
      if (tx.date !== currentDate) {
        if (currentGroup.length > 0) {
          groups.push({
            date: currentDate,
            txs: currentGroup,
            total: currentGroup
              .filter(
                (t) =>
                  t.kind === "fixedExpense" ||
                  t.kind === "envelopeExpense"
              )
              .reduce((s, t) => s + t.amount, 0),
          });
        }
        currentDate = tx.date;
        currentGroup = [tx];
      } else {
        currentGroup.push(tx);
      }
    }
    if (currentGroup.length > 0) {
      groups.push({
        date: currentDate,
        txs: currentGroup,
        total: currentGroup
          .filter(
            (t) =>
              t.kind === "fixedExpense" || t.kind === "envelopeExpense"
          )
          .reduce((s, t) => s + t.amount, 0),
      });
    }

    return groups;
  }, [filtered]);

  // Flatten for virtualization
  const visibleGroups = grouped.slice(0, visibleCount);

  const formatGroupDate = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00");
    const dayNames = ["Ndz", "Pon", "Wt", "Śr", "Czw", "Pt", "Sob"];
    const monthNames = [
      "sty", "lut", "mar", "kwi", "maj", "cze",
      "lip", "sie", "wrz", "paź", "lis", "gru",
    ];
    return `${dayNames[d.getDay()]}, ${d.getDate()} ${monthNames[d.getMonth()]}`;
  };

  const getLabel = (tx: Transaction) => {
    if (tx.kind === "envelopeExpense") {
      if (!tx.envelopeId) {
        if (tx.subcategory) {
          const cat = getCategoryById(tx.subcategory);
          return `${cat.emoji} ${cat.name}`;
        }
        return "💳 Konto główne";
      }
      const env = envelopeMap.get(tx.envelopeId);
      return env ? `${env.emoji} ${env.name}` : "Koperta";
    }
    if (tx.kind === "fixedExpense" && tx.fixedExpenseDefId) {
      const def = defMap.get(tx.fixedExpenseDefId);
      return def ? `📌 ${def.name}` : "Wydatek stały";
    }
    if (tx.kind === "allocation" && tx.envelopeId) {
      const env = envelopeMap.get(tx.envelopeId);
      return env ? `→ ${env.emoji} ${env.name}` : "Alokacja";
    }
    if (tx.kind === "withdrawal" && tx.envelopeId) {
      const env = envelopeMap.get(tx.envelopeId);
      return env ? `← ${env.emoji} ${env.name}` : "Wypłata";
    }
    if (tx.kind === "envelopeTransfer") {
      const src = tx.envelopeId ? envelopeMap.get(tx.envelopeId) : null;
      const tgt = tx.targetEnvelopeId
        ? envelopeMap.get(tx.targetEnvelopeId)
        : null;
      return `${src?.emoji ?? "?"} → ${tgt?.emoji ?? "?"}`;
    }
    return TRANSACTION_KIND_LABELS[tx.kind] ?? tx.kind;
  };

  const getAmountSign = (kind: string) => {
    if (kind === "income") return "+";
    if (
      kind === "fixedExpense" ||
      kind === "envelopeExpense" ||
      kind === "withdrawal"
    )
      return "−";
    return "";
  };

  const getAmountColor = (kind: string) => {
    if (kind === "income") return "text-good";
    if (kind === "fixedExpense" || kind === "envelopeExpense") return "text-text";
    return "text-muted";
  };

  const handleSwipe = useCallback(
    (txId: string) => {
      setSwipedId(swipedId === txId ? null : txId);
      setDeleteConfirm(null);
    },
    [swipedId]
  );

  const handleDelete = useCallback(
    (txId: string) => {
      if (deleteConfirm === txId) {
        onDelete(txId);
        setSwipedId(null);
        setDeleteConfirm(null);
      } else {
        setDeleteConfirm(txId);
      }
    },
    [deleteConfirm, onDelete]
  );

  const activeEnvelopes = envelopes.filter((e) => !e.archived);
  const activeDefs = fixedExpenseDefs.filter((d) => !d.archived);

  return (
    <div className="mx-auto max-w-[960px] px-4 md:px-8">
      <div className="safe-top pt-2 pb-2">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-title font-semibold text-text">
            Wydatki
          </h1>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`rounded-lg px-3 py-1.5 text-micro font-medium transition-colors ${
              showFilters || filter.envelopeId || filter.fixedDefId || filter.categoryId || filter.onlyImpulse
                ? "bg-brass/15 text-brass"
                : "bg-panel text-muted"
            }`}
          >
            Filtry
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-3">
        <input
          type="text"
          value={filter.search}
          onChange={(e) => setFilter((f) => ({ ...f, search: e.target.value }))}
          placeholder="Szukaj: kwota, notatka, kategoria…"
          className="w-full rounded-xl border border-line bg-panel px-4 py-2.5 text-sm text-text placeholder:text-muted/40 focus:border-brass/40 focus:outline-none"
        />
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="mb-3 space-y-3 rounded-xl bg-panel p-4">
          {/* Period selector */}
          <div>
            <label className="mb-1 block text-micro text-muted">Okres</label>
            <select
              value={filter.periodId}
              onChange={(e) =>
                setFilter((f) => ({ ...f, periodId: e.target.value }))
              }
              className="w-full rounded-lg border border-line bg-panel-2 px-3 py-2 text-caption text-text focus:border-brass/40 focus:outline-none"
            >
              <option value="__all__">Wszystkie okresy</option>
              {periods
                .slice()
                .sort((a, b) => b.startDate.localeCompare(a.startDate))
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
            </select>
          </div>

          {/* Envelope filter */}
          <div>
            <label className="mb-1 block text-micro text-muted">
              Koperta
            </label>
            <select
              value={filter.envelopeId ?? ""}
              onChange={(e) =>
                setFilter((f) => ({
                  ...f,
                  envelopeId: e.target.value || null,
                }))
              }
              className="w-full rounded-lg border border-line bg-panel-2 px-3 py-2 text-caption text-text focus:border-brass/40 focus:outline-none"
            >
              <option value="">Wszystkie</option>
              {activeEnvelopes.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.emoji} {e.name}
                </option>
              ))}
            </select>
          </div>

          {/* Fixed expense filter */}
          <div>
            <label className="mb-1 block text-micro text-muted">
              Wydatek stały
            </label>
            <select
              value={filter.fixedDefId ?? ""}
              onChange={(e) =>
                setFilter((f) => ({
                  ...f,
                  fixedDefId: e.target.value || null,
                }))
              }
              className="w-full rounded-lg border border-line bg-panel-2 px-3 py-2 text-caption text-text focus:border-brass/40 focus:outline-none"
            >
              <option value="">Wszystkie</option>
              {activeDefs.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Category filter - chips */}
          <div>
            <label className="mb-1.5 block text-micro text-muted">
              Kategoria
            </label>
            <div className="flex flex-wrap gap-1.5">
              {EXPENSE_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() =>
                    setFilter((f) => ({
                      ...f,
                      categoryId: f.categoryId === cat.id ? null : cat.id,
                    }))
                  }
                  className={`rounded-lg px-2.5 py-1.5 text-micro font-medium transition-colors ${
                    filter.categoryId === cat.id
                      ? "bg-brass/20 text-brass ring-1 ring-brass/30"
                      : "bg-panel-2 text-muted hover:text-text"
                  }`}
                >
                  {cat.emoji} {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Impulse toggle */}
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={filter.onlyImpulse}
              onChange={(e) =>
                setFilter((f) => ({ ...f, onlyImpulse: e.target.checked }))
              }
              className="h-4 w-4 rounded border-line accent-brass"
            />
            <span className="text-caption text-text">Tylko impulsy ⚡</span>
          </label>

          {/* Reset */}
          <button
            onClick={() =>
              setFilter({
                periodId: activePeriodId,
                search: "",
                envelopeId: null,
                fixedDefId: null,
                categoryId: null,
                onlyImpulse: false,
              })
            }
            className="text-micro text-muted hover:text-text"
          >
            Wyczyść filtry
          </button>
        </div>
      )}

      {/* Results count */}
      <p className="mb-2 text-micro text-muted">
        {filtered.length} {pluralTransakcje(filtered.length)}
      </p>

      {/* Grouped list */}
      <div className="pb-24 md:pb-4">
        {visibleGroups.length === 0 ? (
          <div className="rounded-xl bg-panel p-8 text-center">
            <p className="text-sm text-muted">
              {filter.search || filter.envelopeId || filter.fixedDefId || filter.categoryId || filter.onlyImpulse
                ? "Brak wyników dla wybranych filtrów."
                : "Brak transakcji w tym okresie."}
            </p>
          </div>
        ) : (
          visibleGroups.map((group) => (
            <div key={group.date} className="mb-1">
              {/* Date header - sticky */}
              <div className="sticky top-0 z-10 flex items-baseline justify-between bg-ink/90 px-1 py-2 backdrop-blur-sm">
                <span className="text-caption font-medium text-text">
                  {formatGroupDate(group.date)}
                </span>
                {group.total > 0 && (
                  <span className="font-mono text-micro tabular-nums text-muted">
                    −{formatAmount(group.total)} zł
                  </span>
                )}
              </div>

              {/* Transaction rows */}
              <div className="space-y-0.5">
                {group.txs.map((tx) => (
                  <div
                    key={tx.id}
                    className="group relative overflow-hidden rounded-lg"
                  >
                    {/* Swipe action background */}
                    {swipedId === tx.id && (
                      <div className="absolute inset-0 flex items-center justify-end bg-bad/15 pr-3">
                        <button
                          onClick={() => handleDelete(tx.id)}
                          className={`rounded-lg px-3 py-1.5 text-micro font-medium ${
                            deleteConfirm === tx.id
                              ? "bg-bad text-white"
                              : "bg-bad/20 text-bad"
                          }`}
                        >
                          {deleteConfirm === tx.id ? "Na pewno?" : "Usuń"}
                        </button>
                      </div>
                    )}

                    <div
                      onClick={() => handleSwipe(tx.id)}
                      className={`relative flex items-center gap-3 bg-panel px-3 py-2.5 transition-transform ${
                        swipedId === tx.id ? "-translate-x-20" : ""
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate text-caption text-text">
                            {getLabel(tx)}
                          </span>
                          {tx.isImpulse && (
                            <span className="text-micro">⚡</span>
                          )}
                        </div>
                        {tx.note && (
                          <p className="truncate text-micro text-muted/60">
                            {tx.note}
                          </p>
                        )}
                      </div>
                      <span
                        className={`font-mono text-sm tabular-nums ${getAmountColor(
                          tx.kind
                        )}`}
                      >
                        {getAmountSign(tx.kind)}
                        {formatAmount(tx.amount)} zł
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}

        {/* Infinite scroll sentinel */}
        {visibleGroups.length < grouped.length && (
          <div ref={sentinelRef} className="flex justify-center py-4">
            <div className="animate-pulse text-micro text-muted">
              Ładowanie…
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
