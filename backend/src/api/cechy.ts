/**
 * Kupowanie punktow cech.
 *
 * Odpowiednik `$ACT_BUY_STAT` (akcja 21). Klient wysyla sam numer cechy;
 * cene, sprawdzenie stanu kasy i nowa wartosc liczy serwer.
 */

import { Hono } from 'hono';
import type { Context } from 'hono';
import { getSql } from '../db/client.js';
import { PUNKTOW_ZA_ZAKUP, sprawdzZakupCechy } from '../game/cechy.js';
import { wczytajGracza } from './gracz.js';
import { tokenZNaglowka } from './konto.js';

export const cechy = new Hono();

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

const POWODY: Record<string, string> = {
  'nie-ma-takiej-cechy': 'Nie ma takiej cechy.',
  'za-drogo': 'Nie stać cię na to.',
};

/** Wartosc cechy z wiersza — kolumny sa stale, wiec bez skladania nazw. */
function wartoscCechy(wiersz: WierszGracza, cecha: number): number {
  const kolumny = ['attr_str', 'attr_agi', 'attr_int', 'attr_wit', 'attr_luck'];
  return liczba(wiersz[kolumny[cecha - 1] ?? '']);
}

cechy.post('/cecha/kup', async (c) => {
  const dane = await wczytaj(c);
  if (!dane) return c.json({ blad: 'Brak sesji.' }, 401);

  const { sql, wiersz } = dane;
  const zapytanie = (await c.req.json().catch(() => ({}))) as { cecha?: unknown };
  const cecha = Number(zapytanie.cecha);

  const wynik = sprawdzZakupCechy(cecha, {
    klasa: liczba(wiersz['class']) || 1,
    rasa: liczba(wiersz['race']) || 1,
    wartosc: wartoscCechy(wiersz, cecha),
    srebro: liczba(wiersz['silver']),
  });

  if (typeof wynik === 'string') {
    return c.json({ blad: POWODY[wynik] ?? 'Nie da się.' }, 409);
  }

  /*
   * Numer cechy wchodzi w NAZWE kolumny, wiec zamiast sklejac ja
   * z liczby jest piec gotowych zapytan — do bazy nie trafia nic,
   * co przyszlo od gracza.
   */
  const { wartosc, srebro } = wynik;
  const id = wiersz.user_id;

  if (cecha === 1) {
    await sql`UPDATE user_data SET attr_str = ${wartosc}, silver = ${srebro} WHERE user_id = ${id}`;
  } else if (cecha === 2) {
    await sql`UPDATE user_data SET attr_agi = ${wartosc}, silver = ${srebro} WHERE user_id = ${id}`;
  } else if (cecha === 3) {
    await sql`UPDATE user_data SET attr_int = ${wartosc}, silver = ${srebro} WHERE user_id = ${id}`;
  } else if (cecha === 4) {
    await sql`UPDATE user_data SET attr_wit = ${wartosc}, silver = ${srebro} WHERE user_id = ${id}`;
  } else {
    await sql`UPDATE user_data SET attr_luck = ${wartosc}, silver = ${srebro} WHERE user_id = ${id}`;
  }

  const [swiezy] = await sql<WierszGracza[]>`
    SELECT * FROM user_data WHERE user_id = ${id} LIMIT 1
  `;

  return c.json({
    gracz: await wczytajGracza(sql, swiezy ?? wiersz),
    /** Ile punktow doszlo — zawsze trzy, ale niech ekran nie zgaduje. */
    przyrost: PUNKTOW_ZA_ZAKUP,
    cena: wynik.cena,
  });
});
