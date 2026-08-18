# Architektura silnika — notatki techniczne

Notatki z analizy plikow `index.php`, `config.php`, `req.php`, `dbconnect.php`
i `DATABASE.sql`. Punkt wyjscia do dalszych przerobek.

## 1. Protokol klient ↔ serwer

Klient Flash komunikuje sie z serwerem wylacznie przez GET na `req.php`:

```
http://HOST/req.php?req=<SSID><AKCJA><PARAMETRY>&random=<liczba>
```

Rozbior parametru `req` (`req.php`, sekcja dispatchera):

```php
$SSID         = substr($req, 0, 32);   // token sesji, kolumna user_data.ssid
$action       = substr($req, 32, 3);   // trzycyfrowy kod akcji
$action_extra = substr($req, 35);      // parametry rozdzielone ';'
```

Odpowiedz to plaska tablica `$ret` (~511 pol) wypelniana wartoscia `'0'`
i indeksowana przez stale `$SF_*`. Klient czyta wynik po numerze pola, wiec
**kolejnosc i indeksy pol sa czescia kontraktu** — nie wolno ich przesuwac.

Przyklady stalych pol:

| Stala             | Indeks | Znaczenie          |
|-------------------|--------|--------------------|
| `$SF_PLAYER_ID`   | 1      | ID gracza          |
| `$SF_LEVEL`       | 7      | poziom             |
| `$SF_EXP`         | 8      | doswiadczenie      |
| `$SF_HONOR`       | 10     | honor              |
| `$SF_SILVER`      | 13     | srebro             |
| `$SF_MUSH`        | 14     | grzyby             |
| `$SF_STATUS`      | 45     | aktualna aktywnosc |
| `$SF_ACT_ENDTIME` | 47     | koniec aktywnosci  |
| `$SF_TOWER_LEVEL` | 513    | poziom wiezy       |

## 2. Kody akcji (wybor)

| Kod   | Stala                    | Akcja                    |
|-------|--------------------------|--------------------------|
| `001` | `$ACT_REGISTER`          | rejestracja konta        |
| `002` | `$ACT_LOGIN`             | logowanie                |
| `004` | `$ACT_HERO`              | ekran bohatera           |
| `010` | `$ACT_TAVERN_ENTER`      | karczma / zakonczenie questu |
| `011` | `$ACT_ARENA_ENTER`       | arena                    |
| `012` | `$ACT_WORK_ENTER`        | praca                    |
| `013` | `$ACT_ENTER_SHOP_SHAKES` | sklep Shakesa            |
| `014` | `$ACT_ENTER_SHOP_FIDGET` | sklep Fidgeta            |
| `022` | `$ACT_GAMBLE`            | hazard                   |
| `101` | `$ACT_CREATE_GUILD`      | zalozenie gildii         |
| `114` | `$ACT_GUILD_COMMENCE_ATTACK` | atak gildii          |
| `312` | `$ACT_SCREEN_TOWER`      | wieza                    |
| `322` | `$ACT_SCREEN_WITCH`      | wiedzma                  |
| `516` | `$ACT_SEND_CHAT`         | wyslanie wiadomosci czatu |

Pelna lista stalych `$ACT_*` znajduje sie na poczatku `req.php`.

## 3. Model obiektowy (`req.php`)

| Klasa      | Rola                                                        |
|------------|-------------------------------------------------------------|
| `SF_Calc`  | wyliczenia balansu (koszty, mnozniki)                        |
| `Char`     | bazowa postac: statystyki, HP, obrazenia, logika walki       |
| `Monster`  | `extends Char` — przeciwnicy z questow, lochow, wiezy, portali |
| `Copycat`  | `extends Char` — kopie gracza (wieza / Copycat)              |
| `Album`    | album potworow i przedmiotow                                 |

Okolo 50 funkcji globalnych, glowne grupy:

- **generowanie przeciwnikow** — `getQuestMonster`, `getDungMonster`,
  `getTowerMonster`, `getRaidMonster`, `getPortalMonster`, `getGuildPortalMonster`
- **przedmioty i sklepy** — `genItem`, `genNewItem`, `enterShop`,
  `rerollItems`, `rerollOneShop`, `changeItem`, `findFreeSlot`
- **walka** — `generateGuildBattle`, `generateRaidBattle`, `reverseArenaLog`,
  `reverseGuildWarLog`, `calculateHonor`, `calculateGuildHonor`,
  `calculateSilverArena`
- **dane gracza** — `loadCharData`, `loadDefaultData`, `loadDefaultStats`,
  `loadGuildData`, `loadWitchData`, `loadDefaultCopycatData`
- **progresja** — `getQuestExperience`, `getStatCost`, `getGoldForWork`,
  `mountCost`, `mountMultiplier`, `getGuildBuildingCost`, `getRaidCost`

## 4. Baza danych

19 tabel, `InnoDB`, `utf8mb4_unicode_ci`.

**Gracze i postac**
- `user_data` — jedna szeroka tabela ze wszystkim: konto, statystyki, questy,
  mikstury, gildia, lochy `dungeon_1..13`, wieza, Copycat, medale, toaleta, portal
- `user_fights` — historia walk PvP
- `tower_helper_items` — ekwipunek pomocnikow z wiezy

