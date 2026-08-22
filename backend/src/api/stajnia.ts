/**
 * Stajnia — stan ekranu i najem wierzchowca.
 *
 * Ekran jest prosty: cztery boksy, w kazdym jeden wierzchowiec, i jeden
 * przycisk. O cenach, o tym, czy wolno wziac, i o dlugosci najmu
 * decyduje WYLACZNIE serwer — klient dostaje gotowa liste i mowi tylko
 * „biore tego".
 */

import { Hono } from 'hono';
import type { Context } from 'hono';
import { getSql } from '../db/client.js';
import { time } from '../compat/php.js';
import {
  CENNIK,
  LICZBA_WIERZCHOWCOW,
  czynnyWierzchowiec,
  mnoznikWierzchowca,
  premiaZaNajlepszego,
  sprawdzNajem,
} from '../game/stajnia.js';
import { wczytajGracza } from './gracz.js';
import { tokenZNaglowka } from './konto.js';

export const stajnia = new Hono();

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

export interface Boks {
  /** Numer wierzchowca 1..4 — ten sam, ktory idzie do kolumny `mount`. */
  numer: number;
  cena: { srebro: number; grzyby: number };
  /** O ile skraca wyprawe, w procentach: 10, 20, 30 albo 50. */
  skrocenie: number;
  /** Srebro, ktore gracz dostanie w zamian — tylko czwarty wierzchowiec. */
  premia: number;
  /** Czy da sie go teraz wziac, i jesli nie, to dlaczego. */
  odmowa: string | null;
}

export interface StanStajni {
  /** Wierzchowiec, ktory DZIALA — zero, gdy najem wygasl. */
  wierzchowiec: number;
  /** Do kiedy najem, czas uniksowy. Zero, gdy zadnego nie ma. */
  najemDo: number;
  czasSerwera: number;
  boksy: Boks[];
  gracz?: unknown;
}

const POWODY: Record<string, string> = {
  'nie-ma-takiego': 'Takiego wierzchowca tu nie ma.',
  gorszy: 'Masz już lepszego wierzchowca.',
  'za-drogo': 'Nie stać cię na to.',
  'brak-grzybow': 'Za mało grzybów.',
};

async function stanStajni(sql: Sql, wiersz: WierszGracza): Promise<StanStajni> {
  const teraz = time();
  const poziom = liczba(wiersz['lvl']) || 1;
  const stan = {
    teraz,
    wierzchowiec: liczba(wiersz['mount']),
    najemDo: liczba(wiersz['mount_dur']),
    srebro: liczba(wiersz['silver']),
    grzyby: liczba(wiersz['mushroom']),
    poziom,
  };

  const boksy: Boks[] = [];
  for (let numer = 1; numer <= LICZBA_WIERZCHOWCOW; numer++) {
    const wynik = sprawdzNajem(numer, stan);
    boksy.push({
      numer,
      cena: CENNIK[numer]!,
      skrocenie: Math.round((1 - mnoznikWierzchowca(numer)) * 100),
      premia: numer >= LICZBA_WIERZCHOWCOW ? premiaZaNajlepszego(poziom) : 0,
      odmowa: typeof wynik === 'string' ? (POWODY[wynik] ?? 'Nie da się.') : null,
    });
  }

  const czynny = czynnyWierzchowiec(stan.wierzchowiec, stan.najemDo, teraz);

  return {
    wierzchowiec: czynny,
    najemDo: czynny > 0 ? stan.najemDo : 0,
    czasSerwera: teraz,
    boksy,
    gracz: await wczytajGracza(sql, wiersz),
  };
}

stajnia.get('/stajnia', async (c) => {
  const dane = await wczytaj(c);
  if (!dane) return c.json({ blad: 'Brak sesji.' }, 401);
  return c.json(await stanStajni(dane.sql, dane.wiersz));
});

stajnia.post('/stajnia/kup', async (c) => {
  const dane = await wczytaj(c);
  if (!dane) return c.json({ blad: 'Brak sesji.' }, 401);

  const { sql, wiersz } = dane;
  const zapytanie = (await c.req.json().catch(() => ({}))) as { wierzchowiec?: unknown };
  const numer = Number(zapytanie.wierzchowiec);

  const wynik = sprawdzNajem(numer, {
    teraz: time(),
    wierzchowiec: liczba(wiersz['mount']),
    najemDo: liczba(wiersz['mount_dur']),
    srebro: liczba(wiersz['silver']),
    grzyby: liczba(wiersz['mushroom']),
    poziom: liczba(wiersz['lvl']) || 1,
  });

  if (typeof wynik === 'string') {
    return c.json({ blad: POWODY[wynik] ?? 'Nie da się.' }, 409);
  }

  await sql`
    UPDATE user_data
    SET mount = ${numer},
        mount_dur = ${wynik.najemDo},
        silver = ${wynik.srebro},
        mushroom = ${wynik.grzyby}
    WHERE user_id = ${wiersz.user_id}
  `;

  const [swiezy] = await sql<WierszGracza[]>`
    SELECT * FROM user_data WHERE user_id = ${wiersz.user_id} LIMIT 1
  `;
  return c.json(await stanStajni(sql, swiezy ?? wiersz));
});
