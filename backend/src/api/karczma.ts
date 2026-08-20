/**
 * Karczma — trzy zadania, ich podjecie i rozliczenie.
 *
 * Petla rozgrywki: wybierasz zadanie, czekasz, odbierasz nagrode. Walka
 * z potworem rozstrzyga sie dopiero przy odbiorze, po stronie serwera —
 * przegladarka niczego nie liczy i nie ma czego oszukiwac.
 */

import { Hono } from 'hono';
import { getSql } from '../db/client.js';
import { PhpMtRand } from '../compat/rng.js';
import { time } from '../compat/php.js';
import {
  PELNA_WYTRZYMALOSC,
  awansuj,
  wylosujZadania,
  zadaniaZWiersza,
  type Zadanie,
} from '../game/karczma.js';
import { potworNaZadanie, rozegrajWalke, wojownikZGracza, type Przedmiot } from '../game/walka.js';
import { wczytajGracza } from './gracz.js';
import { tokenZNaglowka } from './konto.js';
import type { Context } from 'hono';

export const karczma = new Hono();

/** Stan gracza wobec zadania. */
type Status = 0 | 2;

interface WierszGracza extends Record<string, unknown> {
  user_id: number;
}

/**
 * Wczytuje gracza po tokenie. Zwraca `null`, gdy sesja wygasla — wtedy
 * trasa odpowiada 401 i klient odsyla na ekran logowania.
 */
async function wczytaj(c: Context): Promise<{ sql: ReturnType<typeof getSql>; wiersz: WierszGracza } | null> {
  const token = tokenZNaglowka(c);
  if (!token) return null;

  const sql = getSql();
  const [wiersz] = await sql<WierszGracza[]>`SELECT * FROM user_data WHERE ssid = ${token} LIMIT 1`;
  return wiersz ? { sql, wiersz } : null;
}

async function przedmiotyGracza(
  sql: ReturnType<typeof getSql>,
  userId: number,
): Promise<Przedmiot[]> {
  return sql<Przedmiot[]>`
    SELECT slot, dmg_min, dmg_max, atr_type_1, atr_type_2, atr_type_3,
           atr_val_1, atr_val_2, atr_val_3
    FROM items WHERE owner_id = ${userId} AND slot <= 9
  `;
}

/**
 * Zadania sa losowane raz i zapisywane, zeby odswiezenie strony nie
 * podmienialo ich graczowi pod rekami. Nowy gracz ma je wyzerowane —
 * wtedy losujemy pierwszy komplet.
 */
async function zadaniaGracza(
  sql: ReturnType<typeof getSql>,
  wiersz: WierszGracza,
): Promise<Zadanie[]> {
  const zapisane = zadaniaZWiersza(wiersz);
  if (zapisane.some((z) => z.doswiadczenie > 0)) return zapisane;

  const swieze = wylosujZadania(
    Number(wiersz['lvl'] ?? 1),
    Number(wiersz['thirst'] ?? PELNA_WYTRZYMALOSC),
    new PhpMtRand(),
  );
  await zapiszZadania(sql, wiersz['user_id'], swieze);
  return swieze;
}

async function zapiszZadania(
  sql: ReturnType<typeof getSql>,
  userId: number,
  zadania: Zadanie[],
): Promise<void> {
  const [a, b, c] = zadania;
  if (!a || !b || !c) return;

  await sql`
    UPDATE user_data SET
      quest_dur_1 = ${a.dlugosc}, quest_dur_2 = ${b.dlugosc}, quest_dur_3 = ${c.dlugosc},
      quest_gold_1 = ${a.zloto}, quest_gold_2 = ${b.zloto}, quest_gold_3 = ${c.zloto},
      quest_exp_1 = ${a.doswiadczenie}, quest_exp_2 = ${b.doswiadczenie}, quest_exp_3 = ${c.doswiadczenie},
      quest_location_1 = ${a.lokacja}, quest_location_2 = ${b.lokacja}, quest_location_3 = ${c.lokacja}
    WHERE user_id = ${userId}
  `;
}

// ------------------------------------------------------------ stan --

karczma.get('/karczma', async (c) => {
  const dane = await wczytaj(c);
  if (!dane) return c.json({ blad: 'Sesja wygasła — zaloguj się ponownie.' }, 401);

  const { sql, wiersz } = dane;
  const zadania = await zadaniaGracza(sql, wiersz);

  return c.json({
    wytrzymalosc: Number(wiersz['thirst'] ?? 0),
    wytrzymaloscMaks: PELNA_WYTRZYMALOSC,
    status: Number(wiersz['status'] ?? 0) as Status,
    wybraneZadanie: Number(wiersz['status_extra'] ?? 0),
    koniec: Number(wiersz['status_end'] ?? 0),
    teraz: time(),
    zadania,
  });
});

// ---------------------------------------------------------- podejmij --

