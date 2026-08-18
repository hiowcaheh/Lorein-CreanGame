# Lorein / CreanGame — serwer gry (silnik typu Shakes & Fidget)

Prywatna przerobka silnika gry przegladarkowej: klient Flash (`.swf`, uruchamiany
przez Ruffle) + backend w PHP + baza MariaDB/MySQL.

## Stos technologiczny

| Warstwa   | Technologia                                              |
|-----------|----------------------------------------------------------|
| Klient    | Flash (`res/sfgame_edit.swf`) uruchamiany przez Ruffle     |
| Backend   | PHP 8.3, PDO, bez frameworka                              |
| Baza      | MariaDB 12.x / MySQL, InnoDB, `utf8mb4`                    |
| Hosting   | Apache/Nginx + PHP, baza pod hostem `db` (Docker)          |

## Struktura plikow

Katalog glowny repozytorium = katalog glowny serwera WWW (webroot).

```
index.php        # strona startowa: osadza klienta Flash + czat globalny
config.php       # konfiguracja wysylana do klienta (format "klucz<TAB>wartosc")
req.php          # CALY backend gry: routing akcji, walka, przedmioty, gildie
globals.php      # sesja, autoryzacja czatu, tablica smilies, grupy uzytkownikow
dbconnect.php    # polaczenie PDO z baza
papaya_cfg.php   # konfiguracja Papaya (sklep grzybow) — plik tekstowy, bez kodu PHP
crossdomain.xml  # polityka cross-domain dla klienta Flash
DATABASE.sql     # schemat bazy + dane startowe (server_config, game_settings, witch)
res/             # (do wgrania) klient .swf, grafiki, chat.js, chat.css, smilies
```

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

Konfiguracja rozbita jest na dwie tabele:
- `server_config` — ustawienia instancji (HOST, LANGUAGE, MAIL, EVENT, ...),
- `game_settings` — balans rozgrywki (szanse na grzyby, mnozniki pracy, questy, ...).

## Uruchomienie lokalne

1. Zaimportuj `DATABASE.sql` do bazy `sf555`.
2. Ustaw dane dostepowe do bazy w `dbconnect.php`.
3. W tabeli `server_config` ustaw `HOST` na swoj adres (np. `localhost/sf555`).
4. Wystaw katalog przez serwer WWW z PHP i wejdz na `index.php`.

## Jak dodac do repozytorium reszte plikow gry

Repozytorium zawiera na razie tylko pliki startowe. Reszte (`globals.php`,
katalog `res/` z klientem `.swf` i grafikami, panel admina, `support/` itd.)
wgrywasz **ze swojego komputera**, zachowujac oryginalna strukture katalogow.

### Wariant A — GitHub Desktop (najprostszy)

1. Zainstaluj GitHub Desktop → `File > Clone repository` → wybierz to repo.
2. Skopiuj **cala zawartosc** folderu z gra do sklonowanego katalogu
   (pliki maja trafic bezposrednio do korzenia, nie do podfolderu).
3. W GitHub Desktop wpisz opis zmiany → `Commit to main` → `Push origin`.

### Wariant B — git z linii polecen

```bash
git clone https://github.com/hiowcaheh/Lorein-CreanGame.git
cd Lorein-CreanGame

# skopiuj tu cala zawartosc folderu z gra, a potem:
git add -A
git commit -m "Dodanie pelnych zrodel gry"
git push -u origin main
```

### Wariant C — przegladarka (male paczki plikow)

Na stronie repozytorium: `Add file > Upload files` i przeciagnij pliki lub
folder. Ograniczenia: max 100 plikow na raz i 25 MB na plik.

### O czym pamietac przy wgrywaniu

- **Limit rozmiaru**: GitHub odrzuca pliki powyzej 100 MB i ostrzega powyzej 50 MB.
  Duzy plik `.swf` sprawdz przed wgraniem (`ls -lh res/*.swf`). Jesli przekracza
  limit — uzyj Git LFS (`git lfs track "*.swf"`).
- **Nie wgrywaj**: hasel produkcyjnych, zrzutow bazy z danymi graczy (adresy
  e-mail, IP, hashe hasel), kluczy platnosci. `.gitignore` blokuje juz
  `dump_*.sql`, `backup_*.sql`, `.env` i logi.
- **Prywatnosc repo**: jesli kod ma nie byc publiczny, ustaw
  `Settings > General > Danger Zone > Change repository visibility` na Private.
