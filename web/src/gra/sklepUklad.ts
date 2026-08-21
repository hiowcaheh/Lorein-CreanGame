/**
 * Uklad ekranu sklepu — stale wprost z klienta Flash.
 *
 * Zbrojownia i gabinet magii maja ten sam uklad; rozni je tylko obrazek
 * tla i sprzedawca. Lewa polowa ekranu to zwykly ekran postaci — te same
 * miejsca na przedmioty, ten sam komplet cech — bo w oryginale kupuje
 * sie przeciagajac towar wprost na siebie.
 *
 *   POS_SCR_SHOP_BG_X   = 780   tlo sklepu, 500x700, od y = 100
 *   POS_SHOP_SLOTS_C*_X = 856, 972, 1088
 *   POS_SHOP_SLOTS_R*_Y = 560, 680
 *   POS_NEW_WAREZ       = (1025, 495)   przycisk „nowy towar"
 *   REL_SHAKES          = (171, 112)    sprzedawca wzgledem tla
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

/** Tlo sklepu zajmuje prawa polowe ekranu gry. */
export const TLO = ramka(780, 100, 500, 700);

/** Miejsce na przedmiot ma 90x90, tak jak sam obrazek. */
const BOK = 90;

/**
 * Szesc miejsc z towarem — trzy kolumny na dwa rzedy, numerowane tak,
 * jak `CNT_CHAR_SLOT_SHAKES_1..6`: najpierw gorny rzad, potem dolny.
 */
export const MIEJSCA_TOWARU: Ramka[] = [
  ramka(856, 560, BOK, BOK),
  ramka(972, 560, BOK, BOK),
  ramka(1088, 560, BOK, BOK),
  ramka(856, 680, BOK, BOK),
  ramka(972, 680, BOK, BOK),
  ramka(1088, 680, BOK, BOK),
];

/** Przycisk „nowy towar" — wysrodkowany na 1025, gorna krawedz na 495. */
export const PRZYCISK_TOWARU = ramka(1025 - 110, 495, 220, 46);

const SHOPS = '/res/sfgame/scr/shops';

/**
 * Wyglad jednego sklepu.
 *
 * Kazdy ma swoje tlo, sprzedawce w innym miejscu i inne mrugniecie —
 * u kowala podmieniaja sie same oczy, u czarodzieja cala twarz. Gabinet
 * ma do tego malpe, ktora sie rusza.
 */
export interface WygladSklepu {
  tlo: string;
  dzien: string;
  noc: string;
  mrugniecie: string;
  /** Gdzie stoi sprzedawca i gdzie klatka mrugniecia. */
  sprzedawca: Ramka;
  oczy: Ramka;
  /** Klatki zwierzaka; pusta lista, kiedy sklep go nie ma. */
  zwierzak?: { klatki: string[]; ramka: Ramka };
}

/**
 * Zbrojownia — `REL_SHAKES` = (171, 112), mrugniecie o (56, 33) dalej.
 * Sprzedawca ma 166x306, klatka oczu 53x59.
 */
export const ZBROJOWNIA: WygladSklepu = {
  tlo: `${SHOPS}/shakes.jpg`,
  dzien: `${SHOPS}/shakes_normal.jpg`,
  noc: `${SHOPS}/shakes_nacht.jpg`,
  mrugniecie: `${SHOPS}/shakes_augen1.jpg`,
  sprzedawca: ramka(780 + 171, 100 + 112, 166, 306),
  oczy: ramka(780 + 171 + 56, 100 + 112 + 33, 53, 59),
};

/**
 * Gabinet magii — `REL_FIDGET` = (74, 168), mrugniecie o (107, 88) dalej,
 * malpa na `REL_FIDGET_AFFE` = (425, 128). Czarodziej ma 253x248, klatka
 * mrugniecia 96x55, malpa 75x100 w trzech klatkach.
 */
export const GABINET: WygladSklepu = {
  tlo: `${SHOPS}/fidget.jpg`,
  dzien: `${SHOPS}/fidget_normal.jpg`,
  noc: `${SHOPS}/fidget_nachts.jpg`,
  mrugniecie: `${SHOPS}/fidget_normal_blinzeln.jpg`,
  sprzedawca: ramka(780 + 74, 100 + 168, 253, 248),
  oczy: ramka(780 + 74 + 107, 100 + 168 + 88, 96, 55),
  zwierzak: {
    klatki: [1, 2, 3].map((n) => `${SHOPS}/fidget_affe${n}.jpg`),
    ramka: ramka(780 + 425, 100 + 128, 75, 100),
  },
};

/**
 * Pora dnia — `Tageszeit()` w kliencie.
 *
 * Klient rozroznia noc, swit, dzien i zmierzch; sklep ma tylko dwa
 * obrazki, wiec liczy sie samo „czy jest ciemno".
 */
export function ciemno(godzina: number): boolean {
  return godzina < 6 || godzina >= 20;
}

/**
 * Od tego numeru zaczynaja sie miejsca z towarem.
 *
 * Przeciaganie rozpoznaje miejsca po atrybucie `data-slot`, a numery
 * ekwipunku zajmuja zakres 0-14. Towar dostaje wiec wlasny, odsuniety
 * zakres — dzieki temu jedno upuszczenie wystarczy, zeby wiedziec, czy
 * gracz kupuje (z towaru na siebie), czy sprzedaje (z siebie na towar).
 */
export const PIERWSZE_MIEJSCE_TOWARU = 100;

export function czyMiejsceTowaru(slot: number): boolean {
  return slot >= PIERWSZE_MIEJSCE_TOWARU && slot < PIERWSZE_MIEJSCE_TOWARU + MIEJSCA_TOWARU.length;
}

/**
 * Obszar, na ktory rzuca sie rzecz do sprzedania.
 *
 *     DefineClickArea(CA_SELL_ITEM, C_EMPTY, undefined, 280 + 550, 100, 450, 700);
 *
 * Prostokat 450x700 od x = 830 — czyli prawie cala prawa polowa ekranu,
 * ale NIE od samej krawedzi tla sklepu (780). Pojawia sie dopiero, kiedy
 * gracz zlapie wlasny przedmiot na ekranie sklepu, i przyjmuje wszystko
 * z ekwipunku i plecaka.
 *
 * Ma wlasny numer poza zakresem ekwipunku i poza zakresem towaru, zeby
 * jedno upuszczenie wystarczylo do rozpoznania, o co chodzi.
 */
export const MIEJSCE_SPRZEDAZY = {
  numer: 200,
  ramka: ramka(280 + 550, 100, 450, 700),
};

export function czyMiejsceSprzedazy(slot: number): boolean {
  return slot === MIEJSCE_SPRZEDAZY.numer;
}
