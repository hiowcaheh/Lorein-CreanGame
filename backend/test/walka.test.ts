import { describe, expect, it } from 'vitest';
import { PhpMtRand } from '../src/compat/rng.js';
import { potworNaZadanie, rozegrajWalke, wojownikZGracza, type Przedmiot, type Wojownik } from '../src/game/walka.js';

/**
 * Walka jest z natury losowa, wiec testy sprawdzaja dwie rzeczy:
 *
 *   - zasady, ktore losowosci nie podlegaja (pancerz, zycie, obrazenia
 *     z broni, ignorowanie pancerza przez maga),
 *   - wlasnosci statystyczne na duzej probie (lowca unika mniej wiecej
 *     polowy ciosow, walka zawsze sie konczy).
 *
 * Ziarno generatora jest ustawiane na sztywno, wiec kazdy przebieg daje
 * ten sam wynik — inaczej test raz przechodzilby, raz nie.
 */

function bron(dmgMin: number, dmgMax: number): Przedmiot {
  return {
    slot: 8, dmg_min: dmgMin, dmg_max: dmgMax,
    atr_type_1: 0, atr_type_2: 0, atr_type_3: 0,
    atr_val_1: 0, atr_val_2: 0, atr_val_3: 0,
  };
}

function czesc(slot: number, pancerz: number, typ = 0, wartosc = 0): Przedmiot {
  return {
    slot, dmg_min: pancerz, dmg_max: 0,
    atr_type_1: typ, atr_type_2: 0, atr_type_3: 0,
    atr_val_1: wartosc, atr_val_2: 0, atr_val_3: 0,
  };
}

const WOJOWNIK = { user_name: 'Zenek', class: 1, lvl: 10, attr_str: 100, attr_agi: 20, attr_int: 20, attr_wit: 50, attr_luck: 30 };

describe('sklad wojownika', () => {
  it('zycie zalezy od klasy: wojownik jest twardszy od maga', () => {
    const w = wojownikZGracza(WOJOWNIK, [bron(10, 20)]);
    const m = wojownikZGracza({ ...WOJOWNIK, class: 2 }, [bron(10, 20)]);
    const l = wojownikZGracza({ ...WOJOWNIK, class: 3 }, [bron(10, 20)]);

    // wytrzymalosc x mnoznik x (poziom + 1)
    expect(w.zycie).toBe(50 * 5 * 11);
    expect(m.zycie).toBe(50 * 2 * 11);
    expect(l.zycie).toBe(50 * 4 * 11);
  });

  it('obrazenia broni rosna z cecha glowna', () => {
    const w = wojownikZGracza(WOJOWNIK, [bron(10, 20)]);
    // 10 x (1 + 100/10) = 110
    expect(w.bronMin).toBe(110);
    expect(w.bronMax).toBe(220);
  });

  it('cecha glowna zalezy od klasy', () => {
    const mag = wojownikZGracza({ ...WOJOWNIK, class: 2 }, [bron(10, 20)]);
    // maga niesie intelekt (20), nie sila (100)
    expect(mag.bronMin).toBe(10 * (1 + 20 / 10));
  });

  it('przedmioty dodaja do cech, a typ 6 do wszystkich naraz', () => {
    const w = wojownikZGracza(WOJOWNIK, [bron(10, 20), czesc(0, 5, 1, 30), czesc(1, 5, 6, 7)]);
    expect(w.sila).toBe(100 + 30 + 7);
    expect(w.zrecznosc).toBe(20 + 7);
    expect(w.szczescie).toBe(30 + 7);
  });

  it('pancerz to suma zbroi ze slotow 0-3 i 5, bez broni i tarczy', () => {
    const w = wojownikZGracza(WOJOWNIK, [
      bron(10, 20), czesc(0, 11), czesc(1, 12), czesc(2, 13), czesc(3, 14), czesc(5, 15),
      czesc(9, 99),   // tarcza — nie liczy sie do pancerza
      czesc(4, 77),   // slot 4 tez nie
    ]);
    expect(w.pancerz).toBe(11 + 12 + 13 + 14 + 15);
    expect(w.tarcza).toBe(99);
  });

  it('bez broni bije golymi piesciami za 1-2', () => {
    const w = wojownikZGracza({ ...WOJOWNIK, attr_str: 0 }, []);
    expect(w.bronMin).toBe(1);
    expect(w.bronMax).toBe(2);
  });
});

