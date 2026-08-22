/**
 * Sklepy — zbrojownia i gabinet magii.
 *
 * Oba dzialaja tak samo i oba obsluguje ten sam kod; rozni je numer
 * (`0` zbrojownia, `1` gabinet magii), tabela i asortyment. Zasady sa
 * przepisane z `enterShop()`, `rerollItems()`, `rerollOneShop()`,
 * `genNewItem()` i sklepowej galezi `$ACT_USE_ITEM` w `req.php`.
 *
 * Ceny i wszystkie dane przedmiotow licza sie WYLACZNIE tutaj. Klient
 * dostaje gotowa liste i mowi tylko „kup to miejsce" albo „sprzedaj ten
 * slot" — nie da sie wiec kupic taniej, niz stoi na pólce.
 */

import { Hono } from 'hono';
import { getSql } from '../db/client.js';
import { time } from '../compat/php.js';
import {
  GABINET_MAGII,
  GRZYBY_ZA_SPRZEDAZ_EPIKA,
  KOSZT_WYMIANY_TOWARU,
  MIEJSC_W_SKLEPIE,
  ZBROJOWNIA,
  cenaPoZakupie,
  czasNaNowyTowar,
  najblizszaPolnoc,
  sprawdzZakup,
} from '../game/sklep.js';
import {
  OSTATNI_SLOT_PLECAKA,
  PIERWSZY_SLOT_PLECAKA,
  czyMozeLezec,
  slotDlaRodzaju,
} from '../game/ekwipunek.js';
import { wylosujPrzedmiot } from '../game/generatorPrzedmiotow.js';
import { czyEpicki } from '../game/grafikaPrzedmiotow.js';
import { wczytajGracza, zbudujPrzedmiot } from './gracz.js';
import { tokenZNaglowka } from './konto.js';
import type { Context } from 'hono';

export const sklep = new Hono();

type Sql = ReturnType<typeof getSql>;

interface WierszGracza extends Record<string, unknown> {
  user_id: number;
}

function liczba(wartosc: unknown): number {
  const n = Number(wartosc);
  return Number.isFinite(n) ? n : 0;
}

async function wczytaj(c: Context): Promise<{ sql: Sql; wiersz: WierszGracza } | null> {
  const token = tokenZNaglowka(c);
  if (!token) return null;

  const sql = getSql();
  const [wiersz] = await sql<WierszGracza[]>`SELECT * FROM user_data WHERE ssid = ${token} LIMIT 1`;
  return wiersz ? { sql, wiersz } : null;
}

/** Numer sklepu z adresu — cokolwiek innego niz 1 znaczy zbrojownie. */
function numerSklepu(c: Context): number {
  return liczba(c.req.param('numer')) === 1 ? GABINET_MAGII : ZBROJOWNIA;
}

// ------------------------------------------------------------ towar --

async function towarSklepu(sql: Sql, sklepNr: number, userId: number) {
  const wiersze =
    sklepNr === ZBROJOWNIA
      ? await sql<Record<string, unknown>[]>`
          SELECT * FROM items_shakes WHERE owner_id = ${userId} ORDER BY slot ASC
        `
      : await sql<Record<string, unknown>[]>`
          SELECT * FROM items_fidget WHERE owner_id = ${userId} ORDER BY slot ASC
        `;

  return wiersze.map((w) => ({
    ...zbudujPrzedmiot(w),
    slot: liczba(w['slot']),
    cena: { zloto: liczba(w['gold']), grzyby: liczba(w['mush']) },
  }));
}

/**
 * Losuje jeden przedmiot na pólke.
 *
 * Zbrojownia handluje rodzajami 1-7, gabinet magii 8-13. Album trafia na
 * pólke tylko wtedy, kiedy gracz go jeszcze nie ma — `album == -1`
 * w oryginale znaczy wlasnie „nie ma".
 */
function nowyTowar(sklepNr: number, wiersz: WierszGracza) {
  return wylosujPrzedmiot(liczba(wiersz['lvl']) || 1, liczba(wiersz['class']) || 1, {
    sklep: sklepNr,
    maAlbum: liczba(wiersz['album']) !== -1,
  });
}

