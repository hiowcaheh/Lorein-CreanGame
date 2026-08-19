# Backend Lorein — port `req.php` do TypeScript

Szkielet nowego backendu gry. Powstaje **stopniowo**: akcje przeniesione
obsluguje TypeScript, cala reszta jest przekazywana do starego `req.php`.
Gra dziala nieprzerwanie przez caly czas migracji.

## Stan

| Element | Stan |
|---|---|
| Zgodnosc z `mt_rand()` z PHP | gotowe, 72 testy wzgledem PHP 8.4 |
| Zgodnosc funkcji PHP (`round`, `urlencode`, …) | gotowe, 63 testy |
| Stale protokolu (89 akcji, 134 pola) | generowane z `req.php` |
| Akcja `007` — ranking | przeniesiona, 10 testow roznicowych |
| Pozostale 76 akcji | przekazywane do PHP |

Razem **145 testow**, wszystkie przechodza.

## Uruchomienie

```bash
npm install
cp .env.example .env      # uzupelnij dane bazy i adres starego backendu
npm run dev
```

Sprawdzenie:

```bash
curl localhost:8787/health
# {"status":"ok","ported":["007"]}
```

Zeby przestawic gre na ten backend, **nie trzeba rekompilowac klienta** —
wystarczy zmienic pole 25 w konfiguracji wysylanej do klienta:

```
25	http://localhost:8787/req.php?req=%1&random=%2
```

Klient czyta ten adres w czasie dzialania (`param_php_tunnel_url`
w `MainTimeline.as`), wiec podmiana backendu to zmiana jednej linii.

## Jak to jest zbudowane

```
src/
├── app.ts              # aplikacja Hono — niezalezna od runtime'u
├── index.ts            # adapter dla Node
├── config.ts           # konfiguracja ze zmiennych srodowiskowych
├── compat/
│   ├── php.ts          # round, urlencode, intval, explode, ctype_digit
│   └── rng.ts          # mt_rand zgodny z PHP co do bitu
├── protocol/
│   ├── constants.ts    # GENEROWANY — nie edytuj recznie
│   ├── request.ts      # rozbior parametru `req`
│   └── response.ts     # builder o semantyce tablicy PHP
├── actions/
│   └── ranking.ts      # akcja 007
└── db/client.ts        # pula polaczen MySQL
```

### Dlaczego az taka ostroznosc ze zgodnoscia

Trzy rzeczy rozjezdzaja port po cichu, bez zadnego bledu w logach:

**Zaokraglanie.** PHP zaokragla polowki od zera, JavaScript w gore:

```
PHP:  round(-2.5) = -3        JS:  Math.round(-2.5) = -2
```

W `req.php` jest 60 wywolan `round`. Uzycie `Math.round` przesuneloby
obrazenia i nagrody o jeden w losowych miejscach.

**Losowosc.** 157 wywolan `rand()`/`mt_rand()`. Bez generatora dajacego
identyczne ciagi co PHP nie da sie porownac starego backendu z nowym —
kazda roznica wygladalaby jak przypadek. Implementacja odtwarza MT19937
w wariancie PHP i jest zweryfikowana wzgledem prawdziwego PHP.

**Tablica PHP to nie tablica JS.** `$ret` jest uporzadkowana mapa:
`$ret = ["007"]` podmienia cala tablice, a `join` nie wypelnia dziur.
`PhpResponse` odtwarza te semantyke — zwykla tablica JavaScript dawalaby
inne wyjscie.

## Testy roznicowe — jak przenosic kolejne akcje

To jest wzorzec do powtarzania przy kazdej z pozostalych 76 akcji:

1. **Wzorzec z PHP.** Skopiuj logike akcji z `req.php` do skryptu
   w `test/fixtures/`, zastepujac zapytania do bazy danymi podanymi wprost.
   Wygeneruj wynik prawdziwym PHP.
2. **Port.** Przepisz akcje do `src/actions/`, korzystajac z `compat/`.
3. **Porownanie.** Test podaje te same dane obu stronom i sprawdza,
   czy napisy wyjsciowe sa identyczne — znak po znaku.

Przyklad kompletu: `test/fixtures/generate-ranking.php` + `src/actions/ranking.ts`
+ `test/ranking.test.ts`. Siedem scenariuszy, w tym przypadki brzegowe:
pusty ranking, kodowanie klas znakiem minusa, nazwy z polskimi znakami,
granica statusu online dokladnie na 900 sekundach.

Wzorce zostaly wygenerowane na **PHP 8.4**, a serwer docelowy dziala na
**PHP 8.3**. Dla `round()` istnieja skrajne przypadki, w ktorych te wersje
roznia sie miedzy soba — jesli zalezy Ci na pewnosci, wygeneruj wzorce
ponownie na wersji produkcyjnej:

```bash
php test/fixtures/generate-php-funcs.php > test/fixtures/php-funcs.json
php test/fixtures/generate-ranking.php   > test/fixtures/ranking.json
npm test
```

## Stale protokolu

`src/protocol/constants.ts` jest **generowany** ze zrodla `sf555/req.php`:

```bash
npm run gen:protocol
# ACT: 89, SF: 134, RESP: 79, ERR: 92
```

Recznie przepisane numery pol to proszenie sie o literowke, ktora ujawni sie
dopiero jako dziwnie dzialajacy ekran w grze. Dopoki PHP jest zrodlem prawdy,
generacja gwarantuje zgodnosc.

## Uruchomienie na Supabase Edge Functions

`app.ts` nie zalezy od runtime'u, wiec zmienia sie tylko plik wejsciowy —
zamiast `serve()` z `@hono/node-server`:

```ts
// supabase/functions/game/index.ts
import { app } from './app.ts';
Deno.serve(app.fetch);
```

Ta sama aplikacja uruchomi sie takze pod Bun i Cloudflare Workers. Decyzja
o hostingu nie jest nigdzie zaszyta i mozna ja zmienic pozniej.

## Nastepne kroki

1. **Typowany dostep do bazy.** Warstwa SQL jest teraz pisana recznie, tak jak
   w `req.php` — ulatwia to porownywanie portu z oryginalem. Docelowo warto
   zrobic introspekcje schematu (19 tabel) narzedziem w rodzaju Drizzle;
   wymaga to dostepu do dzialajacej bazy, wiec nalezy do wdrozenia u Ciebie.
2. **Kolejne akcje.** Sensowna kolejnosc: `005` (poczta), `023` (gildia),
   `024` (ranking gildii) — dalej czysty odczyt. Walka i generowanie
   przedmiotow na sam koniec, bo tam losowosc i matematyka wazy najwiecej.
3. **Uwierzytelnianie.** Dzis token sesji jedzie w adresie URL i laduje
   w logach serwera. Przy okazji portu warto przejsc na naglowek
   `Authorization`, a hasla z `md5()` na `password_hash()`.
