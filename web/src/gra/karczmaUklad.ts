/**
 * Ekran karczmy — dane ulozenia.
 *
 * Wszystkie polozenia pochodza ze stalych `REL_TAVERNE_*`, `POS_TAVERNE_*`
 * i `POS_QO_*` klienta Flash. Tam byly w pikselach sceny 1280x800;
 * obszar gry zaczyna sie w punkcie (280, 100), wiec tutaj sa przeliczone
 * na piksele wzgledem jego lewego gornego rogu.
 */

const POCZATEK_X = 280;
const POCZATEK_Y = 100;

export interface Ramka {
  lewo: number;
  gora: number;
  szerokosc: number;
  wysokosc: number;
}

function ramka(x: number, y: number, sz: number, wy: number): Ramka {
  return { lewo: x - POCZATEK_X, gora: y - POCZATEK_Y, szerokosc: sz, wysokosc: wy };
}

import { TYTULY_WYPRAW } from './karczma-teksty';

export const KATALOG = '/res/sfgame/scr/taverne/';

/** Tlo karczmy ma dokladnie tyle, ile obszar gry. */
export const TLO = KATALOG + 'taverne.jpg';

/*
 * Karczmarz stoi za barem i co jakis czas sie porusza — dwa obrazki po
 * 140x103 w punkcie REL_TAVERNE_BARKEEPER = (796, 322).
 */
export const KARCZMARZ = ramka(POCZATEK_X + 796, POCZATEK_Y + 322, 140, 103);
export const KLATKI_KARCZMARZA = [KATALOG + 'taverne_barkeeper1.jpg', KATALOG + 'taverne_barkeeper2.jpg'];

/** Swiece na belce nad stolem — REL_TAVERNE_KERZEN = (364, 21). */
export const SWIECE = ramka(POCZATEK_X + 364, POCZATEK_Y + 21, 279, 117);
export const OBRAZ_SWIEC = KATALOG + 'taverne_kerzen.jpg';

/*
 * Naganiacz do kubkow mruga — REL_TAVERNE_HUTAUGEN = (171, 377).
 * Sama gra w kubki jeszcze nie dziala, ale mrugniecie jest czescia
 * zycia tego ekranu.
 */
export const OCZY_NAGANIACZA = ramka(POCZATEK_X + 171, POCZATEK_Y + 377, 28, 25);
export const OBRAZ_MRUGNIECIA = KATALOG + 'huetchenspieler_blink.jpg';

/*
 * Grupa przy stole, ktora rozdaje zadania. Piec wariantow obrazka po
 * 312x357 w punkcie REL_TAVERNE_QUEST = (285, 281); ten sam punkt jest
 * obszarem klikalnym o rozmiarze SIZE_TAVERNE_QUEST = 312x307.
 */
export const GRUPA_ZADAN = ramka(POCZATEK_X + 285, POCZATEK_Y + 281, 312, 357);
export const KLIK_ZADANIA = ramka(POCZATEK_X + 285, POCZATEK_Y + 281, 312, 307);
export const KLATKI_GRUPY = [1, 2, 3, 4, 5].map((n) => `${KATALOG}taverne_quest${n}.jpg`);

/**
 * Podswietlenie postaci, ktora akurat siedzi przy stole.
 *
 * Kazdy wariant grupy ma inna osobe rozdajaca zadania i wlasne
 * przesuniecie wzgledem obrazka grupy — REL_TAVERNE_QUESTOVL1..5.
 */
export const PODSWIETLENIA_GRUPY: { obraz: string; przesuniecieX: number; przesuniecieY: number; szerokosc: number; wysokosc: number }[] = [
  { obraz: KATALOG + 'taverne_orc_mouseover.jpg', przesuniecieX: 182, przesuniecieY: 60, szerokosc: 53, wysokosc: 43 },
  { obraz: KATALOG + 'taverne_bauer_mouseover.jpg', przesuniecieX: 149, przesuniecieY: 116, szerokosc: 31, wysokosc: 15 },
  { obraz: KATALOG + 'taverne_zauberin_mouseover.jpg', przesuniecieX: 180, przesuniecieY: 58, szerokosc: 18, wysokosc: 14 },
  { obraz: KATALOG + 'taverne_questgeber_mouseover.jpg', przesuniecieX: 169, przesuniecieY: 44, szerokosc: 32, wysokosc: 29 },
  { obraz: KATALOG + 'taverne_tourist_mouseover.jpg', przesuniecieX: 30, przesuniecieY: 31, szerokosc: 64, wysokosc: 45 },
];

