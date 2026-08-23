/**
 * Premie do nagrody — jedno miejsce na wszystkie zrodla.
 *
 * Oryginal zna tylko premie z klasera i z rzadkiego zadania
 * (`$albumbonus`, `$rqbonus` w `req.php`). Kolejne — gildia, wieza,
 * serwerowe przedmioty na zdobycz — dokladaja sie tutaj i same
 * pojawiaja sie w rozpisaniu pod nagroda; nic wiecej nie trzeba zmieniac.
 */

import { PREMIA_Z_WIEZY } from './wieza-teksty';

export interface PremieNagrody {
  /** Klaser Dokladnosci — `round(album / 1700, 2)`. */
  klaser?: number;
  /** Rzadkie zadanie — sama wyprawa, nie loch. */
  rzadkie?: number;
  /** Gildia — jeszcze nie ma jej w grze. */
  gildia?: number;
  /** Wieza — jeszcze nie ma jej w grze. */
  wieza?: number;
  /** Serwerowe przedmioty podbijajace doswiadczenie i zloto. */
  przedmioty?: number;
}

/**
 * Kolejnosc i wyglad rozpisania. Kazde zrodlo ma swoj kolor — po nim
 * widac, skad premia sie wziela.
 */
export const ZRODLA_PREMII = [
  { klucz: 'klaser', podpis: 'Premia kolekcjonera', klasa: 'premia-klaser' },
  { klucz: 'rzadkie', podpis: 'Rzadkie zadanie', klasa: 'premia-rzadkie' },
  { klucz: 'gildia', podpis: 'Premia gildii', klasa: 'premia-gildia' },
  { klucz: 'wieza', podpis: PREMIA_Z_WIEZY, klasa: 'premia-wieza' },
  { klucz: 'przedmioty', podpis: 'Premia z przedmiotów', klasa: 'premia-przedmioty' },
] as const satisfies readonly { klucz: keyof PremieNagrody; podpis: string; klasa: string }[];

export interface WierszPremii {
  podpis: string;
  klasa: string;
  /** Ile procent dokłada to zrodlo. */
  ile: number;
}

/** Same niezerowe skladniki, w stalej kolejnosci. */
export function wierszePremii(premie: PremieNagrody | undefined): WierszPremii[] {
  if (!premie) return [];

  return ZRODLA_PREMII.map((z) => ({
    podpis: z.podpis,
    klasa: z.klasa,
    ile: premie[z.klucz] ?? 0,
  })).filter((w) => w.ile > 0);
}

/** Ile premii lacznie, w procentach. */
export function lacznaPremia(premie: PremieNagrody | undefined): number {
  return wierszePremii(premie).reduce((suma, w) => suma + w.ile, 0);
}
