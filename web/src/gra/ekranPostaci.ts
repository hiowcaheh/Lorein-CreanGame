/**
 * Ekran postaci — dane ulozenia.
 *
 * Wszystkie polozenia pochodza ze stalych `POS_CHAR_*` klienta Flash.
 * Tam byly w pikselach sceny 1280x800; obszar ekranu zaczyna sie
 * w punkcie (280, 100) i ma 1000x700. Tutaj sa przeliczone na procenty,
 * wiec caly uklad skaluje sie razem z oknem.
 */

const POCZATEK_X = 280;
const POCZATEK_Y = 100;
const SZEROKOSC = 1000;
const WYSOKOSC = 700;

export interface Ramka {
  lewo: string;
  gora: string;
  szerokosc: string;
  wysokosc: string;
}

function ramka(x: number, y: number, sz: number, wy: number): Ramka {
  return {
    lewo: `${((x - POCZATEK_X) / SZEROKOSC) * 100}%`,
    gora: `${((y - POCZATEK_Y) / WYSOKOSC) * 100}%`,
    szerokosc: `${(sz / SZEROKOSC) * 100}%`,
    wysokosc: `${(wy / WYSOKOSC) * 100}%`,
  };
}

/** Kwadratowe miejsce na przedmiot ma 90x90, tak jak same obrazki. */
const BOK_SLOTU = 90;

export interface MiejsceNaPrzedmiot {
  /** Numer miejsca w bazie (kolumna `slot` tabeli `items`). */
  slot: number;
  nazwa: string;
  /** Obrazek pustego miejsca — sylwetka czapki, buta, tarczy... */
  pusty: string;
  ramka: Ramka;
}

/*
 * Uklad miejsc na przedmioty, wprost ze stalych klienta:
 *
 *   POS_CHAR_SLOTS_LEFT_X  = 304   lewa kolumna
 *   POS_CHAR_SLOTS_RIGHT_X = 680   prawa kolumna
 *   rzedy: 117, 217, 317, 417      co 100 px
 *   w rzedzie 4 dodatkowo: 441 (bron) i 543 (tarcza)
 *   plecak: rzad 679, kolumny 304, 398, 493, 588, 680
 */
export const MIEJSCA: MiejsceNaPrzedmiot[] = [
  { slot: 0, nazwa: 'Hełm', pusty: 'slot1.png', ramka: ramka(304, 117, BOK_SLOTU, BOK_SLOTU) },
  { slot: 1, nazwa: 'Zbroja', pusty: 'slot2.png', ramka: ramka(304, 217, BOK_SLOTU, BOK_SLOTU) },
  { slot: 2, nazwa: 'Rękawice', pusty: 'slot3.png', ramka: ramka(304, 317, BOK_SLOTU, BOK_SLOTU) },
  { slot: 3, nazwa: 'Buty', pusty: 'slot4.png', ramka: ramka(304, 417, BOK_SLOTU, BOK_SLOTU) },

  { slot: 4, nazwa: 'Amulet', pusty: 'slot5.png', ramka: ramka(680, 117, BOK_SLOTU, BOK_SLOTU) },
  { slot: 5, nazwa: 'Pas', pusty: 'slot6.png', ramka: ramka(680, 217, BOK_SLOTU, BOK_SLOTU) },
  { slot: 6, nazwa: 'Pierścień', pusty: 'slot7.png', ramka: ramka(680, 317, BOK_SLOTU, BOK_SLOTU) },
  { slot: 7, nazwa: 'Amulet szczęścia', pusty: 'slot8.png', ramka: ramka(680, 417, BOK_SLOTU, BOK_SLOTU) },

  // Bron i tarcza stoja pod portretem, w rzedzie czwartym.
  { slot: 8, nazwa: 'Broń', pusty: 'slot9_1.png', ramka: ramka(441, 417, BOK_SLOTU, BOK_SLOTU) },
  { slot: 9, nazwa: 'Tarcza', pusty: 'slot10.png', ramka: ramka(543, 417, BOK_SLOTU, BOK_SLOTU) },
];

/**
 * Sylwetka pustego miejsca na bron zalezy od klasy: miecz, laska albo luk.
 */
