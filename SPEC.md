# SPEC.md — Budżet PWA

> **Jak tego użyć:** wrzuć ten plik do pustego katalogu projektu, otwórz tam Claude Code i napisz:
> `Przeczytaj SPEC.md i zbuduj tę aplikację. Pracuj fazami, po każdej fazie uruchom typecheck, lint i build. Nie pytaj mnie o rzeczy, które możesz rozstrzygnąć sam — decyzje zapisuj w DECISIONS.md.`

---

## 0. Rola i sposób pracy

Jesteś senior full-stack engineerem z dziesięcioletnim doświadczeniem w budowaniu produkcyjnych aplikacji finansowych. Pracowałeś przy systemach, w których błąd zaokrąglenia o jeden grosz był incydentem. Masz silne opinie na temat modelowania domeny, nie znosisz przypadkowego stanu w komponentach i uważasz, że aplikacja finansowa, której nie da się obsłużyć jedną ręką w sklepie w 5 sekund, jest bezużyteczna.

Zasady, których się trzymasz w tym projekcie:

1. **Najpierw domena, potem UI.** Zanim napiszesz pierwszy komponent, zaimplementuj i przetestuj czystą logikę finansową (`src/domain/`) — bez Reacta, bez Firebase, same funkcje i typy. To jest serce aplikacji.
2. **Pieniądze to liczby całkowite.** Każda kwota w kodzie i w bazie to `number` w **groszach** (`1 234,56 zł` → `123456`). Zero operacji na floatach. Formatowanie do wyświetlania tylko na granicy UI, przez jedną funkcję `formatPLN(grosze)`.
3. **Jedno źródło prawdy.** Salda kont i salda kopert **nigdy nie są zapisywane w bazie jako pola do nadpisania** — są wyliczane z ruchów. Jeśli z powodów wydajnościowych zcache'ujesz sumę, musi istnieć komenda przeliczająca ją od zera.
4. **TypeScript strict.** Żadnego `any`, żadnego `as` obchodzącego typy. Dane wchodzące z Firestore walidujesz przez Zod.
5. **Optymistyczny UI.** Dodanie wydatku pojawia się na ekranie natychmiast, zapis leci w tle. Firestore w trybie offline persistence.
6. **Krytykuj własną pracę.** Po każdej fazie przejdź przez kod jak recenzent: co jest niepotrzebnie skomplikowane, gdzie stan może się rozjechać, co się wywali przy pustej bazie, co przy 3000 transakcji. Napraw, zanim pójdziesz dalej.
7. **Commit po każdej fazie**, wiadomości w formacie conventional commits.
8. **Nie dopisuj funkcji, których nie ma w tej specyfikacji.** Jeśli uważasz, że czegoś brakuje — dopisz to do `IDEAS.md`, nie do kodu.

Prowadź `DECISIONS.md` (co i dlaczego zdecydowałeś) oraz `PROGRESS.md` (co zrobione, co zostało).

---

## 1. Kontekst i cel

Jednoosobowa aplikacja do zarządzania budżetem domowym. Użytkownik: Jakub, Polska, waluta PLN. Problem do rozwiązania: **za dużo pieniędzy ucieka na drobne, impulsywne wydatki i nie widać tego, dopóki nie jest za późno.**

Aplikacja ma odpowiadać na cztery pytania, natychmiast po otwarciu:

1. Ile mam wolnych środków do najbliższej wypłaty?
2. Ile mogę dziś wydać, żeby wyjść na swoje?
3. Ile mam odłożone i na co konkretnie?
4. Ile w tym miesiącu poszło na głupoty?

Nie jest to aplikacja księgowa. Nie ma integracji z bankiem. Wszystko wpisywane ręcznie, w czasie rzeczywistym, w momencie płacenia.

### Fizyczna rzeczywistość, którą aplikacja modeluje

Użytkownik ma **dwa konta w tym samym banku**:

- **Konto główne** — tu wpływa wypłata, stąd opłacane są wydatki stałe i codzienne życie.
- **Konto oszczędnościowe** — tu leżą wszystkie odłożone pieniądze. Jest to jeden worek gotówki, ale aplikacja dzieli go logicznie na **koperty** (Wakacje, Ubrania, Poduszka finansowa itd.). Bank nie wie o kopertach — wie o nich tylko aplikacja.

Cykl miesięczny: wypłata wpływa **około 10. dnia miesiąca** (czasem 7., czasem 9.). Przed kolejną wypłatą użytkownik patrzy, ile zostało mu na koncie głównym, rozdziela tę resztę na koperty i robi **jeden przelew** na konto oszczędnościowe.

---

## 2. Stack

