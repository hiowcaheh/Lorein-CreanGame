import { describe, expect, it } from 'vitest';
import { POTWORY_WIEZY } from '../src/game/wieza-dane.js';
import {
  PIERWSZE_PIETRO,
  PIETER_WIEZY,
  pietroZeStanu,
  potworZWiezy,
  poziomNagrody,
  przeszedlWieze,
  srebroZaPietro,
} from '../src/game/wieza.js';

/**
 * Wieza — `getTowerMonster($stage)` w `req.php`. Sto pieter, kazde jako
 * jedno `new Monster(...)` o pietnastu liczbach.
 */
describe('tablica pieter', () => {
  it('ma rowno sto pieter i zadnej dziury', () => {
    expect(POTWORY_WIEZY).toHaveLength(PIETER_WIEZY);
    expect(POTWORY_WIEZY.every((p) => p !== null && p !== undefined)).toBe(true);
  });

  it('poziom rosnie o dwa na pietro — `198 + 2 * $stage`', () => {
    expect(POTWORY_WIEZY[0]!.poziom).toBe(200);
    expect(POTWORY_WIEZY[1]!.poziom).toBe(202);
    expect(POTWORY_WIEZY[99]!.poziom).toBe(398);

    POTWORY_WIEZY.forEach((p, i) => expect(p.poziom).toBe(198 + 2 * (i + 1)));
  });

  it('numer potwora idzie po `399 + $stage`', () => {
    expect(POTWORY_WIEZY[0]!.numer).toBe(400);
    expect(POTWORY_WIEZY[99]!.numer).toBe(499);

    POTWORY_WIEZY.forEach((p, i) => expect(p.numer).toBe(399 + (i + 1)));
  });

  it('pierwsze pietro zgadza sie co do liczby z `req.php`', () => {
    // case 1: new Monster((198 + 2 * $stage), 1, 4194, 1697, 1665, 13985,
    //   2589, 365356, 548792, 16019700, 3856, (399 + $stage), 267461, 0, -1);
    expect(POTWORY_WIEZY[0]).toEqual({
      poziom: 200, klasa: 1,
      sila: 4194, zrecznosc: 1697, intelekt: 1665, wytrzymalosc: 13985, szczescie: 2589,
      obrazeniaMin: 365356, obrazeniaMaks: 548792, zycie: 16019700, pancerz: 3856,
      numer: 400, doswiadczenie: 267461, bron: 0, tarcza: -1,
    });
  });

  it('setne pietro tez', () => {
    // case 100: ... 20977, 9686, 8769, 80151, 12429, 444091, 667058,
    //   159901248, 3856, (399 + $stage), 7386146, 0, -1);
    expect(POTWORY_WIEZY[99]).toEqual({
      poziom: 398, klasa: 1,
      sila: 20977, zrecznosc: 9686, intelekt: 8769, wytrzymalosc: 80151, szczescie: 12429,
      obrazeniaMin: 444091, obrazeniaMaks: 667058, zycie: 159901248, pancerz: 3856,
      numer: 499, doswiadczenie: 7386146, bron: 0, tarcza: -1,
    });
  });
});

describe('pietro gracza', () => {
  it('pusta albo bledna kolumna znaczy pierwsze pietro', () => {
    expect(pietroZeStanu(0)).toBe(PIERWSZE_PIETRO);
    expect(pietroZeStanu(-5)).toBe(PIERWSZE_PIETRO);
    expect(pietroZeStanu(Number.NaN)).toBe(PIERWSZE_PIETRO);
  });

  it('powyzej setki zostaje setka', () => {
    expect(pietroZeStanu(100)).toBe(100);
    expect(pietroZeStanu(101)).toBe(100);
  });

  it('wieza jest za soba dopiero POWYZEJ setnego pietra', () => {
    expect(przeszedlWieze(100)).toBe(false);
    expect(przeszedlWieze(101)).toBe(true);
  });

  it('potwor bierze sie z pietra, liczonego od jedynki', () => {
    expect(potworZWiezy(1)).toBe(POTWORY_WIEZY[0]);
    expect(potworZWiezy(100)).toBe(POTWORY_WIEZY[99]);
  });
});

describe('nagroda za pietro', () => {
  /*
   *     $db_data['silver'] += round($OP->getGoldTower() * 100, -2);
   *
   * `getGoldTower()` oddaje pole `exp`, a mnozenie przez sto zamienia
   * zloto na srebro.
   */
  it('srebro to doswiadczenie potwora razy sto', () => {
    expect(srebroZaPietro(POTWORY_WIEZY[0]!)).toBe(267461 * 100);
    expect(srebroZaPietro(POTWORY_WIEZY[99]!)).toBe(7386146 * 100);
  });

  it('kwota jest zawsze pelnym zlotem — `round(..., -2)`', () => {
    for (const potwor of POTWORY_WIEZY) {
      expect(srebroZaPietro(potwor) % 100).toBe(0);
    }
  });

  /*
   *     $statvalue = $OP->getLvl();
   *     if ($statvalue > $lvl) $statvalue = $lvl;
   */
  it('przedmiot losuje sie na poziom gracza, gdy ten jest nizszy', () => {
    const pietro = POTWORY_WIEZY[0]!;
    expect(poziomNagrody(pietro, 50)).toBe(50);
    expect(poziomNagrody(pietro, 400)).toBe(pietro.poziom);
  });
});
