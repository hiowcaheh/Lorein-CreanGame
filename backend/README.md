# Backend Lorein — port `req.php` do TypeScript

Nowy backend gry: TypeScript + Hono + PostgreSQL (Supabase).
Wdrazany na Vercel do testow, docelowo na VPS.

## Stan prac

| Element | Stan |
|---|---|
| Zgodnosc z `mt_rand()` z PHP | gotowe — 72 testy wzgledem prawdziwego PHP |
| Zgodnosc funkcji PHP (`round`, `urlencode`, …) | gotowe — 63 testy |
| Stale protokolu (89 akcji, 134 pola) | generowane z `req.php` |
| Schemat bazy dla Postgresa (19 tabel) | gotowe — zastosowany na Postgresie 16 |
| Akcja `007` — ranking | przeniesiona — 10 testow jednostkowych + 5 integracyjnych |
| **Pozostale 76 akcji** | **do przeniesienia** |

150 testow: 145 przechodzi zawsze, 5 integracyjnych uruchamia sie przy
wskazanej bazie testowej.

Gra **nie jest jeszcze grywalna na tym backendzie** — dziala ranking,
reszta akcji czeka na port.

## Uruchomienie lokalne

```bash
npm install
cp .env.example .env          # wpisz DATABASE_URL
npm run db:schema             # zaklada 19 tabel i dane bazowe
npm run dev
```

```bash
curl localhost:8787/health
# {"status":"ok","ported":["007"]}
```

## Wdrozenie na Vercel

1. Zaimportuj repozytorium w panelu Vercela.
2. **Root Directory** ustaw na `backend` — repozytorium zawiera takze stara
   gre w PHP, ktorej Vercel nie ma budowac.
3. W `Settings > Environment Variables` dodaj `DATABASE_URL`.
4. Deploy.

`vercel.json` przekierowuje wszystkie sciezki do jednej funkcji, wiec
`/req.php?req=...` trafia do tego samego kodu co lokalnie.

**Uzyj poolera Supabase w trybie transakcyjnym** (port 6543):

```
postgresql://postgres.PROJEKT:HASLO@aws-0-REGION.pooler.supabase.com:6543/postgres
```

Kazde wywolanie funkcji na Vercelu to osobny proces z wlasnym polaczeniem.
Bez poolera baza wyczerpuje limit polaczen przy kilkunastu graczach. Kod
wykrywa port 6543 i wylacza instrukcje preparowane, ktorych Supavisor
w tym trybie nie obsluguje — bez tego zapytania zaczelyby padac dopiero
pod obciazeniem.

Na VPS-ie mozna uzyc polaczenia bezposredniego (port 5432); wtedy proces
zyje dlugo i pula polaczen ma sens.

## Zanim przeniesiesz baze — jedna wazna konsekwencja

Do tej pory plan zakladal migracje bez przerwy w dzialaniu: akcje
przeniesione obsluguje TypeScript, reszte przejmuje stary `req.php`.
**To dziala tylko dopoki oba backendy pisza do tej samej bazy.**

Po przeniesieniu danych do Postgresa stary PHP przestaje byc uzyteczny —
jego 14 tysiecy linii SQL jest napisane pod MySQL (odwrotne apostrofy,
`LIMIT offset, n`, zmienne `@r:=`). Nie poprawimy tego bez przepisania
calosci, czyli tego, co i tak robimy w TypeScript.

Praktyczny wniosek — dwa tory zamiast jednego:

- **Produkcja**: stara gra na MySQL, dziala bez zmian.
- **Rozwoj**: nowy backend na Supabase, z kopia danych.

Przelaczenie nastepuje raz, gdy przeniesione akcje wystarcza do gry.
Nie jest to migracja stopniowa w sensie ruchu graczy — jest stopniowa
w sensie pisania kodu.

Przekazywanie do PHP (`SF_LEGACY_URL`) zostaje w kodzie, bo przydaje sie
w jednym scenariuszu: gdy nowy backend celuje jeszcze w MySQL, zanim dane
przejda na Postgres.

## Uklad projektu

```
api/index.ts            # wejscie dla Vercela
src/
├── app.ts              # aplikacja Hono — niezalezna od runtime'u
├── index.ts            # wejscie dla Node
├── config.ts           # zmienne srodowiskowe, czytane leniwie
├── compat/
│   ├── php.ts          # round, urlencode, intval, explode, ctype_digit
│   └── rng.ts          # mt_rand zgodny z PHP co do bitu
├── protocol/
│   ├── constants.ts    # GENEROWANY — nie edytuj recznie
│   ├── request.ts      # rozbior parametru `req`
│   └── response.ts     # builder o semantyce tablicy PHP
├── actions/ranking.ts  # akcja 007
└── db/client.ts        # postgres.js
db/schema.sql           # schemat dla Postgresa
```

