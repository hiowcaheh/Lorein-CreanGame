import { describe, expect, it } from 'vitest';
import {
  CZAS_DZIALANIA_H,
  DODATKOWY_CZAS_ZYCIA_H,
  MIKSTURA_ZYCIA,
  bonusZycia,
  cechaMikstury,
  czasPoWypiciu,
  miejsceDlaMikstury,
  mnoznikiCech,
  udzialMikstury,
  type MiejsceMikstury,
} from '../src/game/mikstury.js';

/** Skrot do budowania stanu trzech miejsc. */
function miejsca(...numery: number[]): MiejsceMikstury[] {
  return [0, 1, 2].map((i) => ({
    numer: numery[i] ?? 0,
    wartosc: numery[i] ? 10 : 0,
    koniec: numery[i] ? 1_000_000 : 0,
  }));
}

describe('mikstury', () => {
  it('przypisuje numerom cechy w trzech piatkach', () => {
    // `switch ($potionIDRand)` w generatorze: 1..5 to kolejne cechy,
    // 6..10 te same mocniej, 11..15 jeszcze mocniej.
    expect([1, 2, 3, 4, 5].map(cechaMikstury)).toEqual([1, 2, 3, 4, 5]);
    expect([6, 7, 8, 9, 10].map(cechaMikstury)).toEqual([1, 2, 3, 4, 5]);
    expect([11, 12, 13, 14, 15].map(cechaMikstury)).toEqual([1, 2, 3, 4, 5]);
    // Eliksir Niesmiertelnosci nie podnosi zadnej cechy.
    expect(cechaMikstury(MIKSTURA_ZYCIA)).toBe(0);
    expect(cechaMikstury(0)).toBe(0);
  });

  it('daje 10, 15 i 25 procent', () => {
    expect(udzialMikstury(3)).toBe(0.1);
    expect(udzialMikstury(8)).toBe(0.15);
    expect(udzialMikstury(13)).toBe(0.25);
    // Numer 10 nalezy do srodkowej piatki — 15 procent, tyle co jego
    // wlasne `atr_val_2` i tyle, ile liczy `loadDefaultData`.
    expect(udzialMikstury(10)).toBe(0.15);
  });

  it('mnozy tylko te cechy, ktore maja miksture', () => {
    // Sila +25% (numer 11) i inteligencja +10% (numer 3).
    expect(mnoznikiCech(miejsca(11, 3))).toEqual([1, 1.25, 1, 1.1, 1, 1]);
  });

  describe('wybor miejsca', () => {
    it('zajmuje pierwsze wolne', () => {
      expect(miejsceDlaMikstury(3, miejsca())).toBe(1);
      expect(miejsceDlaMikstury(3, miejsca(1))).toBe(2);
      expect(miejsceDlaMikstury(3, miejsca(1, 2))).toBe(3);
    });

    it('odmawia, gdy wszystkie trzy zajete', () => {
      expect(miejsceDlaMikstury(4, miejsca(1, 2, 3))).toBe('brak-miejsca');
    });

    it('doklada sie do tej samej mikstury', () => {
      expect(miejsceDlaMikstury(2, miejsca(1, 2, 3))).toBe(2);
    });

    it('mocniejsza wchodzi na miejsce slabszej', () => {
      // 6 to sila +15%, 1 to sila +10%: `$item_id == $potion_id + 5`.
      expect(miejsceDlaMikstury(6, miejsca(1))).toBe(1);
      expect(miejsceDlaMikstury(11, miejsca(0, 1))).toBe(2);
    });

    it('slabszej nie da sie wypic na mocniejsza', () => {
      expect(miejsceDlaMikstury(1, miejsca(11))).toBe('slabsza');
      expect(miejsceDlaMikstury(6, miejsca(11))).toBe('slabsza');
    });

    it('Eliksir Niesmiertelnosci liczy sie osobno', () => {
      /*
       * Numer 16 to „sila +10%" (1) plus 15, wiec zwykla regula
       * wepchnelaby go na miejsce mikstury sily. Oryginal liczy dla
       * niego miejsce po dokladnej rownosci — dostaje wiec wolne.
       */
      expect(miejsceDlaMikstury(MIKSTURA_ZYCIA, miejsca(1))).toBe(2);
      expect(miejsceDlaMikstury(MIKSTURA_ZYCIA, miejsca(1, MIKSTURA_ZYCIA))).toBe(2);
      // I odwrotnie: mikstura sily nie „przebija" eliksiru zycia.
      expect(miejsceDlaMikstury(1, miejsca(MIKSTURA_ZYCIA))).toBe(2);
    });
  });

  describe('czas dzialania', () => {
    it('liczy 72 godziny od teraz na wolnym miejscu', () => {
      expect(czasPoWypiciu(3, 0, 1000)).toBe(1000 + 3600 * CZAS_DZIALANIA_H);
    });

    it('doklada do konca tego, co juz dziala', () => {
      expect(czasPoWypiciu(3, 5000, 1000)).toBe(5000 + 3600 * CZAS_DZIALANIA_H);
    });

    it('Eliksir Niesmiertelnosci dostaje 96 godzin wiecej', () => {
      expect(czasPoWypiciu(MIKSTURA_ZYCIA, 0, 1000)).toBe(
        1000 + 3600 * (CZAS_DZIALANIA_H + DODATKOWY_CZAS_ZYCIA_H),
      );
    });
  });

  describe('bonus do zycia', () => {
    it('daje cwierc zwyklego wzoru', () => {
      // `round(($wit * $k * ($lvl + 1)) / 100 * 25)` — wojownik ma $k = 5.
      // 100 wytrzymalosci, poziom 33: 100 * 5 * 34 = 17000, czwarta czesc to 4250.
      expect(bonusZycia(miejsca(MIKSTURA_ZYCIA), 100, 5, 33)).toBe(4250);
    });

    it('bez eliksiru nie daje nic', () => {
      expect(bonusZycia(miejsca(11, 3), 100, 5, 33)).toBe(0);
    });

    it('liczy sie raz, nawet gdy eliksir stoi w dwoch miejscach', () => {
      // Petla w `req.php` NADPISUJE `$hpPotionVal`, a nie sumuje.
      expect(bonusZycia(miejsca(MIKSTURA_ZYCIA, MIKSTURA_ZYCIA), 100, 5, 33)).toBe(4250);
    });
  });
});
