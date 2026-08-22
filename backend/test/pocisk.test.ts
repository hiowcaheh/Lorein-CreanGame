import { describe, expect, it } from 'vitest';
import { RODZAJ_BRONI, plikPocisku } from '../src/game/grafikaPrzedmiotow.js';
import { zbudujPrzedmiot } from '../src/api/gracz.js';

/**
 * Pocisk broni — `GetArrowID()`. Ekran postaci stawia go tam, gdzie
 * wojownik ma tarcze, wiec musi przychodzic razem z przedmiotem.
 */
describe('pocisk broni', () => {
  it('bron wojownika pocisku nie ma', () => {
    expect(plikPocisku(1, 0)).toBeNull();
  });

  it('rozdzka maga strzela kula z katalogu 1-2', () => {
    // Numer 1001 to klasa 2 (mag), obrazek 1.
    expect(plikPocisku(1001, 2)).toBe('/res/sfgame/itm/1-2/shot2-1-3.png');
  });

  it('luk zwiadowcy strzela beltem z katalogu 1-3', () => {
    expect(plikPocisku(2001, 4)).toBe('/res/sfgame/itm/1-3/shot1-1-5.png');
  });

  it('epicka rozdzka ma tylko dwa warianty: zwykly i dla barwy 3', () => {
    expect(plikPocisku(1050, 0)).toBe('/res/sfgame/itm/1-2/shot2-50-1.png');
    expect(plikPocisku(1050, 3)).toBe('/res/sfgame/itm/1-2/shot2-50-4.png');
    expect(plikPocisku(1050, 4)).toBe('/res/sfgame/itm/1-2/shot2-50-1.png');
  });

  it('epicki luk ma jeden wariant przy kazdej barwie', () => {
    expect(plikPocisku(2050, 3)).toBe('/res/sfgame/itm/1-3/shot1-50-1.png');
  });

  const pusty = {
    dmg_min: 0, dmg_max: 0,
    atr_type_1: 0, atr_type_2: 0, atr_type_3: 0,
    atr_val_1: 0, atr_val_2: 0, atr_val_3: 0,
    gold: 0, mush: 0, upgrade_level: 0,
  };

  it('przedmiot z API niesie pocisk tylko przy broni', () => {
    const rozdzka = zbudujPrzedmiot({ ...pusty, slot: 8, item_type: RODZAJ_BRONI, item_id: 1001 });
    expect(rozdzka.pocisk).toBe('/res/sfgame/itm/1-2/shot2-1-1.png');

    const zbroja = zbudujPrzedmiot({ ...pusty, slot: 1, item_type: 3, item_id: 1001 });
    expect(zbroja.pocisk).toBeNull();

    const miecz = zbudujPrzedmiot({ ...pusty, slot: 8, item_type: RODZAJ_BRONI, item_id: 1 });
    expect(miecz.pocisk).toBeNull();
  });
});