**Przedmioty** (osobna tabela na kazde zrodlo)
- `items` — ekwipunek i plecak gracza
- `items_shakes`, `items_fidget` — asortyment sklepow
- `items_tavern` — nagrody z questow

**Gildie**
- `guilds`, `guild_chat`, `guild_invites`, `guild_attacks`, `guild_attacks_archive`

**Reszta**
- `server_config` — ustawienia instancji (HOST, LANGUAGE, EVENT, SEASON_EPICS…)
- `game_settings` — balans (`MUSH_CHANCE`, `QUEST_EXP`, `WORK_MULTIPLIER`…)
- `messages`, `chat`, `banned_ips`, `vouchers`, `witch`

## 5. Miejsca wymagajace uwagi przy przerobkach

Lista rzeczy, ktore warto poprawic — kolejnosc mniej wiecej wg wagi:

1. **Hasla trzymane jako `md5()`** (`req.php`, rejestracja). Docelowo
   `password_hash()` / `password_verify()` z migracja przy logowaniu.
2. **`error_reporting(0)`** w `dbconnect.php` ukrywa wszystkie bledy — utrudnia
   diagnostyke. Warto wlaczyc logowanie do pliku zamiast calkowitego wyciszenia.
3. **Dane dostepowe do bazy zapisane w kodzie** (`root`/`root`) — przeniesc do
   zmiennych srodowiskowych.
4. **Brak `PDO::ATTR_ERRMODE => ERRMODE_EXCEPTION`** — bledy SQL przechodza cicho.
5. **`SET sql_mode=""`** wylacza tryb scisly bazy; ukrywa bledy typow i obciec.
6. **Mieszane zapytania**: czesc uzywa `prepare()` z parametrami, czesc
   `$db->query()` ze sklejanym SQL — te drugie trzeba przejrzec pod katem SQL injection.
7. **`req.php` ma ~10 400 linii** w jednym pliku. Przy powazniejszych zmianach
   warto rozbic go na moduly (walka, przedmioty, gildie, konto).
8. **Twarde zaleznosci od `img.playa-games.com`** w `config.php` (pola 2, 3, 48) —
   do podmiany na wlasny CDN.
9. **Zahardkodowane teksty i jezyk** w `index.php` (regulamin czatu, komunikaty)
   oraz mieszanka jezykow (polski + slowacki `servername = 's1.sfgame.cz'`).
10. **Pole 62 w `config.php`** to zaszyfrowany blob przekazywany klientowi —
    nie ruszac bez znajomosci formatu, klient go weryfikuje.
11. **`crossdomain.xml` otwarty na osciez** — `domain="*"`, `headers="*"`,
    `secure="false"`, `permitted-cross-domain-policies="all"`. Dowolna strona
    moze wykonywac zapytania do serwera w imieniu zalogowanego gracza.
    Docelowo zawezic do wlasnych domen i wlaczyc `secure="true"` (HTTPS).
12. **Dwa niezalezne mechanizmy sesji**: gra identyfikuje gracza przez `SSID`
    w URL-u (`req.php`), a czat przez `$_SESSION['user_ssid']` (`globals.php`).
    Trzeba pamietac o obu przy zmianach w logowaniu i wylogowaniu.
13. **`SSID` w adresie URL** trafia do logow serwera, historii przegladarki
    i naglowka `Referer` — to de facto haslo sesyjne wystawione na widok.

## 6. Czat i platnosci

**Czat globalny** obsluguje `globals.php` + `index.php`:

- `auth()` — sprawdza `$_SESSION['user_ssid']` w tabeli `user_data`
- `loaduserdata()` — wczytuje wiersz gracza po `ssid`
- `get_group_name()` — mapuje kolumne `user_data.group`:
  `1` Gracz, `2` VIP, `3` Moderator, `4` Admin
- `get_color()` — kolumna `color` nadpisuje kolor grupy (`color1`, `color2`…)
- `$smilies` — 24 emotikony w formacie `"(usmiech)" => "usmiech.gif"`,
  pliki leza w `res/chat/smilies/`
- blokady czatu: `user_data.chat_ban_until`, wiadomosci w tabeli `chat`

Uwaga: `globals.php` zaczyna sie od `ob_start()`, wiec kazde wyjscie jest
buforowane — przy dodawaniu naglowkow HTTP trzeba o tym pamietac.

**Papaya (sklep grzybow)**: `papaya_cfg.php` to plik konfiguracyjny w formacie
`klucz<TAB>wartosc`, **bez znacznikow PHP** — serwer oddaje go doslownie,
a klient Flash (`res/papaya44.swf`) parsuje. Definiuje wyglad sklepu: czcionke,
grafiki przyciskow, pozycje obrazkow dilera, 10 „speciali" (akcje sezonowe)
i metody platnosci. Aktualnie aktywna jest jedna metoda o indeksie 9 („Free"),
czyli platnosci sa wylaczone — to wlasciwe ustawienie dla prywatnego serwera.
Sciezki do grafik sa wzgledne do `image root` = `res/sfgame/`.

Powiazania w `config.php`: pole 30 → `res/papaya44.swf`, pole 31 →
`papaya_cfg.php`, pole 56 → `html_payment.php` (plik jeszcze nie wgrany).
