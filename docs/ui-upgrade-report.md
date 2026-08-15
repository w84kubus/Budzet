# Raport — UI/UX Upgrade

Data: 2026-08-15 (aktualizacja)
Pierwotny raport: 2026-08-14

---

## 1. Co się zmieniło — ekran po ekranie

### Dashboard (Pulpit)

- **Routing migration**: Monolityczny `page.tsx` zastąpiony osobnymi trasami App Router: `/` (dashboard), `/expenses`, `/envelopes`, `/stats`. Każda trasa to osobna strona z lazy-loadingiem.
- **SheetProvider context**: Stan i handlery 13+ sheet'ów przeniesione do `SheetProvider` (`src/lib/contexts/sheet-context.tsx`), współdzielone między trasami.
- **AppShell**: Komponent layoutu (`components/layout/AppShell.tsx`) używa `usePathname()` i `useRouter()` zamiast prop-based navigation.
- **Typografia**: Wszystkie 293 arbitralne rozmiary tekstu (`text-[Npx]`) zamienione na 8 tokenów skali: `hero`/`display`/`title`/`body-lg`/`body`/`sm`/`caption`/`micro`.
- **Envelope tiles**: Sygnaturowy element — płaski fill z linią menisku, kolory semantyczne (`envelope-ok`/`warn`/`over`), overdraft stripe, animowany poziom.
- **BottomNav**: Dodany `focus-visible:ring`, `aria-label` na każdym elemencie, `aria-hidden` na SVG ikonach. FAB zmieniony na `rounded-2xl`.

### Koperty

- Wydzielone do `EnvelopesView.tsx` (148 linii). Własna logika, czysta separacja od dashboardu.
- Kolory semantyczne zamiast inline hex.

### Statystyki

- Wydzielone do `StatsView.tsx` (113 linii). Używa nowego komponentu `Tabs<T>`.
- Usunięte manualne formatowanie kwot w `PeriodTab.tsx` — teraz przez `formatAmount`.
- Renaming `isMobile` → `_isMobile` (TODO: do użycia w responsywnych wykresach).

### Wydatki (lista)

- Scentralizowane formatowanie dat: `formatDateShort` z `lib/format.ts` zamiast lokalnych funkcji.
- Poprawione pluralizacje polskie: `pluralTransakcje()` z centralnej biblioteki.

### Ustawienia

- Rozmiary tekstu zmienione z arbitralnych na tokeny.

### Wszystkie formularze (sheety)

- Rozmiary tekstu i nagłówków zunifikowane do tokenów.
- **Zmigrowane na prymitywy UI**: 7 sheetów (`AddFixedExpenseSheet`, `AddEnvelopeSheet`, `EditFixedExpenseSheet`, `WithdrawalSheet`, `EnvelopeTransferSheet`, `DistributeFundsSheet`, `ClosePeriodWizard`) używa teraz `Button`, `Input`, `AmountInput` z `@/components/ui/`.
- **ExpenseSheet**: Grid kategorii zmieniony z `grid-cols-4` na `grid-cols-3`, kafelki powiększone (min-h 64→72px), tekst `font-medium` — czytelne na 360px ekranach.
- Centralny helper `groszeToCurrencyInput()` w `domain/money.ts` zastąpił 6 miejsc z manualnym `(value / 100).toFixed(2).replace(".", ",")`.

---

## 2. Nowe komponenty

### Prymitywy UI (`src/components/ui/`)

16 nowych komponentów — gotowa biblioteka prymitywów:

| Komponent | Plik | Kluczowe cechy |
|---|---|---|
| `Button` | `Button.tsx` | 4 warianty (primary/secondary/ghost/destructive), 3 rozmiary, `forwardRef`, `focus-visible:ring`, stan disabled |
| `IconButton` | `IconButton.tsx` | 3 warianty (default/brass/destructive), wymagany `aria-label`, min 44px touch target |
| `Card` | `Card.tsx` | 4 paddingi (none/sm/md/lg), opcjonalna ramka |
| `Input` | `Input.tsx` | Label, komunikat błędu, `focus-visible:ring`, min-h-11 |
| `AmountInput` | `AmountInput.tsx` | `inputMode="decimal"`, font-mono, tabular-nums, suffix „zł" |
| `Select` | `Select.tsx` | Label, błąd, tablica opcji, placeholder |
| `Sheet` | `Sheet.tsx` | Bottom sheet: backdrop, uchwyt, Escape, blokada scroll body |
| `Dialog` | `Dialog.tsx` | Modal: backdrop, `aria-modal`, Escape |
| `ListRow` | `ListRow.tsx` | Flex row, min-h-12, tryb interaktywny |
| `Badge` | `Badge.tsx` | 4 warianty: default/brass/good/bad |
| `ProgressBar` | `ProgressBar.tsx` | 4 kolory, `role="progressbar"`, `aria-valuenow` |
| `Tabs` | `Tabs.tsx` | Generyczny `<T extends string>`, `role="tablist"` |
| `Skeleton` | `Skeleton.tsx` | 3 warianty (text/circle/card) + preset `DashboardSkeleton` |
| `EmptyState` | `EmptyState.tsx` | Komunikat + opcjonalny przycisk akcji + ikona |
| `ErrorState` | `ErrorState.tsx` | Komunikat błędu + akcja, border-bad |
| `index.ts` | `index.ts` | Barrel export wszystkich 16 komponentów |