export function pustaBron(klasa: number): string {
  return klasa === 2 ? 'slot9_2.png' : klasa === 3 ? 'slot9_3.png' : 'slot9_1.png';
}

/** Plecak — piec miejsc w dolnym rzedzie. */
export const PLECAK: Ramka[] = [304, 398, 493, 588, 680].map((x) => ramka(x, 679, BOK_SLOTU, BOK_SLOTU));

/*
 * Portret. Tlo `charbg.jpg` ma juz narysowana ramke pola, wiec sam obrazek
 * postaci wchodzi do srodka — bez dokladania zlotej ramy, ktora byloby
 * ramka w ramce. POS_SCR_CHAR_CHARIMG = (408,119), REL_CHARIMG = (20,51).
 */
export const PORTRET = ramka(408 + 20, 119 + 20, 224, 224);

/** Imie stoi na dole pola portretu, jak w oryginale. */
export const NAZWA_W_POLU = ramka(408, 336, 264, 30);

export const PASEK_DOSWIADCZENIA = ramka(409, 381, 282, 24);

/*
 * Piec wierszy wartosci pod portretem. Kolumny stoja dokladnie tam, gdzie
 * w oryginale — inaczej napisy sie rozjezdzaja:
 *
 *   POS_CHAR_PROP_COLUMN_1_X = 304   nazwa cechy
 *   POS_CHAR_PROP_COLUMN_2_X = 405   wartosc cechy
 *   POS_CHAR_PROP_COLUMN_3_X = 470   przycisk dodawania punktu
 *   POS_CHAR_PROP_COLUMN_5_X = 520   nazwa wartosci pochodnej
 *   POS_CHAR_PROP_COLUMN_6_X = 650   wartosc pochodna
 *   POS_CHAR_PROP_Y = 517, REL_CHAR_PROP_Y = 32 (odstep wierszy)
 */
export const CECHY = ramka(304, 511, 400, 5 * 32 + 6);

/*
 * Szerokosci kolumn siatki.
 *
 * UWAGA na jednostke odniesienia: procenty w `grid-template-columns` licza
 * sie od szerokosci SIATKI, nie od szerokosci ekranu. Liczone wzgledem
 * ekranu (1000 px) wychodzily dwuipolkrotnie za wąskie i nazwy cech
 * zamienialy sie w "Intel...", "Obraż...".
 */
const SZEROKOSC_SIATKI = 400;

export const KOLUMNY_CECH = [
  405 - 304, // nazwa cechy
  470 - 405, // wartosc
  520 - 470, // przycisk dodania punktu
  650 - 520, // nazwa wartosci pochodnej
]
  .map((px) => `${(px / SZEROKOSC_SIATKI) * 100}%`)
  .concat('1fr')
  .join(' ');

/*
 * Wysokosc wiersza jako `1fr`, nie procent.
 *
 * Procent w `grid-auto-rows` liczy sie od wysokosci SIATKI, a nie ekranu —
 * wyszlo z tego kilka pikseli na wiersz i napisy zlewaly sie w jedna
 * plame. Piec rownych czesci wysokosci siatki daje dokladnie te 32 px
 * z oryginalu, bo taka wlasnie wysokosc ma caly blok.
 */
export const WYSOKOSC_WIERSZA = '1fr';

/** Prawa polowa ekranu. */
export const OPIS = ramka(795, 175, 470, 240);
export const WIERZCHOWIEC = ramka(805, 429, 460, 130);
export const PANCERZ = ramka(795, 595, 300, 30);
/** Osiem odznak co 55 px: POS_SCR_CHAR_ACH + REL_SCR_CHAR_ACH_X. */
export const OSIAGNIECIA = ramka(795, 628, 470, 67);
export const KATALOG_ODZNAK = '/res/sfgame/scr/char/ach/';
export const HONOR = ramka(795, 120, 470, 40);

export const TLO_LEWE = '/res/sfgame/scr/char/charbg.jpg';
export const TLO_PRAWE = '/res/sfgame/scr/char/character_right_new.jpg';
export const KATALOG_SLOTOW = '/res/sfgame/scr/char/';
