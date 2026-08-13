# Postęp

- [x] Faza 1 — Fundament domeny
- [x] Faza 2 — Dane i uwierzytelnianie
- [ ] Faza 3 — Dodawanie wydatków i pulpit
- [ ] Faza 4 — Koperty i przepływ pieniędzy
- [ ] Faza 5 — Statystyki
- [ ] Faza 6 — PWA, eksport, wykończenie

## Faza 1 — Fundament domeny ✅

**Zakres:** Next.js 15 + TypeScript strict + Tailwind v4, cały `src/domain/`, testy.

**Co zrobione:**
- Projekt Next.js 15, TypeScript strict, Tailwind v4 z tokenami designu (paleta z SPEC §6)
- `src/domain/types.ts` — wszystkie typy: Period, Transaction, Envelope, FixedExpenseDef/Instance, TransferTask, BalanceCheck, UserSettings
- `src/domain/schemas.ts` — schematy Zod do walidacji danych z Firestore
- `src/domain/money.ts` — formatPLN, formatAmount, parsePLN (round-trip), terminalInputToGrosze
- `src/domain/calculations.ts` — obliczenia sald, wolnych środków, dziennego limitu
- `src/domain/operations.ts` — closePeriod, createInitialPeriod, distributeFunds, distributeProportionally
- `src/domain/defaults.ts` — domyślne wydatki stałe i koperty wg SPEC §3.3/§3.4
- `src/lib/db/paths.ts` — wszystkie ścieżki Firestore przez budgetRoot()
- 110 testów, wszystkie na zielono

## Faza 2 — Dane i uwierzytelnianie ✅

**Zakres:** Firebase Auth + Firestore z offline, reguły bezpieczeństwa, warstwa DB, subskrypcje, onboarding, PIN.

**Co zrobione:**
- `src/lib/firebase/config.ts` — lazy init Firebase (SSR-safe), Firestore z persistentLocalCache + persistentMultipleTabManager
- `src/lib/firebase/auth.ts` — signUp, signIn, signOut, resetPassword, onAuthChange
- `src/lib/firebase/db.ts` — pełna warstwa CRUD dla wszystkich kolekcji (settings, periods, fixedExpenseDefs, fixedExpenseInstances, envelopes, transactions, transferTasks), subskrypcje real-time, writeBatch dla onboardingu
- `src/stores/auth-store.ts` — stan auth (Zustand)
- `src/stores/budget-store.ts` — cały stan budżetowy (dane, okresy, transakcje, koperty, online)
- `src/stores/pin-store.ts` — stan blokady PIN
- `src/lib/pin.ts` — hashPin/verifyPin (PBKDF2, Web Crypto), salt + hash format
- `src/lib/hooks/use-auth.ts` — hook auth z auto-subskrypcją
- `src/lib/hooks/use-budget-data.ts` — hook subskrypcji wszystkich danych budżetowych
- `src/lib/hooks/use-pin-lock.ts` — blokada po 5 min, visibility change, user activity tracking
- `src/components/PinLock.tsx` — ekran blokady PIN z klawiaturą numeryczną
- `src/components/OnlineIndicator.tsx` — wskaźnik offline
- `src/app/(auth)/login/page.tsx` — logowanie
- `src/app/(auth)/register/page.tsx` — rejestracja
- `src/app/(auth)/reset-password/page.tsx` — reset hasła
- `src/app/onboarding/page.tsx` — kreator 4 kroki (dzień wypłaty → kwota → potwierdzenie kategorii → PIN)
- `src/app/page.tsx` — główna strona z routingiem (auth → onboarding → pulpit), PIN lock
- `firestore.rules` — reguły bezpieczeństwa (owner-only, walidacja amount int ≥ 0)
- `firestore.indexes.json` — indeksy złożone (transactions po periodId+date, envelopeId+date)
- Typecheck, lint, build, 110 testów — czysto

## Notatki między sesjami
