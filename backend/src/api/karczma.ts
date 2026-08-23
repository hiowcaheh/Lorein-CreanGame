/**
 * Karczma — trzy zadania, ich podjecie i rozliczenie.
 *
 * Port akcji `$ACT_TAVERN_ENTER` (010), `$ACT_START_QUEST` (510),
 * `$ACT_QUEST_CANCEL` (511), `$ACT_QUEST_SKIP` (189) i
 * `$ACT_DRINK_BEER` (518) z `sf555/req.php`, razem z funkcja
 * `finishQuest()`.
 *
 * CALA rozgrywka liczy sie tutaj, na serwerze — przegladarka dostaje
 * gotowy wynik. Czas konca wyprawy jest czasem serwera i tylko serwer
 * decyduje, czy juz minal; przestawienie zegarka w telefonie nie zmienia
 * niczego. Walka rozstrzyga sie dopiero w chwili odbioru, wiec nie ma
 * czego podejrzec ani powtorzyc.
 */

import { Hono } from 'hono';
import { getSql } from '../db/client.js';
import { PhpMtRand } from '../compat/rng.js';
import { time } from '../compat/php.js';
import {
  GRZYBOW_ZA_PIWO,
  GRZYBOW_ZA_PRZYSPIESZENIE,
  PELNA_WYTRZYMALOSC,
  KOLUMNA_DODATKU_PIW,
  limitPiw,
  PROG_ZA_ZDROWY,
  WYTRZYMALOSC_Z_PIWA,
  awansuj,
  czasWyprawy,
  doswiadczenieZWyprawy,
  zlotoZWyprawy,
  najblizszaPolnoc,
  wolneMiejsceWPlecaku,
  wylosujZadania,
  zadaniaZWiersza,
  type Zadanie,
} from '../game/karczma.js';
import { wylosujPrzedmiot } from '../game/generatorPrzedmiotow.js';
import {
  potworNaZadanie,
  rozegrajWalke,
  wojownikZGracza,
  type Przedmiot,
  type Wojownik,
} from '../game/walka.js';
import { wczytajGracza, zbudujPrzedmiot, type Przedmiot as PrzedmiotEkranu } from './gracz.js';
import { barwaPrzedmiotu, plikIkony, plikPocisku, typAnimacjiBroni } from '../game/grafikaPrzedmiotow.js';
import { tokenZNaglowka } from './konto.js';
import { dolozKolumne } from '../db/kolumny.js';
import { KOLUMNA_DAT } from '../game/album.js';
import { zamknieteLochy } from '../game/lochy.js';
import {
  BEZ_KLASERA,
  PUSTY_KLASER,
  dopiszDoKlasera,
  dopiszPotworaDoKlasera,
  odczytajDaty,
  premiaZKlasera,
  zapiszDaty,
  type StanKlasera,
} from '../game/album.js';
import type { Context } from 'hono';

export const karczma = new Hono();

/** Stan bohatera: 0 wolny, 1 w pracy, 2 na wyprawie. */
const WOLNY = 0;
const NA_WYPRAWIE = 2;

/** Ile procent zadan ma nagrode przedmiotowa — `rand(1,100) <= 30`. */
const SZANSA_NA_PRZEDMIOT = 30;

/** Ile honoru daje wygrana wyprawa. */
const HONOR_ZA_WYPRAWE = 10;

/** Szansa na znalezienie grzyba i ile ich wtedy wpada (`game_settings`). */
const SZANSA_NA_GRZYBA = 15;
const ZNALEZIONYCH_GRZYBOW = 1;

interface WierszGracza extends Record<string, unknown> {
  user_id: number;
}

type Sql = ReturnType<typeof getSql>;

async function wczytaj(c: Context): Promise<{ sql: Sql; wiersz: WierszGracza } | null> {
  const token = tokenZNaglowka(c);
  if (!token) return null;

  const sql = getSql();
  const [wiersz] = await sql<WierszGracza[]>`SELECT * FROM user_data WHERE ssid = ${token} LIMIT 1`;
  return wiersz ? { sql, wiersz } : null;
}

function liczba(wartosc: unknown): number {
  const n = Number(wartosc);
  return Number.isFinite(n) ? n : 0;
}

/** Wierzchowiec liczy sie tylko dopoki trwa najem. */
function wierzchowiec(wiersz: WierszGracza, teraz: number): number {
  return teraz < liczba(wiersz['mount_dur']) ? liczba(wiersz['mount']) : 0;
}

// ------------------------------------------------ zadania i nagrody --

export async function przedmiotyGracza(sql: Sql, userId: number): Promise<Przedmiot[]> {
  return sql<Przedmiot[]>`
    SELECT slot, dmg_min, dmg_max, atr_type_1, atr_type_2, atr_type_3,
           atr_val_1, atr_val_2, atr_val_3
    FROM items WHERE owner_id = ${userId} AND slot <= 9
  `;
}

/**
 * Losuje komplet trzech zadan razem z czekajacymi przy nich nagrodami.
 *
 * Nagroda jest losowana Z GORY i lezy w `items_tavern`, a nie dopiero po
 * wygranej. Dzieki temu gracz widzi w oknie wyboru, co jest do zdobycia —
 * i dlatego wlasnie oryginal trzyma ja w osobnej tabeli.
 */
