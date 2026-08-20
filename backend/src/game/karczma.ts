/**
 * Karczma: losowanie zadan i rozliczenie ich wyniku.
 *
 * Port z `req.php` — generowanie zadan (koniec `finishQuest`) oraz akcje
 * `$ACT_TAVERN_ENTER` i `$ACT_START_QUEST`.
 *
 * Swiadomie pominiete na tym etapie, bo wymagaja ekranow, ktorych jeszcze
 * nie ma: nagrody przedmiotowe czekajace w karczmie, zaklecia wiedzmy,
 * bonusy gildii i wierzchowce. Kazde z nich to mnoznik albo dodatek do
 * wartosci bazowej, wiec dolozenie ich pozniej niczego tu nie przewraca.
 */

import { PhpMtRand } from '../compat/rng.js';
import { LEVELS } from '../protocol/gamedata.js';
import { intval } from '../compat/php.js';

/** Ile wytrzymalosci ma gracz po dobowym odswiezeniu. */
export const PELNA_WYTRZYMALOSC = 6000;

/** Jedna jednostka dlugosci zadania to piec minut. */
export const SEKUND_NA_JEDNOSTKE = 300;

export interface Zadanie {
  numer: 1 | 2 | 3;
  /** Dlugosc w jednostkach po piec minut (1-4). */
  dlugosc: number;
  /** Dlugosc w sekundach — tyle trwa i tyle kosztuje wytrzymalosci. */
  sekundy: number;
  zloto: number;
  doswiadczenie: number;
  /** Numer lokacji 1-21 — decyduje o tle i nazwie miejsca. */
  lokacja: number;
}

/**
 * Doswiadczenie bazowe za zadanie na danym poziomie — port
 * `getQuestExperience()`. Rosnie kwadratowo, bo prog awansu tez rosnie.
 */
export function doswiadczenieZaZadanie(poziom: number): number {
  const p = Math.min(poziom, 200);
  return p * (0.5 + p * 0.05);
}

/**
 * Losuje trzy zadania.
 *
 * Dlugosc zadania jest ograniczana pozostala wytrzymaloscia — inaczej
 * gracz widzialby zadania, ktorych nie ma jak podjac.
 */
export function wylosujZadania(
  poziom: number,
  wytrzymalosc: number,
  rng: PhpMtRand,
): Zadanie[] {
  const zadania: Zadanie[] = [];

  for (let i = 0; i < 3; i++) {
    const m = rng.rand(900, 1100) / 1000;
    const bazoweDosw = rng.rand(200, 300);
    const bazoweZloto = rng.rand(30, 70);

    let dlugosc = rng.rand(1, 4);
    if (poziom < 14) dlugosc = rng.rand(1, 2);
    if (wytrzymalosc === 450 && poziom > 13) dlugosc = rng.rand(1, 3);
    if (wytrzymalosc === 300) dlugosc = rng.rand(1, 2);
    if (wytrzymalosc === 150) dlugosc = 1;

    // Oryginal losuje tu jeszcze rzadkie zadanie z mocniejszym potworem
    // (tylko powyzej 49 poziomu). Losowanie zostaje, zeby ciag generatora
    // zgadzal sie z oryginalem, nawet zanim obsluzymy sam efekt.
    rng.rand(1, 50);

    const zloto = poziom * (poziom / 40) * (poziom / 40) * m * dlugosc + bazoweZloto;
    const dosw = doswiadczenieZaZadanie(poziom) * m * dlugosc + bazoweDosw;

    zadania.push({
      numer: (i + 1) as 1 | 2 | 3,
      dlugosc,
      sekundy: dlugosc * SEKUND_NA_JEDNOSTKE,
      zloto: Math.trunc(zloto),
      doswiadczenie: Math.trunc(dosw),
      lokacja: rng.rand(1, 21),
    });
  }

  return zadania;
}

/**
 * Awans po zdobyciu doswiadczenia.
 *
 * Kolumna `exp` trzyma postep W OBREBIE poziomu, nie sume od poczatku gry:
 * przy awansie oryginal odejmuje prog i podnosi poziom. Jedno zadanie moze
 * dac awans o wiecej niz jeden poziom, stad petla.
 */
export function awansuj(poziom: number, doswiadczenie: number): { poziom: number; doswiadczenie: number } {
  let lvl = poziom;
  let exp = doswiadczenie;

  while (exp > (LEVELS[lvl] ?? Number.MAX_SAFE_INTEGER)) {
    exp -= LEVELS[lvl]!;
    lvl += 1;
  }

  return { poziom: lvl, doswiadczenie: exp };
}

/** Odczytuje trzy zadania zapisane w wierszu gracza. */
export function zadaniaZWiersza(wiersz: Record<string, unknown>): Zadanie[] {
  return [1, 2, 3].map((n) => {
    const dlugosc = Math.max(1, intval(wiersz[`quest_dur_${n}`] ?? 1));
    return {
      numer: n as 1 | 2 | 3,
      dlugosc,
      sekundy: dlugosc * SEKUND_NA_JEDNOSTKE,
      zloto: intval(wiersz[`quest_gold_${n}`] ?? 0),
      doswiadczenie: intval(wiersz[`quest_exp_${n}`] ?? 0),
      lokacja: Math.max(1, intval(wiersz[`quest_location_${n}`] ?? 1)),
    };
  });
}
