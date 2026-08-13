# Decyzje

## D1: Adjustment direction convention

**Problem:** Spec mówi `± Σ adjustment(e)`, ale `Transaction.amount` jest zawsze dodatni. Jak odróżnić adjustment +/−?

**Decyzja:** Używamy `paidFrom` jako sygnału:
- `paidFrom` nieustalone lub `'main'` → korekta **w górę** (dodanie do koperty)
- `paidFrom = 'savings'` → korekta **w dół** (odjęcie z koperty)

**Dlaczego:** Unika dodania nowego pola do Transaction. Pole `paidFrom` nie ma znaczenia semantycznego dla adjustments w kontekście konta, więc przeznaczamy je na kierunek. Alternatywa (nowe pole `adjustmentDirection`) wymagałaby zmiany schematu i jest niepotrzebna przy jednym use-case.

## D2: Daily allowance rounding

**Problem:** `wolneŚrodki / dniDoWypłaty` daje ułamek. Zaokrąglać w górę czy w dół?

**Decyzja:** `Math.floor` — truncate. Nie chcemy, żeby użytkownik wydał więcej niż ma. 1 grosz dziennej straty jest lepszy niż minusowe saldo na koniec miesiąca.

## D3: Proportional distribution — largest remainder method

**Problem:** Rozkład groszy proporcjonalny do planów nie dzieli się równo. Ktoś dostanie za mało lub za dużo.

**Decyzja:** Largest remainder method — floor każdą wartość, potem dodaj po 1 groszu do kopert z największymi resztami, aż suma się zgadza. Suma zawsze dokładna.

## D4: Manual project setup instead of create-next-app

**Problem:** npm cache miał problemy z uprawnieniami (root-owned files), `create-next-app` nie działał.

**Decyzja:** Ręczna inicjalizacja projektu z `package.json`, `tsconfig.json`, `postcss.config.mjs` itd. Rezultat identyczny, ale bez zależności od działającego cache.

## D5: No Intl.NumberFormat thousands separator assertion

**Problem:** Node.js w zależności od wersji ICU nie zawsze dodaje separator tysięcy dla `pl-PL` przy liczbach < 10000.

**Decyzja:** Testy weryfikują poprawność formatowania (kwota + waluta), ale nie wymuszają separatora tysięcy — to zależy od runtime'u. W przeglądarce separator będzie obecny.

## D6: Lazy Firebase initialization

**Problem:** Firebase SDK inicjalizuje się przy imporcie modułu, co powoduje błąd `auth/invalid-api-key` podczas statycznego generowania stron w Next.js (brak zmiennych środowiskowych na serwerze budowania).

**Decyzja:** Eksportujemy gettery (funkcje) zamiast gotowych instancji — `auth()`, `db()`, `storage()`. Firebase inicjalizuje się dopiero przy pierwszym wywołaniu w przeglądarce.

**Dlaczego:** Pozwala zachować standardowy import bez dynamic importów czy `typeof window` checków. Koszt: `()` przy każdym użyciu, ale jest to explicitne i bezpieczne.

## D7: PIN hash format

**Problem:** Spec mówi PBKDF2 z solą. Jak przechowywać?

**Decyzja:** Format `salt:hash` (oba hex-encoded) w jednym stringu. 100k iteracji, SHA-256, 256-bit klucz. Sól losowa (16 bajtów, crypto.getRandomValues).

**Dlaczego:** Jeden string w Firestore jest prostszy niż obiekt z dwoma polami. Format jest samodokumentujący.
