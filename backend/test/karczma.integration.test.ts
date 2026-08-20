import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';
import { app } from '../src/app.js';
import { PhpMtRand } from '../src/compat/rng.js';
import { awansuj, doswiadczenieZaZadanie, wylosujZadania } from '../src/game/karczma.js';

const URL_BAZY = process.env['TEST_DATABASE_URL'];
const opisz = URL_BAZY ? describe : describe.skip;

const SCHEMAT = readFileSync(fileURLToPath(new URL('../db/schema.sql', import.meta.url)), 'utf8');

describe('zasady karczmy', () => {
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

  it('nagrody nie da sie odebrac przed czasem', async () => {
    await wyslij('/api/karczma/podejmij', { numer: 1 });
    const odp = await wyslij('/api/karczma/odbierz', {});
    expect(odp.status).toBe(409);
    expect(((await odp.json()) as { blad: string }).blad).toContain('trwa');
  });

  it('po czasie wyprawa rozlicza sie: walka, nagroda i nowe zadania', async () => {
    const przed = (await (await wyslij('/api/karczma')).json()) as {
      zadania: { numer: number; zloto: number; doswiadczenie: number; sekundy: number }[];
    };

    await wyslij('/api/karczma/podejmij', { numer: 1 });

    // Cofamy koniec wyprawy w przeszlosc zamiast czekac pieciu minut.
    await sql`UPDATE user_data SET status_end = 1 WHERE user_name = 'Lorein'`;

    const odp = await wyslij('/api/karczma/odbierz', {});
    expect(odp.status).toBe(200);

    const wynik = (await odp.json()) as {
      wygrana: boolean;
      nagroda: { zloto: number; doswiadczenie: number } | null;
      walka: { ciosy: { kto: number; obrazenia: number }[]; potwor: { obrazek: number } };
      gracz: { srebro: number; doswiadczenie: number };
      zadania: unknown[];
      wytrzymalosc: number;
    };

    expect(wynik.walka.ciosy.length).toBeGreaterThan(0);
    expect(wynik.walka.potwor.obrazek).toBeGreaterThanOrEqual(1);
    expect(wynik.zadania).toHaveLength(3);

    // Wyprawa kosztuje wytrzymalosc niezaleznie od wyniku.
    expect(wynik.wytrzymalosc).toBe(6000 - przed.zadania[0]!.sekundy);

    if (wynik.wygrana) {
      expect(wynik.nagroda!.zloto).toBe(przed.zadania[0]!.zloto);
      expect(wynik.gracz.srebro).toBe(100 + przed.zadania[0]!.zloto);
    } else {
      expect(wynik.nagroda).toBeNull();
      expect(wynik.gracz.srebro).toBe(100);
    }

    // Po rozliczeniu bohater jest znowu wolny.
    const stan = (await (await wyslij('/api/karczma')).json()) as { status: number };
    expect(stan.status).toBe(0);
  });

  it('przerwana wyprawa uwalnia bohatera bez nagrody', async () => {
    await wyslij('/api/karczma/podejmij', { numer: 1 });
    expect((await wyslij('/api/karczma/przerwij', {})).status).toBe(200);

    const stan = (await (await wyslij('/api/karczma')).json()) as { status: number };
    expect(stan.status).toBe(0);

    const [gracz] = await sql<{ silver: number }[]>`SELECT silver FROM user_data WHERE user_name = 'Lorein'`;
    expect(Number(gracz?.silver)).toBe(100);
  });

  it('nie da sie odebrac nagrody bez wyprawy', async () => {
    expect((await wyslij('/api/karczma/odbierz', {})).status).toBe(409);
  });

  it('bez wytrzymalosci nie da sie ruszyc na wyprawe', async () => {
    await sql`UPDATE user_data SET thirst = 0 WHERE user_name = 'Lorein'`;
    const odp = await wyslij('/api/karczma/podejmij', { numer: 1 });
    expect(odp.status).toBe(409);
    expect(((await odp.json()) as { blad: string }).blad).toContain('wytrzymałości');
  });
});
