/**
 * Portret postaci — dziesiec warstw PNG jedna na drugiej.
 *
 * Regula budowania sciezki jest przepisana wprost z klienta Flash
 * (`getCharPrefix()` i `getCharSuffix()` w MainTimeline.as):
 *
 *   char/{rasa} {m|f}/{rasa}_[female_]{warstwa}[_{kolor}_]{numer}.png
 *
 * Kolor jest zakodowany w samej wartosci: wartosci powyzej 100 oznaczaja
 * kolejne kolory. `350` to kolor 3, wariant 50. Tak samo jak w oryginale,
 * bo te liczby leza juz w bazie w polach `face1`..`face10`.
 */

import { GRANICE_PORTRETU, type Plec } from './postac-dane';

export const RASY = {
  1: 'human',
  2: 'elf',
  3: 'dwarf',
  4: 'gnome',
  5: 'orc',
  6: 'dunkelelf',
  7: 'goblin',
  8: 'demon',
} as const;

export const NAZWY_RAS: Record<number, string> = {
  1: 'Człowiek',
  2: 'Elf',
  3: 'Krasnolud',
  4: 'Gnom',
  5: 'Ork',
  6: 'Mroczny elf',
  7: 'Goblin',
  8: 'Demon',
};

export const NAZWY_KLAS: Record<number, string> = {
  1: 'Wojownik',
  2: 'Mag',
  3: 'Łowca',
};

/** Warstwy w kolejnosci rysowania — od spodu do wierzchu. */
const WARSTWY = [
  { nr: 1, plik: 'mund' },
  { nr: 2, plik: 'bart' },
  { nr: 3, plik: 'nase' },
  { nr: 4, plik: 'augen' },
  { nr: 5, plik: 'brauen' },
  { nr: 6, plik: 'ohren' },
  { nr: 7, plik: 'haare' },
  { nr: 8, plik: 'special' },
  { nr: 9, plik: 'special2' },
] as const;

/** Ktore warstwy w ogole reaguja na kolor — bity maski (czesc 11). */
const BIT_KOLORU: Record<number, number> = { 2: 1, 5: 2, 7: 4, 9: 8 };

/** Plik ciala zalezy od klasy, nie od wygladu. */
const CIALO: Record<number, string> = { 1: 'body_warrior', 2: 'body_mage', 3: 'body_hunter' };

export interface Wyglad {
  rasa: number;
  plec: Plec;
  klasa: number;
  /** Wartosci `face1`..`face9`: usta, broda, nos, oczy, brwi, uszy, wlosy, special, special2. */
  czesci: readonly number[];
}

function przedrostek(rasa: number, plec: Plec): string {
  const r = RASY[rasa as keyof typeof RASY] ?? 'human';
  return `/res/sfgame/char/${r} ${plec}/${r}_${plec === 'f' ? 'female_' : ''}`;
}

/**
 * Ile wariantow ma dana warstwa u tej rasy i plci. Zero oznacza, ze rasa
 * tej warstwy nie ma w ogole (np. broda u kobiet).
 */
export function liczbaWariantow(rasa: number, plec: Plec, warstwa: number): number {
  return GRANICE_PORTRETU[plec]?.[rasa]?.[warstwa] ?? 0;
}

export function liczbaKolorow(rasa: number, plec: Plec): number {
  return liczbaWariantow(rasa, plec, 10);
}

export function warstwaKoloruje(rasa: number, plec: Plec, warstwa: number): boolean {
  const bit = BIT_KOLORU[warstwa];
  if (bit === undefined) return false;
  return (liczbaWariantow(rasa, plec, 11) & bit) !== 0;
}

/**
 * Adresy wszystkich warstw portretu, od spodu do wierzchu.
 * Warstwy, ktorych dana rasa nie ma, sa pomijane.
 */
export function warstwyPortretu(w: Wyglad): string[] {
  const baza = przedrostek(w.rasa, w.plec);
  const adresy: string[] = [];

  const cialo = CIALO[w.klasa];
  if (cialo) adresy.push(`${baza}${cialo}.jpg`);

  for (const [i, warstwa] of WARSTWY.entries()) {
    if (liczbaWariantow(w.rasa, w.plec, warstwa.nr) === 0) continue;

    let wartosc = w.czesci[i] ?? 1;
    let kolor = 0;
    while (wartosc > 100) {
      wartosc -= 100;
      kolor++;
    }
    if (wartosc < 1) continue;

    // Warstwa reagujaca na kolor ZAWSZE ma czlon koloru w nazwie pliku
    // (`bart_1_1.png`, nie `bart1.png`). Jesli w danych zabraklo koloru,
    // bierzemy pierwszy — lepiej pokazac wlosy w zlym kolorze niz nie
    // pokazac ich wcale.
    const koloruje = warstwaKoloruje(w.rasa, w.plec, warstwa.nr);
    const czlon = koloruje ? `_${Math.max(1, kolor)}_` : '';
    adresy.push(`${baza}${warstwa.plik}${czlon}${wartosc}.png`);
  }

  return adresy;
}

/**
 * Losowy wyglad — odpowiednik `RandomizeCharImage()`.
 * Kolor jest jeden dla calej postaci: wlosy, broda i brwi musza pasowac.
 */
export function losowyWyglad(rasa: number, plec: Plec, klasa: number): Wyglad {
  const kolory = liczbaKolorow(rasa, plec);
  const kolor = 1 + Math.floor(Math.random() * Math.max(1, kolory));

  const czesci = WARSTWY.map((warstwa) => {
    const ile = liczbaWariantow(rasa, plec, warstwa.nr);
    if (ile === 0) return 0;
    const wariant = 1 + Math.floor(Math.random() * ile);
    // Kolor siedzi w setkach: `getCharSuffix` odejmuje 100 tyle razy, ile
    // wynosi numer koloru. Kolor 1 to wiec wariant + 100, nie sam wariant.
    return warstwaKoloruje(rasa, plec, warstwa.nr) ? wariant + kolor * 100 : wariant;
  });

  return { rasa, plec, klasa, czesci };
}