async function nowyKompletZadan(
  sql: Sql,
  wiersz: WierszGracza,
  poziom: number,
  wytrzymalosc: number,
  rng: PhpMtRand,
): Promise<Zadanie[]> {
  const zadania = wylosujZadania(poziom, wytrzymalosc, rng);
  await zapiszZadania(sql, wiersz.user_id, zadania);

  await sql`DELETE FROM items_tavern WHERE owner_id = ${wiersz.user_id}`;

  const klasa = liczba(wiersz['class']) || 1;

  /*
   * Klucz do lochu wypada TYLKO z wyprawy, i tylko wtedy, gdy w czterech
   * pierwszych miejscach plecaka nie lezy juz jeden (`check_for_key()`).
   * Trafia do pierwszego lochu, ktorego gracz nie otworzyl i na ktory
   * ma juz poziom — stad lista zamknietych.
   */
  const maJuzKlucz =
    (
      await sql<{ id: number }[]>`
        SELECT id FROM items
        WHERE owner_id = ${wiersz.user_id} AND slot > 9 AND slot < 15 AND item_type = 11
        LIMIT 1
      `
    ).length > 0;

  /*
   * Odlamek lustra ma WLASNE sprawdzenie, szersze niz klucz: liczy sie
   * kazdy odlamek w plecaku, nie tylko w czterech pierwszych kieszeniach.
   *
   *     SELECT * FROM items WHERE owner_id = :uid AND slot >= 10
   *       AND item_type = 11 AND item_id >= 30
   */
  const maJuzOdlamek =
    (
      await sql<{ id: number }[]>`
        SELECT id FROM items
        WHERE owner_id = ${wiersz.user_id} AND slot >= 10 AND item_type = 11 AND item_id >= 30
        LIMIT 1
      `
    ).length > 0;

  const zamkniete = zamknieteLochy(wiersz);

  for (const zadanie of zadania) {
    if (rng.rand(1, 100) > SZANSA_NA_PRZEDMIOT) continue;

    /*
     * `$shop = rand(0, 1); genItem($lvl, $class, $shop, 'tavern', ...)`.
     * Zbrojownia daje bron i zbroje, gabinet — bizuterie albo klucz.
     */
    const sklep = rng.rand(0, 1);
    const nagroda = wylosujPrzedmiot(poziom, klasa, {
      sklep,
      wyprawa: true,
      maJuzKlucz,
      maJuzOdlamek,
      lustro: String(wiersz['magic_mirror'] ?? ''),
      zamknieteLochy: zamkniete,
      losuj: (od, doo) => rng.rand(od, doo),
    });

    // Brak klucza do wydania znaczy, ze wyprawa nie ma zadnej nagrody.
    if (!nagroda) continue;

    await sql`
      INSERT INTO items_tavern (item_type, item_id, dmg_min, dmg_max,
                                atr_type_1, atr_type_2, atr_type_3,
                                atr_val_1, atr_val_2, atr_val_3,
                                gold, mush, quest, owner_id, enchant, enchant_power)
      VALUES (${nagroda.item_type}, ${nagroda.item_id}, ${nagroda.dmg_min}, ${nagroda.dmg_max},
              ${nagroda.atr_type_1}, ${nagroda.atr_type_2}, ${nagroda.atr_type_3},
              ${nagroda.atr_val_1}, ${nagroda.atr_val_2}, ${nagroda.atr_val_3},
              ${nagroda.gold}, ${nagroda.mush}, ${zadanie.numer}, ${wiersz.user_id}, 0, 0)
    `;
  }

  return zadania;
}

async function zapiszZadania(sql: Sql, userId: number, zadania: Zadanie[]): Promise<void> {
  const [a, b, c] = zadania;
  if (!a || !b || !c) return;

  await sql`
    UPDATE user_data SET
      quest_dur_1 = ${a.dlugosc}, quest_dur_2 = ${b.dlugosc}, quest_dur_3 = ${c.dlugosc},
      quest_gold_1 = ${a.zloto}, quest_gold_2 = ${b.zloto}, quest_gold_3 = ${c.zloto},
      quest_exp_1 = ${a.doswiadczenie}, quest_exp_2 = ${b.doswiadczenie}, quest_exp_3 = ${c.doswiadczenie},
      quest_location_1 = ${a.lokacja}, quest_location_2 = ${b.lokacja}, quest_location_3 = ${c.lokacja},
      quest_red_1 = ${a.premia}, quest_red_2 = ${b.premia}, quest_red_3 = ${c.premia}
    WHERE user_id = ${userId}
  `;
}

/**
 * Przedmiot w postaci, ktora rozumie klient.
 *
 * Ten sam ksztalt, co ekwipunek na ekranie postaci — dzieki temu okno
 * wyboru zadania moze pokazac nagrode dokladnie tak samo, jak plecak
 * pokazuje rzeczy juz zdobyte, razem z podpowiedzia.
 */
/**
 * Nagroda z `items_tavern` w postaci, ktora rozumie klient.
 *
 * Idzie przez `zbudujPrzedmiot()`, zeby sciezka do ikony powstawala
 * DOKLADNIE tak samo, jak dla przedmiotu z plecaka — razem z barwa
 * liczona ze statystyk. Wlasna kopia tego skladania juz raz sie
 * rozjechala i ikony nagrod przestaly sie ladowac.
 *
 * Nagroda nie lezy w zadnym slocie, stad -1.
 */
function przedmiotZWiersza(w: Record<string, unknown>) {
  return { ...zbudujPrzedmiot(w), slot: -1 };
}

/** Nagrody czekajace przy zadaniach — po jednej na zadanie albo wcale. */
async function nagrodyZadan(sql: Sql, userId: number) {
  const wiersze = await sql<Record<string, unknown>[]>`
    SELECT * FROM items_tavern WHERE owner_id = ${userId}
  `;
  return wiersze.map((w) => ({ zadanie: liczba(w['quest']), wiersz: w }));
}

