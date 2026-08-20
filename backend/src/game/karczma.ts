/**
 * Karczma: losowanie zadan i rozliczenie ich wyniku.
 *
 * Port z `req.php` — generowanie zadan (koniec `finishQuest`) oraz akcje
 * `$ACT_TAVERN_ENTER` i `$ACT_START_QUEST`.
 *
 * Swiadomie pominiete na tym etapie, bo wymagaja ekranow, ktorych jeszcze
 * nie ma: zaklecia wiedzmy, bonusy budynkow gildii i wydarzenia
 * okolicznosciowe. Kazde z nich to mnoznik albo dodatek do wartosci
 * bazowej, wiec dolozenie ich pozniej niczego tu nie przewraca.
 */

import { PhpMtRand } from '../compat/rng.js';
import { LEVELS } from '../protocol/gamedata.js';
import { intval } from '../compat/php.js';
import { MIEJSC_W_PLECAKU, PIERWSZY_SLOT_PLECAKA } from './ekwipunek.js';

/**
 * Ile wytrzymalosci ma gracz po dobowym odswiezeniu.
 *
 * Wytrzymalosc liczy sie w SEKUNDACH wyprawy: 6000 sekund to sto minut
 * przygody na dobe. Zadanie kosztuje dokladnie tyle, ile trwa.
 */
export const PELNA_WYTRZYMALOSC = 6000;

/** Jedna jednostka dlugosci zadania to piec minut. */
export const SEKUND_NA_JEDNOSTKE = 300;

/** Ile wytrzymalosci dokłada jedno piwo — dwadziescia minut. */
export const WYTRZYMALOSC_Z_PIWA = 1200;

/**
 * Powyzej tego progu karczmarz odmawia nalania.
 *
 * W oryginale: `if (thirst > 4800) break;` — bohater jest „za zdrowy",
 * zeby pic. Klient pokazuje wtedy inny tekst, ale piwa nie sprzedaje.
 */
export const PROG_ZA_ZDROWY = 4800;

/**
 * Ile piw dziennie.
 *
 * Oryginal odrzuca zamowienie przy `beers >= 11`, wiec jedenaste piwo
 * jeszcze wchodzi, a dwunaste juz nie. Klient pokazuje przy tym licznik
 * „x/10" — rozjazd jest w samym oryginale i przepisujemy zachowanie
 * serwera, bo to ono decyduje.
 */
export const PIW_NA_DOBE = 11;

/** Ile kosztuje piwo i przyspieszenie wyprawy. */
export const GRZYBOW_ZA_PIWO = 1;
export const GRZYBOW_ZA_PRZYSPIESZENIE = 1;

/**
 * Wierzchowiec skraca wyprawe.
 *
 * `mountMultiplier()` w oryginale: osiol zabiera dziesiata czesc czasu,
 * smok polowe. Mnoznik dziala i na dlugosc wyprawy, i na to, ile
 * wytrzymalosci ona kosztuje.
 */
export function mnoznikWierzchowca(wierzchowiec: number): number {
  switch (wierzchowiec) {
    case 1: return 0.9;
    case 2: return 0.8;
    case 3: return 0.7;
    case 4: return 0.5;
    default: return 1;
  }
}

/**
 * Ile sekund trwa wyprawa i ile kosztuje wytrzymalosci.
 *
 * Wierzchowiec liczy sie tylko wtedy, gdy najem jeszcze nie wygasl
 * (`mount_dur`) — inaczej bohater idzie pieszo.
 */
export function czasWyprawy(dlugosc: number, wierzchowiec: number): number {
  return Math.trunc(dlugosc * SEKUND_NA_JEDNOSTKE * mnoznikWierzchowca(wierzchowiec));
}

/**
 * Najblizsza polnoc — o niej odnawia sie wytrzymalosc i licznik piw.
 *
 * Oryginal uzywa `strtotime('tomorrow')`, czyli poczatku NASTEPNEGO dnia
 * w strefie serwera. Liczymy tak samo, ale w UTC, bo serwer bezstanowy
 * moze stac w dowolnej strefie i doba gracza nie ma sie przesuwac
 * zaleznie od tego, gdzie akurat wstal proces.
 */
export function najblizszaPolnoc(teraz: number): number {
  const SEKUND_NA_DOBE = 86400;
  return (Math.floor(teraz / SEKUND_NA_DOBE) + 1) * SEKUND_NA_DOBE;
}

/**
 * Pierwsze wolne miejsce w plecaku, albo `null` gdy pelno.
 *
 * Port `findFreeSlot()`. Wolne miejsce to pierwsza dziura w ciagu
 * 10..14 — nagroda z wyprawy trafia wlasnie tam.
 */
export function wolneMiejsceWPlecaku(zajete: number[]): number | null {
  for (let i = 0; i < MIEJSC_W_PLECAKU; i++) {
    const slot = PIERWSZY_SLOT_PLECAKA + i;
    if (!zajete.includes(slot)) return slot;
  }
  return null;
}

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
  /**
   * Premia procentowa rzadkiego zadania (`quest_red_N` w bazie).
   *
   * Oryginal daje ja jednemu na piecdziesiat zadan i tylko powyzej
   * pieedziesiatego poziomu; wartosc 145 znaczy o 145% wiecej
   * doswiadczenia. Klient rysuje takie zadanie na czerwono.
   */
  premia: number;
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

    // Rzadkie zadanie z duzo wieksza nagroda — jedno na piecdziesiat
    // i dopiero powyzej piecdziesiatego poziomu.
    const premia = rng.rand(1, 50) === 1 && poziom > 49 ? 145 : 0;

    const zloto = poziom * (poziom / 40) * (poziom / 40) * m * dlugosc + bazoweZloto;
    const dosw = doswiadczenieZaZadanie(poziom) * m * dlugosc + bazoweDosw;

    zadania.push({
      numer: (i + 1) as 1 | 2 | 3,
      dlugosc,
      sekundy: dlugosc * SEKUND_NA_JEDNOSTKE,
      zloto: Math.trunc(zloto),
      doswiadczenie: Math.trunc(dosw),
      lokacja: rng.rand(1, 21),
      premia,
    });
  }

  return zadania;
}

/**
 * Ile doswiadczenia naprawde wpada za wyprawe.
 *
 * Oryginal mnozy zapisana wartosc zadania przez sume bonusow:
 *
 *   ebonus     = 1 + (instruktor gildii + lochy gildii) / 50
 *   albumbonus = album / 1700, zaokraglone do dwoch miejsc
 *   rqbonus    = premia rzadkiego zadania / 100
 *
 * Bonusow gildii i albumu jeszcze nie ma czym wypelnic, wiec domyslnie sa
 * zerowe — wzor zostaje ten sam i wystarczy podac wartosci, kiedy te
 * ekrany powstana.
 */
export function doswiadczenieZWyprawy(
  bazowe: number,
  { premia = 0, instruktor = 0, lochyGildii = 0, album = 0 } = {},
): number {
  const bonusBudynkow = 1 + (instruktor + lochyGildii) / 50;
  const bonusAlbumu = album > 0 ? Math.round((album / 1700) * 100) / 100 : 0;
  const bonusPremii = premia / 100;
  return Math.trunc(bazowe * (bonusBudynkow + bonusAlbumu + bonusPremii));
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
      premia: intval(wiersz[`quest_red_${n}`] ?? 0),
    };
  });
}
