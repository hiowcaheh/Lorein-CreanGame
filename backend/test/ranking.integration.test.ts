import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';
import { ranking } from '../src/actions/ranking';
import { parseRequest } from '../src/protocol/request';

/**
 * Test integracyjny akcji 007 na prawdziwym Postgresie.
 *
 * Testy w `ranking.test.ts` sprawdzaja sama logike na atrapie bazy. Ten
 * dokłada druga polowe: czy zapytania faktycznie dzialaja na Postgresie —
 * `ROW_NUMBER()` zamiast zmiennych MySQL-a, `LIMIT ... OFFSET ...` zamiast
 * `LIMIT offset, n`, cudzyslowy wokol nazw zarezerwowanych.
 *
 * Uruchamia sie tylko wtedy, gdy wskazano baze testowa:
 *
 *     TEST_DATABASE_URL=postgresql://... npm test
 *
 * Bez tej zmiennej test jest pomijany, zeby zestaw dzialal takze bez bazy.
 */

const TEST_DB_URL = process.env['TEST_DATABASE_URL'];

interface RankingCase {
  name: string;
  extra: string;
  rows: Record<string, unknown>[];
  playerCount: number;
  lookupPos: number;
  expected: string;
}

const fx: { now: number; cases: RankingCase[] } = JSON.parse(
  readFileSync(fileURLToPath(new URL('./fixtures/ranking.json', import.meta.url)), 'utf8'),
);

/**
 * Wstawia gracza, uzupelniajac wszystkie kolumny NOT NULL, ktore nie maja
 * wartosci domyslnej. Oryginalny schemat polega na nieostrym trybie MySQL-a,
 * gdzie brakujace wartosci byly dopisywane po cichu — Postgres tego nie robi
 * i wymaga kompletu.
 */
async function insertPlayer(
  sql: postgres.Sql,
  row: Record<string, unknown>,
  index: number,
): Promise<void> {
  await sql`
    INSERT INTO user_data (
      user_name, password, email, ssid, last_ip, last_activ, reg_date,
      lvl, honor, class, race, gender,
      face1, face2, face3, face4, face5, face6, face7, face8, face9, face10,
      g_silverspent, g_mushroomspent, user_desc, album_data, voucher_date,
      quest_gold_1, quest_gold_2, quest_gold_3,
      quest_exp_1, quest_exp_2, quest_exp_3,
      quest_location_2, quest_location_3,
      potion_id1, potion_id2, potion_id3,
      potion_value1, potion_value2, potion_value3,
      potion_time1, potion_time2, potion_time3,
      guild_id
    ) VALUES (
      ${String(row['user_name'])}, 'x', ${`gracz${index}@test.local`},
      ${`ssid${index}`.padEnd(32, '0')}, '127.0.0.1',
      ${String(row['last_activ'])}, 0,
      ${Number(row['lvl'])}, ${Number(row['honor'])}, ${Number(row['class'])}, 1, 1,
      0,0,0,0,0,0,0,0,0,0,
      0, 0, '', '', 0,
      0, 0, 0,
      0, 0, 0,
      0, 0,
      0, 0, 0,
      0, 0, 0,
      0, 0, 0,
      ${row['guild'] ? index : 0}
    )
  `;

  // Gildia jest wciagana podzapytaniem po `guild_id`, wiec musi istniec.
  if (row['guild']) {
    await sql`
      INSERT INTO guilds (guild_id, name, description, chat, leader_id)
      VALUES (${index}, ${String(row['guild'])}, '', '', 0)
      ON CONFLICT (guild_id) DO NOTHING
    `;
  }
}

describe.skipIf(!TEST_DB_URL)('akcja 007 na prawdziwym Postgresie', () => {
  let sql: postgres.Sql;

  beforeAll(() => {
    sql = postgres(TEST_DB_URL!, { onnotice: () => {} });
  });

  afterAll(async () => {
    await sql?.end({ timeout: 5 });
  });

  beforeEach(async () => {
    // Podmieniamy WYLACZNIE zegar. Pelne `useFakeTimers()` przejmuje takze
    // `setTimeout`, z ktorego korzysta sterownik bazy — zapytania przestaja
    // wtedy wracac i test wisi do timeoutu.
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(fx.now * 1000));
    await sql`TRUNCATE user_data, guilds RESTART IDENTITY CASCADE`;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // Scenariusze, w ktorych kolejnosc wierszy da sie odtworzyc sortowaniem
  // po honorze — atrapa dostawala je gotowe, baza musi je posortowac sama.
  const sortable = fx.cases.filter((c) => c.rows.length > 0 && c.rows.length <= 3);

  for (const testCase of sortable) {
    it(testCase.name, async () => {
      let index = 1;
      for (const row of testCase.rows) {
        await insertPlayer(sql, row, index++);
      }

      const req = parseRequest('x'.repeat(32) + '007' + testCase.extra);
      const response = await ranking(sql, req);

      expect(response.toString()).toBe(testCase.expected);
    });
  }

  it('pusty ranking dziala takze na pustej tabeli', async () => {
    const req = parseRequest('x'.repeat(32) + '007' + 'Nikt;');
    const response = await ranking(sql, req);

    expect(response.toString()).toBe('007007/;');
  });

  it('ROW_NUMBER() zwraca poprawna pozycje szukanego gracza', async () => {
    const rows = [
      { user_name: 'Pierwszy', lvl: 50, honor: 900, class: 1, last_activ: '0', guild: '' },
      { user_name: 'Drugi', lvl: 40, honor: 800, class: 1, last_activ: '0', guild: '' },
      { user_name: 'Trzeci', lvl: 30, honor: 700, class: 1, last_activ: '0', guild: '' },
    ];

    let index = 1;
    for (const row of rows) {
      await insertPlayer(sql, row, index++);
    }

    // Wyszukiwanie po nazwie: pozycja ponizej 8 zostaje podciagnieta do 8,
    // wiec okno zaczyna sie od poczatku listy.
    const req = parseRequest('x'.repeat(32) + '007' + 'Trzeci;');
    const response = await ranking(sql, req);

    expect(response.toString()).toContain('Pierwszy');
    expect(response.toString()).toContain('Trzeci');
  });
});
