import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { Sql } from '../src/db/client.js';
import { ranking } from '../src/actions/ranking.js';
import { parseRequest } from '../src/protocol/request.js';

/**
 * Test roznicowy dla akcji 007.
 *
 * Wzorce w `fixtures/ranking.json` wyprodukowal prawdziwy PHP, uruchamiajac
 * logike przepisana znak w znak z `req.php` (patrz `generate-ranking.php`).
 * Port w TypeScript dostaje te same dane wejsciowe i musi zwrocic **dokladnie
 * ten sam napis** — razem z dziwactwami w rodzaju "007007" dla pustej listy.
 *
 * To jest wzorzec, wedlug ktorego warto przenosic kolejne akcje: najpierw
 * wzorzec z PHP, potem port, potem porownanie znak po znaku.
 */

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
 * Atrapa polaczenia z baza. Rozpoznaje trzy zapytania akcji rankingu
 * i odpowiada danymi ze scenariusza, dzieki czemu test nie potrzebuje
 * dzialajacego MySQL-a.
 */
function stubConnection(testCase: RankingCase): Sql {
  const stub = (strings: TemplateStringsArray, ...values: unknown[]) => {
    const text = strings.join(' ? ');

    let wynik: unknown;
    if (text.includes('ROW_NUMBER')) {
      wynik = [{ pos: testCase.lookupPos }];
    } else if (text.includes('COUNT(*)')) {
      wynik = [{ total: testCase.playerCount }];
    } else {
      // fetchPage: LIMIT ${PAGE_SIZE} OFFSET ${offset}
      const limit = Number(values[0] ?? 15);
      const offset = Number(values[1] ?? 0);
      wynik = testCase.rows.slice(offset, offset + limit);
    }

    // Atrapa musi zachowywac sie jak postgres.js, wraz z `.execute()` —
    // kod produkcyjny wola je tam, gdzie zalezy mu na natychmiastowym
    // wyslaniu zapytania zamiast czekania na `await`.
    const obietnica = Promise.resolve(wynik) as Promise<unknown> & { execute: () => unknown };
    obietnica.execute = () => obietnica;
    return obietnica;
  };

  return stub as unknown as Sql;
}

describe('akcja 007 (ranking) — zgodnosc z req.php', () => {
  beforeEach(() => {
    // Wynik zalezy od `time()`, wiec zegar musi stac w tym samym punkcie
    // co przy generowaniu wzorcow.
    vi.useFakeTimers();
    vi.setSystemTime(new Date(fx.now * 1000));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  for (const testCase of fx.cases) {
    it(testCase.name, async () => {
      const req = parseRequest('x'.repeat(32) + '007' + testCase.extra);
      const response = await ranking(stubConnection(testCase), req);

      expect(response.toString()).toBe(testCase.expected);
    });
  }
});

describe('akcja 007 — udokumentowane dziwactwa protokolu', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(fx.now * 1000));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('pusty ranking zwraca zdublowany przedrostek "007007"', async () => {
    const empty = fx.cases.find((c) => c.rows.length === 0);
    expect(empty, 'brak scenariusza z pustym rankingiem').toBeDefined();
    expect(empty!.expected).toBe('007007/;');
  });

  it('mag ma ujemny poziom, a lowca ujemna pozycje', async () => {
    const classes = fx.cases.find((c) => c.name.includes('trzy klasy'));
    expect(classes).toBeDefined();

    const fields = classes!.expected.split('/');
    // Uklad pol: [pozycja, nick, gildia, poziom, honor, online] x N, na koncu ";".
    // Wojownik (pozycja 1): bez znacznika, pole 0 ma jeszcze przedrostek akcji.
    expect(fields[0]).toBe('0071');
    expect(fields[3]).toBe('50');
    // Mag zaczyna sie na polu 6; minus stoi przy jego poziomie (6 + 3).
    expect(fields[6]).toBe('2');
    expect(fields[9]).toBe('-40');
    // Lowca zaczyna sie na polu 12; minus stoi przy jego pozycji.
    expect(fields[12]).toBe('-3');
    expect(fields[15]).toBe('30');
  });

  it('odpowiedz zawsze konczy sie srednikiem', () => {
    for (const testCase of fx.cases) {
      expect(testCase.expected.endsWith('/;')).toBe(true);
    }
  });
});
