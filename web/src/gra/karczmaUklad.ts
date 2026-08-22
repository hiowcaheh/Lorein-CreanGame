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
export const OKNO_NAGRODY = ramka(410 + 250, 230 + 280, 190, 30);
export const ODSTEP_NAGROD = 40;
/*
 * Miejsce na przedmiot do zdobycia. Oryginal ma `REL_QO_SLOT = (400, 335)`,
 * czyli x = 810 — ale tam ikona wchodzi na wiersz doswiadczenia, odkad
 * stoi przy nim znaczek premii. Przesuwamy ja o 50 px w prawo, do samych
 * przyciskow: te zaczynaja sie na `REL_QO_START_X = 550`, czyli 960,
 * a ikona konczy sie na 950. Kolumna nagrod rosnie o tyle samo.
 */
export const OKNO_PRZEDMIOT = ramka(410 + 450, 230 + 335, 90, 90);
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

/**
 * Tlo krainy — `scr/quest/locations/locationN.jpg`, 1000x700.
 *
 * Wyprawy uzywaja numerow 1-21, lochy 51-63 (`IMG_SCR_QUEST_BG_1 + 50 + N`),
 * a wieza i portal maja wlasne pliki. Gorna granica to najwyzszy numer,
 * jaki lezy w katalogu.
 */
const NAJWYZSZA_KRAINA = 66;

