/**
 * Budowanie pelnego stanu gracza — port `loadDefaultData()` z `req.php`.
 *
 * To jest serce protokolu: funkcja wypelnia wiekszosc ze 134 znanych pol
 * odpowiedzi i decyduje o tym, co gracz widzi na ekranie postaci. Kolejnosc
 * i indeksy pol sa czescia kontraktu z klientem Flash, wiec port trzyma sie
 * struktury oryginalu — latwiej wtedy porownac obie wersje linia po linii.
 *
 * Funkcja ma skutki uboczne: regeneruje HP portalu, zeruje ujemne saldo
 * i wygasa mikstury. Tak samo jak oryginal.
 */

import { PhpResponse } from '../protocol/response.js';
import { SF } from '../protocol/constants.js';
import { LEVELS, portalMonsterHp } from '../protocol/gamedata.js';
import { intval, round, time } from '../compat/php.js';
import { loadDefaultStats, mountMultiplier } from './stats.js';
import type { Sql } from '../db/client.js';

/** Wiersz gracza wraz z danymi doliczanymi podzapytaniami. */
export interface PlayerRow {
  [key: string]: unknown;
}

/**
 * Pobiera gracza po tokenie sesji wraz ze wszystkim, co `loadDefaultData`
 * dolicza podzapytaniami: dane gildii, liczniki wiadomosci, czasy wojen
 * gildyjnych, pozycje w rankingu i liczbe dzisiejszych walk.
 */
export async function fetchPlayerBySsid(sql: Sql, ssid: string): Promise<PlayerRow | undefined> {
  const rows = await sql<PlayerRow[]>`
    SELECT user_data.*,
           guilds.treasure,
           guilds.instructor,
           guilds.dung,
           guilds.portal_act     AS g_act,
           guilds.portal_monster AS g_monster,
           (SELECT COUNT(*) FROM messages
             WHERE messages.read = 0 AND messages.reciver_id = user_data.user_id) AS c,
           (SELECT COUNT(*) FROM messages
             WHERE messages.reciver_id = user_data.user_id) AS mcount,
           (SELECT attack_time FROM guild_attacks
             WHERE guild_id = user_data.guild_id LIMIT 1) AS atcktime,
           (SELECT attack_time FROM guild_attacks
             WHERE target_id = user_data.guild_id LIMIT 1) AS deftime,
           (SELECT pos FROM (
              SELECT ssid,
                     ROW_NUMBER() OVER (ORDER BY honor DESC, lvl DESC, user_id DESC) AS pos
              FROM user_data
            ) ranked WHERE ranked.ssid = ${ssid} LIMIT 1) AS rank,
           (SELECT COUNT(*) FROM user_fights
             WHERE user_fights.fight_time::date = CURRENT_DATE
               AND user_fights.user_id = user_data.user_id) AS fcount
    FROM user_data
    LEFT JOIN guilds ON user_data.guild_id = guilds.guild_id
    WHERE user_data.ssid = ${ssid}
    LIMIT 1
  `;

  return rows[0];
}

/**
 * Wypelnia odpowiedz danymi gracza.
 *
 * `res` jest modyfikowany w miejscu — tak jak `$ret` w PHP, ktore jest
 * zmienna globalna wspoldzielona przez wszystkie akcje.
 */
