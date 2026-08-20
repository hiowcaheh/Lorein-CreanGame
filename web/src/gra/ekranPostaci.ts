/**
 * Ekran postaci — dane ulozenia.
 *
 * Wszystkie polozenia pochodza ze stalych `POS_CHAR_*` klienta Flash.
 * Tam byly w pikselach sceny 1280x800; obszar ekranu gry zaczyna sie
 * w punkcie (280, 100) i ma 1000x700, wiec tutaj sa przeliczone na
 * piksele wzgledem lewego gornego rogu tego obszaru.
 *
 * PIKSELE, nie procenty. Cala scena jest skalowana jednym
 * `transform: scale()` (patrz `useSkalaSceny`), wiec piksel oryginalu jest
 * tu prawdziwa jednostka miary i mozna przepisywac stale wprost. Procenty
 * byly zrodlem ciaglych pomylek: liczyly sie raz od szerokosci ekranu, raz
 * od szerokosci siatki, raz od wysokosci rodzica.
 */

const POCZATEK_X = 280;
const POCZATEK_Y = 100;

export interface Ramka {
  lewo: string;
  gora: string;
  szerokosc: string;
  wysokosc: string;
}

function ramka(x: number, y: number, sz: number, wy: number): Ramka {
  return {
    lewo: `${x - POCZATEK_X}px`,
    gora: `${y - POCZATEK_Y}px`,
    szerokosc: `${sz}px`,
    wysokosc: `${wy}px`,
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
 * Portret.
 *
 * Klient rysuje warstwy twarzy (kazda 300x300) w punkcie
 * POS_SCR_CHAR_CHARIMG = (408,119) ze skala 0,86 — czyli pole ma
 * 300 * 0,86 = 258 pikseli boku. Wczesniej bylo tu 224 px z przesunieciem
 * o 20 px i portret plywal w srodku ramki, zostawiajac dookola puste
 * niebieskie tlo.
 */
export const PORTRET = ramka(408, 119, 258, 258);

/** Imie stoi na dole pola portretu: POS_CHAR_NAME = (410, 345). */
export const NAZWA_W_POLU = ramka(408, 345, 258, 26);

/*
 * Pasek doswiadczenia.
 *
 * Rozmiar bierze sie z obszaru klikalnego w oryginale:
 * `DefineClickArea(CA_SCR_CHAR_EXPBAR, ..., 409, 381, 254, 24)`.
 * Wczesniej bylo 282 px szerokosci i pasek wystawal poza ramke portretu.
 */
export const PASEK_DOSWIADCZENIA = ramka(409, 381, 254, 24);
export const WYPELNIENIE_PASKA = '/res/sfgame/scr/char/experience.jpg';

/*
 * Piec wierszy wartosci pod portretem:
 *
 *   POS_CHAR_PROP_COLUMN_1_X = 304   nazwa cechy
 *   POS_CHAR_PROP_COLUMN_2_X = 405   wartosc cechy
 *   POS_CHAR_PROP_COLUMN_3_X = 470   przycisk dodawania punktu
 *   POS_CHAR_PROP_COLUMN_5_X = 520   nazwa wartosci pochodnej
 *   POS_CHAR_PROP_COLUMN_6_X = 650   wartosc pochodna
 *   POS_CHAR_PROP_Y = 517, REL_CHAR_PROP_Y = 32 (odstep wierszy)
 *
 * Wszystkie napisy sa wyrownane do LEWEJ swojej kolumny — w oryginale to
 * zwykle pola tekstowe z `autoSize = LEFT` postawione w tych punktach.
 */
export const WIERSZ_CECHY_Y = 517;
export const ODSTEP_WIERSZA = 32;
export const KOLUMNY_CECH = [304, 405, 470, 520, 650].map((x) => x - POCZATEK_X);

/** Przycisk „+" stoi 3 px wyzej niz wiersz (patrz `DefineBtn` w oryginale). */
export const PRZESUNIECIE_PLUSA = -3;
/** `plus.png` ma 33x33. */
export const BOK_PLUSA = 33;

/*
 * Prawa polowa ekranu:
 *
 *   POS_GILDEEHRE          = (795, 120), SIZE_GILDEEHRE = 375x40
 *   ikona klasy            = (795, 120), 40x40
 *   napis o czci           = y 130
 *   ciemna plansza opisu   = (795, 175), 440x200, przezroczystosc 0,65
 *   pole tekstowe opisu    = (805, 185)
 *   POS_CHAR_MOUNT         = (805, 429), wiersze co 25
 *   portret wierzchowca    = (805 + 274, 429), 150x150
 *   pancerz: ikona         = (795, 595), 40x40; napis (840, 602)
 *   POS_SCR_CHAR_ACH       = (795, 635), osiem odznak 50x67 co 55
 */
export const IKONA_KLASY = ramka(795, 120, 40, 40);
export const HONOR = ramka(845, 128, 325, 26);
export const OPIS = ramka(795, 175, 440, 200);
export const WIERZCHOWIEC = ramka(805, 429, 269, 130);
export const PORTRET_WIERZCHOWCA = ramka(1079, 429, 150, 150);
export const IKONA_PANCERZA = ramka(795, 595, 40, 40);
export const PANCERZ = ramka(840, 602, 300, 26);
export const OSIAGNIECIA = ramka(795, 635, 7 * 55 + 50, 67);

export const KATALOG_ODZNAK = '/res/sfgame/scr/char/ach/';
/** Ikony klas: 1 wojownik, 2 mag, 3 lowca — tak jak w oryginale. */
export const IKONY_KLAS: Record<number, string> = {
  1: '/res/sfgame/scr/char/char_krieger.jpg',
  2: '/res/sfgame/scr/char/char_magier.jpg',
  3: '/res/sfgame/scr/char/char_dieb.jpg',
};
export const IKONA_TARCZY = '/res/sfgame/scr/char/icon_schild.jpg';

export const TLO_LEWE = '/res/sfgame/scr/char/charbg.jpg';
export const TLO_PRAWE = '/res/sfgame/scr/char/character_right_new.jpg';
export const KATALOG_SLOTOW = '/res/sfgame/scr/char/';
