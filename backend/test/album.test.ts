import { describe, expect, it } from 'vitest';
import {
  BEZ_KLASERA,
  POZYCJI_W_KLASERZE,
  PUSTY_KLASER,
  dopiszDoKlasera,
  miejsceWKlaserze,
  odkodujKlaser,
  premiaZKlasera,
  zakodujKlaser,
} from '../src/game/album.js';

/** Miecz wojownika, wzor 3, barwa 0. */
const MIECZ = {
  item_type: 1,
  item_id: 3,
  dmg_min: 5,
  dmg_max: 0,
  atr_type_1: 0,
  atr_type_2: 0,
  atr_type_3: 0,
  atr_val_1: 0,
  atr_val_2: 0,
  atr_val_3: 0,
};

describe('Klaser Dokladnosci', () => {
  it('pusty zapis nie ma zadnej pozycji', () => {
    const bity = odkodujKlaser(PUSTY_KLASER);
    // 425 znakow base64 to 318 bajtow, czyli 2544 bity.
    expect(bity.length).toBe(2544);
    expect(bity.some(Boolean)).toBe(false);
  });

  it('zapis i odczyt sa odwrotne', () => {
    const bity = odkodujKlaser(PUSTY_KLASER);
    bity[0] = true;
    bity[806] = true;
    bity[2543] = true;
    expect(odkodujKlaser(zakodujKlaser(bity))).toEqual(bity);
  });

  it('idzie przez BAJTY, nie po szesc bitow na znak', () => {
    /*
     * Oryginal robi `unpack('C*', base64_decode(...))`, wiec pierwszy
     * bit siedzi w najstarszym bicie pierwszego bajtu. Znak „g" to
     * wartosc 32 = 0b100000, czyli bajt 0b10000000 i bit numer zero.
     */
    expect(odkodujKlaser('gA')[0]).toBe(true);
    expect(odkodujKlaser('gA')[1]).toBe(false);
  });

  describe('miejsce przedmiotu', () => {
    it('zwykly przedmiot zajmuje po piec miejsc — jedno na barwe', () => {
      // Bron wojownika zaczyna sie na 792: (numer - 1) * 5 + barwa.
      expect(miejsceWKlaserze(MIECZ)).toBe(792 + 2 * 5 + 0);
      expect(miejsceWKlaserze({ ...MIECZ, dmg_min: 6 })).toBe(792 + 2 * 5 + 1);
    });

    it('kazda klasa ma swoj zakres', () => {
      // Klasa siedzi w tysiacach numeru: 1003 to mag, 2003 lowca.
      expect(miejsceWKlaserze({ ...MIECZ, item_id: 1003 })).toBe(1804 + 2 * 5 + 0);
      expect(miejsceWKlaserze({ ...MIECZ, item_id: 2003 })).toBe(2500 + 2 * 5 + 0);
    });

    it('epik nie ma barwy i stoi za zwyklymi wzorami', () => {
      // Bron wojownika: blok zwyklych ma 250 miejsc, potem epiki po jednym.
      expect(miejsceWKlaserze({ ...MIECZ, item_id: 50 })).toBe(792 + 250 + 0);
      expect(miejsceWKlaserze({ ...MIECZ, item_id: 51, dmg_min: 7 })).toBe(792 + 250 + 1);
    });

    it('talizman tez nie ma barwy', () => {
      expect(miejsceWKlaserze({ ...MIECZ, item_type: 10, item_id: 4 })).toBe(702 + 3);
    });

    it('rodzaje spoza 1-10 nie maja miejsca', () => {
      for (const typ of [0, 11, 12, 13, 14]) {
        expect(miejsceWKlaserze({ ...MIECZ, item_type: typ })).toBe(0);
      }
    });
  });

  describe('dopisywanie', () => {
    it('liczy kazda pozycje raz', () => {
      const raz = dopiszDoKlasera({ dane: PUSTY_KLASER, ile: 0 }, [MIECZ]);
      expect(raz.ile).toBe(1);
      expect(dopiszDoKlasera(raz, [MIECZ]).ile).toBe(1);
    });

    it('pomija to, czego klaser nie zbiera', () => {
      // Mikstury, klucze i sam klaser maja rodzaj wiekszy niz 10.
      const stan = dopiszDoKlasera({ dane: PUSTY_KLASER, ile: 0 }, [
        { ...MIECZ, item_type: 12 },
        { ...MIECZ, item_type: 13 },
      ]);
      expect(stan.ile).toBe(0);
    });

    it('rozne barwy tego samego wzoru to rozne pozycje', () => {
      const stan = dopiszDoKlasera({ dane: PUSTY_KLASER, ile: 0 }, [
        MIECZ,
        { ...MIECZ, dmg_min: 6 },
        { ...MIECZ, dmg_min: 7 },
      ]);
      expect(stan.ile).toBe(3);
    });
  });

  it('premia do doswiadczenia to `round(album / 1700, 2)`', () => {
    expect(premiaZKlasera(BEZ_KLASERA)).toBe(0);
    expect(premiaZKlasera(0)).toBe(0);
    expect(premiaZKlasera(850)).toBe(0.5);
    expect(premiaZKlasera(POZYCJI_W_KLASERZE)).toBe(1);
    // Dwa miejsca po przecinku, tak jak `round(..., 2)`.
    expect(premiaZKlasera(17)).toBe(0.01);
  });
});