/**
 * Zadania sa losowane raz i zapisywane, zeby odswiezenie strony nie
 * podmienialo ich graczowi pod rekami. Nowy gracz ma je wyzerowane —
 * wtedy losujemy pierwszy komplet.
 */
async function zadaniaGracza(sql: Sql, wiersz: WierszGracza): Promise<Zadanie[]> {
  const zapisane = zadaniaZWiersza(wiersz);
  if (zapisane.some((z) => z.doswiadczenie > 0)) return zapisane;

  return nowyKompletZadan(
    sql,
    wiersz,
    liczba(wiersz['lvl']) || 1,
    liczba(wiersz['thirst']) || PELNA_WYTRZYMALOSC,
    new PhpMtRand(),
  );
}

// --------------------------------------------------- rozliczenie --

interface Rozliczenie {
  wygrana: boolean;
  /** Kraina, w ktorej doszlo do starcia — jej obraz jest tlem walki. */
  lokacja: number;
  awans: number | null;
  nagroda: { zloto: number; doswiadczenie: number; honor: number; grzyby: number } | null;
  /**
   * Skladniki premii, ktore juz siedza w `nagroda.doswiadczenie`.
   *
   * Ekran po walce rozpisuje z nich, ile dokladnie dolozylo kazde
   * zrodlo — tak samo jak po walce w lochu. Zlota premie nie dotycza:
   * `finishQuest()` podbija samo doswiadczenie.
   */
  premie?: { klaser: number; rzadkie: number };
  /** Premie ZLOTA — rzadkie zadanie ich nie dotyczy. */
  premieZlota?: { klaser: number };
  /** Przedmiot, ktory wpadl do plecaka — albo powod, dla ktorego nie wpadl. */
  /**
   * Zdobyty przedmiot — CALY, bo ekran walki pokazuje jego ikone
   * i podpowiedz ze statystykami, tak samo jak plecak.
   */
  zdobytyPrzedmiot: PrzedmiotEkranu | null;
  plecakBylPelny: boolean;
  walka: unknown;
}

/**
 * Rozlicza zakonczona wyprawe — port `finishQuest()`.
 *
 * Wywolywana i przy wejsciu do karczmy (oryginal robi to samo), i po
 * przyspieszeniu grzybem. Zwraca `null`, gdy nie bylo czego rozliczac.
 */
