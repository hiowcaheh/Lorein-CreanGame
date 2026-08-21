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
  PIW_NA_DOBE,
  PROG_ZA_ZDROWY,
  WYTRZYMALOSC_Z_PIWA,
  awansuj,
  czasWyprawy,
  doswiadczenieZWyprawy,
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
import { wczytajGracza } from './gracz.js';
import { tokenZNaglowka } from './konto.js';
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

async function przedmiotyGracza(sql: Sql, userId: number): Promise<Przedmiot[]> {
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
  for (const zadanie of zadania) {
    if (rng.rand(1, 100) > SZANSA_NA_PRZEDMIOT) continue;

    const nagroda = wylosujPrzedmiot(poziom, klasa);
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
function przedmiotZWiersza(w: Record<string, unknown>) {
  const typ = liczba(w['item_type']);
  const identyfikator = liczba(w['item_id']);
  const podtyp = Math.floor(identyfikator / 1000) + 1;
  const numer = identyfikator % 1000;

  return {
    slot: -1,
    typ,
    podtyp,
    numer,
    ulepszenie: liczba(w['upgrade_level']),
    obrazek: `/res/sfgame/itm/${typ}-${podtyp}/itm${typ}-${podtyp}-${numer}-1.png`,
    obrazenia: { min: liczba(w['dmg_min']), max: liczba(w['dmg_max']) },
    atrybuty: [1, 2, 3]
      .map((n) => ({ rodzaj: liczba(w[`atr_type_${n}`]), wartosc: liczba(w[`atr_val_${n}`]) }))
      .filter((a) => a.rodzaj > 0),
    zloto: liczba(w['gold']),
    grzyby: liczba(w['mush']),
  };
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
  awans: number | null;
  nagroda: { zloto: number; doswiadczenie: number; honor: number; grzyby: number } | null;
  /** Przedmiot, ktory wpadl do plecaka — albo powod, dla ktorego nie wpadl. */
  zdobytyPrzedmiot: { nazwaSlotu: number } | null;
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
  const potwor = potworNaZadanie(gracz, rng);

  /*
   * Czym bije gracz. Zero znaczy gole piesci — i tak wlasnie animuje to
   * oryginal, uderzeniem dloni zamiast lotem broni.
   */
  const bronGracza = przedmioty.find((p) => p.slot === 8) ? 1 : 0;

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
  let zdobytyPrzedmiot: { nazwaSlotu: number } | null = null;
  let plecakBylPelny = false;
  let zdobyteDoswiadczenie = 0;

  if (wygrana) {
    /*
     * Grzyb z wyprawy. Do tego oryginal dorzuca jeden ZA PIERWSZA wyprawe
     * dnia — poznaje ja po tym, ze wytrzymalosc jest jeszcze pelna
     * i nie wypito ani jednego piwa.
     */
    if (rng.rand(1, 100) <= SZANSA_NA_GRZYBA) znalezioneGrzyby += ZNALEZIONYCH_GRZYBOW;
    if (wytrzymalosc === PELNA_WYTRZYMALOSC && liczba(wiersz['beers']) === 0) znalezioneGrzyby += 1;
    grzyby += znalezioneGrzyby;

    zdobyteDoswiadczenie = doswiadczenieZWyprawy(zadanie.doswiadczenie, { premia: zadanie.premia });

    srebro += zadanie.zloto;
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
        zdobytyPrzedmiot = { nazwaSlotu: miejsce };
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

  // Nowy komplet zadan po kazdej wyprawie — jak w oryginale.
  const [swiezy] = await sql<WierszGracza[]>`
    SELECT * FROM user_data WHERE user_id = ${wiersz.user_id} LIMIT 1
  `;
  await nowyKompletZadan(sql, swiezy ?? wiersz, poziom, wytrzymalosc, rng);

  return {
    wygrana,
    awans: poziom > poziomPrzed ? poziom : null,
    nagroda: wygrana
      ? {
          zloto: zadanie.zloto,
          doswiadczenie: zdobyteDoswiadczenie,
          honor: HONOR_ZA_WYPRAWE,
          grzyby: znalezioneGrzyby,
        }
      : null,
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
      gracz: opisWojownika(gracz, zycieGraczaPrzed, bronGracza),
      potwor: { ...opisWojownika(potwor, zyciePotworaPrzed, potwor.bron), obrazek: potwor.obrazek },
      ciosy: walka.ciosy,
    },
  };
}

/**
 * Wojownik w postaci, ktora rozumie ekran walki.
 *
 * `bron` to numer przedmiotu: dodatni dla broni gracza, ujemny dla
 * pazurow i klow potwora (`$weapons` w `getQuestMonster`). Zero znaczy
 * gole piesci — wtedy oryginal animuje uderzenie dlonia.
 */
function opisWojownika(w: Wojownik, zycie: number, bron: number) {
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

  const zajete = (
    await sql<{ slot: number }[]>`
      SELECT slot FROM items WHERE owner_id = ${wiersz.user_id} AND slot >= 10
    `
  ).map((w) => w.slot);

  return {
    wytrzymalosc: liczba(wiersz['thirst']),
    wytrzymaloscMaks: PELNA_WYTRZYMALOSC,
    piwa: liczba(wiersz['beers']),
    piwaMaks: PIW_NA_DOBE,
    /** Powyzej tego progu karczmarz nie naleje. */
    progZaZdrowy: PROG_ZA_ZDROWY,
    grzyby: liczba(wiersz['mushroom']),
    status: liczba(wiersz['status']),
    wybraneZadanie: liczba(wiersz['status_extra']),
    koniec: liczba(wiersz['status_end']),
    teraz,
    /** Miejsce w plecaku — klient uprzedza, ze nagroda przepadnie. */
    wolneMiejsceWPlecaku: wolneMiejsceWPlecaku(zajete) !== null,
    zadania: zadania.map((z) => {
      const nagroda = nagrody.find((n) => n.zadanie === z.numer);
      return {
        ...z,
        // Czas i koszt zaleza od wierzchowca, wiec licza sie tutaj.
        sekundy: czasWyprawy(z.dlugosc, koniowanie),
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

  if (liczba(wiersz['beers']) >= PIW_NA_DOBE) {
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