async function wstawTowar(
  sql: Sql,
  sklepNr: number,
  userId: number,
  slot: number,
  p: ReturnType<typeof nowyTowar>,
) {
  if (sklepNr === ZBROJOWNIA) {
    await sql`
      INSERT INTO items_shakes (item_type, item_id, dmg_min, dmg_max,
        atr_type_1, atr_type_2, atr_type_3, atr_val_1, atr_val_2, atr_val_3,
        gold, mush, slot, owner_id, enchant, enchant_power)
      VALUES (${p.item_type}, ${p.item_id}, ${p.dmg_min}, ${p.dmg_max},
              ${p.atr_type_1}, ${p.atr_type_2}, ${p.atr_type_3},
              ${p.atr_val_1}, ${p.atr_val_2}, ${p.atr_val_3},
              ${p.gold}, ${p.mush}, ${slot}, ${userId}, 0, 0)
    `;
  } else {
    await sql`
      INSERT INTO items_fidget (item_type, item_id, dmg_min, dmg_max,
        atr_type_1, atr_type_2, atr_type_3, atr_val_1, atr_val_2, atr_val_3,
        gold, mush, slot, owner_id, enchant, enchant_power)
      VALUES (${p.item_type}, ${p.item_id}, ${p.dmg_min}, ${p.dmg_max},
              ${p.atr_type_1}, ${p.atr_type_2}, ${p.atr_type_3},
              ${p.atr_val_1}, ${p.atr_val_2}, ${p.atr_val_3},
              ${p.gold}, ${p.mush}, ${slot}, ${userId}, 0, 0)
    `;
  }
}

async function wyczyscSklep(sql: Sql, sklepNr: number, userId: number) {
  if (sklepNr === ZBROJOWNIA) {
    await sql`DELETE FROM items_shakes WHERE owner_id = ${userId}`;
  } else {
    await sql`DELETE FROM items_fidget WHERE owner_id = ${userId}`;
  }
}

/**
 * Wymiana calego towaru w JEDNYM sklepie — `rerollOneShop()`.
 *
 * Termin odnowienia zostaje nietkniety: kupno grzybem nie przesuwa
 * polnocnej wymiany.
 */
async function wymienTowar(sql: Sql, sklepNr: number, wiersz: WierszGracza) {
  await wyczyscSklep(sql, sklepNr, wiersz.user_id);
  for (let slot = 0; slot < MIEJSC_W_SKLEPIE; slot++) {
    await wstawTowar(sql, sklepNr, wiersz.user_id, slot, nowyTowar(sklepNr, wiersz));
  }
}

/**
 * Odnowienie o polnocy — `rerollItems()`.
 *
 * Wymienia OBA sklepy naraz i dopiero wtedy przesuwa termin. Tak robi
 * oryginal, wiec wejscie do zbrojowni odswieza tez gabinet magii.
 */
async function odnowJesliCzas(sql: Sql, wiersz: WierszGracza): Promise<boolean> {
  const teraz = time();
  if (!czasNaNowyTowar(teraz, liczba(wiersz['shop_reroll_time']))) return false;

  await sql`
    UPDATE user_data SET shop_reroll_time = ${najblizszaPolnoc(teraz)}
    WHERE user_id = ${wiersz.user_id}
  `;
  await wymienTowar(sql, ZBROJOWNIA, wiersz);
  await wymienTowar(sql, GABINET_MAGII, wiersz);
  return true;
}

/** Wspolna odpowiedz: towar, gracz i termin nastepnej wymiany. */
async function stanSklepu(sql: Sql, sklepNr: number, wiersz: WierszGracza) {
  const [swiezy] = await sql<WierszGracza[]>`
    SELECT * FROM user_data WHERE user_id = ${wiersz.user_id} LIMIT 1
  `;
  const aktualny = swiezy ?? wiersz;

  return {
    numer: sklepNr,
    towar: await towarSklepu(sql, sklepNr, aktualny.user_id),
    kosztWymiany: KOSZT_WYMIANY_TOWARU,
    odnowienie: liczba(aktualny['shop_reroll_time']),
    czasSerwera: time(),
    gracz: await wczytajGracza(sql, aktualny),
  };
}

// ------------------------------------------------------------ trasy --

sklep.get('/sklep/:numer', async (c) => {
  const dane = await wczytaj(c);
  if (!dane) return c.json({ blad: 'Brak sesji.' }, 401);

  const sklepNr = numerSklepu(c);
  await odnowJesliCzas(dane.sql, dane.wiersz);
  return c.json(await stanSklepu(dane.sql, sklepNr, dane.wiersz));
});

/**
 * Wymiana towaru za grzyba — `$ACT_REROLL_ITEMS`.
 *
 * Oryginal odmawia przy zerze grzybow (`if ($mushroom <= 0) break;`)
 * i sciaga dokladnie jednego.
 */