describe('przebieg walki', () => {
  function zawodnik(nadpisz: Partial<Wojownik>): Wojownik {
    return {
      nazwa: 'X', klasa: 1, poziom: 10,
      sila: 10, zrecznosc: 10, intelekt: 10, wytrzymalosc: 10, szczescie: 0,
      zycie: 1000, zycieMaks: 1000, bronMin: 50, bronMax: 50,
      bronBazowaMin: 50, bronBazowaMax: 50,
      pancerz: 0, tarcza: 0,
      ...nadpisz,
    };
  }

  it('walka zawsze sie konczy i ktos wygrywa', () => {
    for (let ziarno = 1; ziarno <= 50; ziarno++) {
      const wynik = rozegrajWalke(zawodnik({}), zawodnik({}), new PhpMtRand(ziarno));
      expect([1, 2]).toContain(wynik.wygral);
      expect(wynik.ciosy.length).toBeGreaterThan(0);
    }
  });

  it('to samo ziarno daje ten sam przebieg', () => {
    const a = rozegrajWalke(zawodnik({}), zawodnik({}), new PhpMtRand(777));
    const b = rozegrajWalke(zawodnik({}), zawodnik({}), new PhpMtRand(777));
    expect(a).toEqual(b);
  });

  it('silniejszy wygrywa zdecydowana wiekszosc walk', () => {
    let wygrane = 0;
    for (let ziarno = 1; ziarno <= 200; ziarno++) {
      const mocny = zawodnik({ zycie: 3000, zycieMaks: 3000, bronMin: 200, bronMax: 200 });
      const slaby = zawodnik({ zycie: 500, zycieMaks: 500, bronMin: 10, bronMax: 10 });
      if (rozegrajWalke(mocny, slaby, new PhpMtRand(ziarno)).wygral === 1) wygrane++;
    }
    expect(wygrane).toBeGreaterThan(190);
  });

  it('mag przebija pancerz — jego ataki go nie zauwazaja', () => {
    // Ta sama ofiara w ciezkiej zbroi, raz bita przez wojownika,
    // raz przez maga. Pancerz dziala tylko na tego pierwszego.
    const pierwszyCios = (atakujacyKlasa: number) => {
      const wynik = rozegrajWalke(
        zawodnik({ klasa: atakujacyKlasa }),
        zawodnik({ klasa: 1, pancerz: 400, tarcza: 0 }),
        new PhpMtRand(5),
      );
      return wynik.ciosy.find((c) => c.kto === 1 && c.obrazenia > 0)?.obrazenia ?? 0;
    };

    expect(pierwszyCios(2)).toBeGreaterThan(pierwszyCios(1));
  });

  it('pancerz dziala przeciw nie-magom', () => {
    const goly = rozegrajWalke(zawodnik({}), zawodnik({ klasa: 1 }), new PhpMtRand(9));
    const opancerzony = rozegrajWalke(zawodnik({}), zawodnik({ klasa: 1, pancerz: 400 }), new PhpMtRand(9));

    const pierwszyCios = (w: { ciosy: { kto: number; obrazenia: number }[] }) =>
      w.ciosy.find((c) => c.kto === 1 && c.obrazenia > 0)?.obrazenia ?? 0;

    expect(pierwszyCios(opancerzony)).toBeLessThan(pierwszyCios(goly));
  });

  it('lowca unika mniej wiecej polowy ciosow', () => {
    let ciosy = 0;
    let uniki = 0;

    for (let ziarno = 1; ziarno <= 100; ziarno++) {
      const wynik = rozegrajWalke(
        zawodnik({ klasa: 1, zycie: 5000, zycieMaks: 5000 }),
        zawodnik({ klasa: 3, zycie: 5000, zycieMaks: 5000 }),
        new PhpMtRand(ziarno),
      );
      for (const c of wynik.ciosy) {
        if (c.kto !== 1) continue;   // tylko ciosy W lowce
        ciosy++;
        if (c.rodzaj === 2) uniki++;
      }
    }

    const udzial = uniki / ciosy;
    expect(udzial).toBeGreaterThan(0.4);
    expect(udzial).toBeLessThan(0.6);
  });
});

describe('potwor na zadanie', () => {
  it('jest skrojony na miare gracza — slabszy, ale nie za slaby', () => {
    const gracz = wojownikZGracza(WOJOWNIK, [bron(10, 20)]);

    for (let ziarno = 1; ziarno <= 50; ziarno++) {
      const potwor = potworNaZadanie(gracz, new PhpMtRand(ziarno));

      expect(potwor.poziom).toBeGreaterThanOrEqual(gracz.poziom);
      expect(potwor.poziom).toBeLessThanOrEqual(gracz.poziom + 2);
      expect([1, 2, 3]).toContain(potwor.klasa);
      expect(potwor.zycie).toBeGreaterThan(0);
      expect(potwor.bronMin).toBeGreaterThanOrEqual(1);
      expect(potwor.obrazek).toBeGreaterThanOrEqual(1);
      expect(potwor.obrazek).toBeLessThanOrEqual(158);
    }
  });

  it('gracz wygrywa zadania niemal zawsze — tak jest w oryginale', () => {
    /*
     * To nie jest przeoczenie w porcie, tylko wlasnosc oryginalu,
     * potwierdzona wzorcami z prawdziwego PHP (fixtures/walka.json).
     *
     * Obrazenia gracza to bron razy (1 + cecha glowna / 10) — przy cesze 100
     * daje to mnoznik 11. Potwor liczy swoje obrazenia z SUROWEJ broni razy
     * cecha gracza podzielona przez 40-50, czyli mnoznik okolo 2. Do tego ma
     * ulamek zycia gracza. Zadania w karczmie sa wiec z zalozenia bezpieczne;
     * prawdziwe wyzwanie to arena i lochy, gdzie przeciwnik jest pelnoprawna
     * postacia liczona tym samym wzorem co gracz.
     */
    let wygrane = 0;
    const proby = 300;

    for (let ziarno = 1; ziarno <= proby; ziarno++) {
      const rng = new PhpMtRand(ziarno);
      const gracz = wojownikZGracza(WOJOWNIK, [bron(10, 20)]);
      const potwor = potworNaZadanie(gracz, rng);
      if (rozegrajWalke(gracz, potwor, rng).wygral === 1) wygrane++;
    }

    expect(wygrane / proby).toBeGreaterThan(0.95);
  });
});
