/**
 * Akcje konta: rejestracja (`001`), logowanie (`002`) i doladowanie danych
 * gildii po zalogowaniu (`503`).
 *
 * Port z `req.php`. Bez tych trzech akcji nie da sie w ogole wejsc do gry,
 * dlatego sa przenoszone jako pierwsze po rankingu.
 *
 * O haslach: klient wysyla haslo **jawnie przy rejestracji**, a przy
 * logowaniu juz zahaszowane MD5 (`MainTimeline.as`, `RequestLogin`). Serwer
 * godzi to, hashujac przy rejestracji — dlatego oba konce sie spotykaja.
 * To slaby schemat i docelowo idzie do wymiany, ale zmiana wymaga ruszenia
 * klienta, wiec na razie odtwarzamy zachowanie oryginalu.
 */

import { createHash, randomUUID } from 'node:crypto';
import { PhpResponse } from '../protocol/response.js';
import { ACT, ERR, SF } from '../protocol/constants.js';
import { intval, time, urlencode } from '../compat/php.js';
import { loadDefaultStats } from '../game/stats.js';
import { fetchPlayerBySsid, loadDefaultData } from '../game/playerState.js';
import { getRng } from '../compat/rng.js';
import type { GameRequest } from '../protocol/request.js';
import type { Sql } from '../db/client.js';

function md5(value: string): string {
  return createHash('md5').update(value, 'utf8').digest('hex');
}

/** Maksymalna liczba kont zakladanych z jednego adresu IP. */
const MAX_ACCOUNTS_PER_IP = 3;

// ---------------------------------------------------------------- 001 --