karczma.post('/karczma/podejmij', async (c) => {
  const dane = await wczytaj(c);
  if (!dane) return c.json({ blad: 'Sesja wygasła — zaloguj się ponownie.' }, 401);

  const { sql, wiersz } = dane;
  const cialo = (await c.req.json().catch(() => ({}))) as { numer?: unknown };
  const numer = Math.min(3, Math.max(1, Math.trunc(Number(cialo.numer) || 1)));

  if (Number(wiersz['status'] ?? 0) !== 0) {
    return c.json({ blad: 'Twój bohater jest już zajęty.' }, 409);
  }

  const zadania = await zadaniaGracza(sql, wiersz);
  const zadanie = zadania[numer - 1];
  if (!zadanie) return c.json({ blad: 'Nie ma takiego zadania.' }, 400);

  const wytrzymalosc = Number(wiersz['thirst'] ?? 0);
  if (wytrzymalosc < zadanie.sekundy) {
    return c.json({ blad: 'Za mało wytrzymałości na tak długą wyprawę.' }, 409);
  }

  const koniec = time() + zadanie.sekundy;

  await sql`
    UPDATE user_data SET status = 2, status_extra = ${numer}, status_end = ${koniec}
    WHERE user_id = ${wiersz['user_id']}
  `;

  return c.json({ status: 2, wybraneZadanie: numer, koniec, teraz: time(), zadanie });
});

// ----------------------------------------------------------- przerwij --

karczma.post('/karczma/przerwij', async (c) => {
  const dane = await wczytaj(c);
  if (!dane) return c.json({ blad: 'Sesja wygasła — zaloguj się ponownie.' }, 401);

  await dane.sql`
    UPDATE user_data SET status = 0, status_end = 0 WHERE user_id = ${dane.wiersz['user_id']}
  `;
  return c.json({ status: 0 });
});

// ------------------------------------------------------------ odbierz --

karczma.post('/karczma/odbierz', async (c) => {
  const dane = await wczytaj(c);
  if (!dane) return c.json({ blad: 'Sesja wygasła — zaloguj się ponownie.' }, 401);

  const { sql, wiersz } = dane;

  if (Number(wiersz['status'] ?? 0) !== 2) {
    return c.json({ blad: 'Nie masz żadnej wyprawy do rozliczenia.' }, 409);
  }

  const koniec = Number(wiersz['status_end'] ?? 0);
  if (time() < koniec) {
    return c.json({ blad: 'Wyprawa jeszcze trwa.', koniec, teraz: time() }, 409);
  }

  const numer = Math.min(3, Math.max(1, Number(wiersz['status_extra'] ?? 1)));
  const zadanie = zadaniaZWiersza(wiersz)[numer - 1]!;

  // Walka liczy sie tutaj, na serwerze. Przegladarka dostaje gotowy
  // przebieg do odegrania i nie ma czego podmienic.
  const rng = new PhpMtRand();
  const przedmioty = await przedmiotyGracza(sql, wiersz['user_id']);
  const gracz = wojownikZGracza(wiersz, przedmioty);
  const potwor = potworNaZadanie(gracz, rng);

  const zycieGraczaPrzed = gracz.zycie;
  const zyciePotworaPrzed = potwor.zycie;
  const walka = rozegrajWalke(gracz, potwor, rng);
  const wygrana = walka.wygral === 1;

  let poziom = Number(wiersz['lvl'] ?? 1);
  let doswiadczenie = Number(wiersz['exp'] ?? 0);
  let srebro = Number(wiersz['silver'] ?? 0);
  let honor = Number(wiersz['honor'] ?? 0);
  let wytrzymalosc = Number(wiersz['thirst'] ?? 0);

  const poziomPrzed = poziom;

  if (wygrana) {
    srebro += zadanie.zloto;
    doswiadczenie += zadanie.doswiadczenie;
    honor += 10;
    wytrzymalosc = Math.max(0, wytrzymalosc - zadanie.sekundy);

    const po = awansuj(poziom, doswiadczenie);
    poziom = po.poziom;
    doswiadczenie = po.doswiadczenie;
  } else {
    // Przegrana tez kosztuje czas i sily, ale nagrody nie ma.
    wytrzymalosc = Math.max(0, wytrzymalosc - zadanie.sekundy);
  }

  // Nowy komplet zadan po kazdej wyprawie — jak w oryginale.
  const noweZadania = wylosujZadania(poziom, wytrzymalosc, rng);

  await sql`
    UPDATE user_data SET
      status = 0, status_end = 0, status_extra = 0,
      lvl = ${poziom}, exp = ${doswiadczenie}, silver = ${srebro},
      honor = ${honor}, thirst = ${wytrzymalosc},
      medal_adventurer = ${Number(wiersz['medal_adventurer'] ?? 0) + (wygrana ? 1 : 0)}
    WHERE user_id = ${wiersz['user_id']}
  `;
  await zapiszZadania(sql, wiersz['user_id'], noweZadania);

  const [poAktualizacji] = await sql<Record<string, unknown>[]>`
    SELECT * FROM user_data WHERE user_id = ${wiersz['user_id']} LIMIT 1
  `;

  return c.json({
    wygrana,
    awans: poziom > poziomPrzed ? poziom : null,
    nagroda: wygrana ? { zloto: zadanie.zloto, doswiadczenie: zadanie.doswiadczenie, honor: 10 } : null,
    walka: {
      gracz: { nazwa: gracz.nazwa, zycie: zycieGraczaPrzed, klasa: gracz.klasa, poziom: gracz.poziom },
      potwor: {
        nazwa: potwor.nazwa, zycie: zyciePotworaPrzed, klasa: potwor.klasa,
        poziom: potwor.poziom, obrazek: potwor.obrazek,
      },
      ciosy: walka.ciosy,
    },
    gracz: await wczytajGracza(sql, poAktualizacji ?? wiersz),
    zadania: noweZadania,
    wytrzymalosc,
  });
});
