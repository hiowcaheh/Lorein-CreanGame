# Hosting i bezpieczne podlaczenie bazy danych

## 1. Dlaczego gra nie zadziala na GitHub Pages

GitHub Pages to hosting **plikow statycznych**. Serwuje HTML, CSS, JS, obrazki
i nic wiecej — nie ma tam interpretera PHP ani bazy danych.

Gra sklada sie z 45 plikow PHP, ktore wykonuja sie po stronie serwera:
`req.php` (calosc logiki), `chat.php`, `config.php`, panel admina, sklep.
Na Pages te pliki nie zostana wykonane.

Co gorsza — **zostana wystawione jako tekst do pobrania**. Gdyby ustawic
publikowanie z korzenia repozytorium, kazdy moglby wejsc pod adres
`.../sf555/dbconnect.php` i zobaczyc dane dostepowe do bazy. Dlatego workflow
`.github/workflows/pages.yml` publikuje **wylacznie katalog `site/`** i ma krok,
ktory zatrzymuje wdrozenie, gdyby trafil tam jakikolwiek plik `.php`, `.sql`
lub `.env`.

Pages nadaje sie wiec na wizytowke projektu z linkiem do gry — i tak jest to
tutaj uzyte. Sama gra musi stac gdzie indziej.

## 2. Gdzie postawic gre

| Wariant | Koszt | Uwagi |
|---|---|---|
| **Hosting wspoldzielony z PHP + MySQL** | kilka zl/mies. | Najprostszy. Baza zwykle tylko z `localhost`, co jest zaleta. Masz juz taki serwer (`sfprivate-555.7m.pl`). |
| **VPS z Dockerem** | ~20 zl/mies. | Pelna kontrola. W repozytorium jest gotowy `docker-compose.yml`. |
| **Lokalnie na wlasnym komputerze** | 0 zl | Do testow. `docker compose up -d`, gra na `http://localhost:8080`. |

Przy wariancie hostingowym wgrywasz na serwer **wylacznie zawartosc katalogu
`sf555/`**. Katalogi `client-src/`, `deploy/`, `site/`, `docs/` i `.github/`
nie maja tam czego szukac.

## 3. Bezpieczne podlaczenie bazy — siedem warstw

Repozytorium jest publiczne, wiec zalozenie jest proste: **kod moze zobaczyc
kazdy, dane dostepowe nikt**.

### 3.1. Zadnych hasel w repozytorium

`dbconnect.php` nie zawiera juz zadnych danych logowania. Czyta je w kolejnosci:

1. zmienne srodowiskowe procesu (`SF_DB_HOST`, `SF_DB_PORT`, `SF_DB_NAME`,
   `SF_DB_USER`, `SF_DB_PASS`),
2. plik `sf555/.env` lezacy obok — zablokowany w `.gitignore`.

Konfiguracje tworzysz raz, na serwerze:

```bash
cp sf555/.env.example sf555/.env
nano sf555/.env
```

### 3.2. Brak konfiguracji = swiadomy blad

Gdy brakuje danych, `dbconnect.php` konczy dzialanie z komunikatem
`SQL Error`, a powod trafia do logu serwera. Nie ma cichego fallbacku na
`root`/`root` — to bylby najgorszy mozliwy scenariusz przy publicznym kodzie.

### 3.3. Konto aplikacyjne zamiast roota

Gra **nie wykonuje ani jednego polecenia DDL** — sprawdzone w 45 plikach PHP:
zero `CREATE`, `ALTER`, `DROP`, `TRUNCATE`. Potrzebuje wylacznie czterech
uprawnien:

```sql
GRANT SELECT, INSERT, UPDATE, DELETE ON `sf555`.* TO 'sf555_app'@'localhost';
```

Gotowy skrypt: [`db_user.sql`](db_user.sql). Konto **nie ma** praw `DROP`,
`ALTER`, `GRANT OPTION` ani `FILE`. Skutek: nawet udany SQL injection nie
skasuje tabeli, nie zalozy nowego administratora bazy i nie odczyta plikow
z dysku serwera.

### 3.4. Baza niewidoczna z internetu

Najczestszy blad przy stawianiu serwera gry: wystawienie portu 3306 na swiat.
Zabezpieczenia:

- konto zdefiniowane jako `'sf555_app'@'localhost'` dziala tylko z tej samej
  maszyny — polaczenie z zewnatrz zostanie odrzucone nawet ze znanym haslem,
- w `docker-compose.yml` uslugi `db` **celowo nie ma sekcji `ports`** — baza
  jest widoczna wylacznie dla kontenera z gra, w prywatnej sieci Dockera,
- kontener gry nasluchuje na `127.0.0.1:8080`, a nie `0.0.0.0`.

Weryfikacja z innej maszyny — poprawny wynik to odmowa polaczenia:

```bash
nc -zv adres-serwera 3306
```

### 3.5. Dlugie, losowe, unikalne haslo

```bash
openssl rand -base64 24
```

Haslo uzywane wylacznie do tej bazy. Jesli wyciekly logi lub zrzut ekranu —
wymieniasz je, a nie zastanawiasz sie, gdzie jeszcze bylo uzyte.

### 3.6. Bledy do logu, nie do przegladarki

Komunikaty PDO potrafia zawierac nazwe uzytkownika i hosta bazy. W kodzie
gracz widzi tylko `SQL Error`, a pelna tresc idzie przez `error_log()` do
logu serwera.

### 3.7. Blokada dostepu do plikow konfiguracyjnych przez HTTP

`sf555/.htaccess` blokuje pobieranie `.env`, plikow `.sql` i katalogow `.git`,
oraz wylacza listowanie katalogow. Na Nginx trzeba to samo ustawic w konfiguracji
serwera:

```nginx
location ~ /\.(env|git) { deny all; }
location ~ \.sql$       { deny all; }
```

## 4. Uruchomienie przez Docker

```bash
cp .env.example .env          # ustaw wlasne hasla
docker compose up -d
```

Gra: `http://localhost:8080`. Schemat bazy wgrywa sie automatycznie przy
pierwszym starcie pustej bazy. Po starcie ustaw jeszcze `HOST` w tabeli
`server_config` na adres, pod ktorym gra jest dostepna.

## 5. Zanim wystawisz serwer publicznie

- [ ] Zmienione haslo bazy, konto `sf555_app` zamiast `root`
- [ ] Port 3306 niedostepny z internetu
- [ ] `sf555/.env` istnieje na serwerze i **nie jest** w repozytorium
- [ ] HTTPS przed serwerem (Let's Encrypt / proxy hostingu)
- [ ] `crossdomain.xml` zawezony do wlasnej domeny — obecnie stoi otworem
      dla `domain="*"` (patrz `docs/ARCHITEKTURA.md`, punkt 11)
- [ ] Hasla graczy przeniesione z `md5()` na `password_hash()`
      (`docs/ARCHITEKTURA.md`, punkt 1)
- [ ] Zmienione domyslne haslo panelu administracyjnego
- [ ] Kopie zapasowe bazy — i sprawdzenie, ze da sie z nich odtworzyc dane

Ostatnie dwa punkty z listy dotycza danych graczy: adresy e-mail i adresy IP
sa danymi osobowymi, wiec zrzut bazy nie moze trafic do repozytorium.
`.gitignore` blokuje juz `dump_*.sql` i `backup_*.sql`.
