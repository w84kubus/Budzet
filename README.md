<p align="center">
  <img src="public/icon-512.svg" width="96" height="96" alt="Budżet logo" />
</p>

<h1 align="center">Budżet</h1>

<p align="center">
  Osobisty budżet kopertowy — PWA do kontroli wydatków i oszczędzania.
  <br />
  <a href="https://budzet-rust.vercel.app"><strong>🔗 budzet-rust.vercel.app</strong></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-15-black?logo=next.js" alt="Next.js 15" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white" alt="TypeScript strict" />
  <img src="https://img.shields.io/badge/Firebase-Firestore+Auth-FFCA28?logo=firebase&logoColor=black" alt="Firebase" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?logo=tailwindcss&logoColor=white" alt="Tailwind v4" />
  <img src="https://img.shields.io/badge/PWA-instalowalna-5A0FC8?logo=pwa&logoColor=white" alt="PWA" />
</p>

---

## O aplikacji

**Budżet** to aplikacja webowa (PWA) do zarządzania budżetem osobistym, inspirowana [systemem budżetowania kopertowego](https://pl.wikipedia.org/wiki/Metoda_kopertowa). Odpowiada na cztery pytania natychmiast po otwarciu:

1. 💰 **Ile mam wolnych środków** do najbliższej wypłaty?
2. 📊 **Ile mogę dziś wydać**, żeby wyjść na swoje?
3. 💎 **Ile mam odłożone** i na co konkretnie?
4. ⚡ **Ile w tym miesiącu** poszło na impulsy?

Wszystko wpisywane ręcznie, w czasie rzeczywistym — bez integracji z bankiem, bo to jest celowe. Świadome wpisywanie wydatku w sklepie zmienia nawyki skuteczniej niż automatyczny import.

## Funkcje

### Pulpit
- **Główny wskaźnik** — wolne środki + dzienny limit wydatków
- **Zobowiązania stałe** — checklist miesięcznych rachunków z oznaczaniem jako opłacone
- **Wydatki jednorazowe** — szybkie dodawanie z 15 kategoriami i auto-detekcją
- **Koperty oszczędnościowe** — wizualne kafelki z poziomem napełnienia

### Zarządzanie finansami
- **System okresów** — od wypłaty do wypłaty (nie miesiąc kalendarzowy)
- **Rozdysponowanie środków** — proporcjonalny podział reszty na koperty
- **Termin końca spłaty** — opcjonalny end date dla kredytów i rat
- **Impulsy** — oznaczanie wydatków impulsywnych i śledzenie ich sumy

### Statystyki
- **Podsumowanie okresu** — przychód, wydatki, stopa oszczędności
- **Kategorie** — ranking wydatków z wykresem kołowym
- **Trendy** — porównanie między okresami (wykresy Recharts)
- **Plan vs. rzeczywistość** — wydatki stałe: planowane vs. zapłacone

### Bezpieczeństwo i wygoda
- **PIN lock** — blokada aplikacji (4-cyfrowy PIN, klawiatura fizyczna + ekranowa)
- **Offline mode** — Firestore persistent cache + Service Worker
- **Instalacja PWA** — pełny ekran na telefonie, skróty do dodawania wydatków

## Stack technologiczny

| Warstwa | Technologia |
|---|---|
| Framework | Next.js 15 (App Router) |
| UI | React 19, Tailwind CSS v4 |
| Język | TypeScript (strict, zero `any`) |
| Baza danych | Cloud Firestore (offline persistence) |
| Autoryzacja | Firebase Auth (email + hasło) |
| Stan klienta | Zustand |
| Wykresy | Recharts |
| Walidacja | Zod |
| Testy | Vitest (110 testów) |
| PWA | Serwist (Service Worker) |
| Deploy | Vercel (auto-deploy z GitHub) |
| Czcionki | Fraunces (kwoty), Inter Tight (UI), Geist Mono (tabele) |

## Architektura

```
src/
├── app/                  # Next.js App Router — strony i layout
│   ├── layout.tsx        # root layout, fonty, AuthGuard
│   ├── page.tsx          # pulpit (dashboard)
│   ├── expenses/         # lista wydatków z filtrami
│   ├── envelopes/        # widok kopert
│   ├── stats/            # statystyki (zakładki)
│   ├── settings/         # ustawienia konta
│   ├── onboarding/       # kreator pierwszej konfiguracji
│   └── login/            # logowanie, rejestracja, reset hasła
│
├── domain/               # 💡 Czysta logika finansowa (zero Reacta)
│   ├── types.ts          # typy domenowe (Period, Transaction, Envelope…)
│   ├── schemas.ts        # schematy Zod do walidacji danych z Firestore
│   ├── money.ts          # formatPLN, parsePLN, terminalInputToGrosze
│   ├── calculations.ts   # salda, wolne środki, dzienny limit
│   ├── operations.ts     # closePeriod, distributeFunds
│   ├── statistics.ts     # podsumowania, trendy, kategorie
│   ├── constants.ts      # 15 kategorii wydatków z auto-detekcją
│   └── defaults.ts       # domyślne wydatki stałe i koperty
│
├── components/           # komponenty React
│   ├── dashboard/        # sekcje pulpitu
│   ├── stats/            # zakładki statystyk
│   ├── views/            # widoki stron (DashboardView, StatsView…)
│   └── ui/               # bazowe komponenty UI (Button, Sheet…)
│
└── lib/                  # infrastruktura
    ├── firebase/         # config, auth, db (Firestore CRUD)
    ├── contexts/         # sheet-context (globalne bottom sheets)
    └── store/            # Zustand store (aktywny okres, PIN)
```

### Kluczowe decyzje projektowe

- **Kwoty w groszach** — wszystkie kwoty to `number` w groszach (integer). `990 zł` → `99000`. Formatowanie wyłącznie przez `formatPLN()`. Zero operacji na floatach.
- **Salda obliczane, nie zapisywane** — saldo koperty = suma transakcji. Nigdy nie jest polem w bazie.
- **Logika bez Reacta** — `src/domain/` to czyste funkcje z typami. Testowalne bez renderowania.
- **Optymistyczny UI** — zmiana widoczna natychmiast, zapis w tle dzięki Firestore offline persistence.
- **Dark-only** — paleta "cichy panel kontrolny": ciemna, ciepła, z akcentem brass (#D9A441).

## Uruchomienie lokalne

### Wymagania

- Node.js 20+
- Projekt Firebase z Firestore i Authentication (email/password)

### Instalacja

```bash
git clone https://github.com/w84kubus/budzet.git
cd budzet
npm install
```

### Konfiguracja

Utwórz plik `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### Komendy

```bash
npm run dev        # serwer deweloperski (localhost:3000)
npm run build      # produkcyjny build
npm run typecheck  # tsc --noEmit
npm run lint       # next lint
npm run test       # vitest run (110 testów)
npm run test:watch # vitest w trybie watch
```

## Instalacja na telefonie (PWA)

Aplikacja jest w pełni instalowalna jako PWA:

| Platforma | Instrukcja |
|---|---|
| **iOS** | Safari → Udostępnij (↑) → *Dodaj do ekranu początkowego* |
| **Android** | Chrome → Menu (⋮) → *Zainstaluj aplikację* |

Po instalacji działa w pełnym ekranie, ma własną ikonę i działa offline.

## Licencja

Projekt prywatny. Kod źródłowy dostępny publicznie w celach edukacyjnych.