export function tloKrainy(lokacja: number): string {
  const numer = Math.max(1, Math.min(NAJWYZSZA_KRAINA, lokacja));
  return `/res/sfgame/scr/quest/locations/location${numer}.jpg`;
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
/** Srodek sceny walki — POS_SCREEN_TITLE_X = 770. */
export const WALKA_SRODEK_X = 770 - POCZATEK_X;

/*
 * Napis z obrazeniami stoi na SRODKU sceny, przesuniety o 200 px w strone
 * tego, kto oberwal — `x = POS_SCREEN_TITLE_X + (opponent ? -1 : 1) * 200`,
 * `y = POS_FIGHT_WEAPONS_Y - 100`. Nie nad portretem, jak bylo u nas.
 */
export const WALKA_OBRAZENIA_Y = 350 - 100 - POCZATEK_Y;
export const WALKA_OBRAZENIA_ODSTEP = 200;

/**
 * Przycisk „Pomin" i „OK": `POS_FIGHT_BTN_Y = 710`, wysrodkowany
 * w `POS_SCREEN_TITLE_X` (`x = 770 - width / 2`). Kamien `btnClassBasic`
 * ma 174x45 — to inny obrazek niz przycisk menu (180x50, z okuciem).
 */
export const WALKA_PRZYCISK = ramka(770 - 87, 710, 174, 45);
/** Podsumowanie walki: POS_FIGHT_SUMMARY_Y = 520, wysrodkowane. */
export const WALKA_PODSUMOWANIE_Y = 520 - POCZATEK_Y;
/** Szerokosc zdania o wyniku — `SIZE_FIGHT_RESULT_TEXT_X = 490`. */
export const WALKA_SZEROKOSC_PODSUMOWANIA = 490;

/*
 * NAGRODY W RAMCE PODSUMOWANIA.
 *
 * Klient rozklada je czterema stalymi i jedna zasada: ikony z liczbami
 * ida od PRAWEJ do lewej, poczawszy od `POS_FIGHT_REWARDGOLD_X`.
 *
 *   CNT_FIGHT_SLOT        (POS_SCREEN_TITLE_X - 45, POS_FIGHT_SLOT_Y)
 *   LBL_FIGHT_REWARDEXP   (POS_FIGHT_REWARDEXP_X, POS_FIGHT_REWARDGOLD_Y)
 *   grzyby                prawa krawedz POS_FIGHT_REWARDGOLD_X, y POS_FIGHT_REWARDMUSH_Y
 *   zloto i srebro        prawa krawedz POS_FIGHT_REWARDGOLD_X, y POS_FIGHT_REWARDGOLD_Y
 *
 * Kolejnosc w wierszu pieniedzy wynika z kolejnosci galezi w kodzie:
 * najpierw ustawia sie SREBRO (i idzie w lewo), potem zloto. Na ekranie
 * wychodzi wiec „zloto, ikona, srebro, ikona" konczace sie na 1000.
 */
/** Ikonka zdobytego przedmiotu, 90x90. */
export const WALKA_ZDOBYCZ = ramka(770 - 45, 580, 90, 90);
/** Lewa krawedz napisu o doswiadczeniu. */
export const WALKA_DOSWIADCZENIE_X = 535 - POCZATEK_X;
/** Prawa krawedz obu wierszy z pieniedzmi i grzybami. */
export const WALKA_NAGRODY_PRAWA = 1000 - POCZATEK_X;
export const WALKA_GRZYBY_Y = 610 - POCZATEK_Y;
export const WALKA_PIENIADZE_Y = 640 - POCZATEK_Y;

/**
 * Napis o awansie — tuz pod dolna krawedzia `box2.png` (505 + 177 = 682),
 * nad przyciskiem na 710. Podskok unosi go z powrotem nad ramke.
 */
export const WALKA_AWANS_Y = 684 - POCZATEK_Y;

/*
 * ANIMACJA CIOSU — port `WeaponStrike()` z `MainTimeline.as`.
 *
 * Oryginal odlicza ja zegarem `StrikeAniTimer` co 40 ms i ma DWIE galezie
 * o roznym tempie i roznej geometrii. O tym, ktora gra, decyduje numer
 * broni:
 *
 *   (weapon < 0 && weapon > -4) || weapon < -6   galaz „lekka"
 *   reszta (0, -4, -5, -6 i kazda prawdziwa bron) galaz „ciezka"
 *
 * Lekka to plaska klatka wyswietlona przy celu (pazur, machniecie).
 * Ciezka to obrazek broni, ktory leci lukiem od atakujacego do celu,
 * obracajac sie — i to wlasnie tam widac IKONE zalozonej broni.
 */

/** `SPRITE_SCALE` z klienta — skala broni i tarczy w galezi ciezkiej. */
export const WALKA_SKALA_SPRITE = 1.5;

/**
 * Ktora galezia leci cios.
 *
 * Warunek przepisany znak w znak z `StrikeAniTimerEvent`.
 */
export function lekkiCios(numer: number): boolean {
  return (numer < 0 && numer > -4) || numer < -6;
}

const ITM = '/res/sfgame/itm/';

/**
 * Klatki galezi lekkiej.
 *
 * Pazur (-1) ma cztery klatki, plusniecie (-3) i ogien (-7) po trzy,
 * a wszystko inne — machniecie `swoosh`. Klient wybiera klatke jako
 * `int(strikeVal * 3.9)` przy pazurze i `int(strikeVal * 2.9)` przy
 * pozostalych, stad rozne dlugosci tablic.
 */
export function klatkiLekkiegoCiosu(numer: number): string[] {
  if (numer === -1) return [1, 2, 3, 4].map((n) => `${ITM}kampf_kralle${n}.png`);
  if (numer === -3) return [1, 2, 3].map((n) => `${ITM}kampf_splat${n}.png`);
  if (numer === -7) return [1, 2, 3].map((n) => `${ITM}kampf_feuer${n}.png`);
  return [1, 2, 3].map((n) => `${ITM}kampf_swoosh${n}.png`);
}

/**
 * Obrazek galezi ciezkiej.
 *
 * `ikona` to sciezka do ikony zalozonej broni — klient stawia w
 * kontenerze ciosu dokladnie ten sam obrazek, ktory widac w ekwipunku
 * (`SetCnt(CNT_WEAPON_CHAR, GetItemID(0, 0, weaponData), -30, -30, true)`).
 * Bez broni w rece leci piesc, a potwory maja swoje kije i kosci.
 *
 * Numer dodatni bez ikony zdarza sie tylko przy potworze-magu (bron
 * 1004). Oryginal wchodzi wtedy w galaz luku, ktorej ten komplet
 * zasobow nie ma: nie ma ani katalogu `itm/8-2/`, ani grafik strzal.
 * Zamiast rysowac cokolwiek z glowy zostaje machniecie.
 */
export function obrazCiezkiegoCiosu(numer: number, ikona: string | null): string {
  if (numer === -4) return `${ITM}kampf_stock.png`;
  if (numer === -5) return `${ITM}kampf_knochen.png`;
  if (numer === -6) return `${ITM}kampf_steinfaust.png`;
  if (numer <= 0) return `${ITM}kampf_faust.png`;
  return ikona ?? `${ITM}kampf_swoosh1.png`;
}

/**
 * Polozenie kontenera broni, oba warianty.
 *
 * Wszystkie liczby wprost z klienta; `POS_SCREEN_TITLE_X = 770`,
 * `POS_FIGHT_WEAPONS_Y = 350`. `odBohatera` odpowiada zanegowanemu
 * `opponent` z oryginalu.
 */
export function bronLekkaX(odBohatera: boolean, blok: boolean): number {
  const znak = odBohatera ? 1 : -1;
  return 770 + (odBohatera ? 0 : 231) - 115 + znak * 560 * (blok ? 0.7 : 1) - POCZATEK_X;
}

/** Galaz lekka trzyma bron na stalej wysokosci `POS_FIGHT_WEAPONS_Y - 240`. */
export const WALKA_BRON_LEKKA_Y = 350 - 240 - POCZATEK_Y;

export function bronCiezkaX(odBohatera: boolean, blok: boolean, s: number): number {
  const znak = odBohatera ? 1 : -1;
  return 770 + (odBohatera ? 0 : 231) - 115 + znak * 230 * s * (blok ? 0.7 : 1) - POCZATEK_X;
}

export function bronCiezkaY(s: number, krytyczny: boolean): number {
  return 350 - Math.cos((s * Math.PI) / 2) * (75 + (krytyczny ? 75 : 0)) - POCZATEK_Y;
}

export function bronCiezkaObrot(odBohatera: boolean, s: number): number {
  return (280 + 100 * s) * (odBohatera ? 1 : -1);
}

/**
 * Tarcza obroncy.
 *
 * Stoi po DRUGIEJ stronie niz bron — `(opponent ? 0 : 231)` zamiast
 * `(opponent ? 231 : 0)` — i lekko sie kolysze.
 */
export function tarczaX(odBohatera: boolean, s: number, ciezki: boolean): number {
  const znak = odBohatera ? 1 : -1;
  const rozped = s > 0.9 && ciezki ? s + 0.2 : 1;
  return 770 + (odBohatera ? 231 : 0) - 115 + znak * 50 * rozped - POCZATEK_X;
}

export function tarczaY(s: number): number {
  return 350 - Math.cos(s * 2 * Math.PI) * 20 - 20 - POCZATEK_Y;
}

/*
 * GALAZ 2 — ROZDZKA MAGA (`weaponType == 2`)
 *
 * Rozdzka zostaje przy rzucajacym i tylko sie kolysze, a przez ekran
 * leci kula, ktora ROSNIE w locie. Kontener broni ma tu obrazek
 * przesuniety o (30, -30), a nie (-30, -30) jak przy broni bialej.
 */
export const WALKA_ROZDZKA_OFFSET_X = 30;
export function rozdzkaX(odBohatera: boolean): number {
  return 770 + (odBohatera ? -1 : 1) * 170 - POCZATEK_X;
}
export const WALKA_ROZDZKA_Y = 350 - POCZATEK_Y;
export function rozdzkaObrot(odBohatera: boolean, s: number): number {
  return (odBohatera ? 1 : -1) * (-30 + 70 * s);
}

/** Kula maga: rosnie od zera do podwojnej wielkosci, leciac 300 px. */
export function kulaX(odBohatera: boolean, s: number): number {
  const znak = odBohatera ? 1 : -1;
  return 770 + -znak * 200 + znak * 300 * s - POCZATEK_X;
}
/** `y = POS_FIGHT_WEAPONS_Y - 70 - height / 2` — wysokosc juz przeskalowana. */
export const WALKA_KULA_Y = 350 - 70 - POCZATEK_Y;

/*
 * GALAZ 3 — LUK I KUSZA (`weaponType == 3`)
 *
 * Luk stoi przy strzelajacym przechylony o 42 stopnie, a belt rusza
 * dopiero po `strikeVal > 0.3` i leci 400 px. Kontener broni nie jest
 * tu ani przesuniety, ani wysrodkowany — `SetCnt` bez zadnych offsetow.
 */
export function lukX(odBohatera: boolean): number {
  return 770 + (odBohatera ? -1 : 1) * 200 - POCZATEK_X;
}
export const WALKA_LUK_Y = 350 - 140 - POCZATEK_Y;
export function lukObrot(odBohatera: boolean): number {
  return odBohatera ? 42 : -42;
}

export function beltX(odBohatera: boolean, s: number, blok: boolean): number {
  const znak = odBohatera ? 1 : -1;
  const podstawa = 770 + -znak * 200;
  if (s <= 0.3) return podstawa + znak * ((0.3 / s) * 10) - POCZATEK_X;
  return podstawa + znak * 400 * s * (blok ? 0.7 : 1) - POCZATEK_X;
}
export const WALKA_BELT_Y = 350 - 110 - POCZATEK_Y;
export function beltObrot(odBohatera: boolean, s: number): number {
  return (odBohatera ? 1 : -1) * (42 + (s - 0.3) * 6);
}

/**
 * Wybuch „SMASH" — `CNT_FIGHT_ONO`, szesc klatek `smash1..6.png`
 * (286x202). Pojawia sie TYLKO w galezi ciezkiej i tylko przy ciosie
 * zwyklym albo krytycznym; przy bloku i uniku klient go chowa.
 * Zaczyna od skali 0.6 i rosnie po 0.2 na tik, gasnac.
 */
export const KLATKI_UDERZENIA = [1, 2, 3, 4, 5, 6].map((n) => `/res/sfgame/scr/fight/smash${n}.png`);
/**
 * Polozenie i skala wybuchu zaleza od typu broni — klient ma dla kazdego
 * osobna galaz `switch (weaponType)`:
 *
 *     1: x +- 200, y - 20, skala 0.6 i +0.2 na tik
 *     2: x +- 230, y - 40, skala 0.3 i +0.1
 *     3: x +- 235, y - 42, skala 0.4 i +0.05, odbita po stronie potwora
 */
export function onoX(odBohatera: boolean, typAnimacji: number): number {
  const odsun = typAnimacji === 2 ? 230 : typAnimacji === 3 ? 235 : 200;
  return 770 + (odBohatera ? 1 : -1) * odsun - POCZATEK_X;
}
export function onoY(typAnimacji: number): number {
  const podnies = typAnimacji === 2 ? 40 : typAnimacji === 3 ? 42 : 20;
  return 350 - podnies - POCZATEK_Y;
}
export function onoSkalaPoczatkowa(typAnimacji: number): number {
  return typAnimacji === 2 ? 0.3 : typAnimacji === 3 ? 0.4 : 0.6;
}
export function onoPrzyrostSkali(typAnimacji: number): number {
  return typAnimacji === 2 ? 0.1 : typAnimacji === 3 ? 0.05 : 0.2;
}

export const OBRAZ_RAMKI_PORTRETU = '/res/sfgame/scr/fight/character_border.png';
export const OBRAZ_PASKA_ZYCIA = '/res/sfgame/scr/fight/lifebar.png';
export const OBRAZ_WYPELNIENIA_ZYCIA = '/res/sfgame/scr/fight/lifebar_red.png';
export const OBRAZ_RAMKI_STATOW = '/res/sfgame/scr/fight/box1.png';
export const OBRAZ_RAMKI_SRODKOWEJ = '/res/sfgame/scr/fight/box2.png';
/**
 * Portret potwora. Numer liczy sie od jedynki — tak samo jak plik.
 *
 * Klient definiuje obrazki petla `DefineImg(IMG_OPPIMG_MONSTER + k,
 * "monster" + (k + 1) + ".jpg")`, czyli pozycja `k` to plik `k + 1`,
 * ale pokazuje je o jeden nizej:
 *
 *     Add((IMG_OPPIMG_MONSTER + oppMonster) - 1);
 *
 * gdzie `oppMonster` to numer wprost z serwera. Obie zamiany sie znosza
 * i zostaje `monster{numer}.jpg`. Zgadza sie to z nazwa potwora, ktora
 * klient bierze z `TXT_MONSTER_NAME + oppMonster - 1`, i z klaserem,
 * gdzie potwor o numerze `n` siedzi pod bitem `n - 1`.
 */
export function obrazPotwora(numer: number): string {
  return `/res/sfgame/scr/fight/monster/monster${numer}.jpg`;
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
