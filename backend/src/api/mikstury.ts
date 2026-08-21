/**
 * Mikstury — wypijanie i odwolywanie dzialania.
 *
 * W oryginale nie ma osobnej akcji „wypij". Gracz przeciaga miksture
 * z plecaka na postac, klient wysyla zwykle `$ACT_USE_ITEM`, a serwer
 * rozpoznaje rodzaj 12 i zamiast zakladac przedmiot — kasuje go
 * i zapisuje dzialanie w `potion_*`. Odwolanie dzialania to osobna
 * akcja `$ACT_KILL_POTION` (27), ktora klient wysyla po DWUKROTNYM
 * klknieciu w ikonke dzialajacej mikstury.
 *
 * Tutaj sa to dwie zwykle trasy, bo nowy klient nie musi udawac, ze
 * wypicie mikstury to przenoszenie przedmiotu.
 */

import { Hono } from 'hono';
import type { Context } from 'hono';
import { getSql } from '../db/client.js';
import { time } from '../compat/php.js';
import {
  MIEJSC_NA_MIKSTURY,
  RODZAJ_MIKSTURY,
  czasPoWypiciu,
  miejsceDlaMikstury,
  miksturyGracza,
} from '../game/mikstury.js';
import { OSTATNI_SLOT_PLECAKA, PIERWSZY_SLOT_PLECAKA } from '../game/ekwipunek.js';
import { wczytajGracza } from './gracz.js';
import { tokenZNaglowka } from './konto.js';

export const mikstury = new Hono();

type Sql = ReturnType<typeof getSql>;

interface WierszGracza extends Record<string, unknown> {
  user_id: number;
}

async function wczytaj(c: Context): Promise<{ sql: Sql; wiersz: WierszGracza } | null> {
  const token = tokenZNaglowka(c);
  if (!token) return null;

  const sql = getSql();
  const [wiersz] = await sql<WierszGracza[]>`SELECT * FROM user_data WHERE ssid = ${token} LIMIT 1`;
  return wiersz ? { sql, wiersz } : null;
}

/** Swiezy stan postaci — po kazdej zmianie ekran dostaje go w calosci. */
async function stanGracza(sql: Sql, userId: number) {
  const [swiezy] = await sql<Record<string, unknown>[]>`
    SELECT * FROM user_data WHERE user_id = ${userId} LIMIT 1
  `;
  return { gracz: await wczytajGracza(sql, swiezy ?? {}) };
}

const POWODY: Record<string, string> = {
  slabsza: 'Działa już mocniejszy eliksir tego samego rodzaju.',
  'brak-miejsca': 'Wszystkie trzy miejsca na eliksiry są zajęte.',
};

/**
 * Wypicie mikstury z plecaka.
 *
 * `slot` to miejsce w plecaku (10..14). Zasady wyboru miejsca sa
 * w `miejsceDlaMikstury()`; mikstura znika z plecaka dopiero wtedy,
 * gdy naprawde zadziala.
 */
mikstury.post('/mikstura/wypij', async (c) => {
  const dane = await wczytaj(c);
  if (!dane) return c.json({ blad: 'Brak sesji.' }, 401);

  const { sql, wiersz } = dane;
  const zapytanie = (await c.req.json().catch(() => ({}))) as { slot?: unknown };
  const slot = Number(zapytanie.slot);

  if (!Number.isInteger(slot) || slot < PIERWSZY_SLOT_PLECAKA || slot > OSTATNI_SLOT_PLECAKA) {
    return c.json({ blad: 'Eliksir trzeba wziąć z plecaka.' }, 400);
  }

  const [przedmiot] = await sql<Record<string, unknown>[]>`
    SELECT id, item_type, item_id, atr_val_2 FROM items
    WHERE owner_id = ${wiersz.user_id} AND slot = ${slot} LIMIT 1
  `;
  if (!przedmiot) return c.json({ blad: 'W tym miejscu nic nie leży.' }, 409);
  if (Number(przedmiot['item_type']) !== RODZAJ_MIKSTURY) {
    return c.json({ blad: 'Tego się nie pije.' }, 409);
  }

  const numer = Number(przedmiot['item_id']);
  const stan = miksturyGracza(wiersz);
  const miejsce = miejsceDlaMikstury(numer, stan);

  if (typeof miejsce === 'string') {
    return c.json({ blad: POWODY[miejsce] ?? 'Nie da się teraz wypić tego eliksiru.' }, 409);
  }

  const koniec = czasPoWypiciu(numer, stan[miejsce - 1]?.koniec ?? 0, time());
  const wartosc = Number(przedmiot['atr_val_2'] ?? 0);

  /*
   * Numer miejsca wchodzi w NAZWE kolumny, wiec nie da sie go wstawic
   * zwyklym parametrem. Zamiast sklejac nazwe z liczby sa trzy gotowe
   * zapytania — do bazy nie trafia nic, co przyszlo od gracza.
   */
  if (miejsce === 1) {
    await sql`
      UPDATE user_data
      SET potion_id1 = ${numer}, potion_value1 = ${wartosc}, potion_time1 = ${koniec}
      WHERE user_id = ${wiersz.user_id}
    `;
  } else if (miejsce === 2) {
    await sql`
      UPDATE user_data
      SET potion_id2 = ${numer}, potion_value2 = ${wartosc}, potion_time2 = ${koniec}
      WHERE user_id = ${wiersz.user_id}
    `;
  } else {
    await sql`
      UPDATE user_data
      SET potion_id3 = ${numer}, potion_value3 = ${wartosc}, potion_time3 = ${koniec}
      WHERE user_id = ${wiersz.user_id}
    `;
  }

  await sql`DELETE FROM items WHERE id = ${Number(przedmiot['id'])}`;

  return c.json(await stanGracza(sql, wiersz.user_id));
});

/**
 * Odwolanie dzialania — `$ACT_KILL_POTION`.
 *
 * Oryginal nie oddaje ani czasu, ani mikstury: miejsce po prostu sie
 * zeruje. W kliencie robi to dwuklik w ikonke, a podpowiedz mowi o tym
 * wprost („Aby anulowac dzialanie eliksiru kliknij dwukrotnie jego
 * symbol.").
 */
mikstury.post('/mikstura/usun', async (c) => {
  const dane = await wczytaj(c);
  if (!dane) return c.json({ blad: 'Brak sesji.' }, 401);

  const { sql, wiersz } = dane;
  const zapytanie = (await c.req.json().catch(() => ({}))) as { miejsce?: unknown };
  const miejsce = Number(zapytanie.miejsce);

  if (!Number.isInteger(miejsce) || miejsce < 1 || miejsce > MIEJSC_NA_MIKSTURY) {
    return c.json({ blad: 'Nie ma takiego miejsca na eliksir.' }, 400);
  }

  if (miejsce === 1) {
    await sql`
      UPDATE user_data SET potion_id1 = 0, potion_value1 = 0, potion_time1 = 0
      WHERE user_id = ${wiersz.user_id}
    `;
  } else if (miejsce === 2) {
    await sql`
      UPDATE user_data SET potion_id2 = 0, potion_value2 = 0, potion_time2 = 0
      WHERE user_id = ${wiersz.user_id}
    `;
  } else {
    await sql`
      UPDATE user_data SET potion_id3 = 0, potion_value3 = 0, potion_time3 = 0
      WHERE user_id = ${wiersz.user_id}
    `;
  }

  return c.json(await stanGracza(sql, wiersz.user_id));
});