### Dlaczego az taka ostroznosc ze zgodnoscia

Trzy rzeczy rozjezdzaja port po cichu, bez bledu w logach:

**Zaokraglanie.** PHP zaokragla polowki od zera, JavaScript w gore:

```
PHP:  round(-2.5) = -3        JS:  Math.round(-2.5) = -2
```

W `req.php` jest 60 wywolan `round`. `Math.round` przesunelby obrazenia
i nagrody o jeden w losowych miejscach.

**Losowosc.** 157 wywolan `rand()`/`mt_rand()`. Bez generatora dajacego
identyczne ciagi co PHP kazda roznica wygladalaby jak przypadek, a nie blad.

**Tablica PHP to nie tablica JS.** `$ret` jest uporzadkowana mapa:
`$ret = ["007"]` podmienia cala tablice, a `join` nie wypelnia dziur.

## Schemat bazy

`db/schema.sql` to konwersja `sf555/DATABASE.sql` z MariaDB na Postgresa.
Nazwy tabel i kolumn zachowano co do znaku, zeby port kolejnych akcji byl
mechaniczny.

Trzy kolumny nosza nazwy zarezerwowane i w zapytaniach **musza byc
w cudzyslowach**:

```sql
user_data."group"    guild_chat."time"    witch."time"
```

**Postgres jest scisly, MySQL nie byl.** `dbconnect.php` dwukrotnie wykonuje
`SET sql_mode=""`, czyli gra dziala w trybie, gdzie baza po cichu przyjmuje
niepelne i niepoprawne dane. Postgres zglosi blad. Przy przenoszeniu akcji
zapisujacych trzeba wiec uzupelniac wszystkie kolumny `NOT NULL` — widac to
w helperze `insertPlayer` w tescie integracyjnym.

## Testy roznicowe — jak przenosic kolejne akcje

Wzorzec do powtorzenia przy kazdej z pozostalych 76 akcji:

1. **Wzorzec z PHP.** Skopiuj logike akcji z `req.php` do skryptu
   w `test/fixtures/`, zastepujac zapytania danymi podanymi wprost.
   Wygeneruj wynik prawdziwym PHP.
2. **Port.** Przepisz akcje do `src/actions/`, korzystajac z `compat/`.
3. **Porownanie.** Test podaje te same dane obu stronom i sprawdza, czy
   napisy wyjsciowe sa identyczne — znak po znaku.
4. **Integracja.** Drugi test uruchamia akcje na prawdziwym Postgresie,
   zeby sprawdzic same zapytania.

Komplet dla rankingu: `test/fixtures/generate-ranking.php` +
`src/actions/ranking.ts` + `test/ranking.test.ts` + `test/ranking.integration.test.ts`.

Testy integracyjne wymagaja bazy:

```bash
TEST_DATABASE_URL=postgresql://... npm test
```

Bez tej zmiennej sa pomijane, wiec zestaw dziala takze bez bazy.

Wzorce wygenerowano na **PHP 8.4**, a serwer produkcyjny dziala na **8.3**.
Dla `round()` istnieja skrajne przypadki, w ktorych te wersje sie roznia —
jesli zalezy Ci na pewnosci, przegeneruj wzorce na wersji produkcyjnej:

```bash
php test/fixtures/generate-php-funcs.php > test/fixtures/php-funcs.json
php test/fixtures/generate-ranking.php   > test/fixtures/ranking.json
npm test
```

## Stale protokolu

```bash
npm run gen:protocol
# ACT: 89, SF: 134, RESP: 79, ERR: 92
```

Czytane prosto z `req.php`. Recznie przepisane numery pol to pewna literowka,
ktora ujawni sie dopiero jako dziwnie dzialajacy ekran w grze.

## Nastepne kroki

1. **Logowanie i rejestracja** (`002`, `001`) — bez nich nie da sie wejsc do gry.
   Przy okazji: hasla z `md5()` na `password_hash()`, a token sesji z adresu
   URL do naglowka `Authorization`.
2. **Ekran postaci** (`004`) — najwieksza pojedyncza odpowiedz protokolu,
   dotyka wiekszosci ze 134 pol.
3. **Akcje odczytu**: poczta (`005`), gildia (`023`), ranking gildii (`024`).
4. **Walka i przedmioty** na koniec — tam wazy losowosc i matematyka,
   i tam testy roznicowe sa najbardziej potrzebne.
