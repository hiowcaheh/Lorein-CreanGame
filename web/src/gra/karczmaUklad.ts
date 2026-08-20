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
/** „Wybierz wyprawe": REL_QO_CHOOSE = (20, 280); wybory co REL_QO_CHOICES_Y = 40. */
export const OKNO_WYBOR = ramka(410 + 20, 230 + 280, 400, 30);
export const ODSTEP_WYBOROW = 40;
/** Naglowek nagrod: REL_QO_REWARD_Y = 280, wiersze co REL_QO_REWARDS_Y = 40. */
export const OKNO_NAGRODY = ramka(410 + 400, 230 + 280, 300, 30);
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