/*
 * Bar. Obszar klikalny POS_TAVERNE_BAR = (1030, 320) o rozmiarze 200x200,
 * a podswietlenie POS_TAVERNE_BAROVL = (1093, 320).
 */
export const KLIK_BARU = ramka(1030, 320, 200, 200);
export const PODSWIETLENIE_BARU = ramka(1093, 320, 89, 98);
export const OBRAZ_PODSWIETLENIA_BARU = KATALOG + 'barkeeper_mouseover.jpg';

/*
 * Pasek wytrzymalosci. Rama POS_TIMEBAR = (380, 660), wypelnienie
 * zaczyna sie 110 px w prawo i 44 px nizej, a jego pelna dlugosc to
 * 555 px (`RefreshTimeBar`: `(thirst / 6000) * 555`).
 */
export const PASEK = ramka(380, 660, 776, 119);
export const WYPELNIENIE_PASKA = ramka(380 + 110, 660 + 44, 555, 27);
export const OBRAZ_PASKA = '/res/sfgame/if/adventurebar.png';
export const OBRAZ_WYPELNIENIA = KATALOG + 'ausdauer.jpg';
/** Napis z czasem: POS_TIMEBAR_LABEL = (768, 705). */
export const NAPIS_PASKA = ramka(768, 705, 0, 0);

/*
 * Okno wyboru zadania. Przydymiona plansza POS_QO_BLACK_SQUARE =
 * (410, 230) o rozmiarze 740x440 i przezroczystosci 0,6.
 */
export const OKNO = ramka(410, 230, 740, 440);
/** Portret rozdajacego zadania: REL_QO_PORTRAIT = (20, 20). */
export const OKNO_PORTRET = ramka(410 + 20, 230 + 20, 200, 200);
/** Naglowek: REL_QO_QUESTNAME = (480, 20) — wysrodkowany w tym punkcie. */
export const OKNO_NAGLOWEK = ramka(410 + 480, 230 + 20, 0, 0);
/** Opis: REL_QO_QUESTTEXT = (250, 60), szerokosc SIZE_LBL_QO_TEXT_X = 470. */
export const OKNO_OPIS = ramka(410 + 250, 230 + 60, 470, 200);
/*
 * Trzy wyprawy do wyboru: REL_QO_CHOOSE = (20, 280), co REL_QO_CHOICES_Y = 40.
 *
 * Szerokosc konczy sie tam, gdzie zaczyna sie kolumna nagrod (x = 660),
 * czyli 220 px. W oryginale sa to etykiety bez ograniczenia szerokosci,
 * ale mieszcza sie, bo pokazuja krotkie TYTULY wypraw — a nie dlugie
 * nazwy krain, ktore stoja w opisie.
 */
export const OKNO_WYBOR = ramka(410 + 20, 230 + 280, 220, 30);
export const ODSTEP_WYBOROW = 40;
/*
 * Nagrody.
 *
 * Stoja w TEJ SAMEJ kolumnie, co opis wyprawy — `REL_QO_QUESTTEXT_X = 250`,
 * czyli x = 660. Kazdy wiersz nizej o `REL_QO_REWARDS_Y = 40`:
 *
 *   y = 510   napis „Wynagrodzenie"
 *   y = 550   zloto i srebro
 *   y = 590   doswiadczenie
 *   y = 630   czas trwania
 *
 * Wczesniej bylo tu x = 810 i szerokosc 300, wiec kolumna siegala 1110 —
 * a przyciski zaczynaja sie na 960. Napisy wchodzily na nie i dluzsze
 * liczby stawaly sie nieczytelne.
 */
export const OKNO_NAGRODY = ramka(410 + 250, 230 + 280, 165, 30);
export const ODSTEP_NAGROD = 40;
/** Miejsce na przedmiot do zdobycia: REL_QO_SLOT = (400, 335). */
export const OKNO_PRZEDMIOT = ramka(410 + 400, 230 + 335, 90, 90);
/*
 * Oba przyciski stoja w jednej kolumnie, REL_QO_START_X = 550.
 *
 * UWAGA: w oryginale nazwy stalych sa zamienione miejscami —
 * `BTN_QO_START` dostaje `REL_QO_RETURN_Y`, a `BTN_QO_RETURN` dostaje
 * `REL_QO_START_Y`. Przepisujemy zachowanie, nie nazwy: wyruszenie jest
 * wyzej (325), powrot nizej (380).
 */