sklep.post('/sklep/:numer/wymien', async (c) => {
  const dane = await wczytaj(c);
  if (!dane) return c.json({ blad: 'Brak sesji.' }, 401);

  const { sql, wiersz } = dane;
  const sklepNr = numerSklepu(c);

  if (liczba(wiersz['mushroom']) < KOSZT_WYMIANY_TOWARU) {
    return c.json({ blad: 'Nie masz grzyba na nowy towar.' }, 409);
  }

  await sql`
    UPDATE user_data SET mushroom = mushroom - ${KOSZT_WYMIANY_TOWARU}
    WHERE user_id = ${wiersz.user_id}
  `;
  await wymienTowar(sql, sklepNr, wiersz);

  return c.json(await stanSklepu(sql, sklepNr, wiersz));
});

/**
 * Zakup — sklepowa galaz `$ACT_USE_ITEM`.
 *
 * Cel podaje klient, ale sprawdza go serwer: albo miejsce w plecaku,
 * albo slot wynikajacy z rodzaju przedmiotu. Cel musi byc pusty —
 * oryginal nie zamienia przy kupnie, tylko odmawia.
 */
sklep.post('/sklep/:numer/kup', async (c) => {
  const dane = await wczytaj(c);
  if (!dane) return c.json({ blad: 'Brak sesji.' }, 401);

  const { sql, wiersz } = dane;
  const sklepNr = numerSklepu(c);
  const zapytanie = (await c.req.json().catch(() => ({}))) as { miejsce?: unknown; cel?: unknown };

  const miejsce = liczba(zapytanie.miejsce);
  if (miejsce < 0 || miejsce >= MIEJSC_W_SKLEPIE) {
    return c.json({ blad: 'Nie ma takiego miejsca w sklepie.' }, 400);
  }

  const [towar] =
    sklepNr === ZBROJOWNIA
      ? await sql<Record<string, unknown>[]>`
          SELECT * FROM items_shakes WHERE owner_id = ${wiersz.user_id} AND slot = ${miejsce} LIMIT 1
        `
      : await sql<Record<string, unknown>[]>`
          SELECT * FROM items_fidget WHERE owner_id = ${wiersz.user_id} AND slot = ${miejsce} LIMIT 1
        `;

  if (!towar) return c.json({ blad: 'To miejsce jest puste.' }, 409);

  const rodzaj = liczba(towar['item_type']);
  const cel =
    zapytanie.cel === 'zaloz'
      ? slotDlaRodzaju(rodzaj)
      : liczba(zapytanie.cel);

  if (cel < 0 || cel > OSTATNI_SLOT_PLECAKA) {
    return c.json({ blad: 'Tam nie ma gdzie tego polozyc.' }, 400);
  }

  // Na slot ekwipunku wchodzi tylko to, co do niego pasuje.
  if (cel < PIERWSZY_SLOT_PLECAKA) {
    const wolno = czyMozeLezec(
      { id: 0, slot: cel, item_type: rodzaj, item_id: liczba(towar['item_id']) },
      cel,
      liczba(wiersz['class']) || 1,
    );
    if (wolno !== null) return c.json({ blad: 'Tam to nie pasuje.' }, 409);
  }

  const [zajmujacy] = await sql<{ id: number }[]>`
    SELECT id FROM items WHERE owner_id = ${wiersz.user_id} AND slot = ${cel} LIMIT 1
  `;

  const cenaZloto = liczba(towar['gold']);
  const cenaGrzyby = liczba(towar['mush']);
  const odmowa = sprawdzZakup(
    { cenaZloto, cenaGrzyby },
    {
      srebro: liczba(wiersz['silver']),
      grzyby: liczba(wiersz['mushroom']),
      celZajety: Boolean(zajmujacy),
    },
  );

  if (odmowa) {
    const powody = {
      zajete: 'To miejsce jest zajęte.',
      'za-drogo': 'Nie stać cię na to.',
      'brak-grzybow': 'Za mało grzybów.',
    } as const;
    return c.json({ blad: powody[odmowa] }, 409);
  }

  await sql`
    UPDATE user_data
    SET silver = silver - ${cenaZloto}, mushroom = mushroom - ${cenaGrzyby}
    WHERE user_id = ${wiersz.user_id}
  `;

  // W plecaku przedmiot nosi juz cene ODKUPU, a grzyby przepadaja.
  await sql`
    INSERT INTO items (item_type, item_id, dmg_min, dmg_max,
      atr_type_1, atr_type_2, atr_type_3, atr_val_1, atr_val_2, atr_val_3,
      gold, mush, slot, owner_id)
    VALUES (${rodzaj}, ${liczba(towar['item_id'])},
            ${liczba(towar['dmg_min'])}, ${liczba(towar['dmg_max'])},
            ${liczba(towar['atr_type_1'])}, ${liczba(towar['atr_type_2'])}, ${liczba(towar['atr_type_3'])},
            ${liczba(towar['atr_val_1'])}, ${liczba(towar['atr_val_2'])}, ${liczba(towar['atr_val_3'])},
            ${cenaPoZakupie(cenaZloto)}, 0, ${cel}, ${wiersz.user_id})
  `;

  // Puste miejsce od razu dostaje nowy towar — `genNewItem()`.
  const swiezy = nowyTowar(sklepNr, wiersz);
  const numerWiersza = liczba(towar['id']);
  if (sklepNr === ZBROJOWNIA) {
    await sql`
      UPDATE items_shakes SET
        item_type = ${swiezy.item_type}, item_id = ${swiezy.item_id},
        dmg_min = ${swiezy.dmg_min}, dmg_max = ${swiezy.dmg_max},
        atr_type_1 = ${swiezy.atr_type_1}, atr_type_2 = ${swiezy.atr_type_2}, atr_type_3 = ${swiezy.atr_type_3},
        atr_val_1 = ${swiezy.atr_val_1}, atr_val_2 = ${swiezy.atr_val_2}, atr_val_3 = ${swiezy.atr_val_3},
        gold = ${swiezy.gold}, mush = ${swiezy.mush}
      WHERE id = ${numerWiersza}
    `;
  } else {
    await sql`
      UPDATE items_fidget SET
        item_type = ${swiezy.item_type}, item_id = ${swiezy.item_id},
        dmg_min = ${swiezy.dmg_min}, dmg_max = ${swiezy.dmg_max},
        atr_type_1 = ${swiezy.atr_type_1}, atr_type_2 = ${swiezy.atr_type_2}, atr_type_3 = ${swiezy.atr_type_3},
        atr_val_1 = ${swiezy.atr_val_1}, atr_val_2 = ${swiezy.atr_val_2}, atr_val_3 = ${swiezy.atr_val_3},
        gold = ${swiezy.gold}, mush = ${swiezy.mush}
      WHERE id = ${numerWiersza}
    `;
  }

  return c.json(await stanSklepu(sql, sklepNr, wiersz));
});