export async function register(sql: Sql, req: GameRequest, ip: string): Promise<PhpResponse> {
  const parts = req.extra.split(';');

  const nick = parts[0] ?? '';
  const password = parts[1] ?? '';
  const rawEmail = parts[2] ?? '';
  const email = urlencode(rawEmail.toLowerCase());

  if (nick.length < 3 || nick.length > 20) {
    return PhpResponse.of(ERR.NAME_TOO_SHORT);
  }
  if (/[^-a-z0-9_ ]/i.test(nick)) {
    return PhpResponse.of(ERR.NAME_EXISTS);
  }
  if (password.length < 4) {
    return PhpResponse.of(ERR.PASSWORD_TOO_SHORT);
  }
  if (/[^-a-z0-9_]/i.test(password)) {
    return PhpResponse.of(ERR.NAME_EXISTS);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail)) {
    return PhpResponse.of(ERR.EMAIL_WRONG);
  }

  const duplicates = await sql<{ user_name: string; email: string }[]>`
    SELECT user_name, email FROM user_data
    WHERE user_name = ${nick} OR email = ${email}
  `;

  if (duplicates.length > 0) {
    const duplicate = duplicates[0]!;
    return PhpResponse.of(duplicate.email === email ? ERR.EMAIL_EXISTS : ERR.NAME_EXISTS);
  }

  const looks = (parts[8] ?? '').split('/');
  const charClass = intval(parts[7] ?? 1);
  const race = intval(parts[5] ?? 1);
  const gender = intval(parts[6] ?? 1);

  const stats = loadDefaultStats(charClass, race);

  const sameIp = await sql<{ user_id: number }[]>`
    SELECT user_id FROM user_data WHERE last_ip = ${ip}
  `;
  if (sameIp.length >= MAX_ACCOUNTS_PER_IP) {
    return PhpResponse.of(ERR.ACCOUNTS_PER_IP);
  }

  const settings = await sql<{ setting: string; value: string }[]>`
    SELECT setting, value FROM game_settings
    WHERE setting IN ('QUEST_EXP', 'QUEST_GOLD')
    ORDER BY id ASC
  `;

  const expSetting = intval(settings.find((s) => s.setting === 'QUEST_EXP')?.value ?? 1);
  const goldSetting = intval(settings.find((s) => s.setting === 'QUEST_GOLD')?.value ?? 1);

  const currentEvent = await activeEvent(sql);
  let tpBonus = 1;
  let goldBonus = 1;
  if (currentEvent === 1) tpBonus = 1.5;
  if (currentEvent === 3) goldBonus = 2;
  if (currentEvent === 5) {
    tpBonus = 1.5;
    goldBonus = 2;
  }

  // Kolejnosc losowan musi byc taka sama jak w PHP — inaczej te same ziarno
  // dalo by inne wartosci i testy roznicowe przestalyby cokolwiek znaczyc.
  const rng = getRng();

  const baseXp = [rng.rand(200, 300), rng.rand(200, 300), rng.rand(200, 300)];
  const baseGold = [rng.rand(30, 70), rng.rand(30, 70), rng.rand(30, 70)];
  const m = [rng.rand(900, 1100) / 1000, rng.rand(900, 1100) / 1000, rng.rand(900, 1100) / 1000];
  const l = [rng.rand(1, 2), rng.rand(1, 2), rng.rand(1, 2)];

  const xp = [0, 1, 2].map((i) => 0.5 * expSetting * m[i]! * l[i]! * tpBonus + baseXp[i]!);
  const gold = [0, 1, 2].map((i) => 0.5 * goldSetting * m[i]! * l[i]! * goldBonus + baseGold[i]!);

  const locations = [rng.rand(1, 21), rng.rand(1, 21), rng.rand(1, 21)];

  const faces = Array.from({ length: 10 }, (_, i) => intval(looks[i] ?? 1));

  const inserted = await sql<{ user_id: number }[]>`
    INSERT INTO user_data (
      user_name, password, email, last_ip, last_activ, ssid,
      face1, face2, face3, face4, face5, face6, face7, face8, face9, face10,
      reg_date, class, race, gender,
      attr_str, attr_agi, attr_int, attr_wit, attr_luck,
      quest_gold_1, quest_gold_2, quest_gold_3,
      quest_exp_1, quest_exp_2, quest_exp_3,
      quest_location_1, quest_location_2, quest_location_3,
      quest_dur_1, quest_dur_2, quest_dur_3,
      g_silverspent, g_mushroomspent, user_desc, album_data, voucher_date,
      potion_id1, potion_id2, potion_id3,
      potion_value1, potion_value2, potion_value3,
      potion_time1, potion_time2, potion_time3
    ) VALUES (
      ${nick}, ${md5(password)}, ${email}, ${ip}, ${String(time())}, '',
      ${faces[0]!}, ${faces[1]!}, ${faces[2]!}, ${faces[3]!}, ${faces[4]!},
      ${faces[5]!}, ${faces[6]!}, ${faces[7]!}, ${faces[8]!}, ${faces[9]!},
      ${time()}, ${charClass}, ${race}, ${gender},
      ${stats[0]!}, ${stats[1]!}, ${stats[2]!}, ${stats[3]!}, ${stats[4]!},
      ${Math.trunc(gold[0]!)}, ${Math.trunc(gold[1]!)}, ${Math.trunc(gold[2]!)},
      ${Math.trunc(xp[0]!)}, ${Math.trunc(xp[1]!)}, ${Math.trunc(xp[2]!)},
      ${locations[0]!}, ${locations[1]!}, ${locations[2]!},
      ${l[0]!}, ${l[1]!}, ${l[2]!},
      0, 0, '', '', 0,
      0, 0, 0,
      0, 0, 0,
      0, 0, 0
    )
    RETURNING user_id
  `;

  const newUserId = inserted[0]?.user_id ?? 0;

  // Bron startowa zalezna od klasy.
  const starter =
    charClass === 1
      ? { itemId: 1, dmgMin: 4, dmgMax: 8 }
      : charClass === 2
        ? { itemId: 1001, dmgMin: 6, dmgMax: 12 }
        : { itemId: 2001, dmgMin: 5, dmgMax: 10 };

  await sql`
    INSERT INTO items (
      item_type, item_id, dmg_min, dmg_max,
      atr_type_1, atr_type_2, atr_type_3,
      atr_val_1, atr_val_2, atr_val_3,
      gold, mush, slot, owner_id
    ) VALUES (
      1, ${starter.itemId}, ${starter.dmgMin}, ${starter.dmgMax},
      0, 0, 0,
      0, 0, 0,
      1, 0, 8, ${newUserId}
    )
  `;

  // DO PRZENIESIENIA: oryginal losuje tu jeszcze nagrody czekajace
  // w karczmie (`genItem`). Wymaga to portu generatora przedmiotow,
  // ktory przyjdzie razem ze sklepami.

  return PhpResponse.of(ACT.REGISTER + String(newUserId));
}

