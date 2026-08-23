# Lorein — nowa wersja gry

Aplikacja webowa odtwarzajaca stara gre przegladarkowa, do ktorej wlasciciel
repozytorium ma prawa autorskie. Stary klient Flash zostal zastapiony
wlasnym klientem w Reakcie, a stary protokol PHP — zwyklym API JSON.

## Zasada nadrzedna: kopia jeden do jednego

**Wyglad i zachowanie odtwarzamy co do piksela z oryginalu, nigdy „na oko".**
Kiedy cokolwiek dotyczy ukladu, rozmiaru, koloru, tekstu albo dzialania
ekranu, odpowiedz jest w zrodlach oryginalu, a nie we wlasnym wyczuciu:

| Czego szukac | Gdzie |
| --- | --- |
| polozenia, rozmiary, odstepy | `client-src/sfgame555.swf_as/sfgame_fla/MainTimeline.as` — stale `POS_*`, `REL_*`, `SIZE_*` |
| kolory i wielkosci pisma | tamze — `FontFormat_*` i `CLR_*` (np. `CLR_SFORANGE = 0xf0c042`, `FontFormat_Default` = 20 px) |
| napisy | `sf555/lang/sfgame_pl.txt` — numer pozycji odpowiada stalej `TXT_*` |
| grafika interfejsu | w srodku pliku SWF; wyciaga ja `backend/scripts/wyciagnij-grafike-swf.py` do `sf555/res/ui/` |
| grafika ekranow | `sf555/res/sfgame/` |
| potwory z lochow | `sf555/req.php` — `getDungMonster()`; 13 lochow po 10 poziomow, kazdy potwor to pietnascie liczb konstruktora `Monster`. Wyciaga je `backend/scripts/gen-lochy.mjs` |
| mapa klasera (ktory bit jest czym) | `MainTimeline.as` — `ShowAlbumContent()`. **Nie `req.php`**: tamtejszy `Album::getItemIndex()` kladzie epiki o 50 pozycji za nisko, w zakres, ktorego klient nigdy nie rysuje. Po liczbach z klienta kazdy dzial wychodzi co do jednego na `catMax = [252, 246, 506, 348, 348]`, razem 1700 |
| nazwy plikow przedmiotow i pociskow | `MainTimeline.as` — `GetItemFile()` i petla definiujaca `GetArrowID()`; port w `backend/src/game/grafikaPrzedmiotow.ts`. Sama para typ i numer NIE wyznacza pliku: wchodzi jeszcze barwa liczona ze statystyk |
| czcionka | Komika Text, osadzona w SWF; wyciaga ja `backend/scripts/wyciagnij-czcionke-swf.py` |

Przed zmiana wygladu: znajdz odpowiednia stala w `MainTimeline.as` i przepisz
jej wartosc. Kiedy stalej brakuje (np. ramka narysowana wprost na tle), zmierz
ja na obrazie tla, a nie zgaduj. Kazda taka liczba idzie do kodu **razem
z komentarzem, skad pochodzi** — inaczej za tydzien nikt nie wie, czy 254 to
pomiar, czy zgadywanka.

### Swiadome odstepstwa

Odstepstwo od zrodel jest dozwolone tylko wtedy, gdy zdecyduje o nim
wlasciciel gry, i tylko wpisane na te liste. Dopoki tu nie stoi, roznica
wzgledem oryginalu jest bledem do naprawienia, a nie decyzja.

