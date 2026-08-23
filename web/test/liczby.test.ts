import { describe, expect, it } from 'vitest';
import { klasaWielkosci, liczba } from '../src/gra/liczby';

describe('liczba', () => {
  it('kropkuje co trzy cyfry', () => {
    expect(liczba(155232)).toBe('155.232');
    expect(liczba(1560)).toBe('1.560');
    expect(liczba(999)).toBe('999');
  });
});

describe('klasaWielkosci', () => {
  it('od miliona zielony, od dziesieciu milionow czerwony', () => {
    expect(klasaWielkosci(999_999)).toBe('');
    expect(klasaWielkosci(1_000_000)).toBe('duza');
    expect(klasaWielkosci(9_999_999)).toBe('duza');
    expect(klasaWielkosci(10_000_000)).toBe('ogromna');
  });
});