- **Next.js 15** (App Router, TypeScript, `strict: true`)
- **React 19**
- **Tailwind CSS v4** (konfiguracja przez `@theme` w CSS, nie `tailwind.config.js`)
- **Firebase**: Auth (email + hasło), Firestore, Storage (zdjęcia paragonów)
- **Zustand** — stan klienta (aktywny okres, filtry, stan blokady PIN)
- **Framer Motion** — mikrointerakcje, oszczędnie
- **Recharts** — wykresy
- **Zod** — walidacja danych z Firestore i formularzy
- **Vitest** — testy jednostkowe warstwy domenowej (obowiązkowe)
- **PWA**: manifest + service worker (Serwist lub ręcznie), instalowalna na iOS i Androidzie
- **Deploy**: Vercel

Aplikacja jest **wyłącznie w języku polskim**. Formatowanie kwot: `1 234,56 zł` (spacja jako separator tysięcy, przecinek dziesiętny, `Intl.NumberFormat('pl-PL')`). Daty: `pl-PL`, tydzień zaczyna się w poniedziałek.

---

## 3. Model domenowy

To najważniejsza sekcja. Przeczytaj ją dwa razy, zanim napiszesz kod.

### 3.1 Okres budżetowy (`Period`)

Miesiąc budżetowy **nie pokrywa się z miesiącem kalendarzowym**. Trwa od wypłaty do wypłaty.

- Domyślny dzień wypłaty: **10.** (ustawialny w ustawieniach).
- Na pulpicie jest przycisk **„Mam wypłatę"**. Kliknięcie zamyka bieżący okres i otwiera nowy — z rzeczywistą datą, nie z założoną.
- Jeśli użytkownik nie kliknie, a minie dzień wypłaty + 5 dni, aplikacja pokazuje delikatny baner: „Nowy okres nie został jeszcze otwarty."
- Etykieta okresu: nazwa miesiąca kalendarzowego, w którym wypada jego początek — np. okres 10.08 – 09.09 to **„Sierpień 2026"**.

```ts
type Period = {
  id: string;              // "2026-08"
  label: string;           // "Sierpień 2026"
  startDate: string;       // ISO, faktyczna data otwarcia
  endDate: string | null;  // null = okres otwarty
  expectedIncome: number;  // planowana wypłata w groszach
  status: 'open' | 'closed';
};
```

Dokładnie jeden okres może mieć status `open`.

### 3.2 Przychody

Dwa typy: `Wypłata` i `Dodatkowe przychody`. Wpływają na konto główne. Użytkownik wpisuje faktyczną kwotę przy otwieraniu okresu (podpowiadana jest kwota z poprzedniego okresu).

### 3.3 Wydatki stałe (`FixedExpense`)

Powtarzalne co miesiąc obciążenia konta głównego. **Dzielą się na dwa typy zachowania i to rozróżnienie jest kluczowe:**

| Typ | Zachowanie | Przykłady |
|---|---|---|
| `single` | Jedna płatność w miesiącu. Użytkownik odznacza „Zapłacone". Kwota faktyczna domyślnie = planowana, edytowalna. | Leasing AUTO + GAP, Leasing AirPods Max, Studia (990 zł), Subskrypcje, Kredyty |
| `accumulating` | Ma planowany limit, a kwota faktyczna **narasta** z pojedynczych transakcji wpisywanych na bieżąco. | Transport / Paliwo, Jedzenie |

Definicja żyje globalnie, a jej instancja jest tworzona w każdym okresie:

```ts
type FixedExpenseDef = {
  id: string;
  name: string;
  type: 'single' | 'accumulating';
  defaultPlanned: number;   // grosze
  dueDay: number | null;    // dzień miesiąca, tylko informacyjnie
  subcategories: string[];  // dla 'accumulating'
  order: number;
  archived: boolean;
};

type FixedExpenseInstance = {
  id: string;
  periodId: string;
  defId: string;
  planned: number;
  actual: number;          // dla 'single' ustawiane przy oznaczeniu, dla 'accumulating' = suma transakcji
  isPaid: boolean;
  paidAt: string | null;
};
```

Startowy zestaw (kwoty planowane 0, użytkownik uzupełni sam — poza Studiami):

- Leasing AUTO + GAP — `single`
- Leasing AirPods Max — `single`
- Transport / Paliwo — `accumulating`, podkategorie: Paliwo, Myjnia, Parking, Serwis, Autostrady
- Studia — `single`, 990 zł
- Subskrypcje — `single`, podkategorie: Apple, Telefon, HBO Max
- Jedzenie — `accumulating`, podkategorie: Zakupy spożywcze, Na mieście, Dostawy, Kawa
- Kredyty — `single`

Użytkownik może dodawać, edytować, archiwizować (nie usuwać — historia musi zostać) i zmieniać kolejność.

### 3.4 Koperty (`Envelope`)

Nazywane w papierowym planerze „oszczędnościami". **Koperty nie resetują się co miesiąc — mają trwałe saldo, które przechodzi na kolejne okresy i narasta.**

```ts
type Envelope = {
  id: string;
  name: string;
  emoji: string;
  monthlyPlan: number;          // sugerowana miesięczna wpłata (grosze)
  targetAmount: number | null;  // opcjonalny cel, np. 5000 zł na wakacje
  subcategories: string[];
  order: number;
  archived: boolean;
};
```

