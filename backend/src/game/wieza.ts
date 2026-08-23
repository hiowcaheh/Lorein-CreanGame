/**
 * Wieza — sto pieter, na kazdym jeden potwor.
 *
 * Port `$ACT_TOWER_TRY` z `req.php`. Zasady sa proste i wszystkie
 * pochodza stamtad:
 *
 *   - pietro trzyma kolumna `tower_level`, liczona od jedynki;
 *   - przerwa jest ta sama, co w lochach — wspolna kolumna `dungeon_time`
 *     i te same `3600` sekund, a grzyb ja pomija;
 *   - wygrana podnosi pietro o jeden, doklada zloto i JEDEN przedmiot;
 *   - doswiadczenia wieza NIE DAJE wcale.
 *
 * Potwory sa w `wieza-dane.ts`, wyciagniete maszynowo z `getTowerMonster()`.
 */

import { POTWORY_WIEZY, PIETER_WIEZY } from './wieza-dane.js';
import type { PotworLochu } from './lochy-dane.js';

export { PIETER_WIEZY };

/**
 * Kolumna z pietrem. Jest w `db/schema.sql` od poczatku, ale dzialajaca
 * baza moze byc starsza — `dolozKolumne()` dostawia ja w razie potrzeby.
 */
export const KOLUMNA_PIETRA = 'smallint NOT NULL DEFAULT 1';

/**
 * Numer krainy pod tlo walki. Lochy zajmuja `location51..63`, wieza ma
 * WLASNY plik `location_tower.jpg`, wiec nie ma numeru w tym samym
 * ciagu — klient rozpoznaje ja po tej jednej, umownej wartosci.
 */
export const LOKACJA_WIEZY = 100;

/** Pierwsze pietro — `tower_level` swiezej postaci. */
export const PIERWSZE_PIETRO = 1;

/**
 * Pietro, na ktorym gracz stoi. Kolumna moze byc pusta albo wyjsc poza
 * zakres; wieza konczy sie na setce i tam zostaje.
 */
export function pietroZeStanu(stan: number): number {
  if (!Number.isFinite(stan) || stan < PIERWSZE_PIETRO) return PIERWSZE_PIETRO;
  return Math.min(Math.trunc(stan), PIETER_WIEZY);
}

/** Czy gracz ma wieze za soba — przeszedl setne pietro. */
export function przeszedlWieze(stan: number): boolean {
  return Number.isFinite(stan) && stan > PIETER_WIEZY;
}

/** Opis potwora z danego pietra. */
export function potworZWiezy(pietro: number): PotworLochu | null {
  return POTWORY_WIEZY[pietroZeStanu(pietro) - 1] ?? null;
}

/**
 * Ile SREBRA daje pokonane pietro.
 *
 *     $db_data['silver'] += round($OP->getGoldTower() * 100, -2);
 *
 * a `getGoldTower()` oddaje pole `exp` potwora. Mnozenie przez sto
 * zamienia zloto na srebro, a `round(..., -2)` zaokragla do pelnych
 * setek srebra, czyli do pelnego zlota.
 */
export function srebroZaPietro(potwor: PotworLochu): number {
  return Math.round((potwor.doswiadczenie * 100) / 100) * 100;
}

/**
 * Na jaki poziom losuje sie nagroda przedmiotowa.
 *
 *     $statvalue = $OP->getLvl();
 *     if ($statvalue > $lvl) $statvalue = $lvl;
 *
 * czyli poziom potwora, ale nie wyzszy niz poziom gracza — inaczej
 * z pierwszego pietra spadalby przedmiot na dwusetke.
 */
export function poziomNagrody(potwor: PotworLochu, poziomGracza: number): number {
  return Math.min(potwor.poziom, poziomGracza);
}
