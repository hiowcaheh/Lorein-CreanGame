/**
 * Dzialajace mikstury — nazwy, podpowiedz i czas.
 *
 * Wszystko przepisane z klienta Flash: petla rysujaca `CNT_CHAR_POTION`
 * (`EnablePopup` z czterema wierszami) i `TimeStr(czas, true)`.
 */

import {
  NAZWY_CECH,
  NAZWY_MIKSTUR,
  TEKSTY,
  TXT_DZIALA_DO,
  TXT_DO,
  TXT_JAK_ODWOLAC_MIKSTURE,
  TXT_TYMCZASOWO,
} from './przedmioty-dane';
import type { Mikstura } from './typy';

/** Numer Eliksiru Niesmiertelnosci. */
export const MIKSTURA_ZYCIA = 16;

/** Cecha „punkty zycia" — jedyna, ktorej mikstura nie bierze z piatki. */
const CECHA_ZYCIA = 12;

function tekst(numer: number): string {
  return TEKSTY[numer] ?? '';
}

/** Nazwa mikstury: `TXT_ITMNAME_12 + numer - 1`. */
export function nazwaMikstury(rodzaj: number): string {
  return tekst(NAZWY_MIKSTUR + rodzaj - 1) || 'Eliksir';
}

/** Nazwa cechy, ktora mikstura podnosi. */
export function nazwaCechyMikstury(rodzaj: number): string {
  const numer = rodzaj === MIKSTURA_ZYCIA ? CECHA_ZYCIA : ((rodzaj - 1) % 5) + 1;
  return tekst(NAZWY_CECH + numer);
}

/**
 * Sila dzialania w postaci, w ktorej pisze ja klient.
 *
 * Procent stoi przy Eliksirze Niesmiertelnosci i wszedzie tam, gdzie
 * wartosc nie przekracza 25 — wyzsze liczby to juz punkty.
 */
export function silaMikstury(m: Mikstura): string {
  const procent = m.rodzaj === MIKSTURA_ZYCIA || m.wartosc <= 25 ? '%' : '';
  return `+ ${m.wartosc}${procent}`;
}

/**
 * Godzina konca dzialania — port `TimeStr(czas, true)` dla polskiego
 * jezyka: „14:05" tego samego dnia, „23/8/ 14:05" pozniej.
 *
 * Oryginal odejmowal tu jeszcze godzine i roznice zegara serwera
 * z zegarem przegladarki. To byla lataina na serwer chodzacy w innej
 * strefie: nasz wysyla zwykly czas uniksowy, ktory `Date` zamienia na
 * czas lokalny bez zadnych poprawek.
 */
export function koniecDzialania(czas: number): string {
  const kiedy = new Date(czas * 1000);
  const teraz = new Date();
  const lz = (n: number) => String(n).padStart(2, '0');

  const dzien = `${kiedy.getDate()}/${kiedy.getMonth() + 1}`;
  const dzisiaj = `${teraz.getDate()}/${teraz.getMonth() + 1}`;

  return `${dzien === dzisiaj ? '' : `${dzien}/ `}${lz(kiedy.getHours())}:${lz(kiedy.getMinutes())}`;
}

export interface WierszMikstury {
  etykieta: string;
  wartosc: string;
}

/** Cztery wiersze podpowiedzi, dokladnie w kolejnosci z klienta. */
export function podpowiedzMikstury(m: Mikstura): {
  nazwa: string;
  wiersze: WierszMikstury[];
  jakOdwolac: string;
} {
  return {
    nazwa: nazwaMikstury(m.rodzaj),
    wiersze: [
      { etykieta: nazwaCechyMikstury(m.rodzaj), wartosc: silaMikstury(m) },
      { etykieta: tekst(TXT_DZIALA_DO), wartosc: koniecDzialania(m.koniec) },
    ],
    // W pliku jezykowym `#` znaczy nowa linie.
    jakOdwolac: tekst(TXT_JAK_ODWOLAC_MIKSTURE).replaceAll('#', ' '),
  };
}

/**
 * Ile z widocznej cechy pochodzi z mikstury i do kiedy — wiersz
 * „Dzial. tymczas." w podpowiedzi cechy.
 *
 * Klient liczy to odwrotnie niz serwer: dzieli widoczna wartosc przez
 * `(100 + sila) / 100`, zeby dostac cechę SPRZED mikstury, i dopiero
 * z niej liczy dodatek. Przepisane 1:1, zeby obie strony pokazywaly te
 * sama liczbe.
 */
export function dodatekZMikstury(
  mikstury: readonly Mikstura[],
  cecha: number,
  wartoscWidoczna: number,
): { ile: number; doKiedy: string } | null {
  const m = mikstury.find((p) => p.rodzaj > 0 && p.cecha === cecha && p.wartosc <= 25);
  if (!m) return null;

  const przedMikstura = Math.trunc(wartoscWidoczna / ((100 + m.wartosc) / 100));
  return {
    ile: Math.round((m.wartosc / 100) * przedMikstura),
    doKiedy: koniecDzialania(m.koniec),
  };
}

/** Podpis „do:" — do zlozenia wiersza „12 (do: 14:05)". */
export const NAPIS_DO = TEKSTY[TXT_DO] ?? 'do:';
/** Podpis „Dzial. tymczas:". */
export const NAPIS_TYMCZASOWO = TEKSTY[TXT_TYMCZASOWO] ?? '';