async function rozliczWyprawe(sql: Sql, wiersz: WierszGracza): Promise<Rozliczenie | null> {
  if (liczba(wiersz['status']) !== NA_WYPRAWIE) return null;

  const numer = Math.min(3, Math.max(1, liczba(wiersz['status_extra']) || 1));
  const zadanie = zadaniaZWiersza(wiersz)[numer - 1]!;

  const rng = new PhpMtRand();
  const przedmioty = await przedmiotyGracza(sql, wiersz.user_id);
  const gracz = wojownikZGracza(wiersz, przedmioty);
  const potwor = potworNaZadanie(gracz, rng, { rzadkieZadanie: zadanie.premia === 145 });

  /*
   * Bron i tarcza gracza — dla ekranu walki, nie dla obliczen.
   *
   * Klient Flash dostaje w `weaponData` cztery przedmioty: bron gracza,
   * bron przeciwnika, tarcze gracza i tarcze przeciwnika. Bron leci
   * przez ekran jako WLASNA IKONA (`SetCnt(CNT_WEAPON_CHAR,
   * GetItemID(0, 0, weaponData), ...)`), a tarcza staje po stronie
   * obroncy, kiedy odbije cios. Stad obok numeru idzie sciezka do
   * obrazka — bez niej nie da sie odtworzyc ani jednego, ani drugiego.
   *
   * Numer zero znaczy gole piesci: `charHasWeapon` w oryginale wymaga
   * dodatniego typu I dodatniego numeru przedmiotu.
   */
  const doRysowania = await sql<Record<string, unknown>[]>`
    SELECT slot, item_type, item_id, upgrade_level, dmg_min, dmg_max,
           atr_type_1, atr_type_2, atr_type_3, atr_val_1, atr_val_2, atr_val_3,
           gold, mush
    FROM items WHERE owner_id = ${wiersz.user_id} AND slot IN (8, 9)
  `;
  const bronWSlocie = doRysowania.find((p) => liczba(p['slot']) === 8);
  const tarczaWSlocie = doRysowania.find((p) => liczba(p['slot']) === 9);
  const bronGracza = bronWSlocie ? liczba(bronWSlocie['item_id']) : 0;
  const rysunekBroniGracza = bronWSlocie ? rysunekBroni(bronWSlocie) : rysunekPiesci();
  const ikonaTarczyGracza = tarczaWSlocie ? zbudujPrzedmiot(tarczaWSlocie).obrazek : null;

  const zycieGraczaPrzed = gracz.zycie;
  const zyciePotworaPrzed = potwor.zycie;
  const walka = rozegrajWalke(gracz, potwor, rng);
  const wygrana = walka.wygral === 1;

  let poziom = liczba(wiersz['lvl']) || 1;
  let doswiadczenie = liczba(wiersz['exp']);
  let srebro = liczba(wiersz['silver']);
  let grzyby = liczba(wiersz['mushroom']);
  let honor = liczba(wiersz['honor']);
  let wytrzymalosc = liczba(wiersz['thirst']);
  const poziomPrzed = poziom;

  const teraz = time();
  const kosztWyprawy = czasWyprawy(zadanie.dlugosc, wierzchowiec(wiersz, teraz));

  let znalezioneGrzyby = 0;
  let zdobytyPrzedmiot: PrzedmiotEkranu | null = null;
  let plecakBylPelny = false;
  let zdobyteDoswiadczenie = 0;
  let zdobyteZloto = 0;

  /*
   * Klaser. Po wygranej wyprawie oryginal wpisuje do niego POTWORA
   * i przedmiot, ktory z niej wypadl:
   *
   *     $AlbumObj->addMonster($OP->getId());
   *     ...
   *     if ($hasAlbum && (int)$item['item_type'] <= 10) $AlbumObj->addItem($item);
   *
   * i zapisuje wszystko jednym UPDATE-em, tylko gdy licznik urosl.
   * W oryginale wyprawa zawsze sie udaje, wiec nie ma tam czego
   * rozstrzygac; u nas potwor moze wygrac, a wtedy — zgodnie z opisem
   * klasera („trafiaja tam wszystkie pokonane potwory") — nie wchodzi.
   */
  const maKlaser = liczba(wiersz['album'] ?? BEZ_KLASERA) !== BEZ_KLASERA;
  let stanKlasera: StanKlasera = {
    dane: String(wiersz['album_data'] ?? '') || PUSTY_KLASER,
    ile: liczba(wiersz['album'] ?? 0),
    daty: odczytajDaty(wiersz['album_dates']),
  };
  const klaserPrzed = stanKlasera.ile;

  if (wygrana) {
    /*
     * Grzyb z wyprawy. Do tego oryginal dorzuca jeden ZA PIERWSZA wyprawe
     * dnia — poznaje ja po tym, ze wytrzymalosc jest jeszcze pelna
     * i nie wypito ani jednego piwa.
     */
    if (maKlaser) stanKlasera = dopiszPotworaDoKlasera(stanKlasera, potwor.obrazek, teraz);

    if (rng.rand(1, 100) <= SZANSA_NA_GRZYBA) znalezioneGrzyby += ZNALEZIONYCH_GRZYBOW;
    if (wytrzymalosc === PELNA_WYTRZYMALOSC && liczba(wiersz['beers']) === 0) znalezioneGrzyby += 1;
    grzyby += znalezioneGrzyby;

    /*
     * Premia kolekcjonera wchodzi do doswiadczenia tak samo, jak
     * w `req.php`: `exp * ($ebonus + $albumbonus + $rqbonus)`. Liczy sie
     * stan klasera Z POCZATKU wyprawy — potwor dopisany przed chwila
     * podnosi dopiero nastepna nagrode, dokladnie jak w oryginale,
     * gdzie `$albumbonus` czyta sie przed `addMonster()`.
     */
    zdobyteDoswiadczenie = doswiadczenieZWyprawy(zadanie.doswiadczenie, {
      premia: zadanie.premia,
      album: klaserPrzed,
    });

    /*
     * Zloto z ta sama premia kolekcjonera, co liczba pokazana w oknie
     * wyboru — inaczej gracz dostalby mniej, niz mu obiecano.
     */
    zdobyteZloto = zlotoZWyprawy(zadanie.zloto, { album: klaserPrzed });
    srebro += zdobyteZloto;
    doswiadczenie += zdobyteDoswiadczenie;
    honor += HONOR_ZA_WYPRAWE;

    // Nagroda przedmiotowa wpada tylko wtedy, gdy jest ja gdzie polozyc.
    const [czekajacy] = await sql<Record<string, unknown>[]>`
      SELECT * FROM items_tavern WHERE owner_id = ${wiersz.user_id} AND quest = ${numer} LIMIT 1
    `;

    if (czekajacy) {
      const zajete = (
        await sql<{ slot: number }[]>`
          SELECT slot FROM items WHERE owner_id = ${wiersz.user_id} AND slot >= 10
        `
      ).map((w) => w.slot);

      const miejsce = wolneMiejsceWPlecaku(zajete);
      if (miejsce === null) {
        plecakBylPelny = true;
      } else {
        await sql`
          INSERT INTO items (item_type, item_id, dmg_min, dmg_max,
                             atr_type_1, atr_type_2, atr_type_3,
                             atr_val_1, atr_val_2, atr_val_3,
                             gold, mush, slot, owner_id)
          VALUES (${liczba(czekajacy['item_type'])}, ${liczba(czekajacy['item_id'])},
                  ${liczba(czekajacy['dmg_min'])}, ${liczba(czekajacy['dmg_max'])},
                  ${liczba(czekajacy['atr_type_1'])}, ${liczba(czekajacy['atr_type_2'])}, ${liczba(czekajacy['atr_type_3'])},
                  ${liczba(czekajacy['atr_val_1'])}, ${liczba(czekajacy['atr_val_2'])}, ${liczba(czekajacy['atr_val_3'])},
                  ${liczba(czekajacy['gold'])}, ${liczba(czekajacy['mush'])}, ${miejsce}, ${wiersz.user_id})
        `;
        zdobytyPrzedmiot = { ...zbudujPrzedmiot(czekajacy), slot: miejsce };

        if (maKlaser) {
          stanKlasera = dopiszDoKlasera(
            stanKlasera,
            [
            {
              item_type: liczba(czekajacy['item_type']),
              item_id: liczba(czekajacy['item_id']),
              dmg_min: liczba(czekajacy['dmg_min']),
              dmg_max: liczba(czekajacy['dmg_max']),
              atr_type_1: liczba(czekajacy['atr_type_1']),
              atr_type_2: liczba(czekajacy['atr_type_2']),
              atr_type_3: liczba(czekajacy['atr_type_3']),
              atr_val_1: liczba(czekajacy['atr_val_1']),
              atr_val_2: liczba(czekajacy['atr_val_2']),
              atr_val_3: liczba(czekajacy['atr_val_3']),
              },
            ],
            teraz,
          );
        }
      }
    }
  }

  // Wyprawa kosztuje wytrzymalosc niezaleznie od tego, jak sie skonczyla.
  wytrzymalosc = Math.max(0, wytrzymalosc - kosztWyprawy);

  const po = awansuj(poziom, doswiadczenie);
  poziom = po.poziom;
  doswiadczenie = po.doswiadczenie;

  await sql`
    UPDATE user_data SET
      status = ${WOLNY}, status_end = 0, status_extra = 0,
      lvl = ${poziom}, exp = ${doswiadczenie}, silver = ${srebro},
      mushroom = ${grzyby}, honor = ${honor}, thirst = ${wytrzymalosc},
      medal_adventurer = ${liczba(wiersz['medal_adventurer']) + (wygrana ? 1 : 0)}
    WHERE user_id = ${wiersz.user_id}
  `;

  // Zapis klasera idzie osobno i tylko wtedy, gdy cos przybylo.
  if (maKlaser && stanKlasera.ile > klaserPrzed) {
    if (await dolozKolumne(sql, 'user_data', 'album_dates', KOLUMNA_DAT)) {
      await sql`
        UPDATE user_data SET
          album_data = ${stanKlasera.dane},
          album = ${stanKlasera.ile},
          album_dates = ${zapiszDaty(stanKlasera.daty)}
        WHERE user_id = ${wiersz.user_id}
      `;
    } else {
      await sql`
        UPDATE user_data SET album_data = ${stanKlasera.dane}, album = ${stanKlasera.ile}
        WHERE user_id = ${wiersz.user_id}
      `;
    }
  }

  // Nowy komplet zadan po kazdej wyprawie — jak w oryginale.
  const [swiezy] = await sql<WierszGracza[]>`
    SELECT * FROM user_data WHERE user_id = ${wiersz.user_id} LIMIT 1
  `;
  await nowyKompletZadan(sql, swiezy ?? wiersz, poziom, wytrzymalosc, rng);

  return {
    wygrana,
    /*
     * Kraina, w ktorej doszlo do starcia.
     *
     * Oryginal nie ma osobnego tla walki: `BNC_SCREEN_FIGHT` sklada sie
     * z `BLACK_SQUARE` polozonego na biezacym ekranie, czyli na krainie
     * wyprawy. Klient musi wiec wiedziec, gdzie ta walka sie odbyla —
     * nowy komplet zadan jest juz wylosowany i ma inne lokacje.
     */
    lokacja: zadanie.lokacja,
    awans: poziom > poziomPrzed ? poziom : null,
    nagroda: wygrana
      ? {
          zloto: zdobyteZloto,
          doswiadczenie: zdobyteDoswiadczenie,
          honor: HONOR_ZA_WYPRAWE,
          grzyby: znalezioneGrzyby,
        }
      : null,
    /*
     * Te same liczby, ktore podbily doswiadczenie kilka wierszy wyzej —
     * z klasera SPRZED wyprawy, bo `$albumbonus` czyta sie przed
     * `addMonster()`.
     */
    premie: {
      klaser: Math.round(premiaZKlasera(klaserPrzed) * 100),
      rzadkie: zadanie.premia,
    },
    premieZlota: { klaser: Math.round(premiaZKlasera(klaserPrzed) * 100) },
    zdobytyPrzedmiot,
    plecakBylPelny,
    /*
     * Zapis walki do odegrania.
     *
     * Obie strony ida z KOMPLETEM cech, bo oryginalny ekran walki
     * wypisuje je pod portretami (`LBL_FIGHT_CHAR_STAERKE`
     * i `LBL_FIGHT_OPP_STAERKE`, piec wierszy po obu stronach). Numer
     * broni sluzy animacji ciosu: ujemne wartosci to pazury i kly
     * potworow, dodatnie to zwykle przedmioty.
     */
    walka: {
      gracz: {
        ...opisWojownika(gracz, zycieGraczaPrzed, bronGracza),
        ...rysunekBroniGracza,
        tarczaObrazek: ikonaTarczyGracza,
      },
      potwor: {
        ...opisWojownika(potwor, zyciePotworaPrzed, potwor.bron),
        obrazek: potwor.obrazek,
        ...rysunekBroniPotwora(potwor.bron),
        /*
         * Potwor z wyprawy nigdy nie ma tarczy: `getQuestMonster` konczy
         * sie `new Monster(..., $wpnid, -1)`, a `hasShield()` zwraca przy
         * `shilid == -1` zero — czyli nie blokuje i nie ma czego pokazac.
         */
        tarczaObrazek: null,
      },
      ciosy: walka.ciosy,
    },
  };
}

