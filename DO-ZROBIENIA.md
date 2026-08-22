# Co zostalo do zrobienia

Lista tego, czego jeszcze nie ma w nowej wersji, a **jest w oryginalnych
plikach**. Nie sa to pomysly — kazda pozycja ma wskazane zrodlo, z ktorego
trzeba ja przepisac.

Kolejnosc w kazdej sekcji jest od najwazniejszego. Po zrobieniu pozycji
usun ja stad i — jesli powstalo odstepstwo — dopisz wiersz do tabeli
w `CLAUDE.md`.

---

## 1. Wieza

Sto pieter, na kazdym jeden potwor. **Prostszy kawalek niz portal** —
nie zalezy od niczego, czego jeszcze nie ma.

| Czego trzeba | Gdzie to jest |
| --- | --- |
| potwory | `sf555/req.php` — `getTowerMonster($stage)`, sto wierszy `new Monster(...)`, ten sam ksztalt, co lochy. Da sie doloz'yc do `backend/scripts/gen-lochy.mjs` |
| akcje serwera | `$ACT_SCREEN_TOWER` (312), `$ACT_TOWER_TRY` (313) |
| kolumny | `user_data.tower_level` i tabela `tower_helper_items` — obie sa juz w `backend/db/schema.sql` |
| ekran | `MainTimeline.as` — `ShowMainQuestScreen(100, 399 + towerLevel)`, tlo `IMG_SCR_TOWER_BG` = `scr/quest/locations/location_tower.jpg` |
| kafel na liscie lochow | `scr/dungeons/button_tower.jpg` i `done_tower.png`; miejsce juz jest, patrz `KAFEL_WIEZY` w `web/src/gra/lochyUklad.ts` |
| nazwa | plik jezykowy, pozycja 9538 („Wieza") |

**Osobna warstwa: pomocnicy.** `$ACT_COPYCAT_BOOST` (314) i
`$ACT_MOVE_COPYCAT_ITEM` (318) — trzej towarzysze, ktorym zaklada sie
wlasny ekwipunek (`tower_helper_items`, `getCopycatRealArmor()`). Da sie
zrobic sama wieze bez nich i dolozyc ich pozniej.

## 2. Portal do piekiel

**Wymaga najpierw gildii** — dzienny limit i premie wisza na
`guild_portal`, `g_act` i `g_monster` w `user_data`.

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

## 5. Ekrany, ktorych jeszcze nie ma

Arena, Poczta, Gildia, Sala Chwaly, pelne Opcje, gra w kubki
(`Huetchenspieler`), Warta jako osobny ekran.

---

## Zanim wpuscisz obcych graczy

- [ ] `LOREIN_PANEL_TESTOWY=0` na wdrozeniu — panel testowy u grzybiarza
      to cheaty dostepne dla kazdego, kto ma konto.
- [ ] `npm run db:migruj` na bazie produkcyjnej — nie jest juz konieczne
      (backend doklada brakujace kolumny sam, patrz `src/db/kolumny.ts`),
      ale warto puscic, zeby schemat zgadzal sie z `db/schema.sql`.
