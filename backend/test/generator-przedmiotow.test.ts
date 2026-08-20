/**
 * Generator przedmiotow, sprawdzony wobec `genItem()` z req.php.
 *
 * Losowanie jest wstrzykiwane, wiec wyniki sa powtarzalne i mozna
 * porownac je z wzorami z oryginalu na kartce.
 */

import { describe, expect, it } from 'vitest';
import { wylosujPrzedmiot, type Losowanie } from '../src/game/generatorPrzedmiotow.js';

/** Losowanie, ktore zawsze zwraca dolna granice przedzialu. */
const NAJNIZEJ: Losowanie = (od) => od;

/** Losowanie z gory podanej listy wynikow, po kolei. */
function zListy(wyniki: number[]): Losowanie {
  let i = 0;
  return () => wyniki[i++] ?? 0;
}

describe('wylosujPrzedmiot', () => {
  it('koduje klase w tysiacach numeru przedmiotu', () => {
    const mag = wylosujPrzedmiot(1, 2, { rodzaj: 3, losuj: NAJNIZEJ });
    expect(mag.item_id).toBe(1001);

    const lowca = wylosujPrzedmiot(1, 3, { rodzaj: 3, losuj: NAJNIZEJ });
    expect(lowca.item_id).toBe(2001);
  });

  it('cecha nigdy nie schodzi ponizej jedynki', () => {
    // Na pierwszym poziomie wzor `(poziom - 1) * 3 + drgniecie` dalby
    // liczbe ujemna: (1-1)*3 + (5-10) = -5.
    const rzecz = wylosujPrzedmiot(1, 1, { rodzaj: 4, losuj: NAJNIZEJ });
    expect(rzecz.atr_val_1).toBe(1);
    expect(rzecz.atr_type_1).toBeGreaterThan(0);
  });

  it('pancerz rosnie z poziomem wedlug mnoznika klasy', () => {
    // Wojownik, buty (rodzaj 4): mnoznik 7. Poziom 10 -> 10*7 + 1.
    const buty = wylosujPrzedmiot(10, 1, { rodzaj: 4, losuj: NAJNIZEJ });
    expect(buty.dmg_min).toBe(71);

    // Mag w tych samych butach ma mnoznik 2.
    expect(wylosujPrzedmiot(10, 2, { rodzaj: 4, losuj: NAJNIZEJ }).dmg_min).toBe(21);
  });

  it('tarcza blokuje wedlug progow poziomu', () => {
    expect(wylosujPrzedmiot(1, 1, { rodzaj: 2, losuj: NAJNIZEJ }).dmg_min).toBe(10);
    expect(wylosujPrzedmiot(15, 1, { rodzaj: 2, losuj: NAJNIZEJ }).dmg_min).toBe(15);
    expect(wylosujPrzedmiot(30, 1, { rodzaj: 2, losuj: NAJNIZEJ }).dmg_min).toBe(25);
  });

  it('tarcza wojownika nigdy nie kosztuje grzybow', () => {
    // Nawet gdy wypadnie przedmiot o dwoch cechach (`dwieCechy`).
    const losuj = zListy([
      14, // cena z widelek
      30, // dodatek do ceny
      1, //  dwie cechy
      1, //  grzyby za zwykly przedmiot
      1, //  numer przedmiotu
      1, 2, 5, 5, // cechy
    ]);
    expect(wylosujPrzedmiot(1, 1, { rodzaj: 2, losuj }).mush).toBe(0);
  });

  it('mag nigdy nie dostaje tarczy', () => {
    // Pierwsze losowanie rodzaju daje tarcze, drugie helm.
    const losuj = zListy([2, 6, 14, 30, 2, 2, 1, 1, 1]);
    expect(wylosujPrzedmiot(1, 2, { losuj }).item_type).toBe(6);
  });

  it('co siodmy przedmiot ma dwie rozne cechy', () => {
    const losuj = zListy([
      14, 30, // cena
      1, //     dwie cechy
      2, //     bez dodatkowego grzyba
      1, //     numer
      12, //    pancerz
      3, 3, //  obie cechy wyszly te same
      10, 10, // drgniecia wartosci
    ]);
    const rzecz = wylosujPrzedmiot(1, 1, { rodzaj: 4, losuj });
    expect(rzecz.atr_type_1).toBe(3);
    // Ta sama cecha dwa razy nie ma sensu — oryginal przesuwa druga o jeden.
    expect(rzecz.atr_type_2).toBe(2);
    expect(rzecz.atr_val_2).toBeGreaterThan(0);
  });

  it('obrazenia broni rosna z mnoznikiem klasy', () => {
    // Poziom 21, wojownik (mnoznik 2) kontra mag (mnoznik 4,2).
    const wojownik = wylosujPrzedmiot(21, 1, { rodzaj: 1, losuj: NAJNIZEJ });
    const mag = wylosujPrzedmiot(21, 2, { rodzaj: 1, losuj: NAJNIZEJ });
    expect(mag.dmg_max).toBeGreaterThan(wojownik.dmg_max);
    expect(wojownik.dmg_max).toBeGreaterThan(wojownik.dmg_min);
  });

  it('zawsze wychodzi przedmiot ze zbrojowni', () => {
    for (let i = 0; i < 300; i++) {
      const rzecz = wylosujPrzedmiot(1 + (i % 40), 1 + (i % 3));
      expect(rzecz.item_type).toBeGreaterThanOrEqual(1);
      expect(rzecz.item_type).toBeLessThanOrEqual(7);
      expect(rzecz.gold).toBeGreaterThan(0);
      expect(rzecz.atr_val_1).toBeGreaterThanOrEqual(1);
      expect(Number.isInteger(rzecz.gold)).toBe(true);
    }
  });
});