/*
 * Ponizsze pomocniki sa wspolne z lochami — ekran walki jest ten sam,
 * wiec i opis obu stron musi powstawac tak samo.
 */

/**
 * Czym rysowac cios — komplet grafik dla jednej strony pojedynku.
 *
 * `typAnimacji` to `charWeaponType` z klienta: 1 bron biala, 2 rozdzka
 * maga, 3 luk zwiadowcy. Kazdy z nich ma wlasna galaz animacji, wlasne
 * tempo i wlasny wybuch przy trafieniu.
 *
 * `pociski` to klatki lecacego pocisku. Mag przelacza je co tik losowo
 * (`GetArrowID(..., int(Math.random() * 3))`), wiec kula pulsuje; przy
 * broni epickiej wszystkie trzy wskazuja ten sam plik i pulsowania nie
 * ma — zostaje jeden staly efekt. Zwiadowca ma belt jednoklatkowy
 * w swojej wlasnej barwie.
 *
 * `pociskUderzenia` zastepuje przy broni dystansowej wybuch „SMASH":
 * mag dostaje czwarty wariant swojego pocisku, zwiadowca `arrowsmash.png`.
 */
export interface RysunekBroni {
  typAnimacji: 1 | 2 | 3;
  bronObrazek: string | null;
  pociski: string[];
  pociskUderzenia: string | null;
}

