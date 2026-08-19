# Wdrozenie na Vercel — instrukcja i pulapki

Notatki z prawdziwego wdrozenia tego projektu. Kazda pulapka opisana nizej
faktycznie wystapila i kosztowala osobne wdrozenie — warto je znac, zanim
sie na nie wpadnie po raz drugi.

## Konfiguracja projektu

| Ustawienie | Wartosc |
|---|---|
| Root Directory | `backend` |
| Framework Preset | Other |
| Build Command | domyslny (uruchamia `vercel-build` z `package.json`) |
| Output Directory | `public` |
| Zmienne srodowiskowe | `DATABASE_URL` (Production i Preview) |

`DATABASE_URL` musi wskazywac **pooler Supabase w trybie transakcyjnym**
(port 6543), nie polaczenie bezposrednie (5432). Szczegoly w
[`HOSTING.md`](HOSTING.md).

## Adresy do sprawdzenia po wdrozeniu

Trzy adresy, w tej kolejnosci — kazdy odcina inna warstwe problemow:

```
/version     kim jestem: commit, region, czy jest DATABASE_URL i na jaki port
/health      czy backend dogaduje sie z baza
/?debug=1    pelny raport: Ruffle, zasoby, funkcja, baza, konfiguracja klienta
```

`/version` nie dotyka bazy. Jesli odpowiada, a `/health` nie — problem jest
wylacznie w polaczeniu z Postgresem. Jesli nie odpowiada nawet `/version` —
funkcja nie wstaje w ogole.

## Pulapki, w ktore wdepnelismy

### 1. `.vercelignore` wycial pliki potrzebne do dzialania

Wzorzec `scripts/` usunal skrypt budowania, ktory mial sie wtedy uruchomic,
a `db/` zlapal nie tylko katalog `db/`, ale takze `src/db/client.ts` —
polaczenie z baza.

```
Removed 18 ignored files defined in .vercelignore
  /backend/scripts/prepare-static.mjs
  /backend/src/db/client.ts
Error: Cannot find module '.../scripts/prepare-static.mjs'
```

Caly backend bez zasobow gry wazy 404 KB, wiec ten plik niczego nie
oszczedzal. Zostal usuniety.

### 2. Polecenie budowania uruchamia sie wiecej niz raz

Skrypt zaczynal od `rm -rf public`. Drugi przebieg kasowal katalog dokladnie
wtedy, gdy Vercel zbieral z niego pliki wyjsciowe:

```
ENOENT: no such file or directory, open
'.../public/res/sfgame/char/dunkelelf f/dunkelelf_female_haare_3_52.png'
```

Skrypt nie moze niczego usuwac. Musi byc odporny na powtorne uruchomienie.

### 3. Cache budowania podawal stara strone

Naprawa pulapki nr 2 przez znacznik „katalog juz gotowy" wprowadzila gorszy
blad: Vercel przywraca `public/` z cache miedzy wdrozeniami, wiec znacznik
przezywal i skrypt konczyl prace **przed skopiowaniem nowego `index.html``**.
Wdrazala sie strona sprzed kilku commitow, mimo zielonego builda.

Rozwiazanie: male pliki (`index.html`, favicon) kopiowane sa ZAWSZE, a
ciezkie katalogi `res/` i `lang/` tylko wtedy, gdy jeszcze ich nie ma.

Zeby taka sytuacja nie przeszla juz niezauwazona, `index.html` dostaje przy
budowaniu znacznik wersji widoczny w `?debug=1`:

```
OK  wersja strony — 3bdf258 · 2026-08-19 12:03
```

Jesli nie zgadza sie z najnowszym commitem, patrzysz na stara strone.

### 4. `vercel.json` odrzuca nieznane klucze

Do sekcji `headers` trafily pola `comment` z opisem po polsku. Plik ma scisly
schemat — taka konfiguracja jest odrzucana i wdrozenie nie dochodzi do skutku.
Opisy naleza do komunikatu commita, nie do pliku konfiguracyjnego.

### 5. Awaria bazy ubijala cala funkcje

Najbardziej mylacy objaw calej serii:

```
BLAD /req.php    — HTTP 500 FUNCTION_INVOCATION_FAILED
BLAD /health     — przekroczono 25 s
BLAD /config.php — przekroczono 25 s
```

`/req.php` dla nieznanej akcji nie dotyka bazy, a mimo to konczylo sie awaria.
Przyczyna: na Vercelu jedna instancja obsluguje wiele zapytan, wiec zerwane
polaczenie z Postgresem zglaszalo blad, ktorego nikt nie obslugiwal — Node
ubijal proces, a kolejne zapytania trafialy na martwa instancje.

Pula polaczen musi miec nasluch bledow. Bez niego jeden problem z baza
wyglada jak trzy rozne awarie.

## Gdy Vercel nie zauwazy wypchnietego commita

Zdarza sie, ze webhook nie zadziala. Kolejnosc dzialan:

1. Sprawdz, czy commit faktycznie jest na GitHubie (zakladka Commits).
2. W Vercelu: **Deployments** — czy najnowsze wdrozenie ma status Ready
   i ktory commit jest oznaczony jako Current.
3. Wymus wdrozenie: **Deployments → ⋯ przy najnowszym → Redeploy**.
   Uwaga: to przebuduje ten sam commit, nie nowszy.
4. Zeby zbudowac nowszy commit, potrzebne jest nowe zdarzenie z Git —
   najprosciej wypchnac kolejna zmiane.

Warto tez sprawdzic w **Settings → Git**, czy galaz produkcyjna zgadza sie
z ta, na ktorej pracujesz. Repozytorium nie ma `main`; jedyna galezia
z kodem jest `claude/shakes-fidget-github-setup-qlour5`.

## Kolejnosc diagnozowania

Gdy cos nie dziala, warto isc od zewnatrz do srodka — kazdy krok wyklucza
cala warstwe:

1. **Czy wdrozony jest wlasciwy commit?** → `?debug=1`, pierwsza linijka
2. **Czy funkcja zyje?** → `/version`
3. **Czy jest baza?** → `/health`
4. **Czy klient dostaje konfiguracje?** → `/config.php`
5. **Czy sa zasoby?** → `/res/sfgame_edit.swf`

Czarny ekran w grze nie mowi nic sam z siebie — moze pochodzic z kazdej
z tych piatki warstw. Dlatego powstala strona `?debug=1`.
