"use client";

import { formatAmount } from "@/domain/money";
import type { TransferTask, Envelope } from "@/domain/types";

type Props = {
  task: TransferTask;
  envelopes: Envelope[];
  onMarkDone: (taskId: string) => void;
};

export function TransferTaskCard({ task, envelopes, onMarkDone }: Props) {
  const envelopeMap = new Map(envelopes.map((e) => [e.id, e]));

  return (
    <section className="rounded-xl border border-brass/20 bg-panel p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-caption font-semibold uppercase tracking-wider text-brass">
          Przelew do zrobienia
        </h3>
        <span className="font-mono text-body font-medium text-text tabular-nums">
          {formatAmount(task.totalAmount)} zł
        </span>
      </div>

      <div className="mb-3 space-y-1">
        {task.breakdown.map((item) => {
          const env = envelopeMap.get(item.envelopeId);
          return (
            <div
              key={item.envelopeId}
              className="flex items-center justify-between text-caption"
            >
              <span className="text-muted">
                {env ? `${env.emoji} ${env.name}` : item.envelopeId}
              </span>
              <span className="font-mono text-caption text-text/80 tabular-nums">
                {formatAmount(item.amount)} zł
              </span>
            </div>
          );
        })}
      </div>

      <button
        onClick={() => onMarkDone(task.id)}
        className="w-full rounded-lg bg-brass/10 py-2.5 text-caption font-medium text-brass transition-colors active:bg-brass/20"
      >
        Przelew zrobiony
      </button>
    </section>
  );
}
