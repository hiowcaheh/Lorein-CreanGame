/**
 * Akcja `007` — Sala Chwaly (ranking graczy).
 *
 * Port z `req.php` (`case $ACT_RANKING`). Wybrana na pierwszy ogien celowo:
 * czysty odczyt, zero losowosci i zero zapisow, a mimo to zawiera wszystkie
 * dziwactwa protokolu — kodowanie klasy postaci znakiem minusa, doklejanie
 * przedrostka do pola zerowego i domykanie odpowiedzi srednikiem.
 *
 * Zachowanie musi byc identyczne co do znaku, lacznie z przypadkami
 * brzegowymi opisanymi nizej.
 */

import { PhpResponse } from '../protocol/response.js';
import { ctypeDigit, intval, round, time, urlencode } from '../compat/php.js';
import type { GameRequest } from '../protocol/request.js';
import type { Sql } from '../db/client.js';

/** Ile sekund bez aktywnosci oznacza, ze gracz jest juz offline. */
const ONLINE_WINDOW_SECONDS = 900;

/** Ilu graczy zwraca jedna strona rankingu. */
const PAGE_SIZE = 15;

/** O ile pozycji wstecz cofa sie okno wzgledem szukanego gracza. */
const WINDOW_OFFSET = 8;

interface RankingRow {
  user_name: string | null;
  guild: string | null;
  lvl: number | null;
  honor: number | null;
  last_activ: string | null;
  class: number | null;
}

export async function ranking(sql: Sql, req: GameRequest): Promise<PhpResponse> {
  const parts = req.extra.split(';');
  let pos: number;

  // Klient wysyla albo numer pozycji, albo nazwe gracza, ktorego chce zobaczyc.
  // PHP rozpoznaje to po DRUGIM elemencie — `ctype_digit($in[1] ?? '')`.
  if (ctypeDigit(parts[1] ?? '')) {
    pos = intval(req.extra.replaceAll(';', ''));
  } else {
    pos = await positionOfPlayer(sql, parts[0] ?? '');
  }

  if (pos < WINDOW_OFFSET) {
    pos = WINDOW_OFFSET;
  }

  const playerCount = await countPlayers(sql);

  if (pos > playerCount && playerCount > WINDOW_OFFSET) {
    pos = playerCount;
  }
  if (pos > playerCount && playerCount < WINDOW_OFFSET) {
    pos = WINDOW_OFFSET;
  }

  const offset = pos - WINDOW_OFFSET;
  const rows = await fetchPage(sql, offset);

  // PHP zaczyna od `$ret = ["007"]`, ale pierwszy wiersz nadpisuje pole 0.
  // Gdy wynik jest pusty, pole 0 zostaje i na koncu dostaje jeszcze jeden
  // przedrostek — stad "007007" dla pustego rankingu. Odtwarzamy to wiernie.
  const res = PhpResponse.of('007');

  let displayPos = pos - (WINDOW_OFFSET - 1);
  let index = 0;
  const now = time();

  for (const row of rows) {
    const lastActive = intval(row.last_activ ?? 0);
    const isOnline = round(now - lastActive) <= ONLINE_WINDOW_SECONDS ? 1 : 0;

    res.set(index, urlencode(String(displayPos)));
    res.set(index + 1, row.user_name ?? '');
    res.set(index + 2, row.guild ?? '');
    res.set(index + 3, row.lvl ?? 0);
    res.set(index + 4, row.honor ?? 0);
    res.set(index + 5, isOnline);

    // Klasa postaci jest zakodowana znakiem minusa: mag ma ujemny poziom,
    // lowca ujemna pozycje. Wojownik nie ma zadnego znacznika.
    const charClass = intval(row.class ?? 1);
    if (charClass === 2) {
      res.prefix(index + 3, '-');
    } else if (charClass === 3) {
      res.prefix(index, '-');
    }

    displayPos++;
    index += 6;
  }

  res.prefix(0, '007');
  res.push(';');

  return res;
}

/**
 * Pozycja gracza w rankingu.
 *
 * Oryginal liczy ja zmienna uzytkownika MySQL (`@r:=@r+1`), ktorej Postgres
 * nie ma. Funkcja okna `ROW_NUMBER()` daje ten sam wynik przy tym samym
 * porzadku sortowania.
 */
async function positionOfPlayer(sql: Sql, playerName: string): Promise<number> {
  const rows = await sql<{ pos: string }[]>`
    SELECT pos FROM (
      SELECT user_name,
             ROW_NUMBER() OVER (ORDER BY honor DESC, lvl DESC, user_id DESC) AS pos
      FROM user_data
    ) ranked
    WHERE user_name = ${playerName}
    LIMIT 1
  `;

  return intval(rows[0]?.pos ?? 0);
}

async function countPlayers(sql: Sql): Promise<number> {
  const rows = await sql<{ total: string }[]>`SELECT COUNT(*) AS total FROM user_data`;
  return intval(rows[0]?.total ?? 0);
}

/**
 * Strona rankingu.
 *
 * MySQL-owe `LIMIT :offset, 15` nie istnieje w Postgresie — odpowiednikiem
 * jest `LIMIT 15 OFFSET :offset`.
 */
async function fetchPage(sql: Sql, offset: number): Promise<RankingRow[]> {
  return sql<RankingRow[]>`
    SELECT user_data.user_name,
           user_data.lvl,
           user_data.honor,
           user_data.last_activ,
           user_data.class,
           (SELECT guilds.name FROM guilds WHERE guilds.guild_id = user_data.guild_id) AS guild
    FROM user_data
    ORDER BY user_data.honor DESC, user_data.lvl DESC, user_data.user_id DESC
    LIMIT ${PAGE_SIZE} OFFSET ${offset}
  `;
}
