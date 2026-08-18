# Co da sie w tej grze zmienic — analiza mozliwosci

Notatki z przegladu kodu serwera (`sf555/`) i zrodel klienta (`client-src/`).
Ocena trudnosci: **latwe** = sam PHP lub pliki tekstowe, **srednie** = PHP +
nowe grafiki, **trudne** = wymaga rekompilacji klienta Flash.

## 1. Cztery warstwy, w ktorych mozna grzebac

| Warstwa | Co obejmuje | Czy trzeba rekompilowac klienta |
|---|---|---|
| Baza `game_settings` | balans: szanse, mnozniki, koszty | nie |
| PHP (`req.php`, panel, sklep) | logika gry, przeciwnicy, przedmioty | nie |
| Zasoby `res/` | grafiki potworow, postaci, przedmiotow | nie |
| Klient (`client-src/`) | ekrany, menu, uklad interfejsu | **tak** |

Kluczowy wniosek: **wiekszosc zmian nie wymaga dotykania klienta**. Klient jest
w duzej mierze silnikiem renderujacym — dostaje z serwera liczby i sciezki do
plikow, a grafiki czyta z katalogu `res/`, a nie z wnetrza `.swf`.

## 2. Nowe potwory — LATWE

### Grafiki juz sa, i to z duzym zapasem

W `sf555/res/sfgame/scr/fight/monster/` lezy **475 plikow**:

- 274 numerowane `monsterNNN.jpg` (numery od 1 do 620),
- 100 z nazwa zahaszowana (patrz nizej),
- 100 portalowych `monster_portal_A_B.jpg`.

Questy losuja przeciwnika z zakresu `rand(1, 158)` (`req.php`,
`getQuestMonster`). Czyli **116 gotowych grafik potworow nie jest uzywanych
w questach** — numery od 159 w gore leza odlogiem.

Rozszerzenie puli to zmiana jednej liczby:

```php
$monster_id = rand(1, 158);   // przed
$monster_id = rand(1, 274);   // po — o ile grafiki o tych numerach istnieja
```

### Jak klient znajduje grafike

Z `MainTimeline.as` (okolice linii 14650) wynika reguła:

| Zakres ID | Sciezka pliku |
|---|---|
| `id >= 499` | `monster_portal_<A>_<B>.jpg`, gdzie A = `(id-499)/10+1`, B = `(id-499)%10+1` |
| `399 <= id < 499` | `monster<MD5(id + "ScriptKiddieLovesToPeek")>.jpg` |
| pozostale | `monster<id+1>.jpg` |

Srodkowy wariant to prosta obfuskacja nazw. Formula zostala zweryfikowana —
dla ID 399, 400, 450 i 498 wyliczony hash wskazuje na istniejacy plik:

```bash
printf '%s' "399ScriptKiddieLovesToPeek" | md5sum
# 018b70fc46811d87f59d83ccc7d2db91 → monster018b70fc46811d87f59d83ccc7d2db91.jpg
```

**Uwaga na przesuniecie o jeden**: w ostatnim wariancie klient sklada nazwe
z `id + 1`, wiec ID potwora `129` po stronie serwera renderuje plik
`monster130.jpg`. Przy pierwszym dodawaniu potwora warto to sprawdzic
empirycznie, zanim rozjedzie sie cala pula.

### Wlasna grafika potwora

Wrzucasz `monsterNNN.jpg` do katalogu z potworami i uzywasz numeru `NNN-1`
jako ID w kodzie. Zadnej rekompilacji klienta — obrazek jest zwyklym plikiem
pobieranym po HTTP.

### Potwory w lochach — jedna linijka na sztuke

`getDungMonster()` trzyma przeciwnikow jako pojedyncze wywolania konstruktora:

```php
case 1: return new Monster(10, 2, 48, 52, 104, 77, 470, 342, 513, 1694, 85, 129, 1287, -2, -1);
//                         │   │   └── piec statystyk ──┘  └dmg┘  hp   arm  │    exp  broń tarcza
//                         lvl class                                    ID grafiki
```

Kolejnosc argumentow: `lvl, class, str, agi, int, wit, luck, dmg_min, dmg_max,
hp, armor, id_grafiki, exp, weapon_id, shield_id`.

Zmiana statystyk bossa w lochu to edycja liczb w jednej linii. Tak samo
`getTowerMonster()` (wieza), `getRaidMonster()` (rajdy) i `getPortalMonster()`.

## 3. Nowa zakladka w menu — SREDNIE (wymaga klienta)

Menu boczne jest budowane w kliencie z **czytelnej listy 13 wywolan**
(`MainTimeline.as`, linie 12203–12216):

```actionscript
DefiniereInterfaceButton(BTN_IF_TAVERNE,   TXT_TAVERNE);
DefiniereInterfaceButton(BTN_IF_ARENA,     TXT_ARENA);
DefiniereInterfaceButton(BTN_IF_ARBEITEN,  TXT_ARBEITEN);
...
DefiniereInterfaceButton(BTN_IF_OPTIONEN,  TXT_OPTIONEN);
```

Kazdy przycisk to para: stala przycisku + ID tekstu z pliku jezykowego.
Pozycja wyliczana jest automatycznie (`POS_IF_BTN_Y + REL_IF_BTN_1 * iPosi++`),
wiec nowa pozycja sama sie ustawi.

Co trzeba zrobic na nowa zakladke:

1. **Klient**: nowa stala `BTN_IF_*`, nowy `TXT_*`, jedna linia
   `DefiniereInterfaceButton(...)`, obsluga w `InterfaceBtnHandler`
   i funkcja rysujaca ekran (wzorzec: 28 istniejacych funkcji `Show*Screen`).
