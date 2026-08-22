/**
 * Lochy — uklad listy i ekranu jednego lochu.
 *
 * Wszystko ze stalych `POS_MQS_*`, `POS_MQ_*` i `REL_MQ_*` klienta Flash,
 * przeliczone na piksele obszaru gry (minus 280 i 100).
 */

const POCZATEK_X = 280;
const POCZATEK_Y = 100;

/** Ile lochow ma lista z kluczami — `while (i < 9)`. */
export const LOCHOW_NA_LISCIE = 9;
export const POZIOMOW_W_LOCHU = 10;

/** Stany kolumny `dungeon_N`. */
export const ZAMKNIETY = 0;
export const KLUCZ_UZYTY = 1;
export const PIERWSZY_POZIOM = 2;
export const PRZESZEDL = 12;

/** `Background = IMG_SCR_QUEST_BG_1 + 50` — czyli `location51.jpg`. */
export const TLO_LISTY = '/res/sfgame/scr/quest/locations/location51.jpg';

/** Tlo pojedynczego lochu: `IMG_SCR_QUEST_BG_1 + 50 + DungeonNr`. */
export function tloLochu(numer: number): string {
  return `/res/sfgame/scr/quest/locations/location${50 + numer}.jpg`;
}

/** `scr/dungeons/button{51 + i}.jpg` dla i = 0..8, czyli lochy 1..9. */
export function obrazLochu(numer: number): string {
  return `/res/sfgame/scr/dungeons/button${50 + numer}.jpg`;
}

export const OBRAZ_ZAMKNIETY = '/res/sfgame/scr/dungeons/unknown.png';
export const OBRAZ_PRZESZEDL = '/res/sfgame/scr/dungeons/done.png';
export const DZWIEK_OTWARCIA = '/res/sfgame/sfx/unlock.mp3';

/** `POS_MQS_TITLE_Y`, wysrodkowany na `POS_SCREEN_TITLE_X`. */
export const TYTUL = { srodek: 770 - POCZATEK_X, gora: 115 - POCZATEK_Y };

/**
 * Kafle lochow: `(POS_MQS_BUTTON_X + REL_MQS_BUTTON_X * (i % 3),
 * POS_MQS_BUTTON_Y + REL_MQS_BUTTON_Y * (i / 3))`. Obrazek ma 234x165.
 */
export const KAFEL = { szerokosc: 234, wysokosc: 165 };
export const KAFLE = Array.from({ length: LOCHOW_NA_LISCIE }, (_, i) => ({
  lewo: 380 + 280 * (i % 3) - POCZATEK_X,
  gora: 170 + 195 * Math.floor(i / 3) - POCZATEK_Y,
}));

/*
 * DRUGA PLANSZA — `BNC_SCREEN_HLMAINQUESTS`.
 *
 * Klient przelacza sie na nia, gdy gracz ma za soba dziewiec lochow:
 * `Add((countDone >= 9) ? BNC_SCREEN_HLMAINQUESTS : BNC_SCREEN_MAINQUESTS)`.
 * Zamiast dziewieciu kafli stoi tu szesc: cztery lochy (10-13) po bokach,
 * a w srodkowej kolumnie wieza nad portalem.
 *
 *   lochy   (POS_MQS_BUTTON_X + REL_MQS_BUTTON_X * 2 * (i % 2),
 *            POS_MQS_BUTTON_Y + 100 + 200 * (i / 2))
 *   wieza   (POS_MQS_BUTTON_X + REL_MQS_BUTTON_X, POS_MQS_BUTTON_Y + REL_MQS_BUTTON_Y - 170)
 *   portal  (POS_MQS_BUTTON_X + REL_MQS_BUTTON_X, POS_MQS_BUTTON_Y + REL_MQS_BUTTON_Y - 5)
 */
export const LOCHOW_NA_DRUGIEJ = 4;
export const UKONCZONYCH_NA_DRUGA_PLANSZE = 9;

export const KAFLE_DRUGIEJ = Array.from({ length: LOCHOW_NA_DRUGIEJ }, (_, i) => ({
  lewo: 380 + 280 * 2 * (i % 2) - POCZATEK_X,
  gora: 170 + 100 + 200 * Math.floor(i / 2) - POCZATEK_Y,
}));

export const KAFEL_WIEZY = { lewo: 380 + 280 - POCZATEK_X, gora: 170 + 195 - 170 - POCZATEK_Y };
export const KAFEL_PORTALU = { lewo: 380 + 280 - POCZATEK_X, gora: 170 + 195 - 5 - POCZATEK_Y };

