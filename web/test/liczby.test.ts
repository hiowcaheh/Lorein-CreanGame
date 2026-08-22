import { describe, expect, it } from 'vitest';
import { klasaWielkosci, liczba, skrocona } from '../src/gra/liczby';

describe('liczba', () => {
  it('kropkuje co trzy cyfry', () => {
    expect(liczba(155232)).toBe('155.232');
    expect(liczba(1560)).toBe('1.560');
    expect(liczba(999)).toBe('999');
  });
});

describe('skrocona', () => {
  it('ponizej miliona nic nie skraca', () => {
    expect(skrocona(999999)).toBe('999.999');
  });

  it('miliony to „kk", miliardy „kkk"', () => {
    expect(skrocona(10_000_000)).toBe('10kk');
    expect(skrocona(500_000_000)).toBe('500kk');
    expect(skrocona(1_000_000_000)).toBe('1kkk');
  });

  it('ponizej dziesieciu jednostek zostaje jedno miejsce po przecinku', () => {
    expect(skrocona(1_500_000)).toBe('1,5kk');
    expect(skrocona(2_490_000)).toBe('2,4kk');
  });

  it('nie zaokragla w gore — kwota nigdy nie wyglada na wieksza, niz jest', () => {
    expect(skrocona(9_990_000)).toBe('9,9kk');
    expect(skrocona(155_900_000)).toBe('155kk');
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
