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
