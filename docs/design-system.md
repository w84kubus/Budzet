# Budżet — System projektowy

> „Cichy panel kontrolny" — ciemny, gęsty, techniczny. Spokój i powaga, nie ekscytacja.
> Narzędzie otwierane kilka razy dziennie na kilkanaście sekund, jedną ręką, przy złym świetle.

---

## 1. Kolor

### Baza (6 wartości)

| Token          | Hex       | Rola                                               |
| -------------- | --------- | -------------------------------------------------- |
| `ink`          | `#0E1214` | Tło aplikacji — najciemniejszy punkt               |
| `panel`        | `#161B1E` | Karty, kontenery                                   |
| `panel-2`      | `#1E2529` | Elementy wewnątrz kart, pola formularzy, hover     |
| `line`         | `#2A3338` | Obramowania, separatory — zawsze 1 px              |
| `text`         | `#ECE7DF` | Tekst główny — ciepła kość, nie biały              |
| `muted`        | `#8A979E` | Etykiety, opisy, tekst drugorzędny                 |

### Akcenty (3 wartości)

| Token   | Hex       | Rola                                                              |
| ------- | --------- | ----------------------------------------------------------------- |
| `brass` | `#D9A441` | Kwoty kluczowe, aktywne stany nawigacji. **Maks. 1 na ekran.**    |
| `good`  | `#6FBF8B` | Oszczędności, saldo dodatnie, przychód                            |
| `bad`   | `#E0645A` | Przekroczenie, saldo ujemne, usunięcie                            |

### Tokeny semantyczne domenowe

| Token              | Mapowanie          | Użycie                                           |
| ------------------ | ------------------ | ------------------------------------------------ |
| `income`           | `good`             | Przychód, saldo pozytywne                        |
| `expense`          | `text`             | Wydatek (neutralny — to normalność, nie alarm)   |
| `envelope-ok`      | `good`             | Koperta w normie (< 75% wykorzystania)           |
| `envelope-warn`    | `brass`            | Koperta blisko limitu (75–100%)                  |
| `envelope-over`    | `bad`              | Koperta przekroczona (> 100%)                    |
| `unassigned`       | `brass`            | Środki nieprzypisane — wymagają uwagi            |
| `planned`          | `muted`            | Kwota planowana (szarość)                         |
| `actual`           | `text`             | Kwota rzeczywista (pełna widoczność)             |

### Stanowe warianty interfejsu

| Klasa / zastosowanie | Wartość           |
| -------------------- | ----------------- |
| Hover na karcie      | `panel-2`         |
| Aktywny / pressed    | `panel-2` + `border-brass` |
| Disabled tekst       | `muted` z `opacity: 0.5` |
| Focus ring           | `brass` z `ring-2 ring-offset-2 ring-offset-ink` |
| Destructive action   | `bad` jako tło/border z `text` jako tekst |

### Reguła jedynego mosiądzu

Brass pojawia się **dokładnie raz** na ekran jako element wyróżniony:
- Pulpit: kwota wolnych środków
- Koperty: brak (mosiądz w `envelope-warn`)
- Formularz: przycisk zapisu
- Nawigacja: aktywna zakładka

### Rozpoznawalność bez koloru

Każdy stan budżetowy jest rozpoznawalny również bez koloru:
- Przychód: ikona ↓ + znak „+"
- Wydatek: ikona ↑ + znak „−"
- Koperta w normie: wypełnienie niskie + etykieta tekstowa
- Koperta przekroczona: wypełnienie przełamane + ikona ⚠ + etykieta „Przekroczono"
- Impuls: ikona ⚡ + etykieta „impulsywny"

### Kontrast

Wszystkie pary spełniają WCAG AA:

| Para                    | Kontrast | Wymagany |
| ----------------------- | -------- | -------- |
| `text` na `ink`         | 13.2:1   | 4.5:1 ✓ |
| `text` na `panel`       | 11.5:1   | 4.5:1 ✓ |
| `muted` na `ink`        | 5.4:1    | 4.5:1 ✓ |
| `muted` na `panel`      | 4.7:1    | 4.5:1 ✓ |
| `brass` na `ink`        | 7.0:1    | 3.0:1 ✓ |
| `brass` na `panel`      | 6.1:1    | 3.0:1 ✓ |
| `good` na `ink`         | 7.2:1    | 3.0:1 ✓ |
| `bad` na `ink`          | 4.8:1    | 3.0:1 ✓ |

