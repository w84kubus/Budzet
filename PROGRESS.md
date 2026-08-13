# Postęp

- [x] Faza 1 — Fundament domeny
- [ ] Faza 2 — Dane i uwierzytelnianie
- [ ] Faza 3 — Dodawanie wydatków i pulpit
- [ ] Faza 4 — Koperty i przepływ pieniędzy
- [ ] Faza 5 — Statystyki
- [ ] Faza 6 — PWA, eksport, wykończenie

## Faza 1 — Fundament domeny ✅

**Zakres:** Next.js 15 + TypeScript strict + Tailwind v4, cały `src/domain/`, testy.

**Co zrobione:**
- Projekt Next.js 15, TypeScript strict, Tailwind v4 z tokenami designu (paleta z SPEC §6)
- `src/domain/types.ts` — wszystkie typy: Period, Transaction, Envelope, FixedExpenseDef/Instance, TransferTask, BalanceCheck, UserSettings
- `src/domain/schemas.ts` — schematy Zod do walidacji (kwoty int, amount > 0, dueDay 1–31, currency = PLN)
- `src/domain/money.ts` — formatPLN, formatAmount, parsePLN (round-trip), terminalInputToGrosze
- `src/domain/calculations.ts` — calculateEnvelopeBalance, calculateAllEnvelopeBalances, calculateAccountBalances (z doWyrównania), calculateFreeFunds, calculateDaysUntilPayday, calculateDailyAllowance, calculateEnvelopeDailyLimit, calculateImpulseTotal, calculateAllocationBreakdown
- `src/domain/operations.ts` — closePeriod, createInitialPeriod, distributeFunds, distributeProportionally (largest remainder), shouldShowPaydayReminder
- `src/domain/defaults.ts` — domyślne wydatki stałe i koperty wg SPEC §3.3/§3.4
- `src/lib/db/paths.ts` — wszystkie ścieżki Firestore przez budgetRoot()
- 110 testów, wszystkie na zielono
- Typecheck, lint, build — czysto

## Notatki między sesjami
