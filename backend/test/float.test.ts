import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { toPhpString } from '../src/compat/php.js';

/**
 * Zamiana liczb na napisy musi byc identyczna jak w PHP — odpowiedz
 * protokolu to sklejone napisy, wiec kazda roznica trafia wprost do klienta.
 */
const fx: { value: number; expected: string }[] = JSON.parse(
  readFileSync(fileURLToPath(new URL('./fixtures/php-float.json', import.meta.url)), 'utf8'),
);

describe('toPhpString — zgodnosc z rzutowaniem na napis w PHP', () => {
  for (const c of fx) {
    it(`${c.value} -> "${c.expected}"`, () => {
      expect(toPhpString(c.value)).toBe(c.expected);
    });
  }

  it('rozni sie od String() tam, gdzie to istotne', () => {
    expect(toPhpString(0.1 + 0.2)).toBe('0.3');
    expect(String(0.1 + 0.2)).toBe('0.30000000000000004');
  });
});

describe('toPhpString — udokumentowane ograniczenie', () => {
  it('nie odroznia calkowitego float od int, bo JavaScript ma jeden typ liczbowy', () => {
    // PHP: (string)(int)100000000000000  ->  "100000000000000"
    // PHP: (string)(float)1.0e14         ->  "1.0E+14"
    // Wybieramy wariant calkowity — w grze takie wartosci pochodza z kolumn
    // calkowitoliczbowych bazy.
    expect(toPhpString(1e14)).toBe('100000000000000');
  });
});
