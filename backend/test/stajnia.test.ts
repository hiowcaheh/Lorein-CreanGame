import { describe, expect, it } from 'vitest';
import {
  CENNIK,
  CZAS_NAJMU,
  czynnyWierzchowiec,
  mnoznikWierzchowca,
  premiaZaNajlepszego,
  sprawdzNajem,
} from '../src/game/stajnia.js';

const TERAZ = 1_000_000;

/** Bogaty gracz bez wierzchowca — tlo dla wiekszosci prob. */
function bogacz(zmiany: Partial<Parameters<typeof sprawdzNajem>[1]> = {}) {
  return {
    teraz: TERAZ,
    wierzchowiec: 0,
    najemDo: 0,
    srebro: 1_000_000,
    grzyby: 100,
    poziom: 10,
    ...zmiany,
  };
}

describe('stajnia', () => {
  it('ma cennik z `mountCost()`', () => {
    // Klient pokazuje 1, 5 i 10 ZLOTA — a zloto to sto srebra.
    expect(CENNIK[1]).toEqual({ srebro: 100, grzyby: 0 });
    expect(CENNIK[2]).toEqual({ srebro: 500, grzyby: 0 });
    expect(CENNIK[3]).toEqual({ srebro: 1000, grzyby: 1 });
    expect(CENNIK[4]).toEqual({ srebro: 0, grzyby: 25 });
  });

  it('skraca wyprawe o 10, 20, 30 i 50 procent', () => {
    expect([1, 2, 3, 4].map(mnoznikWierzchowca)).toEqual([0.9, 0.8, 0.7, 0.5]);
    expect(mnoznikWierzchowca(0)).toBe(1);
  });

  it('najem trwa czternascie dni', () => {
    expect(CZAS_NAJMU).toBe(14 * 24 * 3600);
  });

  it('po czasie wierzchowiec przepada', () => {
    expect(czynnyWierzchowiec(3, TERAZ + 10, TERAZ)).toBe(3);
    expect(czynnyWierzchowiec(3, TERAZ - 10, TERAZ)).toBe(0);
    expect(czynnyWierzchowiec(3, 0, TERAZ)).toBe(0);
  });

  describe('najem', () => {
    it('pierwszy wierzchowiec liczy czas od teraz', () => {
      const w = sprawdzNajem(1, bogacz());
      expect(w).toMatchObject({ najemDo: TERAZ + CZAS_NAJMU, premia: 0 });
      expect(typeof w === 'string' ? 0 : w.srebro).toBe(1_000_000 - 100);
    });

    it('ten sam wierzchowiec PRZEDLUZA najem', () => {
      // `$mount_dur += 1209600` — doklada sie do konca, nie liczy od nowa.
      const koniec = TERAZ + 5000;
      const w = sprawdzNajem(2, bogacz({ wierzchowiec: 2, najemDo: koniec }));
      expect(w).toMatchObject({ najemDo: koniec + CZAS_NAJMU });
    });

    it('lepszy wierzchowiec zaczyna najem od nowa', () => {
      const w = sprawdzNajem(3, bogacz({ wierzchowiec: 2, najemDo: TERAZ + 5000 }));
      expect(w).toMatchObject({ najemDo: TERAZ + CZAS_NAJMU });
    });

    it('gorszego nie da sie wziac', () => {
      expect(sprawdzNajem(1, bogacz({ wierzchowiec: 3, najemDo: TERAZ + 5000 }))).toBe('gorszy');
    });

    it('ale po wygasnieciu gorszy juz wolno', () => {
      // `$cur_mount` liczy sie tylko wtedy, gdy najem trwa.
      expect(sprawdzNajem(1, bogacz({ wierzchowiec: 3, najemDo: TERAZ - 1 }))).toMatchObject({
        najemDo: TERAZ + CZAS_NAJMU,
      });
    });

    it('sprawdza srebro przed grzybami', () => {
      expect(sprawdzNajem(3, bogacz({ srebro: 999, grzyby: 0 }))).toBe('za-drogo');
      expect(sprawdzNajem(3, bogacz({ srebro: 1000, grzyby: 0 }))).toBe('brak-grzybow');
    });

    it('czwarty wierzchowiec DOKLADA srebro', () => {
      // `$silver += ((23 + $uLvl) * $uLvl * $uLvl)` — i to po odjeciu ceny.
      const w = sprawdzNajem(4, bogacz({ poziom: 10, srebro: 0, grzyby: 25 }));
      expect(premiaZaNajlepszego(10)).toBe((23 + 10) * 10 * 10);
      expect(w).toMatchObject({ srebro: 3300, grzyby: 0, premia: 3300 });
    });

    it('odmawia wierzchowca spoza zakresu', () => {
      for (const zly of [0, 5, -1, 1.5, Number.NaN]) {
        expect(sprawdzNajem(zly, bogacz())).toBe('nie-ma-takiego');
      }
    });
  });
});
