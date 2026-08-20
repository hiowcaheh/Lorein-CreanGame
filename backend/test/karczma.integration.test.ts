import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';
import { app } from '../src/app.js';
import { PhpMtRand } from '../src/compat/rng.js';
import {
  awansuj,
  czasWyprawy,
  doswiadczenieZWyprawy,
  doswiadczenieZaZadanie,
  mnoznikWierzchowca,
  najblizszaPolnoc,
  wolneMiejsceWPlecaku,
  wylosujZadania,
} from '../src/game/karczma.js';

const URL_BAZY = process.env['TEST_DATABASE_URL'];
const opisz = URL_BAZY ? describe : describe.skip;

const SCHEMAT = readFileSync(fileURLToPath(new URL('../db/schema.sql', import.meta.url)), 'utf8');

describe('zasady karczmy', () => {
  it('wierzchowiec skraca wyprawe wedlug mountMultiplier()', () => {
    expect([0, 1, 2, 3, 4].map(mnoznikWierzchowca)).toEqual([1, 0.9, 0.8, 0.7, 0.5]);

    // Zadanie dlugosci 2 to dziesiec minut pieszo, piec na smoku.
    expect(czasWyprawy(2, 0)).toBe(600);
    expect(czasWyprawy(2, 4)).toBe(300);
  });

  it('premia rzadkiego zadania podnosi doswiadczenie', () => {
    // Bez zadnych bonusow mnoznik wynosi rowno jeden.
    expect(doswiadczenieZWyprawy(1000)).toBe(1000);
    // Premia 145 znaczy „o 145% wiecej".
    expect(doswiadczenieZWyprawy(1000, { premia: 145 })).toBe(2450);
    // Instruktor i lochy gildii dokladaja po jednej pieedziesiatej.
    expect(doswiadczenieZWyprawy(1000, { instruktor: 25, lochyGildii: 25 })).toBe(2000);
  });

  it('odswiezenie wypada o najblizszej polnocy', () => {
    const poludnie = Date.UTC(2026, 0, 15, 12, 0, 0) / 1000;
    expect(najblizszaPolnoc(poludnie)).toBe(Date.UTC(2026, 0, 16, 0, 0, 0) / 1000);
  });

  it('nagroda szuka pierwszej dziury w plecaku', () => {
    expect(wolneMiejsceWPlecaku([])).toBe(10);
    expect(wolneMiejsceWPlecaku([10, 12])).toBe(11);
    expect(wolneMiejsceWPlecaku([10, 11, 12, 13, 14])).toBeNull();
  });

  it('awans odejmuje prog i moze przeskoczyc kilka poziomow naraz', () => {
    // Progi: LEVELS[1] = 400, LEVELS[2] = 900.
    expect(awansuj(1, 100)).toEqual({ poziom: 1, doswiadczenie: 100 });
    expect(awansuj(1, 401)).toEqual({ poziom: 2, doswiadczenie: 1 });
    expect(awansuj(1, 1500)).toEqual({ poziom: 3, doswiadczenie: 200 });
  });

  it('doswiadczenie za zadanie rosnie z poziomem i zatrzymuje sie na 200', () => {
    expect(doswiadczenieZaZadanie(1)).toBeCloseTo(1 * (0.5 + 0.05), 6);
    expect(doswiadczenieZaZadanie(50)).toBeGreaterThan(doswiadczenieZaZadanie(10));
    expect(doswiadczenieZaZadanie(500)).toBe(doswiadczenieZaZadanie(200));
  });

  it('zadania sa trzy, kazde od 1 do 4 jednostek po piec minut', () => {
    for (let ziarno = 1; ziarno <= 40; ziarno++) {
      const zadania = wylosujZadania(30, 6000, new PhpMtRand(ziarno));

      expect(zadania).toHaveLength(3);
      for (const z of zadania) {
        expect(z.dlugosc).toBeGreaterThanOrEqual(1);
        expect(z.dlugosc).toBeLessThanOrEqual(4);
        expect(z.sekundy).toBe(z.dlugosc * 300);
        expect(z.zloto).toBeGreaterThan(0);
        expect(z.doswiadczenie).toBeGreaterThan(0);
        expect(z.lokacja).toBeGreaterThanOrEqual(1);
        expect(z.lokacja).toBeLessThanOrEqual(21);
      }
    }
  });

  it('nisko poziomowy gracz nie dostaje dlugich wypraw', () => {
    for (let ziarno = 1; ziarno <= 40; ziarno++) {
      for (const z of wylosujZadania(5, 6000, new PhpMtRand(ziarno))) {
        expect(z.dlugosc).toBeLessThanOrEqual(2);
      }
    }
  });

  it('resztka wytrzymalosci przycina dlugosc do jednej jednostki', () => {
    for (let ziarno = 1; ziarno <= 20; ziarno++) {
      for (const z of wylosujZadania(50, 150, new PhpMtRand(ziarno))) {
        expect(z.dlugosc).toBe(1);
      }
    }
  });
});

