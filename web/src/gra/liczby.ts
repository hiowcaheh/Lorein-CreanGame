/**
 * Liczby na ekranie.
 *
 * SWIADOME ODSTEPSTWO (tabela w CLAUDE.md). Oryginal nie grupuje cyfr
 * wcale — klient sklada napisy zwyklym `String(liczba)`, wiec pokazuje
 * „155232". Wlasciciel gry poprosil o kropke co trzy cyfry: „155.232".
 *
 * Kropka, a nie odstep z `toLocaleString('pl-PL')`: odstep jest szerszy
 * i przy dluzszych nagrodach napis wchodzil pod ikone zdobyczy.
 */
const SEPARATOR = '.';

export function liczba(wartosc: number): string {
  const calkowita = Math.trunc(Math.abs(wartosc));
  const znak = wartosc < 0 ? '-' : '';
  return znak + String(calkowita).replace(/\B(?=(\d{3})+(?!\d))/g, SEPARATOR);
}

/*
 * Skracanie wielkich kwot („18kk") bylo probowane i ODRZUCONE: skrot
 * gubi koncowke, a gracz chce widziec dokladna sume. Miejsce na pasku
 * zasobow robi sie inaczej — chowajac srebro, kiedy jest choc jedno
 * zloto (patrz `Zasoby` w `App.tsx`).
 */
const MILION = 1_000_000;

/**
 * Klasa koloru dla kwoty. Wlasciciel gry poprosil, zeby po samym
 * kolorze bylo widac rzad wielkosci: od miliona zielony, od dziesieciu
 * milionow czerwony. Odcienie z palety gry, nie jaskrawe — patrz
 * `--liczba-duza` i `--liczba-ogromna` w `style/gra.css`.
 */
export function klasaWielkosci(wartosc: number): string {
  const calkowita = Math.trunc(Math.abs(wartosc));
  if (calkowita >= 10 * MILION) return 'ogromna';
  if (calkowita >= MILION) return 'duza';
  return '';
}
