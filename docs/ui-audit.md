# Audyt UI/UX — Budżet PWA

Data audytu: 2026-08-14

---

## 1. Inwentaryzacja tras

| Trasa | Plik | Rola | `"use client"` |
|---|---|---|---|
| `/` | `app/page.tsx` (861 linii) | Mega-komponent: dashboard, koperty, wydatki, statystyki — 4 widoki przełączane przez `activeNav` | ✅ |
| `/login` | `app/(auth)/login/page.tsx` | Logowanie | ✅ |
| `/register` | `app/(auth)/register/page.tsx` | Rejestracja | ✅ |
| `/reset-password` | `app/(auth)/reset-password/page.tsx` | Reset hasła | ✅ |
| `/onboarding` | `app/onboarding/page.tsx` | Kreator 4 kroków po rejestracji | ✅ |
| `/settings` | `app/settings/page.tsx` (814 linii) | Ustawienia, eksport, import, PIN, wylogowanie | ✅ |
| `/print/[periodId]` | `app/print/[periodId]/page.tsx` | Wydruk okresu | ✅ |

**Brakujące pliki:** brak `loading.tsx`, `error.tsx`, `not-found.tsx` na żadnym poziomie — ani globalnie, ani w grupach tras.

---

## 2. Inwentaryzacja komponentów

### Główne (25 plików, wszystkie `"use client"`)

| Komponent | Ścieżka | Linie | Użycia | Uwagi |
|---|---|---|---|---|
| `ExpenseSheet` | `components/ExpenseSheet.tsx` | 376 | 1 (page.tsx) | Formularz dodawania wydatku |
| `ExpensesList` | `components/ExpensesList.tsx` | 518 | 1 | Lista wydatków z filtrami |
| `ClosePeriodWizard` | `components/ClosePeriodWizard.tsx` | 437 | 1 | 3-krokowy wizard |
| `DistributeFundsSheet` | `components/DistributeFundsSheet.tsx` | 233 | 1 | Dystrybucja wolnych środków |
| `WithdrawalSheet` | `components/WithdrawalSheet.tsx` | 170 | 1 | Wyjęcie z koperty |
| `EnvelopeTransferSheet` | `components/EnvelopeTransferSheet.tsx` | 170 | 1 | Transfer między kopertami |
| `EditFixedExpenseSheet` | `components/EditFixedExpenseSheet.tsx` | 131 | 1 | Edycja wydatku stałego |
| `AddFixedExpenseSheet` | `components/AddFixedExpenseSheet.tsx` | 142 | 1 | Dodawanie wydatku stałego |
| `AddEnvelopeSheet` | `components/AddEnvelopeSheet.tsx` | 162 | 1 | Dodawanie koperty |
| `BottomNav` | `components/BottomNav.tsx` | 98 | 1 | Nawigacja mobilna |
| `PinLock` | `components/PinLock.tsx` | 115 | 1 | Ekran PIN |
| `OnlineIndicator` | `components/OnlineIndicator.tsx` | ~20 | 1 | Kropka offline |
| `Toast` | `components/Toast.tsx` | ~80 | 1 | Toast z undo |
| `AuthProvider` | `components/AuthProvider.tsx` | ~25 | 0 | **Nieużywany** |
| `PeriodHeader` | `dashboard/PeriodHeader.tsx` | 96 | 1 | Nagłówek okresu |
| `MainIndicator` | `dashboard/MainIndicator.tsx` | ~90 | 1 | Wolne środki + burn rate |
| `TransferTaskCard` | `dashboard/TransferTaskCard.tsx` | ~70 | 1 | Karta przelewu |
| `FixedExpenses` | `dashboard/FixedExpenses.tsx` | ~150 | 1 | Lista wydatków stałych |
| `EnvelopeTiles` | `dashboard/EnvelopeTiles.tsx` | ~100 | 1 | Kafelki kopert |
| `ImpulseCounter` | `dashboard/ImpulseCounter.tsx` | ~80 | 1 | Suma impulsów |
| `RecentTransactions` | `dashboard/RecentTransactions.tsx` | 150 | 1 | 5 ostatnich transakcji |
| `EnvelopeCard` | `envelopes/EnvelopeCard.tsx` | 190 | 1 | Karta koperty |
| `EnvelopeHistory` | `envelopes/EnvelopeHistory.tsx` | ~120 | 1 | Historia koperty |
| `PeriodTab` | `stats/PeriodTab.tsx` | 233 | 1 | Statystyki okresu |
| `TrendsTab` | `stats/TrendsTab.tsx` | 274 | 1 | Wykresy trendów (Recharts) |
| `CategoriesTab` | `stats/CategoriesTab.tsx` | 270 | 1 | Ranking kategorii |

