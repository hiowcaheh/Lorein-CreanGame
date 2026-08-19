/**
 * Akcja `004` — ekran postaci.
 *
 * Port z `req.php` (`case $ACT_HERO`). Cala robota siedzi w `loadDefaultData`;
 * ta akcja dokłada tylko odswiezenie czasu aktywnosci i opis postaci.
 */

import { PhpResponse } from '../protocol/response.js';
import { ACT } from '../protocol/constants.js';
import { time } from '../compat/php.js';
import { fetchPlayerBySsid, loadDefaultData } from '../game/playerState.js';
import type { GameRequest } from '../protocol/request.js';
import type { Sql } from '../db/client.js';

/**
 * Odpowiednik `fixSpecialChars(urldecode(...))` — ukosnik i srednik
 * rozbilyby format odpowiedzi, bo sa separatorami protokolu.
 */
function fixSpecialChars(text: string): string {
  return text.replaceAll('/', ' ').replaceAll(';', ' ');
}

export async function hero(sql: Sql, req: GameRequest, ip: string): Promise<PhpResponse> {
  const player = await fetchPlayerBySsid(sql, req.ssid);

  if (!player) {
    // Sesja wygasla — klient odesle gracza na ekran logowania.
    return PhpResponse.of('0');
  }

  const res = PhpResponse.filled();
  await loadDefaultData(sql, res, player, req.ssid);

  res.prefix(0, ACT.HERO);

  await sql`
    UPDATE user_data SET last_ip = ${ip}, last_activ = ${String(time())}
    WHERE ssid = ${req.ssid}
  `;

  let description = '';
  try {
    description = decodeURIComponent(String(player['user_desc'] ?? '').replaceAll('+', ' '));
  } catch {
    // Zle zakodowany opis nie moze wywracac calego ekranu postaci.
    description = String(player['user_desc'] ?? '');
  }

  res.set(511, `${res.get(511) ?? ''};${fixSpecialChars(description)};`);

  return res;
}