export async function loadDefaultData(
  sql: Sql,
  res: PhpResponse,
  player: PlayerRow,
  ssid: string,
): Promise<PlayerRow> {
  const db = player;
  const now = time();

  // Poczatek dzisiejszego dnia — odpowiednik `strtotime('today')`.
  const midnight = new Date(now * 1000);
  midnight.setHours(0, 0, 0, 0);
  const todayStart = Math.floor(midnight.getTime() / 1000);

  // --- regeneracja portalu ------------------------------------------------
  let hp = intval(db['portal_hp'] ?? 0);
  const portalAct = intval(db['portal_act'] ?? 1);
  const portalMonster = intval(db['portal_monster'] ?? 1);
  const fullHp = portalMonsterHp(portalAct, portalMonster);

  const portalRegenTime = intval(db['portal_regen_time'] ?? 0);

  if (todayStart > portalRegenTime && hp !== fullHp) {
    const days = (todayStart - portalRegenTime) / 86400;
    hp = intval(hp + ((days * 10) / 100) * fullHp);
    if (hp > fullHp) {
      hp = fullHp;
    }
    db['portal_regen_time'] = todayStart;
    db['portal_hp'] = hp;

    await sql`UPDATE user_data SET portal_regen_time = ${todayStart}, portal_hp = ${hp} WHERE ssid = ${ssid}`;
  }

  // --- zerowanie ujemnych sald -------------------------------------------
  if (intval(db['silver'] ?? 0) < 0) {
    db['silver'] = 0;
    await sql`UPDATE user_data SET silver = 0 WHERE ssid = ${ssid}`;
  }

  if (intval(db['mushroom'] ?? 0) < 0) {
    db['mushroom'] = 0;
    await sql`UPDATE user_data SET mushroom = 0 WHERE ssid = ${ssid}`;
  }

  // --- medale sledzace rekordy gracza ------------------------------------
  const silver = intval(db['silver'] ?? 0);
  if (intval(db['medal_commerce'] ?? 0) < silver) {
    db['medal_commerce'] = silver;
    await sql`UPDATE user_data SET medal_commerce = ${silver} WHERE ssid = ${ssid}`;
  }

  if (intval(db['medal_commerce'] ?? 0) > 1_000_000_000) {
    db['medal_commerce'] = 1_000_000_000;
    await sql`UPDATE user_data SET medal_commerce = 1000000000 WHERE ssid = ${ssid}`;
  }

  const honor = intval(db['honor'] ?? 0);
  if (intval(db['medal_bravery'] ?? 0) < honor) {
    db['medal_bravery'] = honor;
    await sql`UPDATE user_data SET medal_bravery = ${honor} WHERE ssid = ${ssid}`;
  }

  // --- wygasanie mikstur --------------------------------------------------
  for (let p = 1; p <= 3; p++) {
    const key = `potion_time${p}`;
    const potionTime = intval(db[key] ?? 0);

    if (now > potionTime && potionTime !== 0) {
      if (p === 1) {
        await sql`UPDATE user_data SET potion_id1 = 0, potion_value1 = 0, potion_time1 = 0 WHERE ssid = ${ssid}`;
      } else if (p === 2) {
        await sql`UPDATE user_data SET potion_id2 = 0, potion_value2 = 0, potion_time2 = 0 WHERE ssid = ${ssid}`;
      } else {
        await sql`UPDATE user_data SET potion_id3 = 0, potion_value3 = 0, potion_time3 = 0 WHERE ssid = ${ssid}`;
      }
      db[`potion_id${p}`] = 0;
      db[`potion_value${p}`] = 0;
      db[`potion_time${p}`] = 0;
    }
  }

  res.set(509, 34123);

  // --- wyglad postaci -----------------------------------------------------
  for (let i = SF.FACE_1; i <= SF.FACE_10; i++) {
    res.set(i, db[`face${i - 16}`] ?? 0);
  }

  res.set(SF.RACE, db['race'] ?? 1);

  // Plec, magiczne lustro i „czy gracz ma lustro" sa upakowane w jedna
  // liczbe: budowany jest ciag bitow, a potem zamieniany na dziesietny.
  const magicMirror = String(db['magic_mirror'] ?? '0000000000000');
  let genderBits = '';
  let haveMirror: string;

  if (magicMirror === '1111111111111') {
    haveMirror = '1';
  } else if (magicMirror === '0000000000000') {
    haveMirror = '0';
  } else {
    genderBits = '1' + magicMirror;
    haveMirror = '0';
  }

  genderBits += '000000000' + haveMirror + '0000000';
  genderBits += intval(db['gender'] ?? 1) === 1 ? '1' : '0';

  while (genderBits.startsWith('0') && genderBits.length > 1) {
    genderBits = genderBits.slice(1);
  }

  res.set(SF.GENDER, parseInt(genderBits, 2));
  res.set(SF.CLASS, intval(db['class'] ?? 1) + intval(db['portal_time'] ?? 0) * 65536);

  // --- HP potwora portalowego w procentach --------------------------------
  if (portalMonster !== 11) {
    const monsterFullHp = portalMonsterHp(portalAct, portalMonster);
    const currentHp = intval(db['portal_hp'] ?? 0);

    let percents = monsterFullHp > 0 ? round((currentHp / monsterFullHp) * 100) : 1;
    if (percents < 1) {
      percents = 1;
    }
    res.set(SF.CLASS_RANK, percents * 65536);
  } else {
    hp = 0;
  }

  res.set(0, '23132312');
  res.set(SF.PLAYER_ID, db['user_id'] ?? 0);
  res.set(SF.REGISTRATION_DATE, db['reg_date'] ?? 0);
  res.set(SF.REGISTRATION_IP, '123837423');

  // HP portalu nie miesci sie w jednym polu, wiec jest rozbite na dwa.
  let lifeLo = 0;
  let lifeHi = hp;
  if (hp > 65535) {
    lifeHi = 65535;
    lifeLo = hp - 65535;
  }

  res.set(SF.STATUS, intval(db['status'] ?? 0) + lifeLo * 65536);
  res.set(SF.ACTION_INDEX, intval(db['status_extra'] ?? 0) + lifeHi * 65536);
  res.set(SF.ACT_ENDTIME, db['status_end'] ?? 0);

  const level = intval(db['lvl'] ?? 1);
  res.set(SF.LEVEL, intval(db['fcount'] ?? 0) * 65536 + level);
  res.set(SF.EXP, db['exp'] ?? 0);
  res.set(SF.EXP_REQ, LEVELS[level] ?? 0);
  res.set(SF.SILVER, db['silver'] ?? 0);
  res.set(SF.MUSH, db['mushroom'] ?? 0);
  res.set(SF.THIRST, db['thirst'] ?? 0);

  res.set(SF.ATTR_STR, intval(db['attr_str'] ?? 10));
  res.set(SF.ATTR_AGI, intval(db['attr_agi'] ?? 10));
  res.set(SF.ATTR_INT, intval(db['attr_int'] ?? 10));
  res.set(SF.ATTR_WIT, intval(db['attr_wit'] ?? 10));
  res.set(SF.ATTR_LUCK, intval(db['attr_luck'] ?? 10));

  for (let i = 1; i <= 12; i++) {
    const field = (SF as Record<string, number>)[`DUNGEON_${i}`];
    if (field !== undefined) {
      res.set(field, db[`dungeon_${i}`] ?? 0);
    }
  }

  res.set(490, 120 + intval(db['dungeon_13'] ?? 0));
  res.set(SF.QUEST_DESC_1, 3);
  res.set(SF.QUEST_DESC_2, 1);
  res.set(SF.QUEST_DESC_3, 5);
  res.set(SF.UNREAD_MSGS, db['c'] ?? 0);
  res.set(SF.MSG_COUNT, db['mcount'] ?? 0);

  if (db['atcktime'] !== null && db['atcktime'] !== undefined && db['atcktime'] !== '') {
    res.set(365, db['atcktime']);
  }
  if (db['deftime'] !== null && db['deftime'] !== undefined && db['deftime'] !== '') {
    res.set(367, db['deftime']);
  }

  res.set(SF.HONOR, db['honor'] ?? 0);
  res.set(SF.RANK, db['rank'] ?? 1);

  res.set(SF.ACHIEVEMENT_LVL, db['lvl'] ?? 1);
  res.set(SF.ACHIEVEMENT_ARENA, db['medal_gladiator'] ?? 0);
  res.set(SF.ACHIEVEMENT_QUEST, db['medal_adventurer'] ?? 0);
  res.set(SF.ACHIEVEMENT_WORK, db['medal_employment'] ?? 0);
  res.set(SF.ACHIEVEMENT_GOLD, db['medal_commerce'] ?? 0);
  res.set(SF.ACHIEVEMENT_HONOR, db['medal_bravery'] ?? 0);
  res.set(SF.ACHIEVEMENT_FRIEND, db['medal_friendship'] ?? 0);

  let dungeonSum = 0;
  for (let i = 1; i <= 10; i++) {
    const a = intval(db[`dungeon_${i}`] ?? 0);
    if (a > 2) {
      dungeonSum += a - 2;
    }
  }
  res.set(SF.ACHIEVEMENT_DUNG, dungeonSum);

  // --- ekwipunek ----------------------------------------------------------
  const userId = intval(db['user_id'] ?? 0);
  const items = await sql<Record<string, unknown>[]>`
    SELECT * FROM items WHERE owner_id = ${userId}
  `;

  res.set(SF.DMG_MIN, 1);
  res.set(SF.DMG_MAX, 2);

  for (const item of items) {
    const rawSlot = intval(item['slot'] ?? 0);
    // Sloty zalozonych przedmiotow i plecaka trafiaja w rozne obszary pol.
    const slot = rawSlot < 10 ? 48 + rawSlot * 12 : 168 + (rawSlot - 10) * 12;

    res.set(slot, intval(item['enchant'] ?? 0) + intval(item['item_type'] ?? 0));
    res.set(slot + 1, intval(item['enchant_power'] ?? 0) + intval(item['item_id'] ?? 0));
    res.set(slot + 2, item['dmg_min'] ?? 0);
    res.set(slot + 3, item['dmg_max'] ?? 0);
    res.set(slot + 4, item['atr_type_1'] ?? 0);
    res.set(slot + 5, item['atr_type_2'] ?? 0);
    res.set(slot + 6, item['atr_type_3'] ?? 0);
    res.set(slot + 7, item['atr_val_1'] ?? 0);
    res.set(slot + 8, item['atr_val_2'] ?? 0);
    res.set(slot + 9, item['atr_val_3'] ?? 0);
    res.set(slot + 10, item['gold'] ?? 0);
    res.set(slot + 11, intval(item['mush'] ?? 0) + intval(item['upgrade_level'] ?? 0) * 16777216);

    // Tylko zalozone przedmioty (nie plecak) doliczaja statystyki.
    if (slot < 168) {
      const type1 = intval(item['atr_type_1'] ?? 0);

      if (type1 === 6) {
        // Typ 6 to bonus do wszystkich piatki statystyk naraz.
        for (let i = 0; i < 5; i++) {
          res.add(35 + i, intval(item['atr_val_1'] ?? 0));
        }
      } else {
        res.add(34 + type1, intval(item['atr_val_1'] ?? 0));
        res.add(34 + intval(item['atr_type_2'] ?? 0), intval(item['atr_val_2'] ?? 0));
        res.add(34 + intval(item['atr_type_3'] ?? 0), intval(item['atr_val_3'] ?? 0));
      }

      // UWAGA: oryginal ma tu `$item['slot'] = 150` — przypisanie zamiast
      // porownania. Wyrazenie jest zawsze prawdziwe, wiec warunek sprowadza
      // sie do samego typu przedmiotu. Odtwarzamy zachowanie, nie intencje.
      if (intval(item['item_type'] ?? 0) === 1) {
        res.set(SF.DMG_MIN, item['dmg_min'] ?? 0);
        res.set(SF.DMG_MAX, item['dmg_max'] ?? 0);
      }
    }
  }

  res.set(SF.SERVERTIME, now);

  // --- stan wojny gildii --------------------------------------------------
  const gAttack = String(db['guild_attack'] ?? '0');
  const gDefend = String(db['guild_defend'] ?? '0');

  let warStatus = 0;
  if (gAttack === '1' && gDefend === '0') warStatus = 1;
  else if (gAttack === '0' && gDefend === '1') warStatus = 2;
  else if (gAttack === '1' && gDefend === '1') warStatus = 3;

  res.set(SF.GUILD_WAR_STATUS, warStatus);

  // --- wierzchowiec i wieza ----------------------------------------------
  let mountField = (intval(db['tower_level'] ?? 1) - 1) * 65536;
  const mountDur = intval(db['mount_dur'] ?? 0);
  if (now < mountDur) {
    mountField += intval(db['mount'] ?? 0);
  }
  res.set(SF.MOUNT, mountField);

  if (now < mountDur) {
    res.set(SF.MOUNT_DURATION, db['mount_dur']);
  }

  res.set(463, db['email_validated'] ?? 0);

  // --- punkty wydane na statystyki ---------------------------------------
  const base = loadDefaultStats(intval(db['class'] ?? 1), intval(db['race'] ?? 1));
  res.set(40, intval(db['attr_str'] ?? 10) - (base[0] ?? 10));
  res.set(41, intval(db['attr_agi'] ?? 10) - (base[1] ?? 10));
  res.set(42, intval(db['attr_int'] ?? 10) - (base[2] ?? 10));
  res.set(43, intval(db['attr_wit'] ?? 10) - (base[3] ?? 10));
  res.set(44, intval(db['attr_luck'] ?? 10) - (base[4] ?? 10));

  // --- nagrody za questy --------------------------------------------------
  const mount = mountMultiplier(intval(db['mount'] ?? 0));
  const instructor = intval(db['instructor'] ?? 0);
  const dung = intval(db['dung'] ?? 0);
  const treasure = intval(db['treasure'] ?? 0);

  const ebonus = 1 + (instructor + dung) / 50;
  const gbonus = 1 + (treasure + dung) / 50;
  const towerbonus = (intval(db['tower_level'] ?? 1) - 1) / 100;

  const album = intval(db['album'] ?? 0);
  // W oryginale `$albumbonus` nie jest inicjalizowany — przy albumie -1
  // zostaje niezdefiniowany i zachowuje sie jak zero.
  const albumbonus = album !== -1 ? round(album / 1700, 2) : 0;

  const rq1 = intval(db['quest_red_1'] ?? 0) * 0.01;
  const rq2 = intval(db['quest_red_2'] ?? 0) * 0.01;
  const rq3 = intval(db['quest_red_3'] ?? 0) * 0.01;

  res.set(SF.QUEST_RED_1, db['quest_red_1'] ?? 0);
  res.set(SF.QUEST_RED_2, db['quest_red_2'] ?? 0);
  res.set(SF.QUEST_RED_3, db['quest_red_3'] ?? 0);

  res.set(SF.QUEST_DURATION_1, intval(db['quest_dur_1'] ?? 1) * 300 * mount);
  res.set(SF.QUEST_EXP_1, round(intval(db['quest_exp_1'] ?? 0) * (ebonus + albumbonus + rq1)));
  res.set(SF.QUEST_DURATION_2, intval(db['quest_dur_2'] ?? 1) * 300 * mount);
  res.set(SF.QUEST_EXP_2, round(intval(db['quest_exp_2'] ?? 0) * (ebonus + albumbonus + rq2)));
  res.set(SF.QUEST_DURATION_3, intval(db['quest_dur_3'] ?? 1) * 300 * mount);
  res.set(SF.QUEST_EXP_3, round(intval(db['quest_exp_3'] ?? 0) * (ebonus + albumbonus + rq3)));

  const golds = [1, 2, 3].map((i) => {
    let gold = intval(db[`quest_gold_${i}`] ?? 0) * (gbonus + towerbonus);
    if (gold > 10000) {
      gold = round(gold, -2);
    }
    if (gold > 1_000_000_000) {
      gold = 1_000_000_000;
    }
    return gold;
  });

  res.set(SF.QUEST_GOLD_1, golds[0]);
  res.set(SF.QUEST_GOLD_2, golds[1]);
  res.set(SF.QUEST_GOLD_3, golds[2]);

  res.set(SF.MUSH_MAY_DONATE, db['mush_donate'] ?? 0);

  // --- bonusy portalowe ---------------------------------------------------
  const portalLifeBonus = (portalMonster + (portalAct - 1) * 10 - 1) * 256;
  const portalDamageBonus =
    intval(db['g_monster'] ?? 1) + (intval(db['g_act'] ?? 1) - 1) * 10 - 1 + portalLifeBonus;

  res.set(445, (intval(db['guild_id'] ?? 0) !== 0 ? portalDamageBonus : portalLifeBonus) * 65536);

  res.set(506, 0);
  res.set(507, 0);
  res.set(479, 1);
  res.set(461, (instructor + dung) * 2);
  res.set(462, (treasure + dung) * 2);

  res.set(435, db['guild_id'] ?? 0);
  res.set(436, db['guild_rank'] ?? 0);
  res.set(438, album === -1 ? 0 : 10000 + album);
  res.set(443, 123737);
  res.set(459, db['dungeon_time'] ?? 0);
  res.set(460, db['arena_time'] ?? 0);
  res.set(457, db['beers'] ?? 0);
  res.set(447, await getRealArmor(sql, userId));

  // --- nagrody czekajace w karczmie --------------------------------------
  for (let q = 1; q <= 3; q++) {
    const tavernItems = await sql<Record<string, unknown>[]>`
      SELECT * FROM items_tavern WHERE owner_id = ${userId} AND quest = ${q}
    `;

    const index = 244 + (q * 12 - 12);

    for (const item of tavernItems) {
      res.set(index, item['item_type'] ?? 0);
      res.set(index + 1, item['item_id'] ?? 0);
      res.set(index + 2, item['dmg_min'] ?? 0);
      res.set(index + 3, item['dmg_max'] ?? 0);
      res.set(index + 4, item['atr_type_1'] ?? 0);
      res.set(index + 5, item['atr_type_2'] ?? 0);
      res.set(index + 6, item['atr_type_3'] ?? 0);
      res.set(index + 7, item['atr_val_1'] ?? 0);
      res.set(index + 8, item['atr_val_2'] ?? 0);
      res.set(index + 9, item['atr_val_3'] ?? 0);
      res.set(index + 10, item['gold'] ?? 0);
      res.set(index + 11, item['mush'] ?? 0);
    }
  }

  res.set(491, intval(db['toilet'] ?? 0) === 1 ? 9 : 0);
  res.set(238, db['quest_location_1'] ?? 1);
  res.set(239, db['quest_location_2'] ?? 1);
  res.set(240, db['quest_location_3'] ?? 1);
  res.set(499, db['potion_value1'] ?? 0);
  res.set(500, db['potion_value2'] ?? 0);
  res.set(501, db['potion_value3'] ?? 0);
  res.set(493, db['potion_id1'] ?? 0);
  res.set(494, db['potion_id2'] ?? 0);
  res.set(495, db['potion_id3'] ?? 0);
  res.set(496, db['potion_time1'] ?? 0);
  res.set(497, db['potion_time2'] ?? 0);
  res.set(498, db['potion_time3'] ?? 0);
  res.set(444, db['golden_frame'] ?? 0);

  // --- bonusy z mikstur ---------------------------------------------------
  // Mikstury 1-5 daja +10%, 6-10 +15%, 11-15 +25% do jednej statystyki.
  for (let i = 1; i < 4; i++) {
    const potionId = intval(db[`potion_id${i}`] ?? 0);
    if (potionId < 1 || potionId > 15) {
      continue;
    }

    const statIndex = (potionId - 1) % 5; // 0..4 → sila, zrecznosc, ...
    const factor = potionId <= 5 ? 0.1 : potionId <= 10 ? 0.15 : 0.25;

    const bonusField = 35 + statIndex;
    const baseField = 30 + statIndex;

    const bonus = res.number(bonusField);
    const baseValue = res.number(baseField);
    res.set(bonusField, bonus + (bonus + baseValue) * factor);
  }

  return db;
}

/** Suma pancerza z zalozonych czesci zbroi — port `getRealArmor()`. */
async function getRealArmor(sql: Sql, userId: number): Promise<number> {
  const rows = await sql<{ armor: string | null }[]>`
    SELECT SUM(dmg_min) AS armor FROM items
    WHERE owner_id = ${userId} AND slot IN (0, 1, 2, 3, 5)
  `;

  return Math.max(0, intval(rows[0]?.armor ?? 0));
}
