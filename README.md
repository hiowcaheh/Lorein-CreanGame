# Lorein / CreanGame — serwer gry (silnik typu Shakes & Fidget)

Prywatna przerobka silnika gry przegladarkowej: klient Flash (`.swf`, uruchamiany
przez Ruffle) + backend w PHP + baza MariaDB/MySQL. Repozytorium zawiera zarowno
serwer, jak i **zrodla klienta** (`.fla` + klasy ActionScript 3).

## Stos technologiczny

| Warstwa       | Technologia                                            |
|---------------|--------------------------------------------------------|
| Klient        | Flash / ActionScript 3, uruchamiany przez Ruffle        |
| Backend       | PHP 8.3, PDO, bez frameworka                            |
| Baza          | MariaDB 12.x / MySQL, InnoDB, `utf8mb4`                 |
| Panel i sklep | PHP + jQuery 1.9                                        |

## Struktura repozytorium

```
sf555/          # katalog gry — to jest webroot wystawiany przez serwer WWW
client-src/     # zrodla klienta Flash (.fla, .swf, klasy .as) — NIE na serwer
docs/           # dokumentacja techniczna
.github/        # workflow importujacy paczki ZIP
```

### `sf555/` — serwer gry

```
index.php        # strona startowa: osadza klienta Flash + czat globalny
config.php       # konfiguracja wysylana do klienta (format "klucz<TAB>wartosc")
req.php          # CALY backend gry: routing akcji, walka, przedmioty, gildie
globals.php      # sesja, autoryzacja czatu, tablica smilies, grupy uzytkownikow
chat.php         # API czatu globalnego (JSON), formatowanie BBCode i emotikon
dbconnect.php    # polaczenie PDO z baza
papaya_cfg.php   # konfiguracja sklepu grzybow — plik tekstowy, bez kodu PHP
crossdomain.xml  # polityka cross-domain dla klienta Flash
DATABASE.sql     # schemat bazy + dane startowe
favicon.ico

admin/           # panel administracyjny (12 podstron)
shop/            # sklep za grzyby (6 kategorii)
lang/            # tlumaczenia klienta — 22 jezyki + plik Papaya
res/             # zasoby: klient .swf, grafiki, chat.js/css, skrypty JS
```

Panel administracyjny (`admin/pages/`): konfiguracja serwera, ustawienia gry,
edycja graczy i lochow, wiadomosci masowe, vouchery, moderacja czatu.

Sklep (`shop/categories/`): eliksiry, kowal, karczma, lochy, kolor nicku na
czacie, realizacja voucherow.

### `client-src/` — zrodla klienta

```
sfgame555.swf.fla        # projekt Adobe Animate / Flash
sfgame555.swf.swf        # skompilowany klient
sfgame555.swf_as/        # 207 klas ActionScript 3
  sfgame_fla/MainTimeline.as   # glowna logika klienta (~1,7 MB)
  com/hurlant/                 # as3crypto — AES, RSA, TLS, Base64
  fl/                          # komponenty Adobe Flash
  *.as                         # klasy przyciskow, pol tekstowych, czcionek
```

Katalog nie jest czescia webroota — nie kopiuj go na serwer produkcyjny.

## Jak to dziala (skrot)

1. Przegladarka laduje `index.php`, ktory uruchamia klienta Flash przez Ruffle.
2. Klient pobiera `config.php` i dostaje adresy serwera oraz szablon endpointu:
   `http://HOST/req.php?req=%1&random=%2`.
3. Kazda akcja gracza to jedno zapytanie GET do `req.php`. Parametr `req` to:
   - znaki 0–31  → `SSID` (token sesji gracza),
   - znaki 32–34 → kod akcji (np. `001` = rejestracja, `002` = logowanie),
   - reszta      → dodatkowe parametry akcji, rozdzielone `;`.
4. `req.php` przetwarza akcje i odsyla plaska tablice ~511 pol (`$ret`),
   ktora klient Flash mapuje po indeksach (`$SF_LEVEL = 7`, `$SF_SILVER = 13` itd.).

