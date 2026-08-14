# Postęp

- [x] Faza 1 — Fundament domeny
- [x] Faza 2 — Dane i uwierzytelnianie
- [x] Faza 3 — Dodawanie wydatków i pulpit
- [x] Faza 4 — Koperty i przepływ pieniędzy
- [x] Faza 5 — Statystyki
- [x] Faza 6 — PWA, eksport, wykończenie

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

## Faza 3 — Dodawanie wydatków i pulpit ✅

**Zakres:** Arkusz dodawania wydatków, pulpit ze wszystkimi sekcjami, bottom nav, FAB.

**Co zrobione:**
- `src/components/ExpenseSheet.tsx` — arkusz dodawania wydatków: terminal keypad (mobile) / text input (desktop), kafelki kategorii (koperty + accumulating stałe), "Więcej opcji" (notatka, impulse toggle, paidFrom selector), toast z undo
- `src/components/BottomNav.tsx` — dolna nawigacja (4 pozycje + FAB), mobile only
- `src/components/Toast.tsx` — globalny toast z akcją undo, 5s auto-dismiss
- `src/components/AddFixedExpenseSheet.tsx` — formularz dodawania nowego wydatku stałego
- `src/components/AddEnvelopeSheet.tsx` — formularz dodawania nowej koperty (emoji picker, plan, cel)
- `src/components/EditFixedExpenseSheet.tsx` — edycja kwoty planowanej instancji wydatku stałego
- `src/components/dashboard/PeriodHeader.tsx` — nagłówek okresu z nawigacją (prev/next), dni do wypłaty, logout
- `src/components/dashboard/MainIndicator.tsx` — wolne środki (56px Fraunces, brass/red), dzienny limit, burn rate bar
- `src/components/dashboard/TransferTaskCard.tsx` — karta zadania przelewu z rozpiską i przyciskiem "Zrobione"
- `src/components/dashboard/FixedExpenses.tsx` — wydatki stałe z checkboxami, przycisk dodaj, klikalne kwoty
- `src/components/dashboard/EnvelopeTiles.tsx` — kafelki kopert z fill level, horizontal scroll (mobile) / grid (desktop)
- `src/components/dashboard/ImpulseCounter.tsx` — suma impulsów z porównaniem do poprzedniego okresu
- `src/components/dashboard/RecentTransactions.tsx` — ostatnie 5 transakcji
- `src/app/page.tsx` — pulpit z 2-kolumnowym responsive grid (desktop), wszystkie sheety podłączone
- Responsive: mobile stack / desktop 2-column, desktop FAB, full-width bottom sections
- Fonty: Fraunces (variable, opsz), Inter Tight, Geist Mono; tabular-nums na kwotach

**Brakuje (do zrobienia w późniejszym etapie):**
- Lista wydatków z filtrami i wirtualizacją (ekran "Wydatki" z §5.3)

## Faza 4 — Koperty i przepływ pieniędzy ✅

**Zakres:** Widok kopert, dystrybucja wolnych środków, wypłata z koperty, transfer między kopertami, zamknięcie okresu.

**Co zrobione:**
- `src/components/envelopes/EnvelopeCard.tsx` — karta koperty: saldo, pasek postępu, projekcja celu, statystyki okresu (alokowane/wydane), dzienny limit (consumable), ostrzeżenie o przekroczeniu z "Pokryj z innej koperty"
- `src/components/envelopes/EnvelopeHistory.tsx` — historia transakcji koperty: bottom sheet, filtrowanie po envelopeId, grupowanie po datach
- `src/components/DistributeFundsSheet.tsx` — arkusz dystrybucji wolnych środków: lista kopert z polami kwot, live "Pozostanie", skróty (Proporcjonalnie, Wyzeruj, Resztę do Poduszki), walidacja przekroczenia
- `src/components/WithdrawalSheet.tsx` — wyjmowanie z koperty: picker kopert w gridzie z saldami, kwota, powód
- `src/components/EnvelopeTransferSheet.tsx` — pokrywanie przekroczenia: pre-selected target, źródła posortowane po saldzie desc, walidacja salda źródła
- `src/components/ClosePeriodWizard.tsx` — 3-krokowy wizard zamknięcia okresu: podsumowanie (przychody, stałe, koperty, impulsy, wolne), niedokończone sprawy (niezapłacone, otwarte przelewy, przekroczone koperty), nowy okres (data, kwota wypłaty)
- `src/app/page.tsx` — podłączone wszystkie sheety Phase 4, handlery (distribute → alokacje + transfer task, withdrawal, envelopeTransfer, closePeriod → zamknięcie + nowy okres + instancje + income tx), widok "Koperty" z podsumowaniem i kartami, przyciski "Rozdysponuj" / "Mam wypłatę" na dashboardzie i w widoku kopert

