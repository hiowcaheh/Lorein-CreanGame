/**
 * Lochy — port `getDungMonster()`, galezi `$ACT_ENTER_DUNGEON`
 * i `$ACT_MAINQUEST` z `req.php`.
 *
 * Kolumna `dungeon_N` trzyma CALY stan jednego lochu w jednej liczbie:
 *
 *      0  zamkniety — nie ma klucza,
 *      1  klucz uzyty, ale gracz jeszcze nie wszedl na liste lochow,
 *   2-11  loch otwarty, gracz stoi przed poziomem `stan - 1`,
 *     12  przejsty do konca.
 *
 * Wejscie na liste podnosi kazda jedynke do dwojki (`for ($i = 1; $i < 10; $i++)`),
 * wiec stan 1 zyje tylko miedzy uzyciem klucza a otwarciem ekranu.
 */

import { LOCHOW, POTWORY, POZIOMOW_W_LOCHU, type PotworLochu } from './lochy-dane.js';
import type { Wojownik } from './walka.js';

export { LOCHOW, POZIOMOW_W_LOCHU };

/** Rodzaj przedmiotu, ktory jest kluczem — `item_type == 11`. */
export const RODZAJ_KLUCZA = 11;

/** Loch bez klucza. */
export const ZAMKNIETY = 0;
/** Klucz uzyty, ale gracz jeszcze nie byl na liscie. */
export const KLUCZ_UZYTY = 1;
/** Pierwszy stan, w ktorym da sie walczyc. */
export const PIERWSZY_POZIOM = 2;
/** Loch przejsty do konca — `if ($db_data['dungeon_' . $dung] >= 12) break;`. */
export const PRZESZEDL = 12;

/** Ile trzeba odczekac miedzy walkami — `$time += 3600`. */
export const PRZERWA_SEKUND = 3600;

/** Ile grzybow kosztuje pominiecie przerwy — `$db_data['mushroom'] -= 1`. */
export const GRZYBOW_ZA_POMINIECIE = 1;

/**
 * Ktory poziom lochu odpowiada temu stanowi.
 *
 *     $stage -= 1;
 *     if ($stage < 1) $stage = 1; else if ($stage > 10) $stage = 10;
 */
export function poziomZeStanu(stan: number): number {
  const poziom = stan - 1;
  if (poziom < 1) return 1;
  if (poziom > POZIOMOW_W_LOCHU) return POZIOMOW_W_LOCHU;
  return poziom;
}

/** Czy w tym lochu da sie teraz walczyc. */
export function otwarty(stan: number): boolean {
  return stan >= PIERWSZY_POZIOM && stan < PRZESZEDL;
}

/** Numery lochow, ktorych gracz jeszcze nie otworzyl — `dungeon_N == 0`. */
export function zamknieteLochy(wiersz: Record<string, unknown>): number[] {
  const zamkniete: number[] = [];
  for (let loch = 1; loch <= LOCHOW; loch++) {
    if (Number(wiersz[`dungeon_${loch}`] ?? 0) === ZAMKNIETY) zamkniete.push(loch);
  }
  return zamkniete;
}

/** Nazwa kolumny — `getDungeonTableName()`. */
export function kolumnaLochu(loch: number): string | null {
  return loch >= 1 && loch <= LOCHOW ? `dungeon_${loch}` : null;
}

/** Opis potwora z tablicy; `null` tam, gdzie oryginal liczy go z gracza. */
export function opisPotwora(loch: number, stan: number): PotworLochu | null {
  return POTWORY[loch - 1]?.[poziomZeStanu(stan) - 1] ?? null;
}

/**
 * Potwor z lochu w postaci, ktorej uzywa silnik walki.
 *
 * Obrazenia w tablicy sa juz GOTOWE — `Monster::__construct` wpisuje
 * `$dmg_min` wprost, bez mnozenia przez ceche glowna (inaczej niz
 * `Char`, ktory liczy `bron * (1 + glowna / 10)`).
 */
export function potworZLochu(opis: PotworLochu, nazwa: string): Wojownik {
  return {
    nazwa,
    klasa: opis.klasa,
    poziom: opis.poziom,
    sila: opis.sila,
    zrecznosc: opis.zrecznosc,
    intelekt: opis.intelekt,
    wytrzymalosc: opis.wytrzymalosc,
    szczescie: opis.szczescie,
    zycie: opis.zycie,
    zycieMaks: opis.zycie,
    bronMin: opis.obrazeniaMin,
    bronMax: opis.obrazeniaMaks,
    bronBazowaMin: opis.obrazeniaMin,
    bronBazowaMax: opis.obrazeniaMaks,
    pancerz: opis.pancerz,
    // `$shield_id` rowne -1 znaczy „bez tarczy"; inaczej blokuje jak zwykla.
    tarcza: opis.tarcza > 0 ? opis.tarcza : 0,
  };
}

/**
 * Kopia gracza — dziesiaty poziom dziewiatego lochu.
 *
 *     return new Monster($lvl, $class, str, dex, int, wit, luck,
 *                        round($weap['dmg_min'] * ($p->getPrimaryStatValue() / 10)),
 *                        round($weap['dmg_max'] * (...)),
 *                        $p->getHp(), 11, -1, 13322552, $weaponId, $shieldId);
 *
 * Uwaga na wzor obrazen: jest tu `glowna / 10`, a nie `1 + glowna / 10`,
 * wiec kopia bije MOCNIEJ od oryginalu dopiero powyzej dziesiatego
 * punktu cechy glownej. Przepisane doslownie.
 */
export const DOSWIADCZENIE_ZA_KOPIE = 13322552;
export const PANCERZ_KOPII = 11;
export const NUMER_KOPII = -1;

export function kopiaGracza(gracz: Wojownik, nazwa: string): Wojownik {
  const glowna =
    gracz.klasa === 1 ? gracz.sila : gracz.klasa === 2 ? gracz.intelekt : gracz.zrecznosc;

  return {
    ...gracz,
    nazwa,
    bronMin: Math.round(gracz.bronBazowaMin * (glowna / 10)),
    bronMax: Math.round(gracz.bronBazowaMax * (glowna / 10)),
    pancerz: PANCERZ_KOPII,
  };
}