Saldo koperty **nie jest polem** — to `sum(ruchy koperty)`.

Startowy zestaw:

- 🎬 Rozrywka i czas wolny
- 💊 Zdrowie / Leki
- 🎁 Święta / Urodziny
- 👕 Ubrania / Kosmetyki
- ✈️ Wakacje (z celem kwotowym)
- 🛟 Poduszka finansowa (z celem kwotowym)
- 🫠 **Głupoty / Impulsy** — koperta na wydatki, których użytkownik nie potrafi przypisać do niczego sensownego

Dodatkowo **każda transakcja wydatkowa ma flagę `isImpulse`** (przełącznik w formularzu). Dzięki temu statystyki pokazują impulsywne wydatki *przekrojowo* — również te ukryte pod „Jedzeniem" czy „Ubraniami" — a nie tylko te wrzucone do koperty „Głupoty".

### 3.5 Transakcje (`Transaction`) — jedna wspólna księga

Wszystkie ruchy pieniędzy to jedna kolekcja z dyskryminatorem `kind`. To upraszcza timeline, eksport i przeliczanie sald.

```ts
type TransactionKind =
  | 'income'            // wpływ na konto główne
  | 'fixedExpense'      // wydatek stały z konta głównego
  | 'envelopeExpense'   // wydatek pokrywany z koperty
  | 'allocation'        // konto główne → koperta (przelew na oszczędnościowe)
  | 'envelopeTransfer'  // koperta → koperta (pokrycie przekroczenia)
  | 'withdrawal'        // koperta → konto główne (wyjęcie oszczędności)
  | 'adjustment';       // ręczna korekta salda

type Transaction = {
  id: string;
  periodId: string;
  kind: TransactionKind;
  amount: number;                // ZAWSZE dodatnia, w groszach; kierunek wynika z kind
  date: string;                  // ISO, domyślnie „teraz"
  fixedExpenseDefId?: string;    // dla 'fixedExpense'
  envelopeId?: string;           // dla ruchów kopertowych; przy transferze = źródło
  targetEnvelopeId?: string;     // dla 'envelopeTransfer' = cel
  subcategory?: string;
  paidFrom?: 'main' | 'savings'; // tylko dla 'envelopeExpense', domyślnie 'savings'
  note?: string;
  isImpulse: boolean;
  receiptUrl?: string;
  createdAt: string;
};
```

**`paidFrom` — dlaczego to istnieje.** Kupujesz kurtkę za 300 zł z koperty „Ubrania", ale płacisz kartą do konta głównego. Logicznie koperta chudnie o 300 zł, ale fizycznie pieniądze wyszły z niewłaściwego konta. Aplikacja to śledzi i pokazuje kwotę do wyrównania między kontami — zamiast udawać, że problem nie istnieje.

### 3.6 Matematyka — implementuj dokładnie tak

```
saldoKoperty(e) =
    Σ allocation(→e)
  + Σ envelopeTransfer(→e)
  − Σ envelopeTransfer(e→)
  − Σ envelopeExpense(e)          // niezależnie od paidFrom
  − Σ withdrawal(e→)
  ± Σ adjustment(e)

sumaOszczędności = Σ saldoKoperty(e)   dla wszystkich niezarchiwizowanych kopert

oczekiwaneSaldoGłównego =
    Σ income
  − Σ fixedExpense
  − Σ allocation
  + Σ withdrawal
  − Σ envelopeExpense(paidFrom='main')

oczekiwaneSaldoOszczędnościowego =
    Σ allocation
  − Σ withdrawal
  − Σ envelopeExpense(paidFrom='savings')

doWyrównania = oczekiwaneSaldoOszczędnościowego − sumaOszczędności
```

`doWyrównania > 0` → na koncie oszczędnościowym leży nadmiar wobec sumy kopert; aplikacja pokazuje: *„Przelej X zł z oszczędnościowego na główne."*

**Wolne środki w bieżącym okresie** (główny wskaźnik na pulpicie):

```
wolneŚrodki =
    Σ income(okres)
  − Σ fixedExpense zapłacone(okres)
  − Σ pozostałe niezapłacone wydatki stałe wg PLANU(okres)
  − Σ envelopeExpense(paidFrom='main', okres)
  − Σ allocation(okres)
```

**Dzienny limit:**

```
dniDoWypłaty = max(1, dni od dziś do przewidywanej następnej wypłaty)
dziennyLimit = wolneŚrodki / dniDoWypłaty
```

Analogicznie liczony jest dzienny limit dla pojedynczej koperty (`saldoKoperty / dniDoWypłaty`) — pokazywany tylko dla kopert konsumpcyjnych (Rozrywka, Głupoty, Jedzenie).

**Bilans oszczędności okresu** (odpowiednik dolnej sekcji z planera): suma wszystkich `allocation` w okresie, rozbita na koperty. Pokazywana jest kwota **rzeczywista**; planowana pojawia się tylko jako szara podpowiedź przy każdej kopercie, bez sumy zbiorczej.

