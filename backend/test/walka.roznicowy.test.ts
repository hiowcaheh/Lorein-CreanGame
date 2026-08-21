import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { PhpMtRand } from '../src/compat/rng.js';
import { potworNaZadanie, wojownikZGracza, type Przedmiot } from '../src/game/walka.js';

/**
 * Test roznicowy silnika walki.
 *
 * Wzorce w `fixtures/walka.json` wyprodukowal PRAWDZIWY oryginal: skrypt
 * `fixtures/generate-walka.php` wycina z `req.php` klasy `Char`, `Monster`
 * i funkcje `getQuestMonster`, podstawia atrape bazy i uruchamia je przy
 * ustalonym ziarnie generatora.
 *
 * Port dostaje te same dane wejsciowe i to samo ziarno, wiec musi zwrocic
 * dokladnie te same liczby. To jedyny sposob, zeby miec pewnosc, ze zasady
 * zostaly przepisane wiernie, a nie tylko podobnie.
 *
 * Odswiezenie wzorcow:
 *     php test/fixtures/generate-walka.php > test/fixtures/walka.json
 */

interface Wzorzec {
  nazwa: string;
  ziarno: number;
  wejscie: {
    class: number; lvl: number;
    str: number; agi: number; int: number; wit: number; luck: number;
    weapon: [number, number];
    armor: number;
  };
  gracz: {
    hp: number; str: number; dex: number; int: number; wit: number; luck: number;
    bronMin: number; bronMax: number;
  };
  potwor: {
    lvl: number; class: number; hp: number;
    str: number; dex: number; int: number; wit: number; luck: number;
    bronMin: number; bronMax: number;
  };
}

const wzorce: Wzorzec[] = JSON.parse(
  readFileSync(fileURLToPath(new URL('./fixtures/walka.json', import.meta.url)), 'utf8'),
);

function przedmioty(w: Wzorzec): Przedmiot[] {
  const lista: Przedmiot[] = [
    {
      slot: 8, dmg_min: w.wejscie.weapon[0], dmg_max: w.wejscie.weapon[1],
      atr_type_1: 0, atr_type_2: 0, atr_type_3: 0,
      atr_val_1: 0, atr_val_2: 0, atr_val_3: 0,
    },
  ];

  // Pancerz w atrapie oryginalu byl podawany jedna liczba; tutaj wchodzi
  // jako jedna czesc zbroi o tej samej wartosci.
  if (w.wejscie.armor > 0) {
    lista.push({
      slot: 0, dmg_min: w.wejscie.armor, dmg_max: 0,
      atr_type_1: 0, atr_type_2: 0, atr_type_3: 0,
      atr_val_1: 0, atr_val_2: 0, atr_val_3: 0,
    });
  }

  return lista;
}

function wiersz(w: Wzorzec): Record<string, unknown> {
  return {
    user_name: 'Zenek',
    class: w.wejscie.class, lvl: w.wejscie.lvl,
    attr_str: w.wejscie.str, attr_agi: w.wejscie.agi, attr_int: w.wejscie.int,
    attr_wit: w.wejscie.wit, attr_luck: w.wejscie.luck,
  };
}

describe('silnik walki — zgodnosc z req.php', () => {
  it('wzorce zostaly wczytane', () => {
    expect(wzorce.length).toBeGreaterThan(0);
  });

  for (const w of wzorce) {
    describe(`${w.nazwa}, ziarno ${w.ziarno}`, () => {
      it('cechy, zycie i obrazenia gracza zgadzaja sie co do jedynki', () => {
        const gracz = wojownikZGracza(wiersz(w), przedmioty(w));

        expect(gracz.zycie).toBe(w.gracz.hp);
        expect(gracz.sila).toBe(w.gracz.str);
        expect(gracz.zrecznosc).toBe(w.gracz.dex);
        expect(gracz.intelekt).toBe(w.gracz.int);
        expect(gracz.wytrzymalosc).toBe(w.gracz.wit);
        expect(gracz.szczescie).toBe(w.gracz.luck);
        expect(gracz.bronMin).toBeCloseTo(w.gracz.bronMin, 6);
        expect(gracz.bronMax).toBeCloseTo(w.gracz.bronMax, 6);
      });

      it('potwor wychodzi identyczny przy tym samym ziarnie', () => {
        const gracz = wojownikZGracza(wiersz(w), przedmioty(w));
        const potwor = potworNaZadanie(gracz, new PhpMtRand(w.ziarno), { wzorObrazen: 'oryginalne' });

        expect(potwor.poziom).toBe(w.potwor.lvl);
        expect(potwor.klasa).toBe(w.potwor.class);
        expect(potwor.zycie).toBe(w.potwor.hp);
        expect(potwor.sila).toBe(w.potwor.str);
        expect(potwor.zrecznosc).toBe(w.potwor.dex);
        expect(potwor.intelekt).toBe(w.potwor.int);
        expect(potwor.wytrzymalosc).toBe(w.potwor.wit);
        expect(potwor.szczescie).toBe(w.potwor.luck);
        expect(potwor.bronMin).toBe(w.potwor.bronMin);
        expect(potwor.bronMax).toBe(w.potwor.bronMax);
      });

      /*
       * Wzor uzywany w grze rozni sie od oryginalu WYLACZNIE obrazeniami
       * potwora (patrz `WzorObrazenPotwora`). Ten test tego pilnuje: gdyby
       * odstepstwo rozlalo sie na cokolwiek innego — na cechy, zycie,
       * poziom albo na kolejnosc losowan — wyjdzie tutaj.
       */
      it('wzor uzywany w grze rozni sie od oryginalu tylko obrazeniami', () => {
        const gracz = wojownikZGracza(wiersz(w), przedmioty(w));
        const oryginal = potworNaZadanie(gracz, new PhpMtRand(w.ziarno), { wzorObrazen: 'oryginalne' });
        const nasz = potworNaZadanie(gracz, new PhpMtRand(w.ziarno), { wzorObrazen: 'wzorGracza' });

        const { bronMin: _a, bronMax: _b, bronBazowaMin: _c, bronBazowaMax: _d, ...resztaOryginalu } = oryginal;
        const { bronMin: _e, bronMax: _f, bronBazowaMin: _g, bronBazowaMax: _h, ...resztaNaszej } = nasz;
        expect(resztaNaszej).toEqual(resztaOryginalu);

        // Cecha glowna potwora to okolo 1/2,5 cechy gracza, wiec nasz
        // mnoznik `1 + glowna/10` musi wyjsc wyzszy niz `glowna/50`.
        const glownaPotwora =
          nasz.klasa === 1 ? nasz.sila : nasz.klasa === 2 ? nasz.intelekt : nasz.zrecznosc;
        expect(nasz.bronMin).toBe(Math.ceil(gracz.bronBazowaMin * (1 + glownaPotwora / 10)));
        expect(nasz.bronMin).toBeGreaterThanOrEqual(oryginal.bronMin);
      });
    });
  }
});
