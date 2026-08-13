# Budżet — PWA do zarządzania budżetem osobistym

Pełna specyfikacja projektu: **SPEC.md** (katalog główny).

## Obowiązkowo
- Przeczytaj SPEC.md przed rozpoczęciem każdego nowego etapu.
- Sekcje 2 (model finansowy) i 4 (model danych) są wiążące — nie improwizuj.
- Po /compact lub /clear przeczytaj SPEC.md ponownie.
- Po każdym etapie zaktualizuj PROGRESS.md.

## Twarde zasady
- Wszystkie kwoty w groszach jako integer. Nigdy float.
- Zero `any` w TypeScript.
- Logika finansowa w src/domain/ — czyste funkcje, bez Reacta.
- Zmiany sald zawsze przez runTransaction.
- UI po polsku, kod po angielsku.

## Struktura katalogów

```
src/
  app/            — Next.js App Router (layout, strony)
  domain/         — czysta logika finansowa (typy, schematy, kalkulacje)
    types.ts      — typy domenowe (Period, Transaction, Envelope…)
    schemas.ts    — schematy Zod do walidacji danych z Firestore
    money.ts      — formatPLN, parsePLN, terminalInputToGrosze
    calculations.ts — obliczenia sald, wolnych środków, dziennego limitu
    operations.ts — closePeriod, distributeFunds, distributeProportionally
    defaults.ts   — domyślne wydatki stałe i koperty
  lib/
    db/paths.ts   — ścieżki Firestore (budgetRoot → users/{uid})
```

## Komendy

```bash
npm run dev        # serwer deweloperski
npm run build      # produkcyjny build
npm run typecheck  # tsc --noEmit
npm run lint       # next lint
npm run test       # vitest run
npm run test:watch # vitest w trybie watch
```

## Konwencje
- Kwoty: `number` w **groszach** (`990 zł` → `99000`). Formatowanie wyłącznie przez `formatPLN()`.
- Transaction.amount jest **zawsze dodatni** — kierunek wynika z `kind`.
- Saldo koperty nigdy nie jest polem — obliczane z transakcji (`calculateEnvelopeBalance`).
- Ścieżki Firestore wyłącznie przez `src/lib/db/paths.ts`.
- Teksty interfejsu po polsku, nazwy w kodzie po angielsku.
- Commity: conventional commits.