---

## 2. Typografia

### Rodziny fontów

| Rola     | Font          | Styl               | Użycie                                     |
| -------- | ------------- | ------------------- | ------------------------------------------ |
| Display  | Fraunces      | Variable, opsz axis | Kwoty główne, nagłówki okresu               |
| UI       | Inter Tight   | 400 / 500 / 600     | Interfejs, przyciski, listy, opisy          |
| Mono     | Geist Mono    | 400 / 500           | Kwoty w listach i tabelach                  |

### Skala typograficzna

| Token     | Rozmiar  | Line-height | Waga    | Font    | Zastosowanie                          |
| --------- | -------- | ----------- | ------- | ------- | ------------------------------------- |
| `hero`    | 56px     | 1.0         | 600     | Display | Kwota wolnych środków na pulpicie     |
| `display` | 32px     | 1.15        | 500–600 | Display | Nagłówek okresu, podsumowania         |
| `title`   | 22px     | 1.25        | 600     | UI      | Tytuły sekcji, nazwy kart             |
| `body-lg` | 17px     | 1.4         | 400–500 | UI      | Ważny tekst, kwoty w kartach          |
| `body`    | 15px     | 1.5         | 400     | UI      | Domyślny tekst interfejsu             |
| `sm`      | 14px     | 1.4         | 400–500 | UI      | Kompaktowe elementy listy             |
| `caption` | 13px     | 1.4         | 500–600 | UI      | Etykiety, nagłówki sekcji, overline   |
| `micro`   | 12px     | 1.35        | 400–500 | UI      | Znaczniki, znacznik czasu, metadane   |

### Reguły kwot

```css
/* Każda wyświetlona kwota: */
font-variant-numeric: tabular-nums;
font-feature-settings: "tnum" 1;

/* Kwota-bohater (pulpit): */
font-family: var(--font-display);
font-size: var(--font-size-hero);  /* 56px */
letter-spacing: -0.02em;
font-weight: 600;

/* Kwoty w listach: */
font-family: var(--font-mono);
font-size: var(--font-size-sm);    /* 14px */
font-weight: 500;
```

### Hierarchia na ekranie

Kwota jest bohaterem — etykieta jej służy:
```
  1 247 zł     ← duża, mosiądz, Fraunces
  Wolne środki  ← mała, muted, Inter Tight

  NIE:
  Wolne środki  ← duża
  1 247 zł      ← mała
```

### Eliminacja arbitralnych rozmiarów

Migracja z obecnych wartości:

| Obecna       | Nowy token   | Uzasadnienie                        |
| ------------ | ------------ | ----------------------------------- |
| `text-[56px]`| `text-hero`  | 1:1                                 |
| `text-[40px]`| `text-display` | Zbliżone, nie ma w skali          |
| `text-[32px]`| `text-display` | 1:1                               |
| `text-[28px]`| `text-title`  | Zbliżone do 22, zaokrąglone w dół |
| `text-[24px]`| `text-title`  | j.w.                               |
| `text-[22px]`| `text-title`  | 1:1                                |
| `text-[20px]`| `text-body-lg` | Zbliżone do 17, zaokrąglone w dół |
| `text-[18px]`| `text-body-lg` | j.w.                              |
| `text-[17px]`| `text-body-lg` | 1:1                               |
| `text-[16px]`| `text-body`   | Zbliżone do 15                     |
| `text-[15px]`| `text-body`   | 1:1                                |
| `text-[14px]`| `text-sm`     | 1:1                                |
| `text-[13px]`| `text-caption` | 1:1                               |
| `text-[12px]`| `text-micro`  | 1:1                                |
| `text-[11px]`| `text-micro`  | Za mały, podnieś do 12             |
| `text-[10px]`| `text-micro`  | Za mały, podnieś do 12             |

---

## 3. Przestrzeń i kształt

### Skala odstępów

Baza: 4px. Używaj wyłącznie standardowej skali Tailwinda.

