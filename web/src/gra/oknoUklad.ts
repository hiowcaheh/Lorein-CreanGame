/**
 * Okno dialogowe i suwak — uklad z ekranu Warty.
 *
 * Oryginal ma jedno okno na wszystko (`IMG_IF_WINDOW`, `okno.png` 520x380)
 * i stawia je zawsze w tym samym punkcie `POS_IF_WIN`. Warta doklada do
 * niego napis, suwak (`DefineSlider`) i przycisk — i to jest komplet,
 * ktorego uzywa okno dokupywania cech.
 *
 * Wszystko przeliczone na piksele ekranu gry (minus 280 i 100).
 */

const POCZATEK_X = 280;
const POCZATEK_Y = 100;

/** `POS_IF_WIN_X` = 540, `POS_IF_WIN_Y` = 250, `okno.png` ma 520x380. */
export const OKNO = {
  lewo: 540 - POCZATEK_X,
  gora: 250 - POCZATEK_Y,
  szerokosc: 520,
  wysokosc: 380,
};

export const TLO_OKNA = '/res/ui/okno.png';

/*
 * Widoczna ramka jest MNIEJSZA od pliku, a POLE do pisania jeszcze
 * mniejsze od ramki. `okno.png` ma 520x380, ale:
 *
 *   - przezroczysty margines zjada prawa krawedz — tresc konczy sie na
 *     x = 500, stad `REL_IF_WIN_WELCOME_X = 250`: to srodek WIDOCZNEJ
 *     ramki, nie pliku;
 *   - przydymione wnetrze (alfa 204) siega od y = 49 do y = 330, dalej
 *     zaczyna sie ozdobna listwa.
 *
 * Nic z tresci nie moze wejsc na listwe, wiec dolna granica pola to
 * `POS_IF_WIN_Y + 330`. Oryginalna Warta trzyma sie tej granicy:
 * przycisk konczy sie 15 px nad nia.
 */
export const WNETRZE_DOL = 250 + 330 - POCZATEK_Y;

/** Srodek okna — `POS_IF_WIN_X + REL_IF_WIN_WELCOME_X`. */
export const SRODEK_OKNA = 540 + 250 - POCZATEK_X;
/** Naglowek: `POS_IF_WIN_Y + REL_IF_WIN_WELCOME_Y`, wysrodkowany. */
export const NAGLOWEK_Y = 250 + 45 - POCZATEK_Y;

/**
 * `POS_LBL_ARBEITEN_TEXT_X/_Y` i `SIZE_LBL_ARBEITEN_TEXT_X`. Warta ma
 * tu jedno zdanie, okno cechy — dwa. Zaczyna sie wiec wyzej (326
 * zamiast 340), zeby trzeci wiersz nie wszedl na tor suwaka.
 */
export const TEKST = { lewo: 590 - POCZATEK_X, gora: 326 - POCZATEK_Y, szerokosc: 400 };
/** `POS_LBL_ARBEITEN_TEXT2_Y` — drugi wiersz opisu, pod podzialka suwaka. */
export const TEKST2_Y = 485 - POCZATEK_Y;

/** `POS_ARBEITEN_SLIDER_X/_Y`, opuszczone o 14 px na trzeci wiersz opisu. */
export const SUWAK = { lewo: 650 - POCZATEK_X, gora: 434 - POCZATEK_Y };

/** Podzialka pod torem — 4 px pod dolna krawedzia `suwak.png`. */
export const PODZIALKA_POD_TOREM = 4;

/**
 * Przycisk pod oknem — `POS_IF_WIN_X + REL_IF_WIN_WELCOME_X + REL_IF_WIN_BTN_X`
 * i `POS_IF_WIN_Y + REL_ARBEITEN_BTN_Y`. Kamien `btnClassBasic` ma 174x45.
 */
export const PRZYCISK = {
  lewo: 540 + 250 - 87 - POCZATEK_X,
  gora: 250 + 270 - POCZATEK_Y,
  szerokosc: 174,
  wysokosc: 45,
};

/**
 * Dwa przyciski stoja OBOK siebie, po polowie odstepu od srodka okna,
 * na wysokosci z oryginalu (`REL_ARBEITEN_BTN_Y`). Pod soba nie
 * mieszcza sie: drugi wszedlby na ozdobna listwe (`WNETRZE_DOL`).
 */
export const ODSTEP_PRZYCISKOW = 20;
export const PRZYCISKI_Y = PRZYCISK.gora;

/*
 * SUWAK — `DefineSlider(actorID, Ticks, pos_x, pos_y, fn)`.
 *
 *   tor        `suwak.png` 279x24 w punkcie (pos_x, pos_y)
 *   zakres     localX od 35 do 243; wartosc liczy sie z
 *              `((x - 40) / 198) * (Ticks - 1) + 0.5`
 *   uchwyt     `suwak-uchwyt.png` 14x22, srodek na
 *              `40 + 198 * (v - 1) / (Ticks - 1)`, rysowany o 7 px w lewo
 *   znaczniki  `suwak-znacznik.png` 10x19 w tych samych punktach,
 *              10 px NAD torem, przesuniete o 5 px w lewo
 */
export const TOR_SUWAKA = { szerokosc: 279, wysokosc: 24 };
export const POCZATEK_TORU = 40;
export const DLUGOSC_TORU = 198;
export const UCHWYT = { szerokosc: 14, wysokosc: 22 };
export const ZNACZNIK = { szerokosc: 10, wysokosc: 19 };
export const ZNACZNIK_NAD_TOREM = 10;

export const OBRAZ_TORU = '/res/ui/suwak.png';
export const OBRAZ_UCHWYTU = '/res/ui/suwak-uchwyt.png';
export const OBRAZ_ZNACZNIKA = '/res/ui/suwak-znacznik.png';

/** Gdzie stoi uchwyt przy wartosci `v` z zakresu 1..`ticks`. */
export function polozenieUchwytu(v: number, ticks: number): number {
  if (ticks <= 1) return POCZATEK_TORU;
  return POCZATEK_TORU + Math.trunc((DLUGOSC_TORU * (v - 1)) / (ticks - 1));
}

/** Wartosc 1..`ticks` odpowiadajaca punktowi `x` na torze. */
export function wartoscZPolozenia(x: number, ticks: number): number {
  if (ticks <= 1) return 1;
  const v = Math.trunc(((x - POCZATEK_TORU) / DLUGOSC_TORU) * (ticks - 1) + 0.5) + 1;
  return Math.min(ticks, Math.max(1, v));
}
