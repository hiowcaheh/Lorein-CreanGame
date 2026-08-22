/**
 * Grzybiarz — dane ekranu.
 *
 * ODSTEPSTWO Z KONIECZNOSCI (tabela w CLAUDE.md). W oryginale ten ekran
 * NIE JEST czescia klienta: `ShowDealerScreen()` wkłada w
 * `IMG_SCR_DEALER_BG` zewnetrzna strone operatora platnosci
 * (`param_papaya_path` z numerem gracza i sesji), a klient tylko ja
 * wyswietla. W pliku SWF nie ma ani jednej stalej opisujacej uklad tego
 * ekranu, bo caly uklad przychodzil z tamtej strony.
 *
 * Z oryginalu zostaje wiec tylko to, co naprawde jest w `res/`: tlo
 * `dealer_old.jpg` i klatki reki grzybiarza. Reszta — pólka z paczkami —
 * jest nasza, bo nie ma czego przepisac.
 */

const KATALOG = '/res/sfgame/scr/shops/';

/** Tlo ekranu, 1000x700 — dokladnie obszar gry. */
export const TLO = `${KATALOG}dealer_old.jpg`;

/**
 * Reka grzybiarza — cztery klatki 266x320.
 *
 * Polozenia nie ma w zadnej stalej (uklad byl po stronie operatora),
 * wiec ZMIERZONE: `pilzdealer_arm1.jpg` pokrywa sie z tlem w punkcie
 * (176, 164) — dopasowanie po pikselach daje tam roznice bliska zeru,
 * a kazde inne miejsce wielokrotnie wieksza.
 */
export const RAMIE = { x: 176, y: 164, szerokosc: 266, wysokosc: 320 };
export const LICZBA_KLATEK_RAMIENIA = 4;
export const ODSTEP_KLATEK_MS = 220;

export function plikRamienia(numer: number): string {
  return `${KATALOG}pilzdealer_arm${numer + 1}.jpg`;
}

/**
 * Pólka z paczkami grzybow.
 *
 * Nasza — patrz uwaga na gorze pliku. Liczby sa te, ktore sprzedawal
 * oryginalny sklep grzybowy; ceny sa umowne, bo platnosci nie ma.
 */
export interface Paczka {
  grzyby: number;
  /** Cena w groszach — pokazujemy ja tylko po to, zeby pólka nie byla pusta. */
  cena: number;
  /** Ile procent taniej niz najmniejsza paczka. */
  rabat: number;
}

export const PACZKI: Paczka[] = [
  { grzyby: 10, cena: 499, rabat: 0 },
  { grzyby: 50, cena: 1999, rabat: 20 },
  { grzyby: 125, cena: 4499, rabat: 28 },
  { grzyby: 300, cena: 9999, rabat: 33 },
  { grzyby: 700, cena: 19999, rabat: 43 },
  { grzyby: 1500, cena: 39999, rabat: 47 },
];

/*
 * Ciemna plansza pod pólka. Rozmiar i przezroczystosc jak przy kazdej
 * innej planszy w grze (`black_square_neutral`, alfa 0,65).
 */
export const PLANSZA = { lewo: 500, gora: 60, szerokosc: 470, wysokosc: 580 };
export const MARGINES = 16;
/*
 * Szesc paczek plus naglowek i uwaga na dole musza zmiescic sie
 * w planszy: 86 (naglowek) + 6 * 72 - 8 = 510, potem uwaga na 578.
 */
export const WYSOKOSC_PACZKI = 64;
export const ODSTEP_PACZEK = 8;

export function cenaSlownie(grosze: number): string {
  return `${(grosze / 100).toFixed(2).replace('.', ',')} zł`;
}