/**
 * Sprzedaz — przeciagniecie przedmiotu na sklep.
 *
 * Zloto to `gold` zapisane PRZY PRZEDMIOCIE; przy rzeczy kupionej
 * w sklepie jest to juz cena odkupu, bo zakup ja nadpisal.
 *
 * Grzyby licza sie inaczej niz w oryginale — patrz
 * `GRZYBY_ZA_SPRZEDAZ_EPIKA`. Oryginal oddawal kolumne `mush`, przez co
 * zwykly przedmiot z wyprawy potrafil sypnac grzybem albo dziesiecioma,
 * a epik kupiony w sklepie nie oddawal nic.
 */
sklep.post('/sklep/:numer/sprzedaj', async (c) => {
  const dane = await wczytaj(c);
  if (!dane) return c.json({ blad: 'Brak sesji.' }, 401);

  const { sql, wiersz } = dane;
  const sklepNr = numerSklepu(c);
  const zapytanie = (await c.req.json().catch(() => ({}))) as { slot?: unknown };
  const slot = liczba(zapytanie.slot);

  const [przedmiot] = await sql<Record<string, unknown>[]>`
    SELECT id, item_type, item_id, gold FROM items
    WHERE owner_id = ${wiersz.user_id} AND slot = ${slot} LIMIT 1
  `;
  if (!przedmiot) return c.json({ blad: 'Nie ma tam nic do sprzedania.' }, 409);

  const grzyby = czyEpicki(liczba(przedmiot['item_type']), liczba(przedmiot['item_id']))
    ? GRZYBY_ZA_SPRZEDAZ_EPIKA
    : 0;

  await sql`
    UPDATE user_data
    SET silver = silver + ${liczba(przedmiot['gold'])},
        mushroom = mushroom + ${grzyby}
    WHERE user_id = ${wiersz.user_id}
  `;
  await sql`DELETE FROM items WHERE id = ${liczba(przedmiot['id'])}`;

  return c.json(await stanSklepu(sql, sklepNr, wiersz));
});
