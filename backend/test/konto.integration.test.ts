import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';
import { app } from '../src/app.js';

/**
 * Test API konta na prawdziwym Postgresie.
 *
 * Uruchamia sie tylko przy wskazanej bazie testowej:
 *
 *     TEST_DATABASE_URL=postgresql://... npm test
 *
 * Bez niej jest pomijany, zeby zestaw dzialal takze bez bazy.
 */

const URL_BAZY = process.env['TEST_DATABASE_URL'];
const opisz = URL_BAZY ? describe : describe.skip;

const SCHEMAT = readFileSync(fileURLToPath(new URL('../db/schema.sql', import.meta.url)), 'utf8');

opisz('API konta', () => {
  // `max: 1` i `.simple()` — schemat to jeden skrypt z wieloma poleceniami,
  // a postgres.js puszcza takie tylko po jednym polaczeniu i prostym
  // protokolem zapytan.
  const sql = postgres(URL_BAZY ?? '', { onnotice: () => {}, max: 1 });

  beforeAll(() => {
    // Backend czyta adres bazy leniwie, przy pierwszym zapytaniu.
    process.env['DATABASE_URL'] = URL_BAZY;
  });

  beforeEach(async () => {
    await sql.unsafe('DROP SCHEMA public CASCADE; CREATE SCHEMA public;').simple();
    await sql.unsafe(SCHEMAT).simple();
  });

  afterAll(async () => {
    await sql.end();
  });

  function wyslij(sciezka: string, cialo?: unknown, token?: string) {
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

  const NOWY = {
    nick: 'Lorein',
    email: 'gracz@example.com',
    haslo: 'tajne123',
    rasa: 3,
    plec: 'f',
    klasa: 2,
    wyglad: [2, 0, 3, 4, 101, 2, 201, 1, 0, 0],
  };

  it('zaklada konto i od razu zwraca stan gracza', async () => {
    const odp = await wyslij('/api/register', NOWY);
    expect(odp.status).toBe(201);

    const { token, gracz } = (await odp.json()) as { token: string; gracz: Record<string, unknown> };

    expect(token).toMatch(/^[0-9a-f]{32}$/);
    expect(gracz['nick']).toBe('Lorein');
    expect(gracz['rasa']).toBe(3);
    expect(gracz['plec']).toBe('f');
    expect(gracz['klasa']).toBe(2);

    // Cechy startowe krasnoludzkiej magini — z portu `loadDefaultStats`,
    // sprawdzonego wczesniej wobec oryginalu w PHP.
    expect(gracz['cechy']).toEqual({ sila: 10, zrecznosc: 8, intelekt: 17, wytrzymalosc: 14, szczescie: 16 });
    expect(gracz['wyglad']).toEqual([2, 0, 3, 4, 101, 2, 201, 1, 0]);
  });

  it('nowy gracz dostaje bron zalezna od klasy', async () => {
    await wyslij('/api/register', { ...NOWY, klasa: 2 });
    const [bron] = await sql<{ item_id: number; dmg_min: number }[]>`
      SELECT item_id, dmg_min FROM items WHERE slot = 8
    `;
    expect(bron?.item_id).toBe(1001);
    expect(bron?.dmg_min).toBe(6);
  });

  it('hasla nie leza w bazie jawnie ani jako MD5', async () => {
    await wyslij('/api/register', NOWY);
    const [wiersz] = await sql<{ password: string }[]>`SELECT password FROM user_data`;

    expect(wiersz?.password).toMatch(/^scrypt\$/);
    expect(wiersz?.password).not.toContain('tajne123');
    expect(wiersz?.password).not.toBe(createHash('md5').update('tajne123').digest('hex'));
  });

  it('odmawia zajetego imienia i zajetego adresu', async () => {
    await wyslij('/api/register', NOWY);

    const poImieniu = await wyslij('/api/register', { ...NOWY, email: 'inny@example.com' });
    expect(poImieniu.status).toBe(409);
    expect(((await poImieniu.json()) as { blad: string }).blad).toContain('imię');

    const poAdresie = await wyslij('/api/register', { ...NOWY, nick: 'Ktos' });
    expect(poAdresie.status).toBe(409);
    expect(((await poAdresie.json()) as { blad: string }).blad).toContain('adres');
  });

  it('pilnuje limitu kont na jeden adres IP', async () => {
    for (let i = 1; i <= 3; i++) {
      const odp = await wyslij('/api/register', { ...NOWY, nick: `Gracz${i}`, email: `g${i}@example.com` });
      expect(odp.status).toBe(201);
    }
    const czwarty = await wyslij('/api/register', { ...NOWY, nick: 'Gracz4', email: 'g4@example.com' });
    expect(czwarty.status).toBe(429);
  });

  it('logowanie daje za kazdym razem nowy token', async () => {
    const { token: pierwszy } = (await (await wyslij('/api/register', NOWY)).json()) as { token: string };
    const { token: drugi } = (await (
      await wyslij('/api/login', { nick: 'Lorein', haslo: 'tajne123' })
    ).json()) as { token: string };

    expect(drugi).toMatch(/^[0-9a-f]{32}$/);
    expect(drugi).not.toBe(pierwszy);
  });

  it('nie zdradza, czy konto istnieje', async () => {
    await wyslij('/api/register', NOWY);

    const zleHaslo = await wyslij('/api/login', { nick: 'Lorein', haslo: 'nie-to' });
    const brakKonta = await wyslij('/api/login', { nick: 'Nikt', haslo: 'cokolwiek' });

    expect(zleHaslo.status).toBe(401);
    expect(brakKonta.status).toBe(401);
    expect(((await zleHaslo.json()) as { blad: string }).blad).toBe(
      ((await brakKonta.json()) as { blad: string }).blad,
    );
  });

  it('konto ze starym haszem MD5 loguje sie i przechodzi na scrypt', async () => {
    const md5 = createHash('md5').update('stare123').digest('hex');
    await sql`
      INSERT INTO user_data (
        user_name, password, email, last_ip, last_activ, ssid, reg_date,
        class, race, gender,
        face1, face2, face3, face4, face5, face6, face7, face8, face9, face10,
        quest_gold_1, quest_gold_2, quest_gold_3, quest_exp_1, quest_exp_2, quest_exp_3,
        quest_location_1, quest_location_2, quest_location_3,
        quest_dur_1, quest_dur_2, quest_dur_3,
        g_silverspent, g_mushroomspent, user_desc, album_data, voucher_date,
        potion_id1, potion_id2, potion_id3, potion_value1, potion_value2, potion_value3,
        potion_time1, potion_time2, potion_time3
      ) VALUES (
        'Weteran', ${md5}, 'stary@example.com', '1.2.3.4', '0', '', 0,
        1, 1, 1,
        1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
        0, 0, 0, 0, 0, 0,
        1, 1, 1,
        1, 1, 1,
        0, 0, '', '', 0,
        0, 0, 0, 0, 0, 0,
        0, 0, 0
      )
    `;

    const odp = await wyslij('/api/login', { nick: 'Weteran', haslo: 'stare123' });
    expect(odp.status).toBe(200);

    const [po] = await sql<{ password: string }[]>`SELECT password FROM user_data WHERE user_name = 'Weteran'`;
    expect(po?.password).toMatch(/^scrypt\$/);

    // Po przepisaniu to samo haslo musi dzialac dalej.
    expect((await wyslij('/api/login', { nick: 'Weteran', haslo: 'stare123' })).status).toBe(200);
  });

  it('/api/me wymaga waznego tokenu', async () => {
    const { token } = (await (await wyslij('/api/register', NOWY)).json()) as { token: string };

    expect((await wyslij('/api/me')).status).toBe(401);
    expect((await wyslij('/api/me', undefined, 'f'.repeat(32))).status).toBe(401);

    const moje = await wyslij('/api/me', undefined, token);
    expect(moje.status).toBe(200);
    expect(((await moje.json()) as { gracz: { nick: string } }).gracz.nick).toBe('Lorein');
  });

  it('odrzuca dane, ktore nie trzymaja sie zasad', async () => {
    expect((await wyslij('/api/register', { ...NOWY, nick: 'ab' })).status).toBe(400);
    expect((await wyslij('/api/register', { ...NOWY, nick: 'zły/nick' })).status).toBe(400);
    expect((await wyslij('/api/register', { ...NOWY, haslo: '123' })).status).toBe(400);
    expect((await wyslij('/api/register', { ...NOWY, email: 'to-nie-adres' })).status).toBe(400);
  });

  it('/api/opis zapisuje opis postaci i oddaje go przez /api/me', async () => {
    const { token } = (await (await wyslij('/api/register', NOWY)).json()) as { token: string };

    const zapis = await wyslij('/api/opis', { opis: 'Bije mocno, myśli później.' }, token);
    expect(zapis.status).toBe(200);

    const moje = await wyslij('/api/me', undefined, token);
    expect(((await moje.json()) as { gracz: { opis: string } }).gracz.opis).toBe(
      'Bije mocno, myśli później.',
    );
  });

  it('/api/opis czysci znaki, ktore rozbijaja stary protokol', async () => {
    const { token } = (await (await wyslij('/api/register', NOWY)).json()) as { token: string };

    // Stary klient sklada odpowiedz ze srednikow i ukosnikow, a ta sama
    // baza obsluguje oba klienty — wpisany srednik nie moze tam trafic.
    await wyslij('/api/opis', { opis: 'a;b/c|d\ne' }, token);

    const moje = await wyslij('/api/me', undefined, token);
    expect(((await moje.json()) as { gracz: { opis: string } }).gracz.opis).toBe('a b c d e');
  });

  it('/api/opis wymaga waznego tokenu', async () => {
    expect((await wyslij('/api/opis', { opis: 'cokolwiek' })).status).toBe(401);
    expect((await wyslij('/api/opis', { opis: 'cokolwiek' }, 'f'.repeat(32))).status).toBe(401);
  });

  // ------------------------------------------------------ ekwipunek --

  /*
   * Numer przedmiotu przeznaczonego dla KLASY TESTOWEGO GRACZA.
   *
   * `NOWY` zaklada maga, a klasa siedzi w tysiacach numeru przedmiotu:
   * 1003 to trzeci przedmiot maga. Przedmiot z numerem 3 nalezalby do
   * wojownika i zaden test zakladania by nie przeszedl.
   */
  const NUMER_DLA_MAGA = 1003;

  /** Wklada przedmiot wprost do bazy — sklepow jeszcze nie ma. */
  async function dajPrzedmiot(
    wlasciciel: number,
    czesci: { typ: number; numer?: number; slot: number; cecha?: number; wartosc?: number; pancerz?: number },
  ) {
    const [wiersz] = await sql<{ id: number }[]>`
      INSERT INTO items (item_type, item_id, dmg_min, dmg_max,
                         atr_type_1, atr_type_2, atr_type_3,
                         atr_val_1, atr_val_2, atr_val_3,
                         gold, mush, slot, owner_id)
      VALUES (${czesci.typ}, ${czesci.numer ?? NUMER_DLA_MAGA}, ${czesci.pancerz ?? 0}, 0,
              ${czesci.cecha ?? 0}, 0, 0,
              ${czesci.wartosc ?? 0}, 0, 0,
              100, 0, ${czesci.slot}, ${wlasciciel})
      RETURNING id
    `;
    return wiersz!.id;
  }

  async function zaloz() {
    const odp = await wyslij('/api/register', NOWY);
    const { token, gracz } = (await odp.json()) as { token: string; gracz: { id: number } };
    return { token, id: gracz.id };
  }

  it('zaklada przedmiot z plecaka na wlasciwe miejsce i dolicza cechy', async () => {
    const { token, id } = await zaloz();
    // Typ 6 to helm, jego miejsce to slot 0. Kladziemy go w plecaku.
    await dajPrzedmiot(id, { typ: 6, slot: 11, cecha: 1, wartosc: 7, pancerz: 5 });

    const przed = (await (await wyslij('/api/me', undefined, token)).json()) as {
      gracz: { cechy: { sila: number }; bonusy: { sila: number }; pancerz: number };
    };

    // W plecaku przedmiot nie daje nic.
    expect(przed.gracz.bonusy.sila).toBe(0);
    expect(przed.gracz.pancerz).toBe(0);
    const silaBazowa = przed.gracz.cechy.sila;

    // `cel: null` znaczy „zaloz na wlasciwe miejsce".
    const odp = await wyslij('/api/ekwipunek', { zrodlo: 11, cel: null }, token);
    expect(odp.status).toBe(200);

    const { gracz } = (await odp.json()) as {
      gracz: {
        cechy: { sila: number };
        bonusy: { sila: number };
        pancerz: number;
        ekwipunek: { slot: number }[];
      };
    };

    expect(gracz.ekwipunek.find((p) => p.slot === 0)).toBeDefined();
    expect(gracz.bonusy.sila).toBe(7);
    expect(gracz.cechy.sila).toBe(silaBazowa + 7);
    expect(gracz.pancerz).toBe(5);
  });

  it('zdjecie przedmiotu odbiera cechy z powrotem', async () => {
    const { token, id } = await zaloz();
    await dajPrzedmiot(id, { typ: 6, slot: 0, cecha: 1, wartosc: 7, pancerz: 5 });

    const zdjete = await wyslij('/api/ekwipunek', { zrodlo: 0, cel: 11 }, token);
    expect(zdjete.status).toBe(200);

    const { gracz } = (await zdjete.json()) as {
      gracz: { bonusy: { sila: number }; pancerz: number; ekwipunek: { slot: number }[] };
    };
    // Rejestracja daje bron startowa w slocie 8 — szukamy naszego helmu.
    expect(gracz.ekwipunek.some((p) => p.slot === 11)).toBe(true);
    expect(gracz.ekwipunek.some((p) => p.slot === 0)).toBe(false);
    expect(gracz.bonusy.sila).toBe(0);
    expect(gracz.pancerz).toBe(0);
  });

  it('zamienia przedmiot zalozony z tym z plecaka', async () => {
    const { token, id } = await zaloz();
    const slaby = await dajPrzedmiot(id, { typ: 6, slot: 0, cecha: 1, wartosc: 2 });
    const mocny = await dajPrzedmiot(id, { typ: 6, slot: 12, cecha: 1, wartosc: 9 });

    const odp = await wyslij('/api/ekwipunek', { zrodlo: 12, cel: null }, token);
    expect(odp.status).toBe(200);

    const w = await sql<{ id: number; slot: number }[]>`
      SELECT id, slot FROM items WHERE owner_id = ${id} ORDER BY id
    `;
    expect(w.find((r) => r.id === mocny)!.slot).toBe(0);
    expect(w.find((r) => r.id === slaby)!.slot).toBe(12);

    const { gracz } = (await odp.json()) as { gracz: { bonusy: { sila: number } } };
    expect(gracz.bonusy.sila).toBe(9);
  });

  it('nie zaklada przedmiotu w zle miejsce ani z innej klasy', async () => {
    const { token, id } = await zaloz();
    await dajPrzedmiot(id, { typ: 6, slot: 11 });

    // Helm na miejsce butow (slot 3).
    const zle = await wyslij('/api/ekwipunek', { zrodlo: 11, cel: 3 }, token);
    expect(zle.status).toBe(409);

    // Ten sam helm, ale wojownika — a gracz jest magiem.
    await dajPrzedmiot(id, { typ: 6, numer: 3, slot: 12 });
    const obcy = await wyslij('/api/ekwipunek', { zrodlo: 12, cel: null }, token);
    expect(obcy.status).toBe(409);

    // Nic sie nie ruszylo (slot 8 to bron ze startu).
    const w = await sql<{ slot: number }[]>`SELECT slot FROM items WHERE owner_id = ${id} ORDER BY slot`;
    expect(w.map((r) => r.slot)).toEqual([8, 11, 12]);
  });

  it('odrzuca miejsca spoza planszy i puste zrodlo', async () => {
    const { token, id } = await zaloz();
    await dajPrzedmiot(id, { typ: 6, slot: 11 });

    expect((await wyslij('/api/ekwipunek', { zrodlo: 11, cel: 99 }, token)).status).toBe(400);
    expect((await wyslij('/api/ekwipunek', { zrodlo: 13, cel: null }, token)).status).toBe(400);
    expect((await wyslij('/api/ekwipunek', { zrodlo: 11, cel: null })).status).toBe(401);
  });

  it('przeklada w plecaku bez pytania o rodzaj', async () => {
    const { token, id } = await zaloz();
    // Bron wojownika w plecaku — do innego miejsca w plecaku wolno zawsze.
    const bron = await dajPrzedmiot(id, { typ: 1, slot: 10 });

    const odp = await wyslij('/api/ekwipunek', { zrodlo: 10, cel: 14 }, token);
    expect(odp.status).toBe(200);

    const [w] = await sql<{ slot: number }[]>`SELECT slot FROM items WHERE id = ${bron}`;
    expect(w!.slot).toBe(14);
  });

  it('przycina rase, klase i wyglad do dozwolonego zakresu', async () => {
    const odp = await wyslij('/api/register', { ...NOWY, rasa: 99, klasa: -5, wyglad: [1e9, -3] });
    expect(odp.status).toBe(201);

    const { gracz } = (await odp.json()) as { gracz: { rasa: number; klasa: number; wyglad: number[] } };
    expect(gracz.rasa).toBe(8);
    expect(gracz.klasa).toBe(1);
    expect(gracz.wyglad[0]).toBe(32000);
    expect(gracz.wyglad[1]).toBe(0);
  });
});