### 3.7 Przekroczenie koperty

Saldo koperty może zejść poniżej zera. Wtedy:

- kafelek koperty jest czerwony, z kwotą ujemną i etykietą „Przekroczone o X zł",
- pojawia się przycisk **„Pokryj z innej koperty"** → arkusz z listą kopert z dodatnim saldem i sugerowaną kwotą równą przekroczeniu → tworzy `envelopeTransfer`,
- **aplikacja nigdy nie robi tego automatycznie.** Wybór źródła należy do użytkownika.

### 3.8 Rozdysponowanie i checklista przelewu

Kluczowy rytuał, wykonywany przed wypłatą. Wejście: przycisk „Rozdysponuj wolne środki" na pulpicie oraz krok w kreatorze zamknięcia okresu.

Ekran rozdysponowania:

1. Na górze: **Do rozdysponowania: X zł** (wolne środki na koncie głównym).
2. Lista kopert z polem kwoty, wstępnie wypełnionym `monthlyPlan`, ale tylko do wysokości dostępnych środków.
3. Pole reaguje na żywo: **Pozostanie: Y zł**. Jeśli Y < 0 — blokada zapisu i czerwony komunikat.
4. Skróty: „Rozdziel proporcjonalnie do planu", „Wyzeruj wszystko", „Resztę do Poduszki finansowej".
5. Zapis tworzy `allocation` dla każdej niezerowej koperty **oraz jedno zadanie przelewu**:

```ts
type TransferTask = {
  id: string;
  periodId: string;
  totalAmount: number;
  breakdown: { envelopeId: string; amount: number }[];
  createdAt: string;
  isDone: boolean;
  doneAt: string | null;
};
```

Dopóki `isDone === false`, na pulpicie wisi wyraźna karta: **„Do zrobienia w banku: przelej 1 250,00 zł na konto oszczędnościowe"** z rozwijaną rozpiską i dużym przyciskiem „Zrobione". Karta nie znika po zmianie okresu — niedokończone zadania przechodzą dalej.

### 3.9 Wypłata z oszczędności

Osobna akcja „Wyjmij z koperty" → wybór koperty, kwota, powód. Tworzy `withdrawal`. Koperta zapamiętuje ostatnie wyjęcie i przy kolejnym rozdysponowaniu pokazuje podpowiedź: *„Wyjęto stąd 1 000 zł 12.07 — uzupełnić?"*, z przyciskiem dopisującym tę kwotę do sugerowanej wpłaty.

### 3.10 Zamknięcie okresu

Kreator uruchamiany przyciskiem „Mam wypłatę":

1. **Podsumowanie okresu** — przychody, wydatki stałe plan vs rzeczywistość, wydatki z kopert, ile odłożone, ile poszło na impulsy.
2. **Niedokończone sprawy** — niezapłacone wydatki stałe (do oznaczenia lub przeniesienia), otwarte zadania przelewu, przekroczone koperty.
3. **Rozdysponowanie reszty** (sekcja 3.8) — opcjonalne, można pominąć.
4. **Nowy okres** — data wypłaty (domyślnie dziś), kwota przychodu, kopia wszystkich planów wydatków stałych i `monthlyPlan` kopert z możliwością edycji każdej pozycji przed zatwierdzeniem.

Salda kopert **przechodzą bez zmian**. Flagi `isPaid` resetują się.

---

## 4. Model danych w Firestore

```
users/{uid}
  ├─ settings              { paydayDay, pinHash, currency, createdAt, lastBackupAt }
  ├─ periods/{periodId}
  ├─ fixedExpenseDefs/{id}
  ├─ fixedExpenseInstances/{id}
  ├─ envelopes/{id}
  ├─ transactions/{id}
  ├─ transferTasks/{id}
  └─ balanceChecks/{id}    { date, mainReal, savingsReal, mainExpected, savingsExpected }
```

**Architektura pod przyszłe współdzielenie:** nie buduj tego teraz, ale przygotuj grunt — cała warstwa dostępu do danych ma iść przez `src/lib/db/paths.ts` z jedną funkcją `budgetRoot(budgetId)`. Dziś `budgetId === uid`. W przyszłości wystarczy podmienić na `budgets/{budgetId}` z tablicą `memberUids` i zmienić reguły. Nigdzie indziej w kodzie nie może pojawić się zahardkodowana ścieżka.

Reguły bezpieczeństwa: użytkownik czyta i zapisuje wyłącznie własne poddrzewo; walidacja typów pól i tego, że `amount` jest nieujemną liczbą całkowitą; brak dostępu bez uwierzytelnienia.

Indeksy złożone: `transactions` po `periodId + date desc`, `transactions` po `envelopeId + date desc`.

**Offline:** `initializeFirestore` z `persistentLocalCache` i `persistentMultipleTabManager`. Aplikacja musi być w pełni użyteczna bez internetu — zapisy kolejkują się i synchronizują po powrocie. Wskaźnik stanu połączenia w nagłówku: dyskretna kropka + etykieta „Offline — zmiany zapiszą się później".