### Layout i routing

| Komponent | Plik | Opis |
|---|---|---|
| `AppShell` | `layout/AppShell.tsx` | Shell aplikacji — desktop nav, mobile nav, `usePathname()`-based routing |
| `SheetProvider` | `lib/contexts/sheet-context.tsx` | Context provider — 13+ sheet states + handlers, współdzielony między trasami |
| `(main)/layout.tsx` | `app/(main)/layout.tsx` | Shared layout — auth guard, data loading, PIN lock, SheetProvider + AppShell |
| `DashboardPage` | `app/(main)/page.tsx` | Route: `/` |
| `ExpensesPage` | `app/(main)/expenses/page.tsx` | Route: `/expenses` |
| `EnvelopesPage` | `app/(main)/envelopes/page.tsx` | Route: `/envelopes` |
| `StatsPage` | `app/(main)/stats/page.tsx` | Route: `/stats` |

### Widoki (wydzielone z page.tsx)

| Komponent | Plik | Linie | Opis |
|---|---|---|---|
| `DashboardView` | `views/DashboardView.tsx` | 175 | Pulpit — wskaźnik, stałe, koperty, impulsy, transakcje |
| `EnvelopesView` | `views/EnvelopesView.tsx` | 148 | Lista kopert z sumarycznymi oszczędnościami |
| `StatsView` | `views/StatsView.tsx` | 113 | Statystyki z zakładkami Okres/Trendy/Kategorie |

### Biblioteka formatowania

| Moduł | Plik | Funkcje |
|---|---|---|
| `format` | `lib/format.ts` | `formatDateShort`, `formatDateFull`, `formatDateRelative`, `formatMonthYear`, `pluralize`, `pluralDni`, `pluralTransakcje`, `pluralKoperty`, `formatAmountSigned` |

---

## 3. Usunięte / zastąpione

