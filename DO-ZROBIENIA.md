# Co zostalo do zrobienia

Lista tego, czego jeszcze nie ma w nowej wersji, a **jest w oryginalnych
plikach**. Nie sa to pomysly — kazda pozycja ma wskazane zrodlo, z ktorego
trzeba ja przepisac.

Kolejnosc w kazdej sekcji jest od najwazniejszego. Po zrobieniu pozycji
usun ja stad i — jesli powstalo odstepstwo — dopisz wiersz do tabeli
w `CLAUDE.md`.

---

## 1. Wieza — pomocnicy

Sama wieza JEST: sto pieter, potwory z `getTowerMonster()`, wejscie
z kafla na drugiej planszy, walka, srebro i zdobycz. Zostala z niej
jedna warstwa — **trzej pomocnicy**.

| Czego trzeba | Gdzie to jest |
| --- | --- |
| akcje serwera | `$ACT_COPYCAT_BOOST` (314), `$ACT_MOVE_COPYCAT_ITEM` (318) |
| kolumny | `user_data.copycat_lvl/str/dex/int/wit/luck` i tabela `tower_helper_items` — sa juz w `backend/db/schema.sql` |
| pancerz pomocnika | `sf555/req.php` — `getCopycatRealArmor()` |
| cztery rundy | `req.php`, `$ACT_TOWER_TRY`: `while ($round < 4 && $OP->getHP() > 0)` — trzej pomocnicy, potem gracz, a zycie potwora przechodzi z rundy do rundy |
| ekran zarzadzania | `MainTimeline.as` — `ShowTowerScreen()`, wiazka `BNC_SCREEN_TOWER`: trzy portrety `npc/copycat_1..3.jpg`, ich ekwipunek (`DisplayInventory(towerSG, true, true, copyCatSel)`), przyciski ulepszania na `POS_SCR_CHAR_CHARIMG_X + 232` i przewijana wieza (`scr/tower/tower_base.png`, `tower_level.png`, `tower_roof.png`, okna) |
| napisy | `TXT_TOWER_GUYS` (9770), `TXT_BOOST_COPYCAT` |

Dopoki ich nie ma, walka na pietrze to sama runda gracza — patrz wiersz
o wiezy w tabeli odstepstw w `CLAUDE.md`.

## 2. Portal do piekiel

W oryginale sa DWA rozne portale i latwo je pomylic:

| Ktory | Gdzie sie wchodzi | Akcja | Warunek |
| --- | --- | --- | --- |
| Portal do piekiel (wlasny) | kafel na DRUGIEJ planszy lochow, `i == 5` | `ACT_PORTAL_FIGHT_SINGLE` | poziom co najmniej `PORTAL_FIGHT_LEVEL` = 99 |
| Portal gildii (grupowy) | ekran gildii, `BTN_GILDE_CREST_GOTO_PORTAL` | `ACT_PORTAL_FIGHT` | `PORTAL_GROUP_LEVEL`, staz w gildii (`ERR_PORTAL_MEMBERSHIP_TOO_SHORT`) |

Ten opis dotyczy pierwszego z nich — tego z planszy lochow. Kafel juz
tam stoi i chodzi mu animacja; brakuje samego ekranu i walki.

**Dzienny limit i premie wisza na gildii** — `guild_portal`, `g_act`
i `g_monster` w `user_data`.

| Czego trzeba | Gdzie to jest |
| --- | --- |
| akcja | `$ACT_PORTAL_FIGHT_SINGLE`; wejscie zamkniete, dopoki `dungeon_10 == 0` |
| raz na dobe | `portal_time` porownywane z numerem dnia roku (`date("z")`) |
| potwory | `getDungMonster()` dziala tez dla portalu — `IMG_PORTAL_BG + ...`, sto pieter po dziesiec aktow |
| grafika | `scr/dungeons/portal/portal_dungeons_1..24.jpg` (animacja juz chodzi na kaflu), tla `scr/quest/locations/location_portal_1..10.jpg`, `button_portal.jpg`, `unknown_portal.png`, `done_portal.png` |
| nazwa | plik jezykowy, pozycja 9539 („Portal do piekiel") |

## 3. Klucz do wychodka

Ostatni brak w rodzaju 11. Losowanie jest juz zuzywane
w `backend/src/game/generatorPrzedmiotow.ts`, wiec dolozenie go NIE
przesunie ciagu generatora.

- `item_id` 20 albo 10 (zaleznie od kolumny `toilet`), powyzej 99. poziomu.
  Sam wychodek to `$ACT_TOILET_*`.

Magiczne Lustro jest juz zrobione — patrz `backend/src/game/lustro.ts`.

## 4. Zaleglosci oznaczone w kodzie

Szukaj `DO PRZENIESIENIA`:

- `backend/src/api/gracz.ts` — stopnie odznak licza sie z postepu
  w lochach, na arenie i w wiezy; teraz wszystkie wracaja zerem.
- `web/src/ekrany/karczma/OknoWyboru.tsx` — opis wyprawy oryginal sklada
  z czterech zakresow pliku jezykowego (`GetQuestText`).
- `backend/src/actions/account.ts` — przy zakladaniu konta oryginal losuje
  od razu nagrody czekajace przy zadaniach.

## 5. Brakujace dzwieki: caly katalog `sfx/tower/`

Klient definiuje dwa dzwieki, ktorych nie ma w naszej paczce zasobow:

    DefineSnd(SND_SHARD,  "sfx/tower/shard.mp3");
    DefineSnd(SND_MIRROR, "sfx/tower/mirror.mp3");

Pierwszy gra przy wprawieniu odlamka lustra, drugi w chwili ZLOZENIA go
w calosc — i to on jest w oryginale jedynym znakiem, ze lustro gotowe.
Zamiast niego stoi u nas blysk (patrz tabela odstepstw w CLAUDE.md).
Katalog `sf555/res/sfgame/sfx/tower/` nie istnieje wcale, wiec obu
plikow trzeba poszukac w oryginalnej paczce gry.

## 6. Ekrany, ktorych jeszcze nie ma

Arena, Poczta, Gildia, Sala Chwaly, pelne Opcje, gra w kubki
(`Huetchenspieler`), Warta jako osobny ekran.

---

## Zanim wpuscisz obcych graczy

- [ ] `LOREIN_PANEL_TESTOWY=0` na wdrozeniu — panel testowy u grzybiarza
      to cheaty dostepne dla kazdego, kto ma konto.
- [ ] `npm run db:migruj` na bazie produkcyjnej — nie jest juz konieczne
      (backend doklada brakujace kolumny sam, patrz `src/db/kolumny.ts`),
      ale warto puscic, zeby schemat zgadzal sie z `db/schema.sql`.