Czat globalny dziala obok gry: `chat.php` zwraca JSON, a `res/chat.js` odpytuje
go cyklicznie i renderuje wiadomosci w HTML-u `index.php`.

Konfiguracja rozbita jest na dwie tabele:
- `server_config` — ustawienia instancji (HOST, LANGUAGE, MAIL, EVENT, ...),
- `game_settings` — balans rozgrywki (szanse na grzyby, mnozniki pracy, questy, ...).

Szczegoly: [`docs/ARCHITEKTURA.md`](docs/ARCHITEKTURA.md).

## Uruchomienie lokalne

1. Zaimportuj `sf555/DATABASE.sql` do bazy `sf555`.
2. Ustaw dane dostepowe do bazy w `sf555/dbconnect.php`.
3. W tabeli `server_config` ustaw `HOST` na swoj adres (domyslnie `localhost/sf555`).
4. Wystaw katalog `sf555/` przez serwer WWW z PHP i wejdz na `index.php`.

Nazwa katalogu na serwerze musi zgadzac sie z wartoscia `HOST` — przy domyslnym
`localhost/sf555` gra musi lezec w katalogu `sf555`.

## Uwaga o koncach linii

Klient Flash parsuje niektore pliki bajt w bajt, wiec `.gitattributes` wylacza
dla nich normalizacje koncow linii (`-text`): `papaya_cfg.php`, `lang/*.txt`
i caly katalog `res/`. Nie zmieniaj tych regul — zamiana CRLF na LF potrafi
rozsypac parsowanie po stronie klienta.

## Import kolejnych paczek ZIP (dziala z telefonu)

W repozytorium jest workflow `.github/workflows/import-zip.yml`, ktory pobiera
archiwum spod podanego adresu, rozpakowuje je i zapisuje w repo. Cala praca
dzieje sie po stronie GitHuba — wystarczy przegladarka.

1. Zakladka **Actions** → **Import ZIP do repozytorium**.
2. **Run workflow**, ustaw adres archiwum i galaz docelowa (domyslnie
   `import/sf555-zip`).
3. Po zakonczeniu w podsumowaniu uruchomienia znajdziesz liste plikow z
   archiwum i ostrzezenia o plikach pominietych przez `.gitignore`.

Import trafia na osobna galaz, tworzona od nowa przy kazdym uruchomieniu, wiec
workflow mozna bezpiecznie puszczac wielokrotnie. Stare pliki sa zastepowane
zawartoscia archiwum (`rsync --delete`), wiec nie powstaja duplikaty;
`README.md`, `docs/`, `.gitignore`, `.gitattributes` i `.github/` sa chronione.

Jesli krok zapisu zwroci blad uprawnien, wlacz zapis dla Actions:
`Settings > Actions > General > Workflow permissions > Read and write permissions`.

## Wgrywanie plikow z komputera

**GitHub Desktop**: `File > Clone repository` → skopiuj pliki do sklonowanego
katalogu → `Commit` → `Push`.

**git z konsoli**:

```bash
git clone https://github.com/hiowcaheh/Lorein-CreanGame.git
cd Lorein-CreanGame
git add -A
git commit -m "Opis zmiany"
git push
```

O czym pamietac:

- **Limit rozmiaru**: GitHub odrzuca pliki powyzej 100 MB. Najwiekszy plik
  w repozytorium ma obecnie ok. 1,1 MB, wiec jest duzy zapas.
- **Nie wgrywaj** hasel produkcyjnych ani zrzutow bazy z danymi graczy
  (adresy e-mail, IP, hashe hasel). `.gitignore` blokuje juz `dump_*.sql`,
  `backup_*.sql`, `.env` i logi.
- **Prywatnosc repo**: jesli kod ma nie byc publiczny, ustaw
  `Settings > General > Danger Zone > Change repository visibility` na Private.