const OBRAZ_UDERZENIA_STRZALY = '/res/sfgame/scr/fight/arrowsmash.png';

/** Gole piesci — `charHasWeapon` falszywe, klient rysuje `kampf_faust.png`. */
export function rysunekPiesci(): RysunekBroni {
  return { typAnimacji: 1, bronObrazek: null, pociski: [], pociskUderzenia: null };
}

export function rysunekBroni(wiersz: Record<string, unknown>): RysunekBroni {
  const numer = liczba(wiersz['item_id']);
  const typAnimacji = typAnimacjiBroni(numer);
  const przedmiot = zbudujPrzedmiot(wiersz);
  const barwa = barwaPrzedmiotu({
    dmg_min: liczba(wiersz['dmg_min']),
    dmg_max: liczba(wiersz['dmg_max']),
    atr_type_1: liczba(wiersz['atr_type_1']),
    atr_type_2: liczba(wiersz['atr_type_2']),
    atr_type_3: liczba(wiersz['atr_type_3']),
    atr_val_1: liczba(wiersz['atr_val_1']),
    atr_val_2: liczba(wiersz['atr_val_2']),
    atr_val_3: liczba(wiersz['atr_val_3']),
  });

  return {
    typAnimacji,
    bronObrazek: przedmiot.obrazek,
    ...pociskiBroni(numer, barwa, typAnimacji),
  };
}

/**
 * Bron potwora z wyprawy.
 *
 * `$weapons` daje numery ujemne (pazur, kij, kiel) i jeden dodatni:
 * 1004, rozdzke potwora-maga. Ujemne nie sa przedmiotem, wiec nie maja
 * ani ikony, ani barwy — klient rysuje dla nich `kampf_*`. Dodatni idzie
 * przez te same reguly, co bron gracza, tyle ze typ przedmiotu potwora
 * to 8 (`Monster::getWeapon()`), a jego blok statystyk jest staly, wiec
 * barwa wychodzi z niego, a nie z bazy.
 */
export function rysunekBroniPotwora(numer: number): RysunekBroni {
  if (numer <= 0) return { typAnimacji: 1, bronObrazek: null, pociski: [], pociskUderzenia: null };

  const typAnimacji = typAnimacjiBroni(numer);
  // `Monster::getWeapon()`: dmg 1/2, atr_type_1 = 1, atr_val_1 = 1, reszta zero.
  const barwa = barwaPrzedmiotu({
    dmg_min: 1,
    dmg_max: 2,
    atr_type_1: 1,
    atr_type_2: 0,
    atr_type_3: 0,
    atr_val_1: 1,
    atr_val_2: 0,
    atr_val_3: 0,
  });

  return {
    typAnimacji,
    bronObrazek: plikIkony(TYP_BRONI_POTWORA, numer, barwa),
    ...pociskiBroni(numer, barwa, typAnimacji),
  };
}

/** `Monster::getWeapon()` zwraca `item_type => 8`. */
const TYP_BRONI_POTWORA = 8;

function pociskiBroni(
  numer: number,
  barwa: number,
  typAnimacji: 1 | 2 | 3,
): { pociski: string[]; pociskUderzenia: string | null } {
  if (typAnimacji === 2) {
    // Mag: trzy klatki losowane co tik i czwarta na uderzenie.
    const klatki = [0, 1, 2].map((b) => plikPocisku(numer, b)).filter((s): s is string => s !== null);
    return { pociski: klatki, pociskUderzenia: plikPocisku(numer, 3) };
  }
  if (typAnimacji === 3) {
    // Zwiadowca: belt w barwie przedmiotu, wybuch wspolny dla wszystkich.
    const belt = plikPocisku(numer, barwa);
    return { pociski: belt ? [belt] : [], pociskUderzenia: OBRAZ_UDERZENIA_STRZALY };
  }
  return { pociski: [], pociskUderzenia: null };
}

/**
 * Wojownik w postaci, ktora rozumie ekran walki.
 *
 * `bron` to numer przedmiotu: dodatni dla broni gracza, ujemny dla
 * pazurow i klow potwora (`$weapons` w `getQuestMonster`). Zero znaczy
 * gole piesci — wtedy oryginal animuje uderzenie dlonia.
 */
export function opisWojownika(w: Wojownik, zycie: number, bron: number) {
  return {
    nazwa: w.nazwa,
    klasa: w.klasa,
    poziom: w.poziom,
    zycie,
    bron,
    cechy: {
      sila: w.sila,
      zrecznosc: w.zrecznosc,
      intelekt: w.intelekt,
      wytrzymalosc: w.wytrzymalosc,
      szczescie: w.szczescie,
    },
  };
}

