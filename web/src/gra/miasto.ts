/**
 * Ekran miasta — dane ulozenia.
 *
 * Wszystkie polozenia pochodza wprost ze stalych `POS_CITY_*` w kliencie
 * Flash. Tam byly liczone w pikselach sceny 1280x800; obraz miasta zaczyna
 * sie w punkcie (280, 101) i ma 1000x700. Tutaj zamieniamy je na procenty,
 * dzieki czemu ten sam uklad dziala na kazdym ekranie — czego oryginal
 * nie potrafil.
 */

/** Poczatek obrazu miasta w ukladzie sceny oryginalu. */
const POCZATEK_X = 280;
const POCZATEK_Y = 101;
const SZEROKOSC = 1000;
const WYSOKOSC = 700;

export interface Polozenie {
  lewo: string;
  gora: string;
}

function poz(x: number, y: number): Polozenie {
  return {
    lewo: `${((x - POCZATEK_X) / SZEROKOSC) * 100}%`,
    gora: `${((y - POCZATEK_Y) / WYSOKOSC) * 100}%`,
  };
}

/** Szerokosc obrazka wyrazona w procentach szerokosci miasta. */
export function szerokoscProcent(px: number): string {
  return `${(px / SZEROKOSC) * 100}%`;
}

export type PoraDnia = 'tag' | 'abend' | 'nacht';

/** Pora dnia wedlug zegara gracza — miasto zmienia sie tak jak w oryginale. */
export function poraDnia(godzina = new Date().getHours()): PoraDnia {
  if (godzina >= 6 && godzina < 18) return 'tag';
  if (godzina < 22) return 'abend';
  return 'nacht';
}

const S = '/res/sfgame/scr/stadt/';

export function warstwyMiasta(pora: PoraDnia) {
  return {
    // Niebo: 1000x265, od samej gory.
    niebo: `${S}stadt_${pora}_background.jpg`,
    // Miasto: 1000x435, zaczyna sie tam, gdzie konczy sie niebo.
    miasto: `${S}stadt_${pora}_unten.jpg`,
    // Pierwszy plan: 1000x170, nachodzi na miasto (REL_STADT_FOREG_Y = 96).
    przod: `${S}stadt_${pora}_vordergrund.png`,
  };
}

/** Postac chodzaca po miescie — klatki przelaczane w kolko. */
export interface Postac {
  klucz: string;
  klatki: string[];
  polozenie: Polozenie;
  szerokosc: number;
  /** Ile milisekund na klatke. Rozne wartosci, zeby nie mrugaly zgodnie. */
  tempo: number;
}

/*
 * Animacja areny (chmurki "POFF" nad walka) nie chodzi bez przerwy —
 * w oryginale pojawia sie dopiero, gdy gracz najedzie na arene. Bez tego
 * czerwony napis wisi nad miastem caly czas i tylko rozprasza.
 */
export const KLATKI_ARENY = ['arena2.png', 'arena3.png', 'arena4.png', 'arena5.png'];

export const POSTACIE: Postac[] = [
  { klucz: 'esel', klatki: ['esel1.png', 'esel2.png'], polozenie: poz(280, 618), szerokosc: 150, tempo: 900 },
  { klucz: 'magier', klatki: ['magier1.png', 'magier2.png'], polozenie: poz(655, 630), szerokosc: 120, tempo: 1100 },
  { klucz: 'ork', klatki: ['ork1.png', 'ork2.png'], polozenie: poz(850, 580), szerokosc: 139, tempo: 1300 },
  { klucz: 'sandwich', klatki: ['sandwichtyp1.png', 'sandwichtyp2.png'], polozenie: poz(780, 610), szerokosc: 110, tempo: 1500 },
  { klucz: 'zwerg', klatki: ['zwerg2.png', 'zwerg1.png'], polozenie: poz(480, 580), szerokosc: 110, tempo: 1700 },
  { klucz: 'elf', klatki: ['elf1.png', 'elf2.png'], polozenie: poz(943, 405), szerokosc: 90, tempo: 1900 },
  {
    klucz: 'dealer',
    klatki: ['dealer1.png', 'dealer2.png', 'dealer3.png', 'dealer4.png', 'dealer5.png'],
    polozenie: poz(578, 593),
    szerokosc: 80,
    tempo: 400,
  },
  {
    klucz: 'schild',
    klatki: ['schild1.png', 'schild2.png', 'schild3.png', 'schild4.png'],
    polozenie: poz(739, 623),
    szerokosc: 70,
    tempo: 800,
  },
];

/** Miejsce, w ktore da sie kliknac — prowadzi do zakladki. */
export interface Budynek {
  klucz: string;
  nazwa: string;
  zakladka: string;
  /** Obrazek podswietlenia pod kursorem. */
  podswietlenie: string;
  polozenie: Polozenie;
  szerokosc: number;
}

export const BUDYNKI: Budynek[] = [
  { klucz: 'taverne', nazwa: 'Karczma', zakladka: 'karczma', podswietlenie: 'kneipe.png', polozenie: poz(471, 560), szerokosc: 105 },
  { klucz: 'arena', nazwa: 'Arena', zakladka: 'arena', podswietlenie: 'arena_glow.png', polozenie: poz(280, 100), szerokosc: 577 },
  { klucz: 'shakes', nazwa: 'Zbrojownia', zakladka: 'zbrojownia', podswietlenie: 'overlay_waffenladen.png', polozenie: poz(1023, 585), szerokosc: 52 },
  { klucz: 'zauber', nazwa: 'Gabinet magii', zakladka: 'magia', podswietlenie: 'overlay_zauberladen.png', polozenie: poz(1014, 446), szerokosc: 51 },
  { klucz: 'halle', nazwa: 'Sala Chwały', zakladka: 'sala', podswietlenie: 'overlay_ruhmeshalle.png', polozenie: poz(1135, 340), szerokosc: 122 },
  { klucz: 'post', nazwa: 'Poczta', zakladka: 'poczta', podswietlenie: 'post.png', polozenie: poz(872, 546), szerokosc: 52 },
  { klucz: 'dealer', nazwa: 'Grzybiarz', zakladka: 'grzybiarz', podswietlenie: 'dealer_mouseover.png', polozenie: poz(578, 593), szerokosc: 42 },
];

/** Straznik miejski — inna grafika w dzien i po zmroku. */
export function straznik(pora: PoraDnia) {
  return {
    obraz: `${S}${pora === 'tag' ? 'stadtwache_tag.png' : 'stadtwache_abend_nacht.png'}`,
    polozenie: poz(670, 582),
    szerokosc: 53,
  };
}

export const KATALOG_MIASTA = S;
