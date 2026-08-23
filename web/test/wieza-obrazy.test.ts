import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { OBRAZY_PIETER, NAZWY_PIETER } from '../src/gra/wieza-teksty';
import { obrazPotwora } from '../src/gra/karczmaUklad';

/**
 * Portrety potworow z wiezy. Oryginal zamazuje ich nazwy skrotem:
 *
 *     if (i >= 399 && i < 499) {
 *         monsterChecksum = MD5(String(i) + "ScriptKiddieLovesToPeek");
 *         DefineImg(..., "scr/fight/monster/monster" + monsterChecksum + ".jpg");
 *     }
 *
 * gdzie `i` to pozycja obrazka, o jeden nizsza od numeru potwora.
 * Potwor z pietra N ma numer `399 + N`, wiec jego obrazek to `398 + N`.
 */
describe('portrety pieter', () => {
  it('jest ich sto, po jednym na pietro', () => {
    expect(OBRAZY_PIETER).toHaveLength(100);
    expect(NAZWY_PIETER).toHaveLength(100);
    expect(new Set(OBRAZY_PIETER).size).toBe(100);
  });

  it('kazdy plik naprawde lezy w paczce zasobow', () => {
    for (const plik of OBRAZY_PIETER) {
      expect(existsSync(`../sf555/res/sfgame/scr/fight/monster/${plik}`), plik).toBe(true);
    }
  });

  it('`obrazPotwora` siega po nie po numerze potwora', () => {
    // MD5("399ScriptKiddieLovesToPeek") — pierwsze pietro, potwor 400.
    expect(obrazPotwora(400)).toBe(
      '/res/sfgame/scr/fight/monster/monster018b70fc46811d87f59d83ccc7d2db91.jpg',
    );
    expect(obrazPotwora(499)).toBe(`/res/sfgame/scr/fight/monster/${OBRAZY_PIETER[99]}`);
  });

  it('potworow spoza wiezy nie rusza', () => {
    expect(obrazPotwora(1)).toBe('/res/sfgame/scr/fight/monster/monster1.jpg');
    expect(obrazPotwora(399)).toBe('/res/sfgame/scr/fight/monster/monster399.jpg');
    expect(obrazPotwora(500)).toBe('/res/sfgame/scr/fight/monster/monster500.jpg');
  });
});
