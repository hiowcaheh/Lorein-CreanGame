import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { ceil, ctypeDigit, explode, floor, implode, intval, round, urlencode } from '../src/compat/php';

/**
 * Wzorce wygenerowane przez prawdziwe PHP (`test/fixtures/generate-php-funcs.php`).
 * Kazdy przypadek to zachowanie, ktore nowy backend musi odtworzyc co do znaku.
 */

interface Fixtures {
  round: { value: number; precision: number; expected: number }[];
  intval: { value: unknown; expected: number }[];
  urlencode: { value: string; expected: string }[];
  ctype_digit: { value: string; expected: boolean }[];
  explode: { sep: string; subject: string; limit: number | null; expected: string[] }[];
}

const fx: Fixtures = JSON.parse(
  readFileSync(fileURLToPath(new URL('./fixtures/php-funcs.json', import.meta.url)), 'utf8'),
);

describe('round() — zgodnosc z PHP', () => {
  for (const c of fx.round) {
    it(`round(${c.value}, ${c.precision}) === ${c.expected}`, () => {
      expect(round(c.value, c.precision)).toBe(c.expected);
    });
  }

  it('polowki zaokraglaja sie od zera, inaczej niz Math.round', () => {
    expect(round(-2.5)).toBe(-3);
    expect(Math.round(-2.5)).toBe(-2); // dokumentuje roznice, ktorej unikamy
    expect(round(-0.5)).toBe(-1);
    expect(round(2.5)).toBe(3);
  });
});

describe('intval() — zgodnosc z PHP', () => {
  for (const c of fx.intval) {
    it(`(int)${JSON.stringify(c.value)} === ${c.expected}`, () => {
      expect(intval(c.value)).toBe(c.expected);
    });
  }
});

describe('urlencode() — zgodnosc z PHP', () => {
  for (const c of fx.urlencode) {
    it(`urlencode(${JSON.stringify(c.value)})`, () => {
      expect(urlencode(c.value)).toBe(c.expected);
    });
  }

  it('rozni sie od encodeURIComponent tam, gdzie to istotne', () => {
    expect(urlencode('a b')).toBe('a+b');
    expect(encodeURIComponent('a b')).toBe('a%20b');
    expect(urlencode("!'()*")).toBe('%21%27%28%29%2A');
  });
});

describe('ctype_digit() — zgodnosc z PHP', () => {
  for (const c of fx.ctype_digit) {
    it(`ctype_digit(${JSON.stringify(c.value)}) === ${c.expected}`, () => {
      expect(ctypeDigit(c.value)).toBe(c.expected);
    });
  }
});

describe('explode() — zgodnosc z PHP', () => {
  for (const c of fx.explode) {
    const label = c.limit === null ? '' : `, ${c.limit}`;
    it(`explode(${JSON.stringify(c.sep)}, ${JSON.stringify(c.subject)}${label})`, () => {
      const actual = c.limit === null ? explode(c.sep, c.subject) : explode(c.sep, c.subject, c.limit);
      expect(actual).toEqual(c.expected);
    });
  }
});

describe('pozostale pomocniki', () => {
  it('ceil i floor zachowuja sie jak w PHP', () => {
    expect(ceil(1.1)).toBe(2);
    expect(ceil(-1.1)).toBe(-1);
    expect(floor(1.9)).toBe(1);
    expect(floor(-1.9)).toBe(-2);
  });

  it('implode zamienia null i undefined na pusty napis, tak jak PHP', () => {
    expect(implode('/', ['a', null, undefined, 3])).toBe('a///3');
  });
});