## Faza 5 — Statystyki ✅

**Zakres:** Trzy zakładki statystyk (Okres / Trendy / Kategorie), wykresy Recharts, lista wydatków z filtrami.

**Co zrobione:**
- `src/domain/statistics.ts` — funkcje obliczeniowe: calculatePeriodSummary, calculateCategoryBreakdown, calculateFixedExpenseComparison, calculateTrends (multi-period, cumulative savings), calculateCategoryHistory (sparklines, zmiana %)
- `src/components/stats/PeriodTab.tsx` — zakładka "Okres": 6 kafelków podsumowania, słupki kategorii wg wydatków, plan vs rzeczywistość dla stałych, wyróżnienie impulsów
- `src/components/stats/TrendsTab.tsx` — zakładka "Trendy": 4 pod-zakładki (Oszczędności, Wydatki, Impulsy, Stopa oszcz.), AreaChart dla oszczędności, LineChart dla reszty, tooltips, podsumowanie
- `src/components/stats/CategoriesTab.tsx` — zakładka "Kategorie": ranking kategorii (BarChart), pełna lista z SVG sparklines i zmianą %, sekcje "Najbardziej wzrosło" / "spadło"
- `src/components/ExpensesList.tsx` — lista wydatków (§5.3): grupowanie po dniach z sticky nagłówkami, wyszukiwarka, filtry (okres, koperta, stały, impulsy), swipe-to-delete z potwierdzeniem, infinite scroll (IntersectionObserver, porcje po 50)
- `src/lib/firebase/db.ts` — dodano subscribeAllFixedExpenseInstances (dane ze wszystkich okresów dla trendów)
- `src/stores/budget-store.ts` — dodano allFixedExpenseInstances
- `src/lib/hooks/use-budget-data.ts` — subskrypcja allFixedExpenseInstances
- `src/app/page.tsx` — podłączone widoki: Wydatki (ExpensesList), Statystyki (3 zakładki), handleDeleteTransaction
- Recharts zainstalowany, ciemny motyw, responsive

## Faza 6 — PWA, eksport, wykończenie ✅

**Zakres:** PWA manifest + service worker, ikony, ustawienia, eksport CSV/JSON, import, widok wydruku.

**Co zrobione:**
- `public/manifest.json` — manifest PWA (standalone, dark bg, ikony SVG)
- `public/icon-192.svg`, `icon-512.svg`, `icon-maskable.svg` — ikony aplikacji (złote "B" na ciemnym tle)
- `src/app/sw.ts` — service worker (Serwist), precaching + runtime caching
- `next.config.ts` — integracja @serwist/next (disabled w dev)
- `src/app/layout.tsx` — manifest link, appleWebApp meta
- `src/app/settings/page.tsx` — strona ustawień: dzień wypłaty, zarządzanie wydatkami stałymi (archiwizacja), zarządzanie kopertami (archiwizacja), PIN (ustaw/zmień/wyłącz), eksport CSV, eksport JSON (kopia zapasowa z datą), import JSON (z podglądem i potwierdzeniem ZASTĄP), wydruk okresów, wylogowanie
- `src/app/print/[periodId]/page.tsx` — widok wydruku: jasny motyw, A4, przychody → stałe → koperty → podsumowanie, window.print()
- `src/domain/export.ts` — exportTransactionsCSV (UTF-8 BOM, separator ;), createBackup (JSON z wersją), downloadFile helper
- `src/lib/firebase/db.ts` — dodano updateFixedExpenseDef
- `src/components/dashboard/PeriodHeader.tsx` — ikona zębatki (ustawienia) zamiast logout
- `src/components/EditFixedExpenseSheet.tsx` — dodano pole edycji nazwy wydatku stałego

## Notatki między sesjami