export const OKNO_START = ramka(410 + 550, 230 + 325, 180, 50);
export const OKNO_POWROT = ramka(410 + 550, 230 + 380, 180, 50);

/*
 * Pasek postepu wyprawy. Rama POS_QUESTBAR = (390, 580), napis
 * POS_QUESTBAR_LABEL = (778, 625), przycisk przerwania
 * POS_QUEST_CANCEL = (780, 700).
 */
export const POSTEP = ramka(390, 580, 776, 119);
export const POSTEP_WYPELNIENIE = ramka(390 + 110, 580 + 44, 555, 27);
export const POSTEP_NAPIS = ramka(778, 625, 0, 0);
export const POSTEP_PRZERWIJ = ramka(780, 700, 180, 50);

/** Tlo krainy podczas wyprawy — `scr/quest/locations/locationN.jpg`, 1000x700. */
export function tloKrainy(lokacja: number): string {
  return `/res/sfgame/scr/quest/locations/location${Math.max(1, Math.min(21, lokacja))}.jpg`;
}

/*
 * Ekran walki — stale `POS_FIGHT_*` i `POS_OPPIMG_*` klienta.
 *
 *   POS_FIGHT_CHARIMG_X = 315, POS_OPPIMG = (930, 130)   portrety 300x300
 *   lifebar.png 300x46 pod portretem, 15 px nizej (REL_LIFEBAR_Y)
 *   POS_FIGHT_CHAR_PROP_Y = 520, wiersze co REL_FIGHT_CHAR_PROP_Y = 32
 *   kolumny: 324 i 450 (gracz), 1059 i 1185 (przeciwnik)
 *   box1.png pod statystykami, przesuniete o REL_FIGHT_BOX1 = (-17, -15)
 */
export const WALKA_PORTRET_GRACZA = ramka(315, 130, 300, 300);
export const WALKA_PORTRET_POTWORA = ramka(930, 130, 300, 300);
/** Ramka portretu `character_border.png` ma 320x320 — o 10 px szersza. */
export const WALKA_RAMKA_PORTRETU = 10;

export const WALKA_PASEK_GRACZA = ramka(315, 130 + 300 + 15, 300, 46);
export const WALKA_PASEK_POTWORA = ramka(930, 130 + 300 + 15, 300, 46);

/*
 * Imie i poziom: `LBL_NAMERANK_*` jest WYSRODKOWANE pod portretem —
 * `x = POS_..._X + 150 - textWidth/2`, a dolna krawedz napisu siedzi
 * na `POS_OPPIMG_Y + 290`, czyli tuz nad paskiem zycia.
 */
export const WALKA_NAZWA_GRACZA = ramka(315, 130 + 290 - 30, 300, 30);
export const WALKA_NAZWA_POTWORA = ramka(930, 130 + 290 - 30, 300, 30);

export const WALKA_STATY_Y = 520 - POCZATEK_Y;
export const WALKA_ODSTEP_STATOW = 32;
export const WALKA_KOLUMNY_GRACZA = [324 - POCZATEK_X, 450 - POCZATEK_X];
export const WALKA_KOLUMNY_POTWORA = [1059 - POCZATEK_X, 1185 - POCZATEK_X];
/** `box1.png` 194x177 — jedna pod kazdym kompletem statystyk. */
export const WALKA_RAMKA_STATOW_GRACZA = ramka(324 - 17, 520 - 15, 194, 177);
export const WALKA_RAMKA_STATOW_POTWORA = ramka(1059 - 17, 520 - 15, 194, 177);
/** `box2.png` 508x177 na srodku: POS_SCREEN_TITLE_X = 770, minus 254. */
export const WALKA_RAMKA_SRODKOWA = ramka(770 - 254, 520 - 15, 508, 177);

/** Bron leci na wysokosci POS_FIGHT_WEAPONS_Y = 350. */
export const WALKA_WYSOKOSC_BRONI = 350 - POCZATEK_Y;
/** Srodek sceny walki — wokol niego kraza obrazki broni. */
export const WALKA_SRODEK_X = 770 - POCZATEK_X;