2. **Jezyk**: nowy wpis w `lang/sfgame_pl.txt` (format `ID<TAB>tekst`).
3. **Serwer**: nowy kod akcji w `req.php` — dispatcher ma juz 77 `case`,
   dolozenie kolejnego jest mechaniczne.

To jedyna z trzech rzeczy o ktore pytasz, ktora **wymaga przebudowy klienta**.

## 4. Nowa klasa postaci — TRUDNE, ale wykonalne

Obecnie sa trzy klasy (`req.php`, linie 444–446):

```php
$CLASS_WARRIOR = 1;
$CLASS_MAGE    = 2;
$CLASS_ROUGE   = 3;
```

oraz osiem ras. Klasa nie jest jednak zdefiniowana w jednym miejscu — logika
rozsiana jest po **44 rozgalezieniach** w `req.php`. Kazde z nich zaklada
wartosci 1–3 i ma `default`, ktory dla nowej klasy da zero lub wartosc bledna:

| Miejsce | Co definiuje | Co da nowa klasa bez zmian |
|---|---|---|
| `loadDefaultStats()` | statystyki startowe | same dziesiatki, bez bonusow |
| `getPrimaryStatValue()` | statystyka glowna | **0 — postac nie zadaje obrazen** |
| `Char::__construct` (`$k`) | mnoznik zycia | `$k = 1`, czyli ~5× mniej HP niz wojownik |
| `getStatName` / `PrimaryAttrTitle` | opisy w interfejsie | `Str` niezaleznie od prawdy |
| `getStatCost()` | koszt podnoszenia statystyk | do uzupelnienia |
| `genItem()` | generowanie przedmiotow | brak przedmiotow dla klasy |
| `hasShield()` | tarcza tylko dla klasy 1 | brak tarczy |

Do tego dochodza zasoby:

- **Grafiki przedmiotow**: katalog `res/sfgame/itm/` trzyma je w schemacie
  `typ-klasa` — `1-1`, `1-2`, `1-3` (bronie dla trzech klas), `3-1`…`3-3`
  (napiersniki) itd. Nowa klasa oznacza nowe katalogi `1-4`, `3-4`, `4-4`,
  `5-4`, `6-4`, `7-4`. To **okolo 530 plikow graficznych** — najwiekszy koszt
  calego przedsiewziecia. Da sie zaczac od skopiowania grafik istniejacej
  klasy i podmieniania ich stopniowo.
- **Przycisk wyboru klasy**: `res/sfgame/scr/buildchar/` zawiera dokladnie trzy
  — `button_warrior_idle.jpg`, `button_mage_idle.jpg`, `button_hunter_idle.jpg`.
  Nowy trzeba dorobic.
- **Klient**: ekran tworzenia postaci obsluguje trzy pozycje; obsluge czwartej
  trzeba dopisac i zrekompilowac.

Realistyczna kolejnosc: najpierw uruchomic klase 4 po stronie serwera na
skopiowanych grafikach klasy 3, sprawdzic czy walka i sklepy dzialaja, dopiero
potem podmieniac grafike i tuningowac balans.

## 5. Rzeczy latwe, ktore daja duzy efekt

Zanim zabierzesz sie za klase — to sa zmiany na jedno popoludnie, bez klienta:

| Zmiana | Gdzie | Trudnosc |
|---|---|---|
| Balans: szanse na grzyby, mnoznik pracy, nagrody z questow | tabela `game_settings` | trywialne |
| Wszystkie teksty i nazwy w grze | `lang/sfgame_pl.txt` (3293 linie) | trywialne |
| Statystyki bossow w lochach, wiezy, rajdach | `req.php`, jedna linia na potwora | latwe |
| Rozszerzenie puli potworow questowych o 116 gotowych grafik | `getQuestMonster()` | latwe |
| Wlasne grafiki potworow | wrzucenie plikow do `res/` | latwe |
| Nowy towar w sklepie za grzyby | `shop/categories/` | latwe |
| Nowa podstrona panelu admina | `admin/pages/` | latwe |
| Wyglad postaci (oczy, brody, fryzury) | `res/sfgame/char/<rasa> <plec>/` — 238 plikow na sam typ „human m" | srednie |

## 6. Jak edytowac klienta

Zrodla sa kompletne: projekt `sfgame555.swf.fla` plus 207 klas ActionScript 3.
Dwie drogi:

- **Adobe Animate** — otwiera `.fla`, pelna kontrola nad grafika i kodem,
  eksport do `.swf`. Wymaga platnej licencji.
- **JPEXS Free Flash Decompiler** — darmowy, edytuje ActionScript
  bezposrednio w pliku `.swf` i zapisuje go z powrotem. Wystarcza do zmian
  w kodzie (nowa zakladka, obsluga nowej klasy), nie zastapi Animate przy
  powazniejszych zmianach graficznych.

Po rekompilacji podmieniasz `sf555/res/sfgame555.swf`, a `client-src/`
aktualizujesz w repozytorium, zeby zrodla nie rozjechaly sie z wersja na
serwerze.

## 7. Czego nie ruszac bez potrzeby

- **Indeksy pol w tablicy `$ret`** (`req.php`) — klient czyta odpowiedz po
  numerach pol. Przesuniecie indeksu psuje interfejs w losowych miejscach.
- **Pole 62 w `config.php`** — zaszyfrowany blob weryfikowany przez klienta.
- **Konce linii w `papaya_cfg.php` i `lang/*.txt`** — klient parsuje je
  bajt w bajt (patrz `.gitattributes`).
