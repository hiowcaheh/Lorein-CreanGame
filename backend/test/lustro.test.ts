import { describe, expect, it } from 'vitest';
import {
  BEZ_LUSTRA,
  KAWALKOW,
  OSTATNI_ODLAMEK,
  PELNE_LUSTRO,
  PIERWSZY_ODLAMEK,
  POZIOM_ODLAMKOW,
  brakujaceOdlamki,
  czyOdlamek,
  dopiszKawalek,
  kawalkiLustra,
  maPelneLustro,
} from '../src/game/lustro.js';
import { wylosujPrzedmiot } from '../src/game/generatorPrzedmiotow.js';

describe('Magiczne Lustro', () => {
  it('sklada sie z trzynastu kawalkow o numerach 30-42', () => {
    expect(KAWALKOW).toBe(13);
    expect(PIERWSZY_ODLAMEK).toBe(30);
    expect(OSTATNI_ODLAMEK).toBe(42);
    expect(PELNE_LUSTRO).toBe('1111111111111');
    expect(BEZ_LUSTRA).toBe('0000000000000');
  });

  it('czyta kolumne znak po znaku', () => {
    // `$user_data['magic_mirror'][$item_id - 30] = '1'`
    expect(kawalkiLustra('1000000000000')[0]).toBe(true);
    expect(kawalkiLustra('1000000000000')[1]).toBe(false);
    expect(kawalkiLustra('0000000000001')[12]).toBe(true);
    // Pusta albo krotsza kolumna to po prostu brak kawalkow.
    expect(kawalkiLustra('')).toEqual(new Array(13).fill(false));
    expect(kawalkiLustra(null)).toEqual(new Array(13).fill(false));
  });

  it('kompletne jest dopiero, gdy sa wszystkie trzynascie', () => {
    expect(maPelneLustro(PELNE_LUSTRO)).toBe(true);
    expect(maPelneLustro('1111111111110')).toBe(false);
    expect(maPelneLustro(BEZ_LUSTRA)).toBe(false);
  });

  it('kawalek wpada na swoje miejsce i nie rusza reszty', () => {
    expect(dopiszKawalek(BEZ_LUSTRA, 30)).toBe('1000000000000');
    expect(dopiszKawalek(BEZ_LUSTRA, 42)).toBe('0000000000001');
    expect(dopiszKawalek('1000000000000', 35)).toBe('1000010000000');
    // Wprawiony drugi raz niczego nie psuje.
    expect(dopiszKawalek('1000000000000', 30)).toBe('1000000000000');
  });

  it('brakujace to te, ktorych jeszcze nie ma', () => {
    expect(brakujaceOdlamki(PELNE_LUSTRO)).toEqual([]);
    expect(brakujaceOdlamki(BEZ_LUSTRA).length).toBe(13);
    expect(brakujaceOdlamki('1111111111110')).toEqual([42]);
  });

  it('poznaje odlamek po rodzaju i numerze', () => {
    expect(czyOdlamek(11, 30)).toBe(true);
    expect(czyOdlamek(11, 42)).toBe(true);
    // Numery 1-9 to klucze do lochow, nie odlamki.
    expect(czyOdlamek(11, 5)).toBe(false);
    expect(czyOdlamek(11, 43)).toBe(false);
    expect(czyOdlamek(12, 30)).toBe(false);
  });

  describe('odlamki z wypraw', () => {
    const nagroda = (poziom: number, dodatki: Record<string, unknown> = {}) =>
      wylosujPrzedmiot(poziom, 1, {
        rodzaj: 11,
        sklep: 1,
        wyprawa: true,
        lustro: BEZ_LUSTRA,
        zamknieteLochy: [],
        losuj: () => 1,
        ...dodatki,
      });

    it('od piecdziesiatego poziomu wypada brakujacy kawalek', () => {
      // `losuj` oddaje zawsze 1, wiec `brakujace[1]` to drugi kawalek.
      const odlamek = nagroda(POZIOM_ODLAMKOW);
      expect(odlamek?.item_type).toBe(11);
      expect(odlamek?.item_id).toBe(PIERWSZY_ODLAMEK + 1);
      // `$item['gold'] = 0` — odlamka nie da sie sprzedac.
      expect(odlamek?.gold).toBe(0);
    });

    it('ponizej piecdziesiatego poziomu nie wypada', () => {
      // Bez lochow do otwarcia wyprawa zostaje wtedy bez nagrody.
      expect(nagroda(POZIOM_ODLAMKOW - 1)).toBeNull();
    });

    it('nie wypada, gdy jeden juz lezy w plecaku', () => {
      expect(nagroda(POZIOM_ODLAMKOW, { maJuzOdlamek: true })).toBeNull();
    });

    it('nie wypada, gdy lustro jest juz kompletne', () => {
      expect(nagroda(POZIOM_ODLAMKOW, { lustro: PELNE_LUSTRO })).toBeNull();
    });

    it('odlamek ma pierwszenstwo przed kluczem do lochu', () => {
      const co = nagroda(POZIOM_ODLAMKOW, { zamknieteLochy: [1, 2, 3] });
      expect(co?.item_id).toBeGreaterThanOrEqual(PIERWSZY_ODLAMEK);
    });
  });
});
