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

/** Sprzedawca: `shakes_normal.jpg` 166x306 w punkcie (780+171, 100+112). */
export const SPRZEDAWCA = ramka(780 + 171, 100 + 112, 166, 306);

/** Mrugniecie podmienia tylko oczy — `shakes_augen1.jpg`, 53x59. */
export const OCZY_SPRZEDAWCY = ramka(780 + 171 + 56, 100 + 112 + 33, 53, 59);

const SHOPS = '/res/sfgame/scr/shops';

/** Obrazy zbrojowni. Nocna odmiana wchodzi po zmroku, jak w oryginale. */
export const ZBROJOWNIA_OBRAZY = {
  tlo: `${SHOPS}/shakes.jpg`,
  dzien: `${SHOPS}/shakes_normal.jpg`,
  noc: `${SHOPS}/shakes_nacht.jpg`,
  mrugniecie: [`${SHOPS}/shakes_augen1.jpg`, `${SHOPS}/shakes_augen2.jpg`],
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
