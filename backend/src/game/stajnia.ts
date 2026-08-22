/**
 * Stajnia — najem wierzchowcow.
 *
 * Port `mountCost()` i galezi `$ACT_BUY_MOUNT` z `req.php` oraz obslugi
 * `ClickMount` / `BuyMount` z klienta Flash.
 *
 * Wierzchowiec skraca kazda wyprawe (i tyle samo obciecia dostaje koszt
 * w awanturniczosci — `mountMultiplier()` mnozy jedno i drugie). Najem
 * jest na czas: po `mount_dur` bohater znowu chodzi pieszo.
 */

/** Ile jest wierzchowcow. Numeracja 1..4, zero znaczy „pieszo". */
export const LICZBA_WIERZCHOWCOW = 4;

/**
 * Ile trwa najem — `$mount_dur = $time + 1209600`, czyli 14 dni.
 * Napis w kliencie mowi to samo: „Okres wynajmu: 14 dni".
 */
export const CZAS_NAJMU = 1209600;

export interface Cena {
  srebro: number;
  grzyby: number;
}

/**
 * Cennik — `mountCost()`. Klient pokazuje te same liczby w ZLOCIE
 * (1, 5, 10), a zloto to sto srebra.
 */
export const CENNIK: Record<number, Cena> = {
  1: { srebro: 100, grzyby: 0 },
  2: { srebro: 500, grzyby: 0 },
  3: { srebro: 1000, grzyby: 1 },
  4: { srebro: 0, grzyby: 25 },
};

/**
 * Ile skraca wyprawe — `mountMultiplier()`.
 *
 * Te same liczby stoja w `karczma.ts`; tam pracuja na czasie wyprawy,
 * tu sluza tylko do opisu („Czas wedrowki - 30%").
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
 * Premia za najem najlepszego wierzchowca.
 *
 * `$ACT_BUY_MOUNT`: `if ($mount >= 4) $silver += ((23 + $uLvl) * $uLvl * $uLvl);`
 * — i to PO odjeciu ceny, wiec gracz dostaje te srebro do reki. Klient
 * zapowiada to wierszem „Premia srodowiskowa" przy czwartym boksie
 * (napis 4523 ma pionowa kreske, po ktorej idzie kwota).
 */
export function premiaZaNajlepszego(poziom: number): number {
  return (23 + poziom) * poziom * poziom;
}

/** Ktory wierzchowiec dziala TERAZ — po czasie najem przepada. */
export function czynnyWierzchowiec(
  wierzchowiec: number,
  najemDo: number,
  teraz: number,
): number {
  return teraz < najemDo ? wierzchowiec : 0;
}

export type OdmowaNajmu = 'nie-ma-takiego' | 'gorszy' | 'za-drogo' | 'brak-grzybow';

export interface WynikNajmu {
  /** Ile srebra ZOSTANIE graczowi (juz po cenie i po premii). */
  srebro: number;
  grzyby: number;
  /** Do kiedy najem. */
  najemDo: number;
  /** Ile srebra doszlo z premii — zero poza czwartym wierzchowcem. */
  premia: number;
}

/**
 * Czy da sie wynajac i co z tego wyjdzie.
 *
 * Kolejnosc sprawdzen jest z oryginalu:
 *
 *   1. gorszego niz obecny nie wolno wziac wcale (`$cur_mount > $mount`
 *      konczy akcje bez slowa; klient chowa wtedy przycisk),
 *   2. brak srebra — `$ERR_TOO_EXPENSIVE`,
 *   3. brak grzybow — `$ERR_NO_MUSH_MQ`.
 *
 * Czas liczy sie dwojako: TEN SAM wierzchowiec z waznym najmem PRZEDLUZA
 * (`$mount_dur += 1209600`), kazdy inny zaczyna najem od nowa.
 */
export function sprawdzNajem(
  wierzchowiec: number,
  stan: {
    teraz: number;
    wierzchowiec: number;
    najemDo: number;
    srebro: number;
    grzyby: number;
    poziom: number;
  },
): OdmowaNajmu | WynikNajmu {
  if (!Number.isInteger(wierzchowiec) || wierzchowiec < 1 || wierzchowiec > LICZBA_WIERZCHOWCOW) {
    return 'nie-ma-takiego';
  }

  const cena = CENNIK[wierzchowiec]!;
  const czynny = czynnyWierzchowiec(stan.wierzchowiec, stan.najemDo, stan.teraz);

  if (czynny > wierzchowiec) return 'gorszy';
  if (cena.srebro > stan.srebro) return 'za-drogo';
  if (cena.grzyby > stan.grzyby) return 'brak-grzybow';

  const najemDo =
    stan.najemDo <= stan.teraz || wierzchowiec !== czynny
      ? stan.teraz + CZAS_NAJMU
      : stan.najemDo + CZAS_NAJMU;

  const premia = wierzchowiec >= LICZBA_WIERZCHOWCOW ? premiaZaNajlepszego(stan.poziom) : 0;

  return {
    srebro: stan.srebro - cena.srebro + premia,
    grzyby: stan.grzyby - cena.grzyby,
    najemDo,
    premia,
  };
}
