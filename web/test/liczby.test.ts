import { describe, expect, it } from 'vitest';
import { liczba } from '../src/gra/liczby';

describe('liczba', () => {
  it('kropkuje co trzy cyfry', () => {
    expect(liczba(155232)).toBe('155.232');
    expect(liczba(1560)).toBe('1.560');
    expect(liczba(999)).toBe('999');
  });
});
