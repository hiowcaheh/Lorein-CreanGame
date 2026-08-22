/**
 * Panel testowy grzybiarza.
 *
 * To NIE jest czesc gry — zadnej z tych akcji nie ma w oryginale.
 * Sluza do przechodzenia przez ekrany bez rozgrywania kilkudziesieciu
 * wypraw: awans, zloto, grzyby, wyzerowanie piw i poziomu.
 *
 * Sa CHEATAMI, wiec caly moduł stoi za `config.panelTestowy` — lokalnie
 * wlaczony, na wdrozeniu tylko po ustawieniu `LOREIN_PANEL_TESTOWY=1`.
 */

import { Hono } from 'hono';
import { getSql } from '../db/client.js';
import { intval } from '../compat/php.js';
import { config } from '../config.js';
import { LEVELS } from '../protocol/gamedata.js';
import { loadDefaultStats } from '../game/stats.js';
import { wczytajGracza } from './gracz.js';
import { tokenZNaglowka } from './konto.js';

export const testy = new Hono();

/** Ile srebra to jedno zloto — tak samo, jak w pasku u gory. */
const SREBRA_W_ZLOCIE = 100;

/** Najwyzszy poziom, na jaki pozwala tablica progow. */
const NAJWYZSZY_POZIOM = LEVELS.length - 1;

export type Sztuczka =
  | 'awans-1'
  | 'awans-10'
  | 'zloto-1000'
  | 'zloto-10000'
  | 'grzyby-1000'
  | 'piwa-zeruj'
  | 'poziom-1';

interface WierszGracza extends Record<string, unknown> {
  user_id: number;
}

/** Czy panel jest w ogole wlaczony — klient pyta, zanim narysuje przyciski. */
testy.get('/testy', (c) => c.json({ wlaczony: config.panelTestowy }));

testy.post('/testy/:sztuczka', async (c) => {
  if (!config.panelTestowy) return c.json({ blad: 'Panel testowy jest wyłączony.' }, 403);

  const token = tokenZNaglowka(c);
  if (!token) return c.json({ blad: 'Brak sesji.' }, 401);

  const sql = getSql();
  const [wiersz] = await sql<WierszGracza[]>`
    SELECT * FROM user_data WHERE ssid = ${token} LIMIT 1
  `;
  if (!wiersz) return c.json({ blad: 'Brak sesji.' }, 401);

  const sztuczka = c.req.param('sztuczka') as Sztuczka;
  const poziom = Math.max(1, intval(wiersz['lvl'] ?? 1));

  switch (sztuczka) {
    case 'awans-1':
    case 'awans-10': {
      const oIle = sztuczka === 'awans-10' ? 10 : 1;
      const nowy = Math.min(NAJWYZSZY_POZIOM, poziom + oIle);
      // Doswiadczenie liczy sie W OBREBIE poziomu, wiec przy awansie wraca do zera.
      await sql`UPDATE user_data SET lvl = ${nowy}, exp = 0 WHERE user_id = ${wiersz.user_id}`;
      break;
    }

    case 'zloto-1000':
    case 'zloto-10000': {
      const zloto = sztuczka === 'zloto-10000' ? 10000 : 1000;
      await sql`
        UPDATE user_data SET silver = silver + ${zloto * SREBRA_W_ZLOCIE}
        WHERE user_id = ${wiersz.user_id}
      `;
      break;
    }

    case 'grzyby-1000':
      await sql`UPDATE user_data SET mushroom = mushroom + 1000 WHERE user_id = ${wiersz.user_id}`;
      break;

    case 'piwa-zeruj':
      await sql`UPDATE user_data SET beers = 0 WHERE user_id = ${wiersz.user_id}`;
      break;

    case 'poziom-1': {
      /*
       * Powrot na pierwszy poziom. Cechy wracaja do wartosci startowej
       * rasy i klasy (`loadDefaultStats`), inaczej postac zostalaby
       * z setkami punktow na jedynce i wszystko by rozwalila.
       */
      const [sila, zrecznosc, intelekt, wytrzymalosc, szczescie] = loadDefaultStats(
        intval(wiersz['class'] ?? 1),
        intval(wiersz['race'] ?? 1),
      );
      await sql`
        UPDATE user_data SET
          lvl = 1, exp = 0,
          attr_str = ${sila ?? 0}, attr_agi = ${zrecznosc ?? 0}, attr_int = ${intelekt ?? 0},
          attr_wit = ${wytrzymalosc ?? 0}, attr_luck = ${szczescie ?? 0}
        WHERE user_id = ${wiersz.user_id}
      `;
      break;
    }

    default:
      return c.json({ blad: 'Nie ma takiej sztuczki.' }, 400);
  }

  const [swiezy] = await sql<Record<string, unknown>[]>`
    SELECT * FROM user_data WHERE user_id = ${wiersz.user_id} LIMIT 1
  `;
  return c.json({ gracz: await wczytajGracza(sql, swiezy ?? wiersz) });
});