// ---------------------------------------------------------------- 002 --

export async function login(sql: Sql, req: GameRequest, ip: string): Promise<PhpResponse> {
  const parts = req.extra.split(';');
  const nick = parts[0] ?? '';
  const password = parts[1] ?? '';

  const found = await sql<Record<string, unknown>[]>`
    SELECT user_id, password, enabled FROM user_data WHERE user_name = ${nick} LIMIT 1
  `;

  if (found.length === 0) {
    return PhpResponse.of(ERR.LOGIN_FAILED);
  }

  const account = found[0]!;

  // Klient przysyla juz zahaszowane haslo, wiec porownanie jest doslowne.
  if (password !== String(account['password'] ?? '')) {
    return PhpResponse.of(ERR.LOGIN_FAILED);
  }

  if (String(account['enabled'] ?? 'yes') === 'no') {
    return PhpResponse.of(ERR.LOCKED_ADMIN);
  }

  // Nowy token sesji przy kazdym logowaniu.
  const ssid = md5(randomUUID());

  await sql`
    UPDATE user_data SET ssid = ${ssid}, last_ip = ${ip}, last_activ = ${String(time())}
    WHERE user_id = ${intval(account['user_id'])}
  `;

  const player = await fetchPlayerBySsid(sql, ssid);
  if (!player) {
    return PhpResponse.of(ERR.LOGIN_FAILED);
  }

  const res = PhpResponse.filled();
  await loadDefaultData(sql, res, player, ssid);

  res.prefix(0, ACT.LOGIN);

  const eventSpecial = await configValue(sql, 'EVENT_OCTOBERFEST', '0');
  const dealer = await configValue(sql, 'EVENT_DEALER', '');

  const dealerAktions = [
    'dealer_aktion1_en', 'dealer_aktion2_en', 'dealer_aktion3_en',
    'dealer_aktion4_en', 'dealer_aktion5_en', 'dealer_aktion6_en',
    'dealer_aktion7', 'dealer_aktion8_en', 'dealer_aktion9_en',
  ];
  const dealerEvent = dealerAktions.includes(dealer) ? 1 : 0;

  res.set(511, `;${dealerEvent};${ssid};0;529;${eventSpecial}`);
  res.set(SF.GUILD_INDEX, player['guild_id'] ?? 0);

  await sql`UPDATE user_data SET gchat_last = 0 WHERE ssid = ${ssid}`;

  return res;
}

// ---------------------------------------------------------------- 503 --

/** Po zalogowaniu klient dopytuje o nazwe gildii gracza. */
export async function loginFollowUp(sql: Sql, req: GameRequest): Promise<PhpResponse> {
  const rows = await sql<{ name: string; guild_id: number }[]>`
    SELECT guilds.name, guilds.guild_id FROM guilds
    WHERE guilds.guild_id = (SELECT user_data.guild_id FROM user_data WHERE user_data.ssid = ${req.ssid})
    LIMIT 1
  `;

  const guild = rows[0];
  return PhpResponse.of(guild ? `+101${guild.name};${guild.guild_id}` : '+101;0');
}

// ------------------------------------------------------------ pomocnicze --

async function configValue(sql: Sql, name: string, fallback: string): Promise<string> {
  const rows = await sql<{ value: string }[]>`
    SELECT value FROM server_config WHERE name = ${name} LIMIT 1
  `;
  return rows[0]?.value ?? fallback;
}

/** Odpowiednik `event()` — numer trwajacego wydarzenia. */
async function activeEvent(sql: Sql): Promise<number> {
  return intval(await configValue(sql, 'EVENT', '0'));
}