---

## 5. Ekrany

Nawigacja dolna, 4 pozycje: **Pulpit · Wydatki · Koperty · Statystyki**. Ustawienia pod ikoną w nagłówku. Duży przycisk dodawania jako FAB nad paskiem nawigacji, obecny na każdym ekranie.

### 5.1 Pulpit

Kolejność od góry:

1. **Nagłówek okresu** — „Sierpień 2026 · 12 dni do wypłaty", przycisk zmiany okresu (historia).
2. **Wskaźnik główny** — bardzo duża kwota: **wolne środki**. Pod nią jedno zdanie: „Możesz wydawać ok. **142 zł dziennie**". Pod tym cienki pasek postępu okresu (ile dni minęło vs ile budżetu zostało) — jeśli wydajesz szybciej niż mija czas, pasek rozjeżdża się wizualnie i to jest sygnał.
3. **Karta zadania przelewu** (jeśli aktywne) — sekcja 3.8.
4. **Wydatki stałe** — lista z checkboxami. Zapłacone szare i przekreślone, niezapłacone wyraźne. Przy `accumulating` pasek postępu plan/rzeczywistość. Na dole: „Zapłacono 3 200 z 4 850 zł".
5. **Koperty** — poziomy, przewijalny rząd kompaktowych kafelków z saldem i paskiem wypełnienia. Przekroczone na czerwono, na początku listy.
6. **Głupoty w tym okresie** — pojedyncza liczba, suma wszystkich transakcji z `isImpulse`, z porównaniem do poprzedniego okresu (`↑ o 140 zł`). Ma być niewygodna do zignorowania.
7. **Ostatnie 5 transakcji** + link „Zobacz wszystkie".

### 5.2 Dodawanie wydatku — najważniejszy ekran aplikacji

Cel: **od otwarcia aplikacji do zapisanego wydatku maksymalnie 5 sekund i 3 dotknięcia.**

Arkusz wysuwany od dołu, natychmiast po dotknięciu FAB:

1. **Klawiatura numeryczna** — własna, duża, natywnie wyglądająca. Kwota rośnie od groszy w prawo (jak w terminalu płatniczym): wpisanie `3`,`5` daje `0,35`, dopisanie `0` daje `3,50`. Przecinek jest zawsze. Duży podgląd kwoty u góry.
2. **Kategoria** — siatka dużych kafelków (min. 64×64 px): najpierw koperty, potem wydatki stałe typu `accumulating`. Kolejność ustalana przez użytkownika w ustawieniach, nie przez algorytm „ostatnio używane" (przewidywalność > sprytność).
3. **Zapisz** — jeden przycisk. Dotknięcie zamyka arkusz i pokazuje toast „Zapisano — 35,00 zł, Jedzenie" z akcją „Cofnij" (5 sekund).

Wszystko poniżej jest opcjonalne i schowane pod rozwijanym „Więcej":

- podkategoria (chipsy),
- notatka,
- flaga **„To był impuls"** (wyraźny przełącznik — powinien lekko kłuć),
- data i godzina (domyślnie teraz, edytowalna),
- `paidFrom` — segmented control „Zapłacone z: Główne / Oszczędnościowe",
- zdjęcie paragonu (aparat lub galeria; kompresja po stronie klienta do WebP, maks. 1400 px dłuższy bok, upload w tle z widocznym stanem).

Osobne wejścia (menu długiego przytrzymania FAB): **Dodaj przychód**, **Wyjmij z koperty**, **Przenieś między kopertami**.

### 5.3 Wydatki (lista)

Pełna księga, grupowana po dniach, z lepkimi nagłówkami dat i sumą dzienną po prawej. Wyszukiwarka (kwota, notatka, kategoria). Filtry: okres, koperta / wydatek stały, tylko impulsy, zakres kwot, tylko z paragonem. Wirtualizowana lista — musi działać płynnie przy 5000 pozycji. Przesunięcie w lewo: edytuj / usuń (z potwierdzeniem). Wejście w pozycję: pełny widok ze zdjęciem paragonu.

### 5.4 Koperty

Lista pionowa, pełne karty:

- nazwa, emoji, **saldo dużą czcionką**,
- pasek postępu do celu, jeśli `targetAmount` ustawiony, z prognozą: „Przy 500 zł/mies. cel w kwietniu 2027",
- w tym okresie: wpłacono X, wydano Y,
- dzienny limit (dla kopert konsumpcyjnych),
- przekroczone: czerwień + „Pokryj z innej koperty".

Na górze ekranu: **suma wszystkich kopert** = ile realnie masz odłożone, oraz mały wiersz kontroli: „Na koncie oszczędnościowym powinno być: X zł" z akcją „Sprawdź saldo" (wpisanie rzeczywistego salda z banku → `balanceCheck` → jeśli się nie zgadza, propozycja utworzenia `adjustment` z notatką).

Wejście w kopertę: historia jej ruchów, edycja planu i celu, archiwizacja.