opisz('karczma przez API', () => {
  const sql = postgres(URL_BAZY ?? '', { onnotice: () => {}, max: 1 });
  let token = '';

  beforeAll(() => {
    process.env['DATABASE_URL'] = URL_BAZY;
  });

  beforeEach(async () => {
    await sql.unsafe('DROP SCHEMA public CASCADE; CREATE SCHEMA public;').simple();
    await sql.unsafe(SCHEMAT).simple();

    const odp = await wyslij('/api/register', {
      nick: 'Lorein', email: 'gracz@example.com', haslo: 'tajne123',
      rasa: 1, plec: 'm', klasa: 1, wyglad: [1, 101, 1, 1, 101, 1, 101, 1, 0, 0],
    });
    token = ((await odp.json()) as { token: string }).token;
  });

  afterAll(async () => {
    await sql.end();
  });

  function wyslij(sciezka: string, cialo?: unknown) {
    return app.request(sciezka, {
      method: cialo === undefined ? 'GET' : 'POST',
      headers: {
        'content-type': 'application/json',
        ...(token ? { authorization: `Bearer ${token}` } : {}),
        'x-forwarded-for': '10.0.0.1',
      },
      ...(cialo === undefined ? {} : { body: JSON.stringify(cialo) }),
    });
  }

  it('nowy gracz od razu widzi trzy zadania', async () => {
    const dane = (await (await wyslij('/api/karczma')).json()) as {
      zadania: { numer: number; zloto: number }[];
      wytrzymalosc: number;
      status: number;
    };

    expect(dane.zadania).toHaveLength(3);
    expect(dane.status).toBe(0);
    expect(dane.wytrzymalosc).toBe(6000);
    expect(dane.zadania[0]!.zloto).toBeGreaterThan(0);
  });

  it('zadania nie zmieniaja sie przy kazdym odswiezeniu', async () => {
    const pierwsze = (await (await wyslij('/api/karczma')).json()) as { zadania: unknown };
    const drugie = (await (await wyslij('/api/karczma')).json()) as { zadania: unknown };
    expect(drugie.zadania).toEqual(pierwsze.zadania);
  });

  it('podjecie zadania zajmuje bohatera na okreslony czas', async () => {
    const odp = await wyslij('/api/karczma/podejmij', { numer: 2 });
    expect(odp.status).toBe(200);

    const dane = (await odp.json()) as { status: number; wybraneZadanie: number; koniec: number; teraz: number };
    expect(dane.status).toBe(2);
    expect(dane.wybraneZadanie).toBe(2);
    expect(dane.koniec).toBeGreaterThan(dane.teraz);

    // Drugiego zadania nie da sie podjac rownoczesnie.
    expect((await wyslij('/api/karczma/podejmij', { numer: 1 })).status).toBe(409);
  });

  it('wyprawa w toku nie rozlicza sie przed czasem', async () => {
    await wyslij('/api/karczma/podejmij', { numer: 1 });

    // Wejscie do karczmy w trakcie wyprawy pokazuje pasek, nie wynik.
    const stan = (await (await wyslij('/api/karczma')).json()) as {
      status: number;
      rozliczenie: unknown;
      koniec: number;
      teraz: number;
    };
    expect(stan.status).toBe(2);
    expect(stan.rozliczenie).toBeNull();
    expect(stan.koniec).toBeGreaterThan(stan.teraz);
  });

  it('po czasie wyprawa rozlicza sie: walka, nagroda i nowe zadania', async () => {
    const przed = (await (await wyslij('/api/karczma')).json()) as {
      zadania: { numer: number; zloto: number; doswiadczenie: number; sekundy: number }[];
    };

    await wyslij('/api/karczma/podejmij', { numer: 1 });

    // Cofamy koniec wyprawy w przeszlosc zamiast czekac pieciu minut.
    await sql`UPDATE user_data SET status_end = 1 WHERE user_name = 'Lorein'`;

    // Wejscie do karczmy rozlicza wyprawe samo, tak jak w oryginale.
    const odp = await wyslij('/api/karczma');
    expect(odp.status).toBe(200);

    const wynik = (await odp.json()) as {
      status: number;
      rozliczenie: {
        wygrana: boolean;
        nagroda: { zloto: number; doswiadczenie: number } | null;
        walka: { ciosy: { kto: number; obrazenia: number }[]; potwor: { obrazek: number } };
      };
      gracz: { srebro: number; doswiadczenie: number };
      zadania: unknown[];
      wytrzymalosc: number;
    };

    expect(wynik.rozliczenie.walka.ciosy.length).toBeGreaterThan(0);
    expect(wynik.rozliczenie.walka.potwor.obrazek).toBeGreaterThanOrEqual(1);
    expect(wynik.zadania).toHaveLength(3);

    // Wyprawa kosztuje wytrzymalosc niezaleznie od wyniku.
    expect(wynik.wytrzymalosc).toBe(6000 - przed.zadania[0]!.sekundy);

    if (wynik.rozliczenie.wygrana) {
      expect(wynik.rozliczenie.nagroda!.zloto).toBe(przed.zadania[0]!.zloto);
      expect(wynik.gracz.srebro).toBe(100 + przed.zadania[0]!.zloto);
    } else {
      expect(wynik.rozliczenie.nagroda).toBeNull();
      expect(wynik.gracz.srebro).toBe(100);
    }

    // Po rozliczeniu bohater jest znowu wolny.
    expect(wynik.status).toBe(0);
  });

  it('przerwana wyprawa uwalnia bohatera bez nagrody', async () => {
    await wyslij('/api/karczma/podejmij', { numer: 1 });
    expect((await wyslij('/api/karczma/przerwij', {})).status).toBe(200);

    const stan = (await (await wyslij('/api/karczma')).json()) as { status: number };
    expect(stan.status).toBe(0);

    const [gracz] = await sql<{ silver: number }[]>`SELECT silver FROM user_data WHERE user_name = 'Lorein'`;
    expect(Number(gracz?.silver)).toBe(100);
  });

  it('bez wyprawy nie ma czego przyspieszac', async () => {
    const odp = await wyslij('/api/karczma/przyspiesz', {});
    expect(odp.status).toBe(409);
    expect(((await odp.json()) as { blad: string }).blad).toContain('przyspieszać');
  });

  // ---------------------------------------------------------- piwo --

  it('piwo dokłada wytrzymalosci za grzyba', async () => {
    await sql`UPDATE user_data SET thirst = 1000, mushroom = 5 WHERE user_name = 'Lorein'`;

    const odp = await wyslij('/api/karczma/piwo', {});
    expect(odp.status).toBe(200);

    const stan = (await odp.json()) as { wytrzymalosc: number; piwa: number; grzyby: number };
    expect(stan.wytrzymalosc).toBe(2200);
    expect(stan.piwa).toBe(1);
    expect(stan.grzyby).toBe(4);
  });

  it('karczmarz nie naleje zbyt wypoczetemu ani bez grzybow', async () => {
    await sql`UPDATE user_data SET thirst = 6000, mushroom = 5 WHERE user_name = 'Lorein'`;
    const zdrowy = await wyslij('/api/karczma/piwo', {});
    expect(zdrowy.status).toBe(409);
    expect(((await zdrowy.json()) as { blad: string }).blad).toContain('wypoczęty');

    await sql`UPDATE user_data SET thirst = 1000, mushroom = 0 WHERE user_name = 'Lorein'`;
    const biedny = await wyslij('/api/karczma/piwo', {});
    expect(biedny.status).toBe(409);
    expect(((await biedny.json()) as { blad: string }).blad).toContain('grzybów');
  });

  it('dzienny limit piw jest pilnowany', async () => {
    await sql`UPDATE user_data SET thirst = 1000, mushroom = 50, beers = 11 WHERE user_name = 'Lorein'`;
    const odp = await wyslij('/api/karczma/piwo', {});
    expect(odp.status).toBe(409);
    expect(((await odp.json()) as { blad: string }).blad).toContain('dość');
  });

  // -------------------------------------------------- przyspieszenie --

  it('grzyb konczy wyprawe od razu', async () => {
    await sql`UPDATE user_data SET mushroom = 5 WHERE user_name = 'Lorein'`;
    await wyslij('/api/karczma/podejmij', { numer: 1 });

    const odp = await wyslij('/api/karczma/przyspiesz', {});
    expect(odp.status).toBe(200);

    const wynik = (await odp.json()) as {
      status: number;
      grzyby: number;
      rozliczenie: { walka: { ciosy: unknown[] } } | null;
    };
    expect(wynik.status).toBe(0);
    expect(wynik.rozliczenie!.walka.ciosy.length).toBeGreaterThan(0);
    // Jeden grzyb za przyspieszenie; wygrana moze dorzucic swoje.
    expect(wynik.grzyby).toBeGreaterThanOrEqual(4);
  });

  it('ostatniego grzyba nie da sie wydac na przyspieszenie', async () => {
    // Oryginal odrzuca przy `mushroom <= 1`, wiec jeden grzyb to za malo.
    await sql`UPDATE user_data SET mushroom = 1 WHERE user_name = 'Lorein'`;
    await wyslij('/api/karczma/podejmij', { numer: 1 });

    const odp = await wyslij('/api/karczma/przyspiesz', {});
    expect(odp.status).toBe(409);
    expect(((await odp.json()) as { blad: string }).blad).toContain('grzybów');
  });

  // ---------------------------------------------- dobowe odswiezenie --

  it('po polnocy wytrzymalosc i licznik piw wracaja do pelna', async () => {
    await sql`
      UPDATE user_data SET thirst = 300, beers = 7, quest_reroll_time = 1
      WHERE user_name = 'Lorein'
    `;

    const stan = (await (await wyslij('/api/karczma')).json()) as {
      wytrzymalosc: number;
      piwa: number;
    };
    expect(stan.wytrzymalosc).toBe(6000);
    expect(stan.piwa).toBe(0);
  });

  // ------------------------------------------- nagroda przedmiotowa --

  it('nagroda z wyprawy trafia do plecaka, a przy pelnym przepada', async () => {
    const [gracz] = await sql<{ user_id: number }[]>`
      SELECT user_id FROM user_data WHERE user_name = 'Lorein'
    `;
    const id = gracz!.user_id;

    // Wstawiamy nagrode recznie, zeby test nie zalezal od losowania.
    async function przygotuj(pelnyPlecak: boolean) {
      await sql`DELETE FROM items WHERE owner_id = ${id} AND slot >= 10`;
      if (pelnyPlecak) {
        for (let slot = 10; slot <= 14; slot++) {
          await sql`
            INSERT INTO items (item_type, item_id, dmg_min, dmg_max,
                               atr_type_1, atr_type_2, atr_type_3,
                               atr_val_1, atr_val_2, atr_val_3, gold, mush, slot, owner_id)
            VALUES (6, 1, 5, 0, 1, 0, 0, 1, 0, 0, 10, 0, ${slot}, ${id})
          `;
        }
      }

      await sql`DELETE FROM items_tavern WHERE owner_id = ${id}`;
      await sql`
        INSERT INTO items_tavern (item_type, item_id, dmg_min, dmg_max,
                                  atr_type_1, atr_type_2, atr_type_3,
                                  atr_val_1, atr_val_2, atr_val_3,
                                  gold, mush, quest, owner_id, enchant, enchant_power)
        VALUES (6, 2, 16, 0, 4, 0, 0, 1, 0, 0, 53, 0, 1, ${id}, 0, 0)
      `;
      await sql`
        UPDATE user_data SET status = 2, status_extra = 1, status_end = 1, thirst = 6000
        WHERE user_id = ${id}
      `;
    }

    // Wygrana jest losowa, wiec probujemy, az bohater wroci zwycieski.
    async function wyprawaAzDoWygranej(pelnyPlecak: boolean) {
      for (let proba = 0; proba < 40; proba++) {
        await przygotuj(pelnyPlecak);
        const wynik = (await (await wyslij('/api/karczma')).json()) as {
          rozliczenie: { wygrana: boolean; zdobytyPrzedmiot: unknown; plecakBylPelny: boolean };
        };
        if (wynik.rozliczenie.wygrana) return wynik.rozliczenie;
      }
      throw new Error('bohater przegral czterdziesci wypraw z rzedu');
    }

    const zPustym = await wyprawaAzDoWygranej(false);
    expect(zPustym.zdobytyPrzedmiot).not.toBeNull();
    expect(zPustym.plecakBylPelny).toBe(false);

    const zPelnym = await wyprawaAzDoWygranej(true);
    expect(zPelnym.zdobytyPrzedmiot).toBeNull();
    expect(zPelnym.plecakBylPelny).toBe(true);
  });

  it('bez wytrzymalosci nie da sie ruszyc na wyprawe', async () => {
    await sql`UPDATE user_data SET thirst = 0 WHERE user_name = 'Lorein'`;
    const odp = await wyslij('/api/karczma/podejmij', { numer: 1 });
    expect(odp.status).toBe(409);
    expect(((await odp.json()) as { blad: string }).blad).toContain('wytrzymałości');
  });
});
