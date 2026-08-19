import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { PhpMtRand } from '../src/compat/rng.js';

/**
 * Wzorce w `fixtures/php-mt-rand.json` pochodzia z prawdziwego PHP 8.4
 * (skrypt generujacy: `test/fixtures/generate.php`). Jesli te testy przechodza,
 * generator w TypeScript daje **identyczne** ciagi co PHP — a to warunek
 * konieczny, zeby porownywac stary backend z nowym przy tym samym ziarnie.
 */

interface Fixture {
  seed: number;
  raw: number[];
  ranged: { min: number; max: number; values: number[] }[];
  viaRand: number[];
}

const fixtures: Fixture[] = JSON.parse(
  readFileSync(fileURLToPath(new URL('./fixtures/php-mt-rand.json', import.meta.url)), 'utf8'),
);

describe('PhpMtRand — zgodnosc z mt_rand() z PHP', () => {
  it('wzorce zostaly wczytane', () => {
    expect(fixtures.length).toBeGreaterThan(0);
  });

  for (const fixture of fixtures) {
    describe(`ziarno ${fixture.seed}`, () => {
      it('mt_rand() bez argumentow daje ten sam ciag', () => {
        const rng = new PhpMtRand(fixture.seed);
        const actual = fixture.raw.map(() => rng.rand());
        expect(actual).toEqual(fixture.raw);
      });

      for (const range of fixture.ranged) {
        it(`mt_rand(${range.min}, ${range.max}) daje ten sam ciag`, () => {
          const rng = new PhpMtRand(fixture.seed);
          const actual = range.values.map(() => rng.rand(range.min, range.max));
          expect(actual).toEqual(range.values);
        });
      }

      it('rand() zachowuje sie jak mt_rand() (alias od PHP 7.1)', () => {
        const rng = new PhpMtRand(fixture.seed);
        const actual = fixture.viaRand.map(() => rng.rand(1, 158));
        expect(actual).toEqual(fixture.viaRand);
      });
    });
  }
});

describe('PhpMtRand — wlasnosci ogolne', () => {
  it('to samo ziarno daje ten sam ciag', () => {
    const a = new PhpMtRand(777);
    const b = new PhpMtRand(777);
    const seqA = Array.from({ length: 50 }, () => a.rand(1, 1000));
    const seqB = Array.from({ length: 50 }, () => b.rand(1, 1000));
    expect(seqA).toEqual(seqB);
  });

  it('trzyma sie zadanego zakresu', () => {
    const rng = new PhpMtRand(2024);
    for (let i = 0; i < 5000; i++) {
      const value = rng.rand(5, 9);
      expect(value).toBeGreaterThanOrEqual(5);
      expect(value).toBeLessThanOrEqual(9);
    }
  });

  it('pokrywa caly zakres, takze skrajne wartosci', () => {
    const rng = new PhpMtRand(31337);
    const seen = new Set<number>();
    for (let i = 0; i < 2000; i++) {
      seen.add(rng.rand(1, 6));
    }
    expect([...seen].sort((x, y) => x - y)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('zakres jednoelementowy zwraca stala', () => {
    const rng = new PhpMtRand(1);
    expect(rng.rand(42, 42)).toBe(42);
  });

  it('odwrocony zakres konczy sie bledem', () => {
    const rng = new PhpMtRand(1);
    expect(() => rng.rand(10, 1)).toThrow(RangeError);
  });
});