### Obserwacje
- **100% komponentów to `"use client"`** — zero Server Components. Layout też jest serwerowy, ale jedynym dzieckiem jest `{children}`.
- **`AuthProvider`** istnieje ale nie jest nigdzie importowany — martwy kod.
- **`page.tsx` = 861 linii** — god component z 15 stanami sheet'ów, 20+ handlerami, 4 widokami render. Masywny klient-side bundle.
- Brak jakiejkolwiek biblioteki prymitywów (`Button`, `Input`, `Card`) — każdy komponent buduje swoje przyciski, inputy, karty od zera, powtarzając klasy Tailwinda.

---

## 3. Tailwind — tokeny i wartości arbitralne

### Tokeny `@theme` (globals.css)
9 kolorów: `ink`, `panel`, `panel-2`, `line`, `text`, `muted`, `brass`, `good`, `bad`.
3 fonty: `display` (Fraunces), `ui` (Inter Tight), `mono` (Geist Mono).

**Brak tokenów:** spacing, radii, shadows, breakpoints, font-sizes.

### Wartości arbitralne — podsumowanie

| Typ | Unikalne wartości | Łączne wystąpienia |
|---|---|---|
| `text-[Xpx]` | 16 rozmiarów | **293 wystąpień** |
| `w-[X]` | 10 wartości | 25 |
| `h-[X]` | 15 wartości | 35 |

**16 różnych rozmiarów tekstu arbitralnego** zamiast skali typograficznej. Najczęstsze: `text-[13px]` (83×), `text-[14px]` (64×), `text-[12px]` (62×). Brak jakiejkolwiek semantycznej nazwy — nie wiadomo co jest „body", co „caption", co „label".

### Powtarzające się klasy
Łańcuch `"w-full rounded-lg border border-line bg-panel-2 px-3 py-2.5 text-[14px] text-text placeholder:text-muted/40 focus:border-brass/40 focus:outline-none"` powtarza się w **20+ miejscach** — wszędzie tam, gdzie jest input.

### Hardcoded kolory
- `stats/PeriodTab.tsx:29-38` — 10 hex'ów wypisanych wprost w tablicy kolorów wykresu
- `print/[periodId]/page.tsx` — `#1a1a1a`, `color: white`, klasy `text-gray-*` (Tailwind default, nie tokeny projektu)

---

## 4. Nawigacja

### Przepływ użytkownika
1. Otwiera PWA → `page.tsx` → guard auth → redirect `/login` jeśli niezalogowany
2. Po logowaniu → `page.tsx` → guard onboarding → redirect `/onboarding` jeśli brak `settings`
3. Dashboard (`activeNav="dashboard"`) jest domyślny
4. Przełączanie widoków: **BottomNav** (mobilny, `md:hidden`) lub **desktop top nav** (dodany ostatnio, `hidden md:block`)
5. Ustawienia: ikona zębatki w `PeriodHeader` → `/settings` (osobna trasa)
6. „Zobacz wszystkie" w RecentTransactions → przełącza na `activeNav="expenses"`

