import { describe, expect, it } from 'vitest';
import {
  PUNKTOW_ZA_ZAKUP,
  cenaPokazywana,
  cenaPunktow,
  cennikPunktow,
  dokupionePunkty,
  ileStacNaZakupy,
  kolumnaCechy,
  sprawdzZakupCechy,
} from '../src/game/cechy.js';
import { loadDefaultStats } from '../src/game/stats.js';

/** Wojownik czlowiek: 17/13/10/15/10 z `loadDefaultStats`. */
const WOJOWNIK = 1;
const CZLOWIEK = 1;

describe('kupowanie cech', () => {
  it('jeden zakup daje trzy punkty', () => {
    // `$newStatVal = 3 + $db_data['stat'];`
    expect(PUNKTOW_ZA_ZAKUP).toBe(3);
  });

  it('tablica cen zgadza sie z krzywa oryginalu', () => {
    /*
     * Wartosci policzone niezaleznie z `getStatCost()` — te same
     * trzy przebiegi, ta sama kolejnosc dzielen calkowitych.
     */
    const ceny = cennikPunktow();
    expect(ceny[0]).toBe(25);
    expect(ceny[1]).toBe(30);
    expect(ceny[2]).toBe(35);
    expect(ceny[3]).toBe(40);
    expect(ceny[5]).toBe(50);
    expect(ceny[10]).toBe(75);
    expect(ceny[15]).toBe(95);
    expect(ceny[30]).toBe(185);
    expect(ceny[60]).toBe(520);
    expect(ceny[100]).toBe(1430);
    expect(ceny[300]).toBe(28380);
    expect(ceny[1000]).toBe(2905790);
    expect(ceny[3000]).toBe(754775775);
  });

  it('cena rosnie i nigdy nie przekracza miliarda', () => {
    const ceny = cennikPunktow();
    for (let i = 1; i < 5000; i++) {
      expect(ceny[i]!).toBeGreaterThanOrEqual(ceny[i - 1]!);
      expect(ceny[i]!).toBeLessThanOrEqual(1000000000);
    }
  });

  it('liczy punkty DOKUPIONE, nie cala cechę', () => {
    const [sila] = loadDefaultStats(WOJOWNIK, CZLOWIEK);
    expect(dokupionePunkty(WOJOWNIK, CZLOWIEK, 1, sila!)).toBe(0);
    expect(dokupionePunkty(WOJOWNIK, CZLOWIEK, 1, sila! + 3)).toBe(3);
    // Wartosc ponizej startowej nie moze dac ujemnego indeksu.
    expect(dokupionePunkty(WOJOWNIK, CZLOWIEK, 1, 0)).toBe(0);
  });

  it('swieza postac placi za pierwszy zakup 25 srebra', () => {
    const [sila] = loadDefaultStats(WOJOWNIK, CZLOWIEK);
    expect(cenaPunktow(WOJOWNIK, CZLOWIEK, 1, sila!)).toBe(25);
    expect(cenaPunktow(WOJOWNIK, CZLOWIEK, 1, sila! + 3)).toBe(40);
  });

  it('ta sama cena dla kazdej cechy przy tylu samych dokupionych', () => {
    // Cena zalezy TYLKO od liczby dokupionych punktow danej cechy.
    const baza = loadDefaultStats(WOJOWNIK, CZLOWIEK);
    for (let cecha = 1; cecha <= 5; cecha++) {
      expect(cenaPunktow(WOJOWNIK, CZLOWIEK, cecha, (baza[cecha - 1] ?? 0) + 30)).toBe(
        cennikPunktow()[30],
      );
    }
  });

  it('powyzej 9999 klient pokazuje cene bez srebra', () => {
    // `boostPrice = int(int(boostPrice / 100) * 100)`.
    expect(cenaPokazywana(9999)).toBe(9999);
    expect(cenaPokazywana(10087)).toBe(10000);
    expect(cenaPokazywana(28380)).toBe(28300);
  });

  describe('zakup', () => {
    const baza = { klasa: WOJOWNIK, rasa: CZLOWIEK, wartosc: 17, srebro: 1000 };

    it('podnosi cechę o trzy i zabiera cene', () => {
      expect(sprawdzZakupCechy(1, baza)).toEqual({
        wartosc: 20,
        srebro: 975,
        cena: 25,
        zakupow: 1,
      });
    });

    it('hurtem liczy kolejne, coraz drozsze ceny', () => {
      // Trzy zakupy pod rzad: 25 + 40 + 55 = 120 srebra i dziewiec punktow.
      expect(sprawdzZakupCechy(1, baza, 3)).toEqual({
        wartosc: 26,
        srebro: 880,
        cena: 120,
        zakupow: 3,
      });
    });

    it('hurtem bierze tyle, na ile starczy', () => {
      // Za 70 srebra wychodza dwa zakupy (25 + 40), na trzeci brakuje.
      expect(sprawdzZakupCechy(1, { ...baza, srebro: 70 }, 5)).toEqual({
        wartosc: 23,
        srebro: 5,
        cena: 65,
        zakupow: 2,
      });
    });

    it('odmawia przy braku srebra', () => {
      expect(sprawdzZakupCechy(1, { ...baza, srebro: 24 })).toBe('za-drogo');
      // Rowno tyle, ile trzeba, juz wystarcza.
      expect(sprawdzZakupCechy(1, { ...baza, srebro: 25 })).toMatchObject({ srebro: 0 });
    });

    it('odmawia cechy spoza zakresu', () => {
      for (const zla of [0, 6, -1, 2.5, Number.NaN]) {
        expect(sprawdzZakupCechy(zla, baza)).toBe('nie-ma-takiej-cechy');
      }
    });
  });

  it('liczy, ile zakupow starczy za dane srebro', () => {
    // Ceny 25, 40, 55, 70... — za 120 srebra wychodza trzy.
    expect(ileStacNaZakupy(WOJOWNIK, CZLOWIEK, 1, 17, 120)).toEqual({ ile: 3, koszt: 120 });
    expect(ileStacNaZakupy(WOJOWNIK, CZLOWIEK, 1, 17, 119)).toEqual({ ile: 2, koszt: 65 });
    expect(ileStacNaZakupy(WOJOWNIK, CZLOWIEK, 1, 17, 24)).toEqual({ ile: 0, koszt: 0 });
    // Gorna granica przycina wynik, nawet gdy srebra jest duzo.
    expect(ileStacNaZakupy(WOJOWNIK, CZLOWIEK, 1, 17, 10 ** 9, 2)).toMatchObject({ ile: 2 });
  });

  it('zna kolumny z `getStatName()`', () => {
    expect([1, 2, 3, 4, 5].map(kolumnaCechy)).toEqual([
      'attr_str',
      'attr_agi',
      'attr_int',
      'attr_wit',
      'attr_luck',
    ]);
    expect(kolumnaCechy(6)).toBeNull();
  });
});