/** `scr/dungeons/button{60 + i}.jpg` dla i = 0..3, czyli lochy 10-13. */
export function obrazDrugiejPlanszy(numer: number): string {
  return `/res/sfgame/scr/dungeons/button${50 + numer}.jpg`;
}

export const OBRAZ_WIEZY = '/res/sfgame/scr/dungeons/button_tower.jpg';
export const OBRAZ_PORTALU = '/res/sfgame/scr/dungeons/button_portal.jpg';
export const OBRAZ_PORTAL_ZAMKNIETY = '/res/sfgame/scr/dungeons/unknown_portal.png';

/**
 * Klatki portalu — `portalFrames = 12`, a klient bierze z dwudziestu
 * czterech plikow co drugi: `portal_dungeons_{floor(i * 24 / 12) + 1}`.
 */
export const KLATEK_PORTALU = 12;
export const KLATEK_W_KATALOGU = 24;
export const ODSTEP_KLATEK_PORTALU_MS = 90;

export function klatkaPortalu(i: number): string {
  const numer = Math.floor((i * KLATEK_W_KATALOGU) / KLATEK_PORTALU) + 1;
  return `/res/sfgame/scr/dungeons/portal/portal_dungeons_${numer}.jpg`;
}

/*
 * EKRAN JEDNEGO LOCHU.
 *
 * `SHP_MAINQUEST` to przydymiony prostokat w `POS_MQ_SQUARE` o rozmiarze
 * `SIZE_MQ_SQUARE`, z przezroczystoscia 0,6. Zaczyna sie 20 px NAD
 * obszarem gry — w oryginale lezy na calej scenie, u nas obszar gry
 * konczy sie na 0, wiec gorna krawedz przycinamy i o tyle samo skracamy
 * wysokosc. Dolna krawedz zostaje tam, gdzie byla.
 */
const KWADRAT_GORA = 80 - POCZATEK_Y;
export const PLANSZA = {
  lewo: 470 - POCZATEK_X,
  gora: Math.max(0, KWADRAT_GORA),
  szerokosc: 610,
  wysokosc: 570 + Math.min(0, KWADRAT_GORA),
};
export const PRZEZROCZYSTOSC_PLANSZY = 0.6;

/** `POS_MQ_SQUARE_Y + REL_MQ_TITLE_Y`, wysrodkowany jak tytul ekranu. */
export const TYTUL_LOCHU_Y = 80 + 90 - POCZATEK_Y;

/** `POS_MQ_SQUARE + REL_MQ_TEXT`, szerokosc `SIZE_MQ_SQUARE_X - 2 * REL_MQ_TEXT_X`. */
export const TEKST = {
  lewo: 470 + 20 - POCZATEK_X,
  gora: 80 + 130 - POCZATEK_Y,
  szerokosc: 610 - 20 * 2,
};

/** `CNT_MAINQUEST_ENEMY` i ramka o `REL_MQ_BORDER` wyzej i w lewo. */
export const PRZECIWNIK = { lewo: 630 - POCZATEK_X, gora: 330 - POCZATEK_Y, rozmiar: 300 };
export const RAMKA_PRZECIWNIKA = {
  lewo: PRZECIWNIK.lewo - 10,
  gora: PRZECIWNIK.gora - 10,
  rozmiar: 320,
};
export const OBRAZ_RAMKI = '/res/sfgame/scr/fight/character_border.png';

/**
 * Przycisk „OK": prawa krawedz na `POS_MQ_SQUARE_X + SIZE_MQ_SQUARE_X
 * - REL_MQ_TEXT_X`, gora na `POS_MQ_SQUARE_Y + SIZE_MQ_SQUARE_Y
 * - REL_MQ_BUTTON_Y` (a `REL_MQ_BUTTON_Y` jest UJEMNE, wiec przycisk
 * schodzi PONIZEJ planszy).
 */
export const PRZYCISK = {
  szerokosc: 174,
  wysokosc: 45,
  prawo: 470 + 610 - 20 - POCZATEK_X,
  gora: 80 + 570 + 20 - POCZATEK_Y,
};

/** `LBL_MAINQUEST_MUSHHINT` — po lewej od przycisku, na jego wysokosci. */
export const PODPOWIEDZ = {
  lewo: 470 + 20 - POCZATEK_X,
  gora: 80 + 570 + 15 - POCZATEK_Y,
  szerokosc: 610 - 20 * 3 - 174,
};

/** Ile trwa zanikanie zaslony nad swiezo otwartym lochem — `FadeOut(..., 20, 0.05)`. */
export const KROKOW_OTWIERANIA = 20;
export const KROK_OTWIERANIA_MS = 40;