| Gdzie | Na czym polega | Dlaczego |
| --- | --- | --- |
| `web/src/ekrany/karczma/Walka.tsx` — `box2.png` | Srodkowa ramka pokazuje sie DOPIERO po walce; w trakcie widac samo pole bitwy i przycisk „Pomin" | Klient 5.55 trzyma ja na scenie od poczatku (`AddBunch(BNC_SCREEN_FIGHT, ..., IMG_FIGHT_BOX2, ...)`, nigdzie jej nie zdejmuje), wiec przez cala walke stoi tam pusty szary prostokat. Wlasciciel gry pokazal zrzuty z gry, na ktorych w trakcie walki tej ramki nie ma. Samo UZUPELNIENIE ramki po walce jest jeden do jednego — zdanie, ikona zdobyczy, doswiadczenie i kwoty stoja na stalych `POS_FIGHT_*`. |
| `web/src/ekrany/karczma/Walka.tsx` — `walka-awans` | Pod ramka z wynikiem walki stoi napis o nowym poziomie | Oryginal pokazuje awans dopiero na ekranie postaci, przy pasku doswiadczenia (`LevelUpAniEvent`). Wlasciciel gry poprosil o widoczny awans zaraz po walce. Sama animacja podskoku jest przepisana z `LevelUpAniEvent` jeden do jednego. |
| `backend/src/game/karczma.ts` — `wylosujZadania()` | Przez dlugosc wyprawy mnozy sie CALA nagroda, a nie tylko czlon zalezny od poziomu | `req.php` dokłada ryczalt (`basexp` 200-300, `basegold` 30-70) POZA mnozeniem. Do okolo trzydziestego poziomu ryczalt przykrywa dlugosc i wyprawa za 20 minut placi tyle samo, co za 5 — a kosztuje cztery razy wiecej awanturniczosci. Kolejnosc losowan bez zmian, wiec dalej trafiaja sie wyprawy hojniejsze w zloto niz w doswiadczenie. |
| `web/src/ekrany/Sklep.tsx` — `postac-nazwa` | Pod portretem w obu sklepach stoi nick postaci | Oryginal nie wklada `CNT_SCR_CHAR_NAME` do `BNC_SCREEN_SHAKES` i `BNC_SCREEN_FIDGET`, wiec w sklepie nazwy postaci nie ma wcale. Wlasciciel gry poprosil o nick w obu sklepach. Miejsce jest to samo, co na ekranie postaci (`POS_CHAR_NAME`). Paska doswiadczenia z poziomem to NIE dotyczy — `CA_SCR_CHAR_EXPBAR` nalezy do obu wiazek sklepowych. |
| `web/src/ekrany/karczma/OknoWyboru.tsx` — `karczma-czas-wyprawy` | Czas wyprawy da sie klikac; pod spodem wychodzi, ile trwalaby pieszo i o ile skraca ja wierzchowiec | Oryginal pokazuje sam gotowy czas (`LBL_QO_TIME`) i nigdzie nie mowi, ile daje wierzchowiec. Wlasciciel gry poprosil o to wprost — bez tego nie widac, za co placi sie najem. Sama liczba czasu jest bez zmian. |
| `web/src/ekrany/OknoCechy.tsx` | Klikniecie „+" przy cesze otwiera okno z suwakiem: ile punktow, za ile i co ta cecha daje TEJ klasie. Pod torem stoi podzialka z liczba punktow, a „Ulepsz" i „Wroc" stoja OBOK siebie | Oryginal kupuje wprost z ekranu, a cene pokazuje tylko na czas najechania myszka (`BoostBtnOver`). Na dotyku nie ma czego najezdzac, a kazde stukniecie od razu kupuje. Wlasciciel gry poprosil o okno. Samo okno, suwak i przycisk sa przepisane z ekranu Warty (`okno.png` w `POS_IF_WIN`, `DefineSlider` w `POS_ARBEITEN_SLIDER`), przyciski stoja na `REL_ARBEITEN_BTN_Y`, a ceny licza sie z tego samego cennika, co przy pojedynczym zakupie — kolejny jest zawsze drozszy. Okno ma wiecej tresci niz Warta, wiec napis zaczyna sie wyzej (326 zamiast 340), a suwak nizej (434 zamiast 420). Pod soba przyciski sie nie mieszcza: przydymione WNETRZE okna konczy sie na `POS_IF_WIN_Y + 330` (pomiar alfy), a drugi wszedlby na ozdobna listwe. Podzialki z opisem oryginal nie ma — bez niej nie widac, co wybiera suwak. |
| `backend/src/game/cechy.ts` — `PUNKTOW_ZA_ZAKUP` | Jeden zakup podnosi cechę o JEDEN punkt, nie o trzy | `req.php` ma `$newStatVal = 3 + $db_data['stat']`, ale cennik jest indeksowany PUNKTEM: `TrueAttPreis[i] = GoldKurve[1 + i / 5]`, a potem wygladzenie po piec kolejnych. Przy skoku o trzy gracz przeskakuje dwie ceny za darmo i cecha rosnie trzy razy taniej, niz przewiduje krzywa. Wlasciciel gry zdecydowal: jeden do jednego. Sama krzywa i kolejnosc dzielen calkowitych bez zmian. |
| `web/src/ekrany/karczma/OknoWyboru.tsx` — premie | Przy nagrodzie podbitej premia stoi podskakujaca strzalka w gore, a klikniecie doswiadczenia rozpisuje, ile dokłada klaser i rzadkie zadanie. Kazda premia ma swoj kolor | Oryginal nie oznacza takiej nagrody niczym — podwiesza tylko podpowiedz (`EnablePopup(LBL_QO_REWARDEXP, ...)`), a na dotyku nie ma czego najezdzac. Wlasciciel gry poprosil o widoczny znak; strzalka to `btnClassArrowUp` z oryginalu. Sama tresc rozpisania jest jeden do jednego: „w tym" (`TXT_EXPBONUS_PREFIX`) i „Premia kolekcjonera" (`TXT_COLLECTION + 1`). Liczba doswiadczenia jest juz z premiami — tak samo, jak podaje ja `req.php`. Kolory sa nasze: kolekcjonerska blekitna (`--blekit`), rzadkie zadanie czerwone — nastepne premie (gildia, wieza) dostana swoje. |
| `web/src/gra/liczby.ts` oraz `Zasoby` w `App.tsx` | Na pasku zasobow SREBRO pokazuje sie tylko wtedy, gdy nie ma ani jednego zlota; dokladne kwoty wychodza po klikniecu | Oryginal pokazuje zawsze zloto RAZEM ze srebrem. Przy kilkunastu milionach cala kwota nie miescila sie w pasku i wychodzila poza ramke panelu. Probowalismy dwoch innych drog i obie wlasciciel gry ODRZUCIL: skracania kwot („18kk") — bo skrot gubi koncowke, oraz kolorowania po progach wielkosci — bo zloto ma zostac w swoim oryginalnym kolorze. Miejsce robi wiec schowanie srebra: ponizej stu srebra nic wartego tego miejsca nie mowi. |
| `web/src/gra/useLustro.ts` — blysk na koniec | Po wprawieniu OSTATNIEGO kawalka lustro blyska fala i kawalki znikaja z portretu | Samo ZNIKANIE jest jeden do jednego: oryginal przy pelnym lustrze wysyla same zera na bitach kawalkow i osobny znacznik (`$haveMirror`), a klient je zdejmuje. Znakiem konca jest tam DZWIEK — `SND_MIRROR`, czyli `sfx/tower/mirror.mp3`. Tego pliku nie ma w naszej paczce zasobow (calego katalogu `sfx/tower/` nie ma), wiec zamiast niego zostaje widoczny blysk. Sama fala jest przepisana z `MirrorAniFn` co do stalej: krok 25 ms, sila 0,2, gasniecie 0,002, faza +0,1. |
| `web/src/gra/OknoNagrody.tsx` | Kazda nagroda ma WLASNE okienko: klikniecie w doswiadczenie rozpisuje je na czlon podstawowy i kazda premie z osobna (w procentach I w punktach), klikniecie w pieniadze podaje zloto i srebro. Tak samo w karczmie przed wyprawa i po walce | Oryginal podwiesza pod doswiadczeniem sama podpowiedz z procentami (`EnablePopup(LBL_QO_REWARDEXP, ...)`), a przy pieniadzach nie ma nic — i na dotyku nie ma czego najezdzac. Wlasciciel gry poprosil, zeby kazda nagroda tlumaczyla SIEBIE. Punkty przy premiach licza sie z liczby, ktora przychodzi z serwera JUZ z premiami: podstawa to `wartosc / (1 + premie)`. Suma czlonow moze sie roznic od calosci o jeden punkt, bo kazdy jest osobno zaokraglony. |
| `web/src/gra/premie.ts` | Rozpisanie premii jest lista zrodel: klaser, rzadkie zadanie, gildia, wieza, serwerowe przedmioty — kazde ze swoim kolorem | Oryginal zna dwa zrodla (`$albumbonus`, `$rqbonus`) i nie pokazuje zadnego. Wlasciciel gry poprosil o widoczne rozpisanie i o miejsce na kolejne premie. Zrodlo, ktorego serwer nie odsyla, po prostu sie nie pokazuje — dolozenie nastepnego to jeden wiersz w `ZRODLA_PREMII`. |
| `web/src/gra/karczma-teksty.ts` — `doswiadczenieKrotko` | W oknie po walce zamiast „Doswiadczenie" stoi „EXP" | `LBL_FIGHT_REWARDEXP` bierze pelne slowo z pliku jezykowego (pozycja 102). Wlasciciel gry poprosil o skrot: przy kwotach z kropkami i znaczku premii pelne slowo zjadalo miejsce liczbie i ikonie zdobyczy. Okno wyboru zadania zostaje przy pelnym slowie. |
| `web/src/gra/PodpowiedzPrzedmiotu.tsx` — grzyby przy sprzedazy | W sklepie przy WLASNYM przedmiocie stoi to, co sklep ODDA (10 grzybow za epika, zero za reszte), a nie kolumna `mush` | Oryginal pokazuje zawsze `mush` przedmiotu, czyli jego cene ZAKUPU. Odkad sprzedaz oddaje ustalone 10 grzybow za epika (patrz wiersz o `api/sklep.ts`), podpowiedz klamala: „15 grzybow" przy rzeczy, za ktora dostaje sie 10. |
| `web/src/style/gra.css` — `--blekit-cytat` | Cytat epika ma wlasny, wyrazniej niebieski odcien `#9a9aff` | To odcien blizszy oryginalnemu `CLR_EPICITEMQUOTE = 0x8888FF` niz `--blekit`, ktory wpada w blekit. Wlasciciel gry poprosil, zeby cytat byl „bardziej niebieski" niz reszta premii. Rozjasniony tylko na tyle, zeby dalo sie go czytac na czarnym tle podpowiedzi. |
| `web/src/gra/ekranPostaci.ts` — `pustaTarcza()` | U maga i zwiadowcy w miejscu tarczy stoi POCISK ich zalozonej broni | Oryginal podstawia obrazek pod dziesiate miejsce wylacznie przy `ownerClass == 1`, wiec magowi i zwiadowcy zostaje pusty kwadrat, ktory o niczym nie mowi. Wlasciciel gry poprosil, zeby stala tam ikonka pocisku, ktory ta bron wypuszcza w walce. Sam plik jest z oryginalu — `GetArrowID()`, port w `backend/src/game/grafikaPrzedmiotow.ts`. Bez broni miejsce zostaje puste, tak jak bylo. |
| `web/src/ekrany/Bohater.tsx` — brak ikonki klasera | Ekran postaci NIE pokazuje ikonki Klasera Dokladnosci ani jej podpowiedzi; zostaje sam przycisk „Klaser" | Oryginal stawia `IMG_CHAR_ALBUM` w prawym gornym rogu (280 + 500 + 350, 100 + 20) i wiesza na niej podpowiedz „Znaleziono: N / 1700". Ikonke probowalismy przeniesc pod przycisk; wlasciciel gry zdecydowal, ze jest zbedna — te same liczby stoja na samym ekranie klasera, o jedno klikniecie dalej. |
| `web/src/gra/RozbicieCechy.tsx` | Klikniecie w ceche rozpisuje ja na czlon wlasny, przedmiotowy i miksturowy | Oryginal dostaje te czlony osobno (pola 30..34 i 35..39), ale pokazuje juz SUME — gracz nie widzi, ile daje ekwipunek. Wlasciciel gry poprosil o rozpisanie. Liczby sa te same, ktore serwer i tak liczy (`skladnikiCech` w `api/gracz.ts`), tylko podane osobno. |
| `web/src/ekrany/Sklep.tsx` — `PytanieOWymiane` | „Nowy towar" przy epiku na pólce pyta o potwierdzenie | Oryginal wymienia towar bez slowa, a epik trafia sie rzadko i po wymianie przepada. Wlasciciel gry poprosil o pytanie z nazwa przedmiotu. Samo okno jest z ekranu Warty: `okno.png` w `POS_IF_WIN`, przyciski obok siebie na `REL_ARBEITEN_BTN_Y` — te same stale, co okno cechy. |
| `backend/src/game/karczma.ts` — `PIW_NA_DOBE_PODSTAWA` | Podstawa to rowne DZIESIEC piw na dobe, a limit jest ruchomy dla kazdego gracza (`beers_bonus`) | Oryginal odrzuca zamowienie przy `beers >= 11`, wiec jedenaste piwo jeszcze wchodzi — przy liczniku „x/10" na kliencie; rozjazd jest w samym oryginale. Wlasciciel gry zdecydowal: podstawa rowna dziesiec, a dodatki (konto VIP piec, pomniejsze po jednym) maja sie doliczac graczowi osobno. Kolumna trzyma sam DODATEK, wiec podstawe da sie zmienic w jednym miejscu. |
| `web/src/gra/klaser.ts` — `ulozonyDzial()` | Klaser pokazuje pozycje od NAJNOWSZYCH zdobyczy do najstarszych; niezdobyte ida na koniec | Oryginal rozklada klaser na sztywno — strona i gniazdo wynikaja wprost z numeru bitu (`ShowAlbumContent()`), wiec pierwsza strona to zawsze te same przedmioty. Wlasciciel gry poprosil o kolejnosc od najswiezszych. Sam UKLAD strony jest bez zmian: cztery gniazda, te same rozmiary, te same napisy — zmienia sie wylacznie to, ktora pozycja gdzie stoi. Zdobycz bez daty (sprzed wprowadzenia kolumny) stoi za datowanymi, ale przed nieznanymi. |
| `web/src/ekrany/Klaser.tsx` — okienko pozycji | Kazda ikona ma przezroczysty guzik; klikniecie otwiera okienko z nazwa i data odblokowania co do sekundy | Oryginal wiesza na kazdej ikonie `EnablePopup(CNT_ALBUM_WEAPON_n + i)` BEZ tresci, wiec nie pokazuje nic. Wlasciciel gry poprosil o osobna date dla KAZDEGO przedmiotu, nie dla grupy — bity zapisuja sie osobno, wiec i daty sa osobne (piec barw jednego wzoru to piec zdobyczy i piec chwil). Nazwa barwy jest nasza („barwa 3 z 5"): `GetItemName` barwy nie zna i wszystkie piec nosi ta sama nazwe. |
| `web/src/gra/karczmaUklad.ts` — `OKNO_PRZEDMIOT` | Ikona zdobyczy stoi o 50 px w prawo od miejsca z oryginalu, a kolumna nagrod jest o tyle szersza | `REL_QO_SLOT = (400, 335)` stawia ja na wysokosci wiersza z doswiadczeniem. Odkad przy tym wierszu stoi znaczek premii, ikona na niego wchodzila. Przesunieta konczy sie na 950, a przyciski zaczynaja sie na 960 (`REL_QO_START_X = 550`) — miedzy nimi zostaje 10 px. |
| `web/src/ekrany/Lochy.tsx` — licznik przerwy | Ile zostalo do konca przerwy, stoi NA przycisku („31:30 (~P)"), a nie osobnym napisem obok | Oryginal ma tam `LBL_MAINQUEST_MUSHHINT` po lewej od przycisku, ale to miejsce zajmuje u nas „Wroc" — oryginal takiego przycisku nie ma, wychodzi sie krzyzykiem. Pelne zdanie z `TXT_MQ_MUSHHINT` zostalo jako podpowiedz przycisku. |
| `web/src/style/gra.css` — `--blekit` | Cytat epika, podpowiedz mikstury i premia kolekcjonera sa w odcieniu `#9ecbff` | `CLR_EPICITEMQUOTE` z oryginalu to `0x8888FF` — ciemniejszy i na czarnym tle gorzej czytelny. Jasniejszy odcien stoi na ekranie postaci od poczatku i wlasciciel gry wskazal go jako wzor dla kolejnych premii. |
| `web/src/ekrany/Grzybiarz.tsx` — panel testowy | Pod reka grzybiarza stoi panel z dziesiecioma przyciskami: awans o 1 i o 10, +10 mln i +100 mln zlota, +1000 grzybow, +1000 do kazdej z pieciu cech, wyzerowanie piw, powrot na pierwszy poziom, zlozenie lustra do dwunastu kawalkow z trzynastu i otwarcie wszystkich dziewieciu lochow | Oryginalu NIE MA CZEGO przepisac — to nie jest czesc gry, tylko narzedzie do przechodzenia przez ekrany bez rozgrywania kilkudziesieciu wypraw. Wlasciciel gry poprosil o nie wprost. Sa to CHEATY i na czas budowy stoja WLACZONE takze na wdrozeniu — zdejmuje je `LOREIN_PANEL_TESTOWY=0` i trzeba to zrobic, zanim do gry wejda obcy gracze. Powrot na pierwszy poziom cofa tez cechy do wartosci startowej rasy i klasy (`loadDefaultStats`) — inaczej postac zostalaby z setkami punktow na jedynce. |
| `web/src/ekrany/Lochy.tsx` — Wieza i Portal do piekiel | Kafle stoja na swoich miejscach w srodkowej kolumnie drugiej planszy, ale sa przykryte zaslona i nie daja sie klikac | Oba ekrany SA w oryginale i maja komplet danych: `getTowerMonster()` to sto pieter, a portal ma wlasne tla (`location_portal_1..10.jpg`) i akcje `ACT_PORTAL_FIGHT_SINGLE`. To osobne systemy — wieza ma mechanike pomocnikow (`tower_helper_items`, `ACT_COPYCAT_BOOST`), portal chodzi raz na dobe i wisi na gildii. Nie sa czescia lochow i czekaja na wlasna kolej. Sam uklad kafli, obrazki i animacja portalu (12 klatek z 24 plikow, `portalFrames = 12`) sa jeden do jednego. |
| `backend/src/game/generatorPrzedmiotow.ts` — klucz do wychodka | Z rodzaju 11 wypada odlamek lustra albo klucz do lochu; klucza do wychodka nie ma | Wychodka jeszcze nie ma, wiec nie ma czego otwierac. Same LOSOWANIA (`rand(1, 2)` dwa razy) zostaja w kodzie i sa zuzywane — bez nich caly dalszy ciag generatora rozjechalby sie z oryginalem. |
| `backend/src/game/ekwipunek.ts` — `czyMozeLezec()` | Bizuteria tez ma swoje jedno miejsce: naszyjnik idzie na naszyjnik, pierscien na pierscien, talizman na talizman | Oryginal konczy KAZDY ze swoich czterech warunkow czlonem `$item['item_type'] < 8`, wiec sprawdzenie miejsca omija rodzaje 8, 9 i 10: da sie tam wladowac pierscien w gniazdo naszyjnika i nosic trzy pierscienie naraz. Wlasciciel gry uznal to za blad — kazdy przedmiot ma miec swoje miejsce, tak jak buty czy helm. Sprawdzenie KLASY zostaje przy rodzajach 1-7, dokladnie jak w oryginale: bizuteria klasy nie ma (`item_id` ponizej tysiaca daje zawsze jedynke), wiec objecie jej tym warunkiem odcieloby ja magowi i zwiadowcy. Klient nie odmawia, tylko KIERUJE rzecz na jej wlasne miejsce (`celPrzeniesienia()`) — tak samo, jak oryginal przy upuszczeniu na ciało: `$in[3] = getSlotIndex($item['item_type'])`. |
| `backend/src/api/lochy.ts` — premia w lochu | Doswiadczenie z lochu jest podbite premia kolekcjonera. ZLOTA nie dotyczy zadna premia — ani w lochu, ani na wyprawie | `req.php` doklada w lochu `$OP->getExp()` i `$OP->getGold()` surowo: premie chodza tam wylacznie przy wyprawie (`finishQuest`). Wlasciciel gry poprosil, zeby klaser liczyl sie takze w lochu. Ma dotyczyc TYLKO doswiadczenia — tak samo, jak przy wyprawie, gdzie `$albumbonus` wchodzi do `$exp += quest_exp * ($ebonus + $albumbonus + $rqbonus)`, a zloto liczy sie osobnym wzorem `quest_gold * ($gbonus + $towerbonus)`, ktory klasera w ogole nie zna. Wzor premii bez zmian: `round(album / 1700, 2)`. Wlasne premie zlota z oryginalu (skarbiec gildii, przejsciowe lochy, wieza) SA w `zlotoZWyprawy()` i sa zerami — czekaja na te budynki. |
| `web/src/gra/lochyUklad.ts` — `PLANSZA` na ekranie lochu | Przydymiona plansza obejmuje CALA tresc razem z przyciskami, z rownym marginesem u gory i u dolu | Oryginal ma `SHP_MAINQUEST` w `POS_MQ_SQUARE` (470, 80) o rozmiarze `SIZE_MQ_SQUARE` 610x570, czyli konczaca sie na 650, a przyciski stawia PONIZEJ niej, na 670 (`REL_MQ_BUTTON_Y = -20` jest odejmowane). U nas wychodzily z tego dwie brzydkie rzeczy naraz: jasny pas pod plansza z dwoma przyciskami na nim oraz plansza przyklejona do gornej krawedzi obszaru gry — scena zaczyna sie na 100, a oryginal wpuszcza plansze 20 px na pas tytulu, wiec tej gornej krawedzi w oryginale po prostu nie widac. Wlasciciel gry poprosil o przyciski NA planszy i o rowna pusta przestrzen z gory i z dolu. Plansza liczy sie wiec z TRESCI (`MARGINES_PLANSZY`), a nie z wpisanych liczb. POLOZENIA TRESCI zostaja z oryginalu co do piksela: tytul 170, opis 210, przeciwnik (630, 330) z ramka o 10 px, przycisk prawa krawedzia na 1060. |
| `web/src/ekrany/Lochy.tsx` — opis lochu | Nazwa, motto, poziom i przeciwnik sa wysrodkowane | Oryginal ma ten blok do lewej (`FontFormat_DefaultLeft`), ale caly ekran jest osiowy — tytul i portret stoja na srodku. Wlasciciel gry poprosil o wysrodkowanie. |
| `backend/src/db/kolumny.ts` — dokladanie kolumn | Backend sam doklada brakujaca kolumne (`ADD COLUMN IF NOT EXISTS`), zamiast czekac na `npm run db:migruj` | `db/schema.sql` tworzy baze od zera i nie da sie go puscic na dzialajacej, a na Supabase nie ma pod reka `psql`. Bez tego kod juz kolumny uzywal, baza jeszcze jej nie miala i gra po cichu gubila funkcje — raz skonczylo sie to bledem 500 na klaserze. Gdy konto bazy nie ma prawa do zmiany schematu, zapytanie po prostu sie nie uda i wracamy do dzialania bez kolumny. |
| `backend/src/game/album.ts` — `album_dates` | Przy kazdej odblokowanej pozycji klasera zapisuje sie data i widac ja pod nazwa | Oryginal trzyma sam zapis bitowy i o datach nic nie wie. Wlasciciel gry poprosil o date znalezienia. Bity zostaja nietkniete — data idzie do OSOBNEJ kolumny (JSON `{numer bitu: czas uniksowy}`), wiec `album_data` dalej zgadza sie z oryginalem co do bitu. Pozycje sprzed wprowadzenia kolumny daty nie maja i po prostu jej nie pokazuja. |
| `web/src/ekrany/Grzybiarz.tsx` — pólka z paczkami | Ekran grzybiarza ma wlasna pólke z paczkami grzybow | Oryginalu NIE MA CZEGO przepisac: `ShowDealerScreen()` wklada w `IMG_SCR_DEALER_BG` zewnetrzna strone operatora platnosci i tylko ja wyswietla, wiec w pliku SWF nie ma ani jednej stalej opisujacej ten uklad. Z oryginalu zostaje tlo `dealer_old.jpg` i klatki reki (`pilzdealer_arm1..4`, polozenie ZMIERZONE na tle). Platnosci nie ma — ekran jest podgladem wygladu. |
| `backend/src/game/generatorPrzedmiotow.ts` — `grzyby` | Zwykly przedmiot nie kosztuje juz grzybow. Zostaje epik (15) i Eliksir Niesmiertelnosci (15) | Oryginal dokladal 10 grzybow do co siodmego przedmiotu (`$statNumRand`, ten z dwiema cechami) i 1 grzyb do co trzeciego pozostalego (`$mushRand`). Przez to zdobycz z wyprawy sprzedawalo sie za grzyby i waluta traciła sens. Losowania zostaly w kodzie — `dwieCechy` dalej decyduje o liczbie cech, a kazde pominiete losowanie przesunieloby caly ciag generatora. |
| `backend/src/api/sklep.ts` — sprzedaz | Za epika wraca 10 grzybow; za wszystko inne zero | Oryginal oddaje kolumne `mush` przedmiotu, a zakup ja zeruje („grzyby przepadaja") — epik kupiony za 15 grzybow nie oddawal wiec nic. Wlasciciel gry poprosil o zwrot 10 grzybow za epika, zeby dalo sie wymienic niepotrzebna czesc na nastepna. Liczy sie to, czym przedmiot JEST (numer obrazka >= 50), a nie ile za niego zaplacono. |
| `backend/src/game/walka.ts` — `WzorObrazenPotwora` | Potwor z wyprawy liczy obrazenia wzorem `bron x (1 + glowna/10)` ze swojej cechy glownej, a nie `bron x glowna_gracza / 50` z `getQuestMonster()` | Wzor z `req.php` daje potworowi okolo 1/5 sily ciosu gracza na kazdym poziomie — 300 walk na 300 wygranych przy ubytku 7% zycia. Reszta `req.php` (gracz, arena, kopie z wiezy) liczy wlasnie `x (1 + glowna/10)`. Oryginalny wzor zostaje w kodzie pod `'oryginalne'` i to na nim pracuje test roznicowy. |

## Scena

Oryginal to sztywna scena 1280x800:

```
pas z tytulem      (0,   0) 1280x100
panel menu         (0, 100)  280x700
ekran gry        (280, 100) 1000x700
```

Kazde `left`, `top`, `width` i `font-size` w `web/src/style/gra.css` to piksel
tej sceny. Do okna dopasowuje ja jedno `transform: scale()` w `.scena`
(`web/src/gra/useSkalaSceny.ts`) — skalowanie jest nierownomierne, w granicach
0,78–1,25 stosunku pion/poziom, dokladnie tak jak odtwarzacz Flasha rozciagniety
na okno przegladarki.

**Nie wprowadzaj procentow ani progow `@media` do ukladu gry.** Procenty licza
sie raz od szerokosci ekranu, raz od szerokosci siatki, raz od wysokosci
rodzica; progi `@media` nie wiedza nic o wysokosci okna. Oba podejscia byly juz
probowane i oba skonczyly sie rozjezdzonym ukladem.

## Katalogi

- `web/` — klient (Vite + React). `npm run dev` na porcie 5173, `/api` idzie na 8787.
- `backend/` — API (Hono + postgres.js), wdrazane na Vercel jako jedna funkcja.
- `client-src/` — zdekompilowane zrodla oryginalnego klienta Flash. **Tylko do czytania.**
- `sf555/` — oryginalne zasoby gry i stary serwer PHP.

## Grafika w `res/` — nazwy sa na zawsze

Wdrozenie oddaje `/res/*` z naglowkiem `max-age=31536000, immutable`
(`backend/vercel.json`), wiec przegladarka NIGDY nie sprawdza, czy plik sie
zmienil. **Podmieniona zawartosc pod ta sama nazwa nie dojdzie do nikogo, kto
raz otworzyl gre.** Poprawka grafiki musi wiec dostac NOWA nazwe pliku —
inaczej wyglada, jakby zmiana nie zadzialala.

## Co zostalo do zrobienia

`DO-ZROBIENIA.md` — lista tego, czego jeszcze nie ma, a JEST w oryginalnych
plikach, razem ze wskazaniem zrodla dla kazdej pozycji. Zajrzyj tam, zanim
zaczniesz cokolwiek nowego, i skresl pozycje po zrobieniu.

## Sprawdzanie pracy

- `cd web && npm test && npm run build`
- `cd backend && npm test` (testy integracyjne wymagaja Postgresa; bez niego sa pomijane)
- wyglad sprawdzaj w przegladarce (Playwright, Chromium w `/opt/pw-browsers/`),
  **mierzac** elementy, a nie ogladajac zrzut ekranu — wiekszosc bledow ukladu
  z tego projektu byla niewidoczna golym okiem, ale oczywista w pomiarze.

## Srodowisko

Serwer posredniczacy blokuje `vercel.app`, wiec wdrozonej strony nie da sie
stad obejrzec. Diagnostyke wdrozenia prowadzi sie przez `?diag=1` i Supabase.
