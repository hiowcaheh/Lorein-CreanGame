/**
 * Klaser Dokladnosci — odczyt zawartosci.
 *
 * Oryginal ma na to osobne zadanie (`ACT_ALBUM`), ktore odpowiada samym
 * zapisem bitow:
 *
 *     $Album = new Album($user_data['album_data'], $user_data['album']);
 *     $ret = [$RESP_ALBUM . ($Album->data)];
 *
 * Klient rozklada ten zapis na bity i sam wie, ktory bit jest ktorym
 * przedmiotem — cala mapa lezy w `ShowAlbumContent()`. Robimy tak samo:
 * serwer nie opisuje zawartosci, tylko oddaje bity.
 */

import { Hono } from 'hono';
import { getSql } from '../db/client.js';
import { intval } from '../compat/php.js';
import {
  BEZ_KLASERA,
  POZYCJI_W_KLASERZE,
  PUSTY_KLASER,
  odczytajDaty,
  type DatyKlasera,
} from '../game/album.js';
import { tokenZNaglowka } from './konto.js';

export const klaser = new Hono();

interface WierszKlasera extends Record<string, unknown> {
  album: number | null;
  album_data: string | null;
  album_dates: string | null;
}

export interface StanKlaseraApi {
  /** Zapis base64url — dokladnie to, co oddaje `ACT_ALBUM`. */
  dane: string;
  /** Ile pozycji zebrano. `-1`, gdy gracz nie ma klasera. */
  ile: number;
  /** `contentMax` z klienta — ile pozycji miesci komplet. */
  wszystkich: number;
  /**
   * Kiedy odblokowala sie ktora pozycja: numer bitu -> czas uniksowy.
   * Pozycje sprzed wprowadzenia kolumny daty nie maja.
   */
  daty: DatyKlasera;
}

klaser.get('/klaser', async (c) => {
  const token = tokenZNaglowka(c);
  if (!token) return c.json({ blad: 'Brak sesji.' }, 401);

  const sql = getSql();
  const [wiersz] = await sql<WierszKlasera[]>`
    SELECT album, album_data, album_dates FROM user_data WHERE ssid = ${token} LIMIT 1
  `;
  if (!wiersz) return c.json({ blad: 'Brak sesji.' }, 401);

  const ile = intval(wiersz.album ?? BEZ_KLASERA);
  const odpowiedz: StanKlaseraApi = {
    dane: ile === BEZ_KLASERA ? PUSTY_KLASER : (wiersz.album_data || PUSTY_KLASER),
    ile,
    wszystkich: POZYCJI_W_KLASERZE,
    daty: ile === BEZ_KLASERA ? {} : odczytajDaty(wiersz.album_dates),
  };
  return c.json(odpowiedz);
});