### 5.5 Statystyki

Zakładki: **Okres · Trendy · Kategorie**.

**Okres:**
- wykres kołowy wydatków wg kategorii (koperty + stałe razem),
- słupki poziome: plan vs rzeczywistość dla wydatków stałych,
- kafelki: przychody, wydatki łącznie, odłożone, stopa oszczędzania (%), średni wydatek dzienny, liczba dni bez wydatku.

**Trendy** (wykresy liniowe, ostatnie 12 okresów):
- suma oszczędności w czasie (najbardziej motywujący wykres w całej aplikacji — pokaż go pierwszy),
- wydatki łącznie,
- **wydatki impulsywne** — osobna linia, kolor ostrzegawczy,
- stopa oszczędzania.

**Kategorie:**
- ranking kategorii wg wydatków w wybranym okresie,
- dla każdej: sparkline z ostatnich 6 okresów i zmiana procentowa,
- „Najbardziej wzrosło" i „Najbardziej spadło" — po trzy pozycje.

Wykresy Recharts, ciemny motyw, bez legend tam, gdzie wystarczą etykiety bezpośrednio na serii. Na małych ekranach wykres kołowy zastąp poziomymi słupkami — są czytelniejsze.

### 5.6 Ustawienia

- dzień wypłaty, domyślna kwota wypłaty,
- zarządzanie wydatkami stałymi (dodaj, edytuj, kolejność, archiwum),
- zarządzanie kopertami (jw. + cele kwotowe),
- podkategorie,
- PIN: ustaw, zmień, wyłącz; czas do automatycznej blokady (domyślnie 5 min w tle),
- **eksport**: CSV transakcji, JSON pełnej kopii, wydruk okresu (sekcja 7),
- **import** kopii JSON z podglądem różnic przed zapisem,
- konto: e-mail, wylogowanie, usunięcie konta.

---

## 6. Design

Brief: *cichy panel kontrolny*. Ciemny, gęsty, techniczny, ale nie „cyberpunkowy". Aplikacja o pieniądzach ma budzić spokój i powagę, nie ekscytację. Ekscytacja jest tym, co powoduje wydawanie na głupoty.

**Nie rób:** neonowej zieleni na czerni, gradientów jako dekoracji, szklanego rozmycia, emoji jako głównego nośnika znaczenia, świecących cieni.

### Paleta

```css
@theme {
  --color-ink:      #0E1214;  /* tło aplikacji */
  --color-panel:    #161B1E;  /* karty */
  --color-panel-2:  #1E2529;  /* elementy wewnątrz kart, pola formularzy */
  --color-line:     #2A3338;  /* linie, obramowania — 1px, nigdy grubsze */
  --color-text:     #ECE7DF;  /* tekst główny, lekko ciepła kość */
  --color-muted:    #8A979E;  /* etykiety, opisy */
  --color-brass:    #D9A441;  /* akcent: kwoty kluczowe, aktywne stany */
  --color-good:     #6FBF8B;  /* oszczędności, saldo dodatnie */
  --color-bad:      #E0645A;  /* przekroczenia, saldo ujemne */
}
```

Akcent mosiądzowy używany **oszczędnie** — na jednej, najważniejszej liczbie na ekranie i na aktywnym elemencie nawigacji. Jeśli na ekranie są trzy mosiężne rzeczy, dwie są za dużo.

### Typografia

- **Display** (główne kwoty, nagłówki okresu): `Fraunces` — zmienna, oś optyczna, waga 500–600, `font-optical-sizing: auto`. Szeryf na dużych kwotach nadaje aplikacji powagę wyciągu bankowego, a nie aplikacji do fitnessu.
- **UI** (interfejs, przyciski, listy): `Inter Tight`, wagi 400/500/600.
- **Liczby w tabelach i listach**: `Geist Mono` lub `IBM Plex Mono`.
- **Obowiązkowo globalnie na każdej kwocie:** `font-variant-numeric: tabular-nums;`. Cyfry o zmiennej szerokości w liście transakcji to błąd.

Skala: 56 / 32 / 22 / 17 / 15 / 13 px. Kwota główna na pulpicie 56 px, `letter-spacing: -0.02em`.

### Element charakterystyczny

**Koperta z poziomem wypełnienia.** Każda koperta rysowana jest jako kafelek z cienką linią wypełnienia od dołu — poziom = saldo względem celu lub względem miesięcznego planu. Wypełnienie to płaski kolor z jedną linią menisku na górze, jak ciecz w naczyniu. Przy przekroczeniu poziom schodzi poniżej podstawy i kafelek zyskuje czerwoną kreskę pod spodem. To jedyne miejsce w aplikacji, gdzie pozwalasz sobie na wyrazistość wizualną. Wszystko pozostałe jest ciche.

### Ruch

- Arkusze wysuwane: `spring`, `stiffness: 380, damping: 32`.
- Kwoty przy zmianie: krótki `count-up`, maks. 400 ms, tylko na pulpicie.
- Poziom w kopercie animuje się przy zmianie salda.
- **Wszystko respektuje `prefers-reduced-motion`.**
- Żadnych animacji wejścia elementów listy — irytują przy codziennym użyciu.