/** Wspolna odpowiedz opisujaca stan karczmy. */
async function stanKarczmy(sql: Sql, wiersz: WierszGracza, dodatki: Record<string, unknown> = {}) {
  const zadania = await zadaniaGracza(sql, wiersz);
  const nagrody = await nagrodyZadan(sql, wiersz.user_id);
  const teraz = time();
  const koniowanie = wierzchowiec(wiersz, teraz);

  /*
   * Premia kolekcjonera. `req.php` doklada ja do POKAZYWANEJ nagrody,
   * a nie dopiero przy rozliczeniu:
   *
   *     $ret[$SF_QUEST_EXP_1] = round(quest_exp_1 * ($ebonus + $albumbonus + $rqbonus1));
   *
   * Robimy tak samo, zeby liczba w oknie wyboru byla ta, ktora naprawde
   * wpadnie. Obok idzie rozbicie na skladniki — klient pokazuje je po
   * klikniecu, jak `EnablePopup(LBL_QO_REWARDEXP, ...)`.
   */
  const klaser = liczba(wiersz['album'] ?? BEZ_KLASERA);
  const premiaKlasera = Math.round(premiaZKlasera(klaser) * 100);

  const zajete = (
    await sql<{ slot: number }[]>`
      SELECT slot FROM items WHERE owner_id = ${wiersz.user_id} AND slot >= 10
    `
  ).map((w) => w.slot);

  return {
    wytrzymalosc: liczba(wiersz['thirst']),
    wytrzymaloscMaks: PELNA_WYTRZYMALOSC,
    piwa: liczba(wiersz['beers']),
    piwaMaks: limitPiw(liczba(wiersz['beers_bonus'])),
    /** Powyzej tego progu karczmarz nie naleje. */
    progZaZdrowy: PROG_ZA_ZDROWY,
    grzyby: liczba(wiersz['mushroom']),
    status: liczba(wiersz['status']),
    wybraneZadanie: liczba(wiersz['status_extra']),
    koniec: liczba(wiersz['status_end']),
    teraz,
    /**
     * Wierzchowiec, ktory DZIALA — zero, gdy najem wygasl. Ekran
     * pokazuje przy czasie wyprawy, o ile go skraca.
     */
    wierzchowiec: koniowanie,
    /** Miejsce w plecaku — klient uprzedza, ze nagroda przepadnie. */
    wolneMiejsceWPlecaku: wolneMiejsceWPlecaku(zajete) !== null,
    zadania: zadania.map((z) => {
      const nagroda = nagrody.find((n) => n.zadanie === z.numer);
      return {
        ...z,
        // Czas i koszt zaleza od wierzchowca, wiec licza sie tutaj.
        sekundy: czasWyprawy(z.dlugosc, koniowanie),
        zloto: zlotoZWyprawy(z.zloto, { album: klaser === BEZ_KLASERA ? 0 : klaser }),
        doswiadczenie: doswiadczenieZWyprawy(z.doswiadczenie, {
          premia: z.premia,
          album: klaser === BEZ_KLASERA ? 0 : klaser,
        }),
        /** Skladniki premii do doswiadczenia, w procentach. */
        premie: { klaser: premiaKlasera, rzadkie: z.premia },
        /*
         * Premie ZLOTA. Rzadkie zadanie ich nie dotyczy — `$rqbonus`
         * wchodzi w oryginale wylacznie do doswiadczenia.
         */
        premieZlota: { klaser: premiaKlasera },
        /*
         * Przedmiot czekajacy przy zadaniu. Oryginal pokazuje go w oknie
         * wyboru w calosci — z obrazkiem i wartosciami — bo gracz ma
         * wiedziec, o co walczy. Wysylamy wiec komplet danych, a nie
         * sama informacje, ze cos tam jest.
         */
        nagrodaPrzedmiotowa: nagroda ? przedmiotZWiersza(nagroda.wiersz) : null,
      };
    }),
    ...dodatki,
  };
}

// ------------------------------------------------------------ stan --

karczma.get('/karczma', async (c) => {
  const dane = await wczytaj(c);
  if (!dane) return c.json({ blad: 'Sesja wygasła — zaloguj się ponownie.' }, 401);

  let { wiersz } = dane;
  const { sql } = dane;
  const teraz = time();

  /*
   * Dobowe odswiezenie. Oryginal robi je wlasnie tutaj, przy wejsciu do
   * karczmy — nie ma zadnego zadania w tle, ktore chodziloby o polnocy.
   */
  if (teraz > liczba(wiersz['quest_reroll_time'])) {
    await sql`
      UPDATE user_data
      SET quest_reroll_time = ${najblizszaPolnoc(teraz)},
          thirst = ${PELNA_WYTRZYMALOSC}, beers = 0
      WHERE user_id = ${wiersz.user_id}
    `;
    const [odswiezony] = await sql<WierszGracza[]>`
      SELECT * FROM user_data WHERE user_id = ${wiersz.user_id} LIMIT 1
    `;
    if (odswiezony) wiersz = odswiezony;
  }

  /*
   * Wyprawa, ktorej czas minal, rozlicza sie sama przy wejsciu — tak samo
   * jak w oryginale. Gracz moze zamknac przegladarke i wrocic pozniej.
   */
  let rozliczenie: Rozliczenie | null = null;
  if (liczba(wiersz['status']) === NA_WYPRAWIE && teraz >= liczba(wiersz['status_end'])) {
    rozliczenie = await rozliczWyprawe(sql, wiersz);
    const [po] = await sql<WierszGracza[]>`
      SELECT * FROM user_data WHERE user_id = ${wiersz.user_id} LIMIT 1
    `;
    if (po) wiersz = po;
  }

  return c.json(
    await stanKarczmy(sql, wiersz, {
      rozliczenie,
      gracz: rozliczenie ? await wczytajGracza(sql, wiersz) : undefined,
    }),
  );
});

// ---------------------------------------------------------- podejmij --

