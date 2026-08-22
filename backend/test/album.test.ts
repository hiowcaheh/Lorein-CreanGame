import { describe, expect, it } from 'vitest';
import {
  BEZ_KLASERA,
  POZYCJI_W_KLASERZE,
  PUSTY_KLASER,
  dopiszDoKlasera,
  dopiszPotworaDoKlasera,
  miejsceWKlaserze,
  odczytajDaty,
  odkodujKlaser,
  premiaZKlasera,
  zakodujKlaser,
  zapiszDaty,
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
    // 532 znaki base64 to 399 bajtow, czyli 3192 bity — tyle, ile trzeba,
    // zeby zmiescil sie ostatni epik zwiadowcy (bit 3187).
    expect(bity.length).toBe(3192);
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
      /*
       * Bron wojownika: epiki zaczynaja sie na 1092, bo tam ich szuka
       * `ShowAlbumContent()` (strona 8 dzialu wojownika liczy
       * `(1076 + 16) + (page - 8) * 4 + i`). `req.php` ma tu 1042
       * i wpisuje je w martwy zakres.
       */
      expect(miejsceWKlaserze({ ...MIECZ, item_id: 50 })).toBe(1092);
      expect(miejsceWKlaserze({ ...MIECZ, item_id: 51, dmg_min: 7 })).toBe(1093);
    });

    it('epiki stoja tam, gdzie ich szuka klient', () => {
      /*
       * Punkty zaczepienia wprost z `ShowAlbumContent()` — pierwsza
       * strona epikow kazdego rodzaju daje `aOffs` dla numeru 50.
       *
       *   rodzaj 8   strona 6  ->  510 + (page - 6) * 4 + i
       *   rodzaj 9   strona 12 ->  686 + ...
       *   rodzaj 10  strona 24 -> (760 + 16) + ...
       *   tarcza woj strona 13 -> (1192 + 16) + ...
       *   bron maga  strona 3  -> (1888 + 16) + ...
       *   bron lowcy strona 3  -> (1888 + 712) + ...
       */
      const epik = (typ: number, klasa: number) =>
        miejsceWKlaserze({ ...MIECZ, item_type: typ, item_id: 50 + klasa * 1000 });

      expect(epik(8, 0)).toBe(510);
      expect(epik(9, 0)).toBe(686);
      expect(epik(10, 0)).toBe(776);
      expect(epik(1, 0)).toBe(1092);
      expect(epik(2, 0)).toBe(1208);
      expect(epik(1, 1)).toBe(1904);
      expect(epik(1, 2)).toBe(2600);
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
    const PUSTY = { dane: PUSTY_KLASER, ile: 0, daty: {} };

    it('liczy kazda pozycje raz', () => {
      const raz = dopiszDoKlasera(PUSTY, [MIECZ]);
      expect(raz.ile).toBe(1);
      expect(dopiszDoKlasera(raz, [MIECZ]).ile).toBe(1);
    });

    it('pomija to, czego klaser nie zbiera', () => {
      // Mikstury, klucze i sam klaser maja rodzaj wiekszy niz 10.
      const stan = dopiszDoKlasera(PUSTY, [
        { ...MIECZ, item_type: 12 },
        { ...MIECZ, item_type: 13 },
      ]);
      expect(stan.ile).toBe(0);
    });

    it('rozne barwy tego samego wzoru to rozne pozycje', () => {
      const stan = dopiszDoKlasera(PUSTY, [
        MIECZ,
        { ...MIECZ, dmg_min: 6 },
        { ...MIECZ, dmg_min: 7 },
      ]);
      expect(stan.ile).toBe(3);
    });

    it('zapisuje date odblokowania, ale tylko gdy ja podano', () => {
      const bezDaty = dopiszDoKlasera(PUSTY, [MIECZ]);
      expect(bezDaty.daty).toEqual({});

      const zData = dopiszDoKlasera(PUSTY, [MIECZ], 1700000000);
      expect(zData.daty).toEqual({ [miejsceWKlaserze(MIECZ)]: 1700000000 });

      // Powtorzony przedmiot nie nadpisuje pierwszej daty.
      const znowu = dopiszDoKlasera(zData, [MIECZ], 1800000000);
      expect(znowu.daty).toEqual({ [miejsceWKlaserze(MIECZ)]: 1700000000 });
    });

    it('potwor tez dostaje date, a jego bit to numer minus jeden', () => {
      const stan = dopiszPotworaDoKlasera(PUSTY, 7, 1700000000);
      expect(stan.ile).toBe(1);
      expect(stan.daty).toEqual({ 6: 1700000000 });
    });

    it('daty przezywaja zapis i odczyt kolumny', () => {
      const stan = dopiszDoKlasera(PUSTY, [MIECZ], 1700000000);
      expect(odczytajDaty(zapiszDaty(stan.daty))).toEqual(stan.daty);
      expect(odczytajDaty('')).toEqual({});
      expect(odczytajDaty('to nie jest JSON')).toEqual({});
      expect(odczytajDaty(null)).toEqual({});
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