### Poziom jakości

- Wszystkie cele dotykowe min. 44×44 px.
- Widoczny focus klawiatury.
- Bezpieczne obszary iOS (`env(safe-area-inset-*)`), FAB nad paskiem gestów.
- Kontrast tekstu min. WCAG AA.
- Stany puste są zaproszeniem do działania, nie komunikatem o błędzie: „Brak wydatków w tym okresie. Dodaj pierwszy." z przyciskiem.
- Błędy mówią, co się stało i co zrobić. Nie przepraszają.

### Copy

Polski, zdaniowa wielkość liter, bezpośrednio, bez żargonu. Przyciski mówią, co się stanie: „Zapisz wydatek", nie „Zatwierdź". Ta sama nazwa akcji od przycisku po komunikat: „Zrobione" → „Przelew oznaczony jako zrobiony". Nie „Twoje saldo wynosi", tylko „Zostało".

---

## 7. Eksport, wydruk, kopie zapasowe

1. **CSV** — transakcje z aktywnego okresu lub zakresu, separator `;`, kodowanie UTF-8 z BOM (żeby Excel po polsku otworzył poprawnie), kwoty w formacie `1234,56`.
2. **Wydruk okresu** — osobna trasa `/print/[periodId]` z arkuszem stylów `@media print`: **jasny motyw**, format A4, układ wzorowany na papierowym planerze użytkownika (Przychody → Stałe wydatki → Koperty → Podsumowanie z bilansem). Drukowanie przez `window.print()`, bez generowania PDF po stronie serwera.
3. **Kopia JSON** — pełny zrzut wszystkich kolekcji z wersją schematu. Przycisk „Pobierz kopię" w ustawieniach, data ostatniej kopii widoczna, a po 30 dniach bez kopii dyskretne przypomnienie w ustawieniach (nie push, nie modal).
4. **Import JSON** — walidacja Zod, podgląd („1 240 transakcji, 7 kopert, 12 okresów"), wybór trybu: scal / zastąp. Zastąpienie wymaga wpisania słowa potwierdzającego.

---

## 8. Uwierzytelnianie i PIN

- Firebase Auth, e-mail + hasło. Rejestracja, logowanie, reset hasła. Bez logowania społecznościowego.
- Po pierwszym zalogowaniu kreator: dzień wypłaty → kwota wypłaty → potwierdzenie startowych wydatków stałych i kopert (wstępnie wypełnione z sekcji 3.3 i 3.4, kwoty do uzupełnienia później) → gotowe. Maksymalnie 4 ekrany.
- **PIN**: 4 cyfry, hashowany (Web Crypto, PBKDF2 z solą), hash w Firestore. Blokada po 5 minutach w tle lub przy ponownym otwarciu aplikacji. Ekran blokady zasłania treść. Wyjście awaryjne: „Zapomniałem PIN-u" → wylogowanie i ponowne logowanie hasłem.
- PIN jest opcjonalny, ale proponowany podczas onboardingu.

---

## 9. Przypadki brzegowe — obsłuż wszystkie

1. Pusta baza po rejestracji — wszystkie ekrany mają sensowne stany puste, nic się nie wywala na `undefined`.
2. Brak otwartego okresu — pulpit pokazuje jeden przycisk: „Rozpocznij okres".
3. Wydatek z datą spoza aktywnego okresu — przypisz do właściwego okresu automatycznie; jeśli taki nie istnieje, ostrzeż i pozwól przypisać do najbliższego.
4. Wypłata wcześniejsza niż zwykle — kreator zamknięcia dopuszcza dowolną datę, `dniDoWypłaty` liczone od faktycznej daty startu plus długość typowego cyklu.
5. Okres krótszy niż 20 dni lub dłuższy niż 45 — pozwól, ale pokaż ostrzeżenie w statystykach, że porównania mogą być zniekształcone.
6. Ujemne wolne środki — pulpit na czerwono, „Jesteś na minusie o X zł", propozycja wyjęcia z koperty.
7. Usunięcie transakcji, która była częścią rozdysponowania — przelicz zadanie przelewu i oznacz je jako nieaktualne, jeśli zostało już wykonane.
8. Archiwizacja koperty z niezerowym saldem — wymuś przeniesienie salda do innej koperty przed archiwizacją.
9. Konflikt offline (edycja tego samego rekordu na dwóch urządzeniach) — Firestore rozstrzyga ostatnim zapisem; nie buduj własnego CRDT, ale nie przechowuj żadnych sum, które mogłyby się przez to rozjechać (patrz zasada nr 3).
10. Kwota 0 — blokada zapisu z jasnym komunikatem.
11. Kwoty powyżej 1 000 000 zł — pozwól, ale sprawdź, czy układ się nie łamie.
12. Bardzo długie nazwy kategorii — obcinanie z wielokropkiem, pełna nazwa w podpowiedzi.
13. Upload paragonu bez internetu — zakolejkuj, oznacz transakcję jako „paragon czeka na wysłanie".

---

## 10. Testy

Vitest, wyłącznie warstwa domenowa (`src/domain/`), ale **pokrycie tej warstwy ma być kompletne**:

- `formatPLN` i `parsePLN` — w obie strony, wszystkie zaokrąglenia,
- `calculateEnvelopeBalance` — każdy typ ruchu, transfery w obie strony, saldo ujemne,
- `calculateAccountBalances` — w tym `paidFrom = 'main'` i wyliczenie `doWyrównania`,
- `calculateFreeFunds` i `calculateDailyAllowance` — w tym `dniDoWypłaty = 0` i okres zamknięty,
- `closePeriod` — kopiowanie planów, reset flag, zachowanie sald kopert,
- `distributeFunds` — walidacja sumy, tworzenie transakcji i zadania przelewu,
- test właściwościowy: dla losowego zbioru 1000 transakcji suma sald kopert zawsze równa się sumie ruchów kopertowych.

Nie pisz testów komponentów. Nie pisz testów E2E. Ten czas lepiej zainwestować w warstwę domenową.

---

## 11. Plan budowy

Realizuj fazami. Po każdej: `npm run typecheck && npm run lint && npm run build`, testy na zielono, commit, wpis w `PROGRESS.md`.

**Faza 1 — fundament domeny.**
Projekt Next.js, TypeScript strict, Tailwind v4 z tokenami z sekcji 6, czcionki. Cały `src/domain/`: typy, schematy Zod, funkcje obliczeniowe, formatowanie kwot. Pełny zestaw testów. **Żadnego UI.**
*Gotowe, gdy:* wszystkie testy przechodzą, a logika finansowa jest kompletna i można ją zweryfikować bez uruchamiania aplikacji.

**Faza 2 — dane i uwierzytelnianie.**
Firebase, Auth (e-mail + hasło), Firestore z offline persistence, reguły bezpieczeństwa, warstwa dostępu przez `paths.ts`, hooki subskrypcji, onboarding, blokada PIN.
*Gotowe, gdy:* można się zarejestrować, przejść onboarding, dane lądują w Firestore, a po wyłączeniu sieci aplikacja nadal działa.

**Faza 3 — dodawanie wydatków i pulpit.**
Arkusz dodawania z klawiaturą numeryczną, kafelkami kategorii, cofaniem. Pulpit ze wszystkimi sekcjami. Lista wydatków z filtrami i wirtualizacją.
*Gotowe, gdy:* dodanie wydatku zajmuje mniej niż 5 sekund od otwarcia aplikacji, a pulpit pokazuje poprawne wolne środki i dzienny limit.

**Faza 4 — koperty i przepływ pieniędzy.**
Ekran kopert z wypełnieniem, przekroczenia i pokrywanie z innej koperty, rozdysponowanie, zadania przelewu z checklistą, wyjmowanie z koperty, kontrola sald.
*Gotowe, gdy:* pełny cykl — wypłata, wydatki, rozdysponowanie, przelew, zamknięcie okresu — działa i salda zgadzają się co do grosza.

**Faza 5 — statystyki.**
Trzy zakładki, wykresy, licznik impulsów, trendy.
*Gotowe, gdy:* wykresy poprawnie obsługują 1, 3 i 12 okresów oraz okres bez żadnych transakcji.

**Faza 6 — PWA, eksport, wykończenie.**
Manifest, service worker, ikony, instalacja na iOS i Androidzie, eksport CSV i JSON, import, widok wydruku, zdjęcia paragonów, dopracowanie animacji i dostępności, deploy na Vercel.
*Gotowe, gdy:* aplikacja instaluje się na telefonie, działa offline, a wydruk okresu wygląda jak papierowy planer.

---

## 12. Czego nie robić

- Nie integruj się z bankami, nie parsuj wyciągów, nie kategoryzuj automatycznie.
- Nie dodawaj powiadomień push.
- Nie dodawaj wielu walut.
- Nie dodawaj grywalizacji, odznak, serii dni ani motywacyjnych cytatów.
- Nie dodawaj asystenta AI ani podpowiedzi generowanych przez model.
- Nie buduj współdzielenia konta — przygotuj tylko architekturę (sekcja 4).
- Nie używaj bibliotek komponentów UI. Wszystko własne, na Tailwindzie.
- Nie zapisuj wyliczonych sald jako trwałych pól bez możliwości przeliczenia od zera.

---

## 13. Uzupełnij CLAUDE.md

Na koniec fazy 1 utwórz `CLAUDE.md` w katalogu głównym z: strukturą katalogów, komendami (`dev`, `build`, `typecheck`, `lint`, `test`), zasadami z sekcji 0, przypomnieniem o groszach jako liczbach całkowitych, konwencją nazw i informacją, że wszystkie teksty w interfejsie są po polsku. Ma być krótki — maksymalnie jedna strona.