export const OBRAZ_RAMKI_PORTRETU = '/res/sfgame/scr/fight/character_border.png';
export const OBRAZ_PASKA_ZYCIA = '/res/sfgame/scr/fight/lifebar.png';
export const OBRAZ_WYPELNIENIA_ZYCIA = '/res/sfgame/scr/fight/lifebar_red.png';
export const OBRAZ_RAMKI_STATOW = '/res/sfgame/scr/fight/box1.png';
export const OBRAZ_RAMKI_SRODKOWEJ = '/res/sfgame/scr/fight/box2.png';
/** Szesc klatek uderzenia piescia — `smash1.png`..`smash6.png`, 286x202. */
export const KLATKI_UDERZENIA = [1, 2, 3, 4, 5, 6].map((n) => `/res/sfgame/scr/fight/smash${n}.png`);
/**
 * Portret potwora.
 *
 * Numer z serwera liczy od jedynki, a plik od dwojki: klient definiuje
 * obrazek jako `monster{i + 1}.jpg` dla pozycji `i` w tablicy, a serwer
 * wysyla te pozycje wprost. Stad przesuniecie o jeden.
 */
export function obrazPotwora(numer: number): string {
  return `/res/sfgame/scr/fight/monster/monster${numer + 1}.jpg`;
}

/**
 * Tytul wyprawy — port `GetQuestTitle()` i `GetQuestRandom()`.
 *
 * Tytul nie jest losowany. Klient liczy sume kontrolna z WSZYSTKICH
 * danych zadania i bierze ja modulo dlugosc zakresu tytulow dla danego
 * rodzaju. Dzieki temu ten sam komplet zadan zawsze pokazuje te same
 * tytuly — odswiezenie strony niczego nie podmienia, a serwer nie musi
 * ich przechowywac.
 */
export function tytulWyprawy(zadanie: {
  rodzaj: number;
  lokacja: number;
  dlugosc: number;
  doswiadczenie: number;
  zloto: number;
  premia: number;
  nagrodaPrzedmiotowa?: { typ: number; numer: number } | null;
}): string {
  const zakres = TYTULY_WYPRAW[zadanie.rodzaj];
  if (!zakres || zakres.length === 0) return '';

  /*
   * Skladniki sumy sa dokladnie te, co w `GetQuestRandom`: poziom zadania,
   * rodzaj, przeciwnik, lokacja, dlugosc, doswiadczenie, zloto oraz rodzaj
   * i numer przedmiotu-nagrody. Poziom zadania tego serwera jest zawsze
   * zerowy — `req.php` nie wypelnia tego pola.
   */
  const nagroda = zadanie.nagrodaPrzedmiotowa;
  const suma =
    Math.abs(zadanie.rodzaj) +
    Math.abs(zadanie.premia) +
    Math.abs(zadanie.lokacja) +
    Math.abs(zadanie.dlugosc) +
    Math.abs(zadanie.doswiadczenie) +
    Math.abs(zadanie.zloto) +
    Math.abs(nagroda?.typ ?? 0) +
    Math.abs(nagroda?.numer ?? 0);

  return zakres[suma % zakres.length] ?? '';
}

/** Portrety rozdajacych zadania — po jednym na wariant grupy. */
export const PORTRETY_ZADAN = [1, 2, 3, 4, 5].map((n) => `${KATALOG}portrait_questgeber_${n}.png`);
/** Portrety karczmarza: zwykly, „za zdrowy" i odmowa. */
export const PORTRETY_KARCZMARZA = [1, 2, 3].map((n) => `${KATALOG}portrait_barkeeper_${n}.png`);

/**
 * Ktory wariant grupy siedzi przy stole.
 *
 * Oryginal nie losuje tego w kliencie — liczy sume kontrolna z danych
 * zadan (`GetQuestRandom`) i bierze ja modulo liczbe wariantow. Dzieki
 * temu obrazek jest staly dla danego kompletu zadan i zmienia sie
 * dopiero razem z nim, a odswiezenie strony niczego nie podmienia.
 */
export function wariantGrupy(zadania: { lokacja: number; dlugosc: number; doswiadczenie: number; zloto: number }[]): number {
  const suma = zadania.reduce(
    (s, z) => s + Math.abs(z.lokacja) + Math.abs(z.dlugosc) + Math.abs(z.doswiadczenie) + Math.abs(z.zloto),
    0,
  );
  return suma % KLATKI_GRUPY.length;
}

/**
 * Czas w postaci `h:mm:ss` albo `m:ss`, tak jak na pasku w oryginale.
 */
export function czas(sekundy: number): string {
  const s = Math.max(0, Math.trunc(sekundy));
  const godziny = Math.trunc(s / 3600);
  const minuty = Math.trunc((s % 3600) / 60);
  const reszta = s % 60;

  const dwie = (n: number) => String(n).padStart(2, '0');
  return godziny > 0 ? `${godziny}:${dwie(minuty)}:${dwie(reszta)}` : `${minuty}:${dwie(reszta)}`;
}