karczma.post('/karczma/podejmij', async (c) => {
  const dane = await wczytaj(c);
  if (!dane) return c.json({ blad: 'Sesja wygasła — zaloguj się ponownie.' }, 401);

  const { sql, wiersz } = dane;
  const cialo = (await c.req.json().catch(() => ({}))) as { numer?: unknown };
  const numer = Math.min(3, Math.max(1, Math.trunc(Number(cialo.numer) || 1)));

  if (liczba(wiersz['status']) !== WOLNY) {
    return c.json({ blad: 'Twój bohater jest już zajęty.' }, 409);
  }

  const zadania = await zadaniaGracza(sql, wiersz);
  const zadanie = zadania[numer - 1];
  if (!zadanie) return c.json({ blad: 'Nie ma takiego zadania.' }, 400);

  const teraz = time();
  const trwanie = czasWyprawy(zadanie.dlugosc, wierzchowiec(wiersz, teraz));

  if (liczba(wiersz['thirst']) < trwanie) {
    return c.json({ blad: 'Za mało wytrzymałości na tak długą wyprawę.' }, 409);
  }

  const koniec = teraz + trwanie;
  await sql`
    UPDATE user_data SET status = ${NA_WYPRAWIE}, status_extra = ${numer}, status_end = ${koniec}
    WHERE user_id = ${wiersz.user_id}
  `;

  return c.json({
    status: NA_WYPRAWIE,
    wybraneZadanie: numer,
    koniec,
    teraz,
    zadanie: { ...zadanie, sekundy: trwanie },
  });
});

// ----------------------------------------------------------- przerwij --

karczma.post('/karczma/przerwij', async (c) => {
  const dane = await wczytaj(c);
  if (!dane) return c.json({ blad: 'Sesja wygasła — zaloguj się ponownie.' }, 401);

  const { sql, wiersz } = dane;

  // Przerwana wyprawa nie kosztuje wytrzymalosci — ta schodzi dopiero
  // przy rozliczeniu, wiec wystarczy skasowac stan.
  await sql`
    UPDATE user_data SET status = ${WOLNY}, status_end = 0, status_extra = 0
    WHERE user_id = ${wiersz.user_id}
  `;

  const [po] = await sql<WierszGracza[]>`
    SELECT * FROM user_data WHERE user_id = ${wiersz.user_id} LIMIT 1
  `;
  return c.json(await stanKarczmy(sql, po ?? wiersz));
});

// -------------------------------------------------------- przyspiesz --

karczma.post('/karczma/przyspiesz', async (c) => {
  const dane = await wczytaj(c);
  if (!dane) return c.json({ blad: 'Sesja wygasła — zaloguj się ponownie.' }, 401);

  const { sql, wiersz } = dane;

  if (liczba(wiersz['status']) !== NA_WYPRAWIE) {
    return c.json({ blad: 'Nie ma czego przyspieszać.' }, 409);
  }

  /*
   * Oryginal wymaga WIECEJ niz jednego grzyba (`mushroom <= 1` odrzuca),
   * a odejmuje jeden. Ostatniego grzyba nie da sie wiec wydac.
   */
  if (liczba(wiersz['mushroom']) <= GRZYBOW_ZA_PRZYSPIESZENIE) {
    return c.json({ blad: 'Za mało grzybów.' }, 409);
  }

  await sql`
    UPDATE user_data
    SET mushroom = mushroom - ${GRZYBOW_ZA_PRZYSPIESZENIE}, status_end = 0
    WHERE user_id = ${wiersz.user_id}
  `;

  const [gotowy] = await sql<WierszGracza[]>`
    SELECT * FROM user_data WHERE user_id = ${wiersz.user_id} LIMIT 1
  `;
  const rozliczenie = await rozliczWyprawe(sql, gotowy ?? wiersz);

  const [po] = await sql<WierszGracza[]>`
    SELECT * FROM user_data WHERE user_id = ${wiersz.user_id} LIMIT 1
  `;
  return c.json(
    await stanKarczmy(sql, po ?? wiersz, { rozliczenie, gracz: await wczytajGracza(sql, po ?? wiersz) }),
  );
});

// ------------------------------------------------------------- piwo --

karczma.post('/karczma/piwo', async (c) => {
  const dane = await wczytaj(c);
  if (!dane) return c.json({ blad: 'Sesja wygasła — zaloguj się ponownie.' }, 401);

  const { sql, wiersz } = dane;

  /*
   * Limit jest RUCHOMY — podstawa plus dodatek gracza (`beers_bonus`).
   * Kolumny moze jeszcze nie byc na dzialajacej bazie; wtedy dodatek
   * jest zerem i zostaje sama podstawa.
   */
  await dolozKolumne(sql, 'user_data', 'beers_bonus', KOLUMNA_DODATKU_PIW);
  if (liczba(wiersz['beers']) >= limitPiw(liczba(wiersz['beers_bonus']))) {
    return c.json({ blad: 'Na dziś dość — karczmarz już nie naleje.' }, 409);
  }
  if (liczba(wiersz['mushroom']) < GRZYBOW_ZA_PIWO) {
    return c.json({ blad: 'Za mało grzybów.' }, 409);
  }
  if (liczba(wiersz['thirst']) > PROG_ZA_ZDROWY) {
    return c.json({ blad: 'Twój bohater jest zbyt wypoczęty na piwo.' }, 409);
  }

  await sql`
    UPDATE user_data SET
      thirst = ${liczba(wiersz['thirst']) + WYTRZYMALOSC_Z_PIWA},
      beers = beers + 1,
      mushroom = mushroom - ${GRZYBOW_ZA_PIWO}
    WHERE user_id = ${wiersz.user_id}
  `;

  const [po] = await sql<WierszGracza[]>`
    SELECT * FROM user_data WHERE user_id = ${wiersz.user_id} LIMIT 1
  `;
  return c.json(await stanKarczmy(sql, po ?? wiersz, { gracz: await wczytajGracza(sql, po ?? wiersz) }));
});