### Kliknięcia do dodania transakcji
- Dashboard: **1 klik** (FAB „+")
- Wydatki/Koperty/Statystyki: **1 klik** (FAB nadal widoczny)

### Problemy nawigacyjne
- Wszystko na jednej stronie (`page.tsx`) — brak URL-ów dla widoków Wydatki/Koperty/Statystyki. Nie da się linkować, udostępnić, otworzyć w nowej karcie, cofnąć przyciskiem wstecz przeglądarki.
- Desktop top nav jest duplikacją BottomNav — ten sam stan, ale osobny JSX.
- Brak breadcrumbs, brak wizualnego kontekstu „gdzie jestem" poza podświetlonym elementem nav.

---

## 5. Stany interfejsu

| Stan | Obsługa | Ocena |
|---|---|---|
| **Ładowanie** | Tekst „Ładowanie…" z `animate-pulse` — identyczny na `page.tsx`, `settings`, `print`. Brak skeletonów odzwierciedlających docelowy układ. | ❌ Przeskok layoutu po wczytaniu |
| **Pusto (brak transakcji)** | Tekst „Brak transakcji w tym okresie." + podpowiedź „Dodaj pierwszą za pomocą przycisku +" w `RecentTransactions`. `ExpensesList` ma tylko tekst. | ⚠️ Brak CTA-buttona |
| **Pusto (brak okresów)** | Komunikat + przycisk „Rozpocznij okres" | ✅ OK |
| **Błąd** | **Brak obsługi.** Nie ma `error.tsx`, nie ma try/catch w komponentach, nie ma granicy błędów. | ❌ Krytyczne |
| **Offline** | `OnlineIndicator` — kropka w rogu ekranu. Brak komunikatu co jest ograniczone. | ⚠️ Minimalna |
| **PIN lock** | Pełnoekranowa klawiatura numeryczna. | ✅ OK |

---

## 6. Formatowanie kwot

### Centralne funkcje (`domain/money.ts`)
- `formatPLN(grosze)` → `"1 234,56 zł"` (Intl.NumberFormat)
- `formatAmount(grosze)` → `"1 234,56"` (bez waluty)
- `parsePLN(input)` → grosze
- `terminalInputToGrosze(input)` → grosze

### Niespójności — manualne formatowanie w 10 miejscach
6 komponentów robi własne `(value / 100).toFixed(2).replace(".", ",")` zamiast centralnej funkcji:
- `EditFixedExpenseSheet.tsx:21`
- `ClosePeriodWizard.tsx:73`
- `DistributeFundsSheet.tsx:46, 73, 100`
- `EnvelopeTransferSheet.tsx:45`
- `CategoriesTab.tsx:136` (tick formatter)
- `TrendsTab.tsx:119-121` (tick formatter)

To narusza format przy wartościach ≥ 1000 (brak separatora tysięcy) i wyklucza lokalizację.

---

## 7. Lista problemów

### P0 — Blokuje / psuje podstawowe użycie na telefonie

| # | Plik:linia | Problem | Wpływ na użytkownika |
|---|---|---|---|
| 1 | `app/page.tsx` (cały) | God component 861 linii, 15 stanów sheet'ów, 20+ handlerów, 4 widoków — cały klient-side bundle ładowany przy starcie | Wolne ładowanie, duży JS parse na słabszych telefonach |
| 2 | `app/page.tsx` | Brak URL-ów dla widoków — przycisk „wstecz" wychodzi z aplikacji zamiast wrócić do pulpitu | Użytkownik traci kontekst, frustracja |
| 3 | — | Brak `error.tsx` / `ErrorBoundary` na żadnym poziomie | Biały ekran przy błędzie Runtime — użytkownik traci dostęp do danych |
| 4 | `globals.css` | Brak `-webkit-tap-highlight-color: transparent`, brak `overscroll-behavior`, brak `touch-action` — nie czuje się jak natywna aplikacja | Niebieskie flashe przy dotknięciu, pull-to-refresh odświeża stronę |
| 5 | `components/ExpenseSheet.tsx:208` | Kategorie w gridzie 4×N: `min-h-[64px]` — ale na 360px to 4 kolumny × ~82px + gaps = ledwo mieści się, a tekst `text-[10px]` jest nieczytelny | Trudno trafić w kategorię, nie widać nazwy |

### P1 — Wyraźnie pogarsza doświadczenie

| # | Plik:linia | Problem | Wpływ na użytkownika |
|---|---|---|---|
| 6 | 20+ plików | Brak biblioteki prymitywów — inputy, buttony, karty budowane inline, łańcuchy 100+ znaków klas | Niespójny wygląd: różne paddingi, radii, rozmiary tekstu między formularzami |
| 7 | 20+ plików | **293 arbitralne rozmiary tekstu** (`text-[13px]` itd.) bez skali typograficznej | Brak hierarchii — użytkownik nie wie co jest ważniejsze |
| 8 | 6 plików | Manualne `(v / 100).toFixed(2)` zamiast `formatAmount` | Kwoty ≥1000 zł bez separatora tysięcy (np. „1234,56" zamiast „1 234,56") w formularzach |
| 9 | wszystkie inputy | `focus:outline-none` bez `focus-visible:ring` — usunięty natywny focus bez zamiennika dostępnego z klawiatury | Niewidoczny focus — niedostępne z klawiatury |
| 10 | `components/BottomNav.tsx:67` | Label `text-[10px]` — 10px jest poniżej minimum czytelności | Etykiety nawigacji nieczytelne w ruchu |
| 11 | — | Brak skeletonów — ładowanie to jednolinijkowy „Ładowanie…" na pustym ekranie | Przeskok layoutu po załadowaniu danych, użytkownik nie wie czego się spodziewać |
| 12 | `stats/PeriodTab.tsx:29-38` | 10 hardcoded hex'ów kolorów wykresu, nie z tokenów | Kolory wykresów nie reagują na zmianę motywu |
| 13 | `app/settings/page.tsx:206` | Dzień wypłaty: `type="number"` zamiast `inputMode="numeric"` | Na iOS otwiera spinner zamiast klawiatury numerycznej |
| 14 | `components/AuthProvider.tsx` | Martwy komponent — importowany nigdzie | Zbędny kod w repo |
| 15 | `app/print/[periodId]/page.tsx` | Używa klas `text-gray-*` (Tailwind default) zamiast tokenów projektu | Rozjazd z resztą projektu, brak dark mode na wydruku |
| 16 | `components/ExpenseSheet.tsx:198` | Grid kategorii: `grid-cols-4 gap-2` — na 360px kafelki ~78px, tekst `text-[10px]`, ale emoji `text-[22px]` — proporcje złe | Na małych ekranach tekst jest obcięty, emoji dominuje |
| 17 | `components/dashboard/EnvelopeTiles.tsx` | Horizontal scroll kafelków kopert — brak wizualnego wskaźnika, że można scrollować | Użytkownik nie wie, że są kolejne koperty |
| 18 | 8 plików | Tylko 8 atrybutów `aria-*` w całej aplikacji. Brak `role`, brak `aria-live` dla toastów, brak etykiet na większości przycisków | Aplikacja niedostępna dla screen readerów |

### P2 — Kosmetyka

| # | Plik:linia | Problem | Wpływ na użytkownika |
|---|---|---|---|
| 19 | `app/layout.tsx:40` | `maximumScale: 1` — blokuje zoom na całej stronie | Niedostępne dla słabowidzących |
| 20 | `components/ExpenseSheet.tsx:155` | Sheet `max-w-[430px]` z `mx-auto` — na tablecie wąska kolumna pośrodku | Niewykorzystana przestrzeń |
| 21 | `stats/TrendsTab.tsx` | Recharts (9.3 MB w node_modules) — ciężka zależność na wykresy widoczne rzadko | Wpływ na rozmiar bundle'a |
| 22 | `components/envelopes/EnvelopeCard.tsx` | Fill level animacja `transition: height 600ms` — bez `will-change`, potencjalnie jank na słabszym hardware | Drobne |
| 23 | `app/layout.tsx:42` | Jeden `themeColor` (#0E1214) — brak wariantu jasnego | Status bar zawsze ciemny |
| 24 | `app/settings/page.tsx` | 814 linii — za duży, 3 lokalnych helper components (`Section`, `Row`, `EditableDefRow`, `EditableEnvelopeRow`) | Trudny w utrzymaniu |
| 25 | `components/dashboard/FixedExpenses.tsx:89` | Checkbox input bez widocznej etykiety, tylko `aria-label` | Klikanie w mały checkbox trudne na telefonie |

---

## 8. Podsumowanie

### Co działa dobrze
- Model domenowy w `src/domain/` jest czysty i dobrze przetestowany (110 testów)
- Centralne formatowanie kwot istnieje (`money.ts`), choć nie jest wszędzie używane
- Tokeny kolorów i fontów w `@theme` — dobra baza do rozbudowy
- Safe area padding (`safe-top`, `safe-bottom`) zdefiniowany
- `tabular-nums` stosowany na większości kwot
- Fonty dobrane dobrze: Fraunces na kwotach, Inter Tight na UI, Geist Mono na liczbach
- PWA manifest, service worker, ikony — jest fundament

### Co wymaga przebudowy
1. **Architektura `page.tsx`** — god component do rozbicia na trasy lub przynajmniej na wydzielone widoki
2. **Biblioteka prymitywów** — nie istnieje, każdy formularz jest od zera
3. **Skala typograficzna** — 16 arbitralnych rozmiarów do zastąpienia 6–8 tokenami
4. **Stany interfejsu** — brak skeleton, error boundary, sensownych empty states z CTA
5. **Dostępność** — prawie żadna: brak focus-visible, brak ARIA, brak keyboard nav
6. **Natywność PWA** — brak tap highlight suppression, overscroll, touch-action
7. **Formatowanie** — 10 miejsc z manualnym formatowaniem kwot do naprawienia
8. **Ciężkość** — Recharts jako dependency na wykresy, cały app w jednym bundle