| Token Tailwind | Wartość | Użycie typowe                          |
| -------------- | ------- | -------------------------------------- |
| `1`            | 4px     | Micro-gap, separator w wierszu         |
| `1.5`          | 6px     | Padding wewnętrzny badge               |
| `2`            | 8px     | Gap między elementami w wierszu        |
| `3`            | 12px    | Padding karty wewnętrzny, gap listy    |
| `4`            | 16px    | Padding sekcji, margines między kartami|
| `5`            | 20px    | Margines między sekcjami               |
| `6`            | 24px    | Padding strony (boczny)                |
| `8`            | 32px    | Duży margines sekcyjny                 |

### Padding strony

```
Mobile:  px-4 (16px po bokach)
Desktop: px-8 (32px po bokach)
Max-width: 960px (max-w-[960px] mx-auto)
```

### Promienie zaokrągleń

| Element                  | Token Tailwind | Wartość |
| ------------------------ | -------------- | ------- |
| Karty, panele            | `rounded-xl`   | 12px    |
| Przyciski, inputy, badge | `rounded-lg`   | 8px     |
| Małe elementy, progress  | `rounded-md`   | 6px     |
| Pełne zaokrąglenie       | `rounded-full` | 9999px  |

### Cele dotykowe

```
Minimum: 44×44px (min-h-11 min-w-11)
Przyciski: min-h-11 (44px), padding px-4
Wiersze listy: min-h-12 (48px)
Ikony w nawigacji: p-2.5 (target 44px z ikoną 24px)
```

### Siatka

- Mobilna: 1 kolumna, pełna szerokość
- Tablet (md: 768px): 2 kolumny dla kart kopert
- Desktop (lg: 1024px): max-w-[960px], opcjonalny sidebar

---

## 4. Głębia

Podejście: **obramowania, nie cienie.** Ciemny motyw — cienie są niewidoczne. Głębię budujemy jasnością tła.

### Warstwy (od najniższej)

| Warstwa           | Tło       | Obramowanie   | z-index |
| ----------------- | --------- | ------------- | ------- |
| Tło aplikacji     | `ink`     | —             | 0       |
| Karta / panel     | `panel`   | brak lub `line` | 0     |
| Element w karcie  | `panel-2` | `line`        | 0       |
| Nawigacja dolna   | `panel`   | `line` (top)  | 40      |
| Nawigacja górna   | `panel`   | `line` (bottom) | 40    |
| Arkusz (sheet)    | `panel`   | `line` (top)  | 50      |
| Backdrop arkusza  | `ink/60`  | —             | 49      |
| Modal / dialog    | `panel`   | `line`        | 50      |
| Toast             | `panel-2` | `line`        | 60      |

### Reguły

- Cień wyłącznie na elemencie FAB (jeśli istnieje): `shadow-lg shadow-ink/50`
- Obramowania zawsze 1px: `border border-line`
- Tło karty **bez** obramowania, gdy jest na `ink` — kontrast tła wystarcza
- Tło karty **z** obramowaniem, gdy jest na `panel` (np. pole w karcie)

---

## 5. Ruch

### Trzy przypadki

| Przypadek              | Czas     | Krzywa                                      |
| ---------------------- | -------- | -------------------------------------------- |
| Przejście między ekranami | 0ms   | Natychmiastowe (zmiana stanu, nie animacja)   |
| Pojawienie arkusza     | 300ms    | `cubic-bezier(0.16, 1, 0.3, 1)` (ease-out expo) |
| Potwierdzenie zapisu   | 200ms    | `ease-out`                                   |

### Animacje konkretne

```css
/* Arkusz od dołu */
animation: slide-up 300ms cubic-bezier(0.16, 1, 0.3, 1);

/* Fade tła arkusza */
animation: fade-in 200ms ease-out;

/* Poziom w kopercie */
transition: height 600ms cubic-bezier(0.16, 1, 0.3, 1);

/* Count-up kwoty na pulpicie */
animation: amount-fade 400ms ease-out; /* tylko tekst, nie licznik */
```

### Reguły

- `prefers-reduced-motion: reduce` — wyłącz **wszystkie** animacje
- Żadnych animacji wejścia elementów listy
- Żadnych animacji przy scrollowaniu
- Toast wchodzi i wychodzi bez animacji (pojawia się, znika po timeout)

---

## 6. Tryb ciemny

**Ciemny jest domyślny i jedyny.** Aplikacja finansowa otwierana wieczorem — jasny motyw nie jest planowany w MVP.