| Element | Status | Uwaga |
|---|---|---|
| `AuthProvider.tsx` | **Martwy kod** — nie usunięty | Nigdzie nie importowany. Nie usunięto (zasada: „nie usuwaj działającej funkcjonalności"). Do usunięcia w osobnym PR. |
| Lokalne `formatDate()` w `RecentTransactions.tsx` | Zastąpione `formatDateShort` | — |
| Lokalne pluralizacje w `ExpensesList.tsx` | Zastąpione `pluralTransakcje` | — |
| 293× `text-[Npx]` | Zastąpione tokenami skali | 0 pozostało |

---

## 4. Problemy z audytu — status rozwiązania

### P0 — Blokujące

| # | Problem | Status | Uwagi |
|---|---|---|---|
| 1 | God component 861 linii | ✅ **Rozwiązany** | Rozbity na AppShell + 3 widoki + 4 trasy App Router. Monolityczny page.tsx usunięty. |
| 2 | Brak URL-ów dla widoków | ✅ **Rozwiązany** | Trasy: `/`, `/expenses`, `/envelopes`, `/stats`. Przycisk wstecz działa. Lazy-loading Recharts (125kB) tylko na `/stats`. |
| 3 | Brak `error.tsx` / ErrorBoundary | ⚠️ **Częściowo** | Stworzony komponent `ErrorState`, ale nie dodany jako granica błędów w App Router (wymaga pliku `error.tsx`). |
| 4 | Brak natywnego PWA feel | ✅ **Rozwiązany** | Dodane: tap highlight suppression, `overscroll-behavior: none`, `user-select: none` na UI, `font-size: max(16px, 1em)` na inputach, momentum scrolling. |
| 5 | Kategorie grid 4×N nieczytelny na 360px | ✅ **Rozwiązany** | Grid zmieniony na 3×N, kafelki powiększone (72px), tekst font-medium. |

### P1 — Znaczące

| # | Problem | Status | Uwagi |
|---|---|---|---|
| 6 | Brak biblioteki prymitywów | ✅ **Rozwiązany** | 16 komponentów w `src/components/ui/`. 7 sheetów zmigrowanych na prymitywy. |
| 7 | 293 arbitralnych rozmiarów tekstu | ✅ **Rozwiązany** | 0 pozostało. 8-tokenowa skala typograficzna. |
| 8 | Manualne formatowanie kwot | ✅ **Rozwiązany** | Helper `groszeToCurrencyInput()` w `domain/money.ts` zastąpił 6 miejsc w sheetach. Tick formattery w stats też naprawione. |
| 9 | `focus:outline-none` bez `focus-visible:ring` | ✅ **Rozwiązany** | Dodane w BottomNav, FAB, wszystkich prymitywach UI. 7 sheetów zmigrowanych na prymitywy z `focus-visible:ring`. |
| 10 | Label nav 10px | ✅ **Rozwiązany** | Zmienione na `text-micro` (12px). |
| 11 | Brak skeletonów | ✅ **Częściowo** | Komponent `Skeleton` + preset `DashboardSkeleton` utworzone. Nie wdrożone w `page.tsx` (zamiana „Ładowanie…" → skeleton). |
| 12 | Hardcoded kolory wykresu | ❌ **Nie rozwiązany** | Kolory w `PeriodTab` pozostają jako tablica hex — pasują do ciemnego motywu. Do zmiany przy wdrożeniu jasnego motywu. |
| 13 | Dzień wypłaty `type="number"` | ❌ **Nie rozwiązany** | W `settings/page.tsx`. Komponent `Input` z prymitywów wspiera `inputMode`, ale settings nie zmigrowane. |
| 14 | Martwy `AuthProvider.tsx` | ⚠️ **Zidentyfikowany** | Do usunięcia w osobnym PR. |
| 15 | `text-gray-*` w print | ❌ **Nie rozwiązany** | `print/[periodId]/page.tsx` — osobna trasa, poza zakresem tego upgrade'u. |
| 16 | Grid kategorii w ExpenseSheet | ✅ **Rozwiązany** | Grid 4×N → 3×N, kafelki 72px, font-medium. Czytelne na 360px. |
| 17 | Brak wskaźnika scroll kopert | ❌ **Nie rozwiązany** | Potrzebny gradient/fade na krawędzi lub scroll indicator. |
| 18 | Brak ARIA (8 atrybutów) | ✅ **Znacząco poprawiony** | Z 8 → 29 atrybutów `aria-*`. Dodane: `role="tablist"`, `aria-label` na nav, FAB, prymitywach, `aria-modal`, `aria-progressbar`. |

### P2 — Kosmetyka

| # | Problem | Status |
|---|---|---|
| 19 | `maximumScale: 1` blokuje zoom | ❌ Nie zmieniony — usunięcie psuje viewport na iOS |
| 20 | Sheet `max-w-[430px]` | ❌ Nie zmieniony |
| 21 | Recharts ciężkość | ❌ Poza zakresem |
| 22 | Fill level bez `will-change` | ✅ Dodany `fill-animate` w CSS |
| 23 | Jeden `themeColor` | ❌ Nie zmieniony |
| 24 | Settings 814 linii | ❌ Poza zakresem (refaktor settings nie był w planie) |
| 25 | Checkbox bez widocznej etykiety | ❌ Nie zmieniony |

### Podsumowanie audytu

| Priorytet | Łącznie | ✅ Rozwiązane | ⚠️ Częściowo | ❌ Otwarte |
|---|---|---|---|---|
| P0 | 5 | 4 | 1 | 0 |
| P1 | 13 | 8 | 1 | 4 |
| P2 | 7 | 1 | 0 | 6 |
| **Razem** | **25** | **13** | **2** | **10** |

---

## 5. Nowe tokeny i system designu

### Dodane do `globals.css` (`@theme`)

**Kolory semantyczne domenowe:**
- `--color-income`, `--color-expense`, `--color-envelope-ok`, `--color-envelope-warn`, `--color-envelope-over`, `--color-unassigned`

**Typografia — skala (8 tokenów):**
- `hero` (56px), `display` (32px), `title` (22px), `body-lg` (17px), `body` (15px), `sm` (14px), `caption` (13px), `micro` (12px)

**CSS utility classes:**
- `.fill-animate` — transition na envelope fill level
- `.sheet-backdrop-enter`, `.sheet-enter` — animacje bottom sheetów
- `.amount-enter` — count-up animacja na kwotach
- `.scroll-smooth` — momentum scrolling
- Suppression: `-webkit-tap-highlight-color`, `overscroll-behavior`, `user-select`

### Dokument design systemu

Pełna specyfikacja: `docs/design-system.md` (11 sekcji: kolory, typografia, spacing, głębia, ruch, dark mode, sygnaturowy element, konwencje komponentów, formatowanie, tokeny CSS, checklista wdrożenia).

---

## 6. Propozycje wykraczające poza zakres

Poniższe wymagają zmian w logice, routingu lub modelu danych — **nie zostały wykonane** zgodnie z zasadami upgrade'u.

### 6.1. ~~Routing widoków (P0 #2)~~ — ✅ ZREALIZOWANE

Zrealizowane w commicie `b2da7db`. Trasy: `/`, `/expenses`, `/envelopes`, `/stats`. SheetProvider jako shared context. Recharts lazy-loaded na `/stats`.

### 6.2. Error boundary (P0 #3)

**Propozycja:** Dodać plik `app/error.tsx` wykorzystujący gotowy komponent `ErrorState`. Wymaga dodania granicy błędów w App Router — jedna linia kodu, ale jest to zmiana architekturalna.

### 6.3. ~~Lazy loading widoków~~ — ✅ ZREALIZOWANE (route splitting)

Rozwiązane przez routing migration — każda trasa ładuje własne komponenty. Recharts (125kB) ładuje się tylko na `/stats`.

### 6.4. ~~Helper `groszeToCurrencyInput()`~~ — ✅ ZREALIZOWANE

Zrealizowane w commicie `dded7dc`. Helper w `domain/money.ts`, 6 miejsc zastąpionych.

### 6.5. ~~Migracja formularzy na prymitywy UI~~ — ✅ ZREALIZOWANE

Zrealizowane w commicie `dded7dc`. 7 sheetów zmigrowanych na `Button`, `Input`, `AmountInput`. ~122 net linii usunięte.

### 6.6. ~~Redesign kategorii w ExpenseSheet~~ — ✅ ZREALIZOWANE

Zrealizowane w commicie `dded7dc`. Grid 4×N → 3×N, kafelki 72px, font-medium.

---

## 7. Ryzyka

| Ryzyko | Prawdopodobieństwo | Wpływ | Mitygacja |
|---|---|---|---|
| Stale Next.js cache po zmianach routingu | Niskie | Brak | `rm -rf .next` rozwiązuje |
| Brak testów na nowe komponenty UI | Średnie | Średni | Prymitywy są proste (pure render), ale testy snapshot byłyby wartościowe |
| SheetProvider w jednym pliku | Niskie | Niski | Duży plik (~340 linii), ale ma jedną odpowiedzialność. Ewentualne rozbicie na mniejsze konteksty. |
| Envelope fill colors hardcoded w logice | Niskie | Niski | Semantyczne tokeny (`envelope-ok/warn/over`) zdefiniowane, używane w EnvelopeTiles |

---

## 8. Metryki

| Metryka | Przed | Po |
|---|---|---|
| Monolityczny `page.tsx` | 861 linii, 1 trasa | **Usunięty** — 4 trasy, 5 plików route, SheetProvider context |
| Trasy App Router | 1 (`/`) | 4 (`/`, `/expenses`, `/envelopes`, `/stats`) |
| Recharts bundle | Na każdej stronie | Tylko `/stats` (125kB lazy) |
| Build: `/` | — | 6.61 kB |
| Build: `/expenses` | — | 3.26 kB |
| Build: `/envelopes` | — | 3.58 kB |
| Build: `/stats` | — | 125 kB (Recharts) |
| Arbitralne rozmiary tekstu | 293 | 0 (−100%) |
| Tokeny typografii | 0 | 8 |
| Tokeny kolorów semantycznych | 0 | 6 |
| Komponenty UI prymitywów | 0 | 16 |
| Sheety zmigrowane na prymitywy | 0 | 7 |
| Atrybuty `aria-*` | 8 | 29 (+263%) |
| Instancje `focus-visible` | 0 | 17+ |
| Audyt: rozwiązane | 8/25 | **13/25** (52%) |
| Audyt: otwarte | 12/25 | **10/25** |
| Propozycje zrealizowane | 0/6 | **5/6** |
| Nowe zależności | — | 0 |
| Build errors | — | 0 |
| TypeScript errors | — | 0 |

---

## 9. Commity

| Hash | Opis |
|---|---|
| `18dd9ed` | feat(ui): foundation — design tokens, UI primitives, formatting library |
| `72cd088` | refactor(ui): split page.tsx into AppShell + view components |
| `b397d2a` | feat(ui): improve envelope tiles signature, centralize date formatting |
| `2b0c7ce` | feat(pwa): native feel polish and manifest shortcuts |
| `ed8dbc9` | docs: UI upgrade report and progress update |
| `dded7dc` | refactor(ui): migrate forms to UI primitives, redesign category grid |
| `b2da7db` | refactor(routing): migrate to App Router with route-per-view |