Jeśli w przyszłości dodamy jasny motyw:
- `ink` → `#F5F3EF` (ciepła biel)
- `panel` → `#FFFFFF`
- `panel-2` → `#F0EDE8`
- `line` → `#D8D3CC`
- `text` → `#1A1D1F`
- `muted` → `#6B7680`
- Akcenty (`brass`, `good`, `bad`) — te same wartości, sprawdź kontrast

---

## 7. Sygnatura — Koperta z poziomem wypełnienia

Jedyne miejsce w aplikacji z wyrazistością wizualną.

### Specyfikacja

```
┌─────────────────────┐
│  🛒 Zakupy          │   ← emoji + nazwa, text-caption, text
│  327 / 600 zł       │   ← kwota, font-mono, tabular-nums
│                     │
│  ▓▓▓▓▓▓▓▓▓▓▓       │   ← menisk (1px linia brass/good)
│  █████████████████  │   ← wypełnienie (flat color, good/warn/bad)
│  █████████████████  │   ← od dołu w górę, height = % wykorzystania
└─────────────────────┘

Stan: OK        → wypełnienie good, menisk good
Stan: Uwaga     → wypełnienie brass, menisk brass  (75–100%)
Stan: Przekr.   → wypełnienie bad, menisk bad, +1px red pod kafelkiem
```

### Implementacja CSS

```css
.envelope-tile {
  position: relative;
  overflow: hidden;
  border-radius: var(--radius-xl);         /* rounded-xl */
  background: var(--color-panel);
}

.envelope-fill {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  /* height: calc(clamp(0%, var(--fill), 100%)); — ustawiane inline */
  transition: height 600ms cubic-bezier(0.16, 1, 0.3, 1);
}

.envelope-fill::before {
  /* Menisk — 1px linia na górze wypełnienia */
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: currentColor;
  opacity: 0.6;
}

/* Stany */
.envelope-fill[data-state="ok"]   { background: var(--color-good); opacity: 0.15; color: var(--color-good); }
.envelope-fill[data-state="warn"] { background: var(--color-brass); opacity: 0.2; color: var(--color-brass); }
.envelope-fill[data-state="over"] { background: var(--color-bad); opacity: 0.2; color: var(--color-bad); }

/* Przekroczenie — czerwona kreska pod kafelkiem */
.envelope-tile[data-state="over"]::after {
  content: "";
  position: absolute;
  bottom: 0;
  left: 8px;
  right: 8px;
  height: 2px;
  background: var(--color-bad);
  border-radius: 1px;
}
```

### Reguły

- Wypełnienie zawsze flat — żadnych gradientów
- Menisk to jednopiksowa linia, nie efekt świetlny
- Przy zerowym saldzie kafelek jest pusty (brak wypełnienia)
- Przy przekroczeniu: wypełnienie na 100% + red stripe pod spodem
- Na liście kopert: kafelki 140×100px, scroll horyzontalny na mobile
- Na stronie kopert: kafelki pełnej szerokości, wyższe

---

## 8. Komponenty — Konwencje

### Warianty (wzorzec CVA)

```typescript
// Każdy komponent ma warianty przez cva lub ręczny switch:
const buttonVariants = {
  primary:     "bg-brass text-ink font-medium",
  secondary:   "bg-panel-2 text-text border border-line",
  ghost:       "text-muted hover:text-text hover:bg-panel-2",
  destructive: "bg-bad/10 text-bad border border-bad/20",
};
```

### Konwencje nazewnicze

```
components/ui/          — prymitywy (Button, Input, Sheet, Card...)
components/dashboard/   — widgety pulpitu
components/envelopes/   — widgety kopert
components/transactions/ — formularz, lista, wiersz transakcji
components/stats/       — wykresy, podsumowania
components/settings/    — sekcje ustawień
components/layout/      — nawigacja, shell
```

### Dostępność

- Każdy interaktywny element: `focus-visible:ring-2 focus-visible:ring-brass focus-visible:ring-offset-2 focus-visible:ring-offset-ink`
- Pola formularza: powiązane z `<label>` przez `htmlFor`/`id`
- Ikony dekoracyjne: `aria-hidden="true"`
- Ikony funkcjonalne: `aria-label` z opisem akcji
- Arkusze: `role="dialog"`, `aria-modal="true"`, `aria-labelledby`
- Listy: semantyczne `<ul>`/`<li>` tam gdzie logicznie lista
- Kwoty: `aria-label` z pełnym opisem („1 247 złotych 50 groszy")

---

## 9. Formatowanie

### Jedno źródło prawdy

Plik: `src/domain/money.ts` — `formatPLN(grosze: number): string`

```
Wejście: 124750 (grosze)
Wyjście: "1 247,50 zł"

Separator tysięcy: spacja (` `)
Separator dziesiętny: przecinek (`,`)
Waluta: „zł" po liczbie, po spacji
```

Żadne inne miejsce w kodzie nie formatuje kwot. Każdy `(v/100).toFixed(2).replace(".",",")` musi zostać zastąpiony przez `formatPLN()`.

### Daty

```
Format krótki: "14 sie" (dzień + 3-literowy miesiąc)
Format pełny: "14 sierpnia 2026"
Względny: "dziś", "wczoraj", "2 dni temu" (do 7 dni)
```

### Liczba mnoga po polsku

```
1 dzień, 2 dni, 5 dni
1 transakcja, 2 transakcje, 5 transakcji
1 koperta, 2 koperty, 5 kopert
```

Reguła: `n === 1` → mianownik, `n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)` → forma 2–4, reszta → dopełniacz l. mn.

---

## 10. Tokeny CSS — pełna definicja

```css
@theme {
  /* ── Kolory bazowe ─────────────────────────────── */
  --color-ink:      #0E1214;
  --color-panel:    #161B1E;
  --color-panel-2:  #1E2529;
  --color-line:     #2A3338;
  --color-text:     #ECE7DF;
  --color-muted:    #8A979E;
  --color-brass:    #D9A441;
  --color-good:     #6FBF8B;
  --color-bad:      #E0645A;

  /* ── Kolory semantyczne domenowe ───────────────── */
  --color-income:        #6FBF8B;
  --color-expense:       #ECE7DF;
  --color-envelope-ok:   #6FBF8B;
  --color-envelope-warn: #D9A441;
  --color-envelope-over: #E0645A;
  --color-unassigned:    #D9A441;

  /* ── Typografia — rodziny ──────────────────────── */
  --font-display: var(--font-fraunces), "Fraunces", serif;
  --font-ui:      var(--font-inter-tight), "Inter Tight", sans-serif;
  --font-mono:    var(--font-geist-mono), "Geist Mono", monospace;

  /* ── Typografia — skala rozmiarów ──────────────── */
  --font-size-hero:    3.5rem;      /* 56px */
  --font-size-hero--line-height: 1;

  --font-size-display: 2rem;        /* 32px */
  --font-size-display--line-height: 1.15;

  --font-size-title:   1.375rem;    /* 22px */
  --font-size-title--line-height: 1.25;

  --font-size-body-lg: 1.0625rem;   /* 17px */
  --font-size-body-lg--line-height: 1.4;

  --font-size-body:    0.9375rem;   /* 15px */
  --font-size-body--line-height: 1.5;

  --font-size-sm:      0.875rem;    /* 14px */
  --font-size-sm--line-height: 1.4;

  --font-size-caption: 0.8125rem;   /* 13px */
  --font-size-caption--line-height: 1.4;

  --font-size-micro:   0.75rem;     /* 12px */
  --font-size-micro--line-height: 1.35;
}
```

---

## 11. Checklist wdrożenia

- [ ] Zaktualizować `@theme` w `globals.css`
- [ ] Zastąpić wszystkie `text-[Npx]` tokenami ze skali
- [ ] Zastąpić manualne formatowanie kwot wywołaniami `formatPLN()`
- [ ] Dodać `focus-visible` ring na wszystkie interaktywne elementy
- [ ] Dodać `min-h-11` na cele dotykowe
- [ ] Komponent `EnvelopeTile` z wypełnieniem jako sygnatura
- [ ] Usunąć kolory wpisane inline (hex w className)
- [ ] Ujednolicić promienie: karty=xl, przyciski=lg, małe=md
- [ ] Sprawdzić kontrast wszystkich par tekst/tło
- [ ] Dodać `env(safe-area-inset-*)` na dolną nawigację
