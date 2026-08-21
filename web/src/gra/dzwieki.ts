/**
 * Dzwieki gry — port `DefineSnd`, `Play`, `SetVolume`, `GetWeaponSound`
 * i `GetWeaponLevel` z `MainTimeline.as`.
 *
 * Zasada z oryginalu: KAZDY przycisk gra `sfx/click.mp3` na wcisnieciu
 * (`DefineBtn` wiesza `playClickSound` na `MOUSE_DOWN`), wygrana walka
 * i awans graja `jingle.mp3`, a kazda bron ma cztery wlasne probki —
 * zamach, trafienie, blok i cios krytyczny.
 *
 * Glosnosc tez jest z oryginalu: liczba calkowita 0..10, domyslnie 5,
 * pamietana miedzy sesjami (`so.data.volume`, u nas `localStorage`).
 * Zero znaczy cisze — `TXT_MUTE` mowi wprost „dzwiek wylaczony".
 */

const SFX = '/res/sfgame/sfx';

/** `so.data.volume` z oryginalu: 0..10, domyslnie 5. */
const KLUCZ_GLOSNOSCI = 'lorein.glosnosc';
const GLOSNOSC_DOMYSLNA = 5;

let glosnosc = wczytajGlosnosc();

function wczytajGlosnosc(): number {
  try {
    const zapisana = localStorage.getItem(KLUCZ_GLOSNOSCI);
    if (zapisana === null) return GLOSNOSC_DOMYSLNA;
    const n = Number.parseInt(zapisana, 10);
    return Number.isFinite(n) ? Math.min(10, Math.max(0, n)) : GLOSNOSC_DOMYSLNA;
  } catch {
    // Prywatne okno albo zablokowane ciasteczka — gramy domyslnie.
    return GLOSNOSC_DOMYSLNA;
  }
}

export function glosnoscGry(): number {
  return glosnosc;
}

export function ustawGlosnosc(nowa: number): void {
  glosnosc = Math.min(10, Math.max(0, Math.round(nowa)));
  try {
    localStorage.setItem(KLUCZ_GLOSNOSCI, String(glosnosc));
  } catch {
    // Trudno — zostanie na te sesje.
  }
}

/*
 * Kazdy plik trzymamy raz i odtwarzamy przez klon.
 *
 * Klon jest po to, zeby dwa ciosy pod rzad nie ucinaly sie nawzajem —
 * `HTMLAudioElement` gra tylko jedna instancje na raz. Sciezki, ktorych
 * nie ma w zasobach (a takich jest kilka, bo `GetWeaponLevel` siega
 * wyzej niz komplet probek), zapamietujemy jako nieme i wiecej o nie nie
 * pytamy.
 */
const wczytane = new Map<string, HTMLAudioElement>();
const nieme = new Set<string>();

function przygotuj(sciezka: string): HTMLAudioElement | null {
  if (nieme.has(sciezka)) return null;

  let dzwiek = wczytane.get(sciezka);
  if (!dzwiek) {
    dzwiek = new Audio(sciezka);
    dzwiek.preload = 'auto';
    dzwiek.addEventListener('error', () => nieme.add(sciezka), { once: true });
    wczytane.set(sciezka, dzwiek);
  }
  return dzwiek;
}

/** Odpowiednik `Play()` — cisza przy glosnosci zero. */
export function zagraj(sciezka: string | null): void {
  if (!sciezka || glosnosc === 0) return;

  const zrodlo = przygotuj(sciezka);
  if (!zrodlo) return;

  const glos = zrodlo.cloneNode() as HTMLAudioElement;
  glos.volume = glosnosc / 10;
  /*
   * Przegladarka odmawia grania, dopoki gracz w cokolwiek nie kliknie.
   * Pierwsze klikniecie samo to odblokowuje, wiec odmowe po prostu
   * przelykamy — inaczej leciałby nieobsluzony wyjatek.
   */
  void glos.play().catch(() => {});
}

/** Wstepne pobranie, zeby pierwszy cios nie grał z opoznieniem. */
export function przygotujDzwieki(sciezki: readonly (string | null)[]): void {
  for (const s of sciezki) if (s) przygotuj(s);
}

export const KLIK = `${SFX}/click.mp3`;
export const BLAD = `${SFX}/error.mp3`;
export const FANFARY = `${SFX}/jingle.mp3`;

/**
 * Do czego sluzy probka — `useCase` w `GetWeaponSoundFile`.
 *
 *     0 zamach, 1 trafienie, 2 blok, 3 cios krytyczny
 */
export type UzycieBroni = 'zamach' | 'trafienie' | 'blok' | 'krytyk';

const LITERA: Record<UzycieBroni, string> = {
  zamach: 's',
  trafienie: 'n',
  blok: 'b',
  krytyk: 'k',
};

/**
 * Grupa brzmieniowa broni — port `GetWeaponLevel()`.
 *
 * Numery obrazkow sa poprzypisywane recznie do kilkunastu grup: kije
 * i miecze brzmia inaczej niz topory, pazury inaczej niz piesci. Tablice
 * ponizej to ten sam `switch`, przepisany jeden do jednego.
 */
const GRUPY: Record<number, Record<number, number[]>> = {
  1: {
    0: [-5, -4, 1, 2, 3, 4],
    1: [5, 6, 8, 11, 15, 17, 19, 21, 22, 24, 26, 27, 29, 30, 50, 51, 60],
    2: [-6, 7, 10, 13, 16, 20, 23, 25, 28, 52],
    3: [9, 12, 14, 18],
    4: [-2, -1, 54],
    5: [0],
    6: [-3],
    7: [-7],
    8: [53],
    9: [55],
    10: [56],
    11: [57],
    12: [58],
    13: [59, 61],
    14: [62],
    15: [63],
  },
  2: {
    0: [1, 60],
    1: [2, 9],
    2: [6, 7, 10, 52, 54],
    3: [3, 4, 5, 8, 50, 51],
    4: [-5, -4, -3, -2, -1, 53],
    5: [0],
    9: [55, 61],
    10: [56],
    11: [57],
    12: [58],
    13: [59],
    14: [62],
    15: [63],
  },
  3: {
    0: [1, 2],
    1: [3, 5, 6, 7, 50, 52, 53, 54],
    2: [4, 8, 9, 10, 59],
    3: [51],
    4: [-5, -4, -3, -2, -1],
    5: [0],
    9: [55, 61],
    10: [56],
    11: [57],
    12: [58],
    13: [60],
    14: [62],
    15: [63],
  },
};

export function grupaBrzmieniaBroni(klasaBroni: number, obrazek: number): number {
  const dlaKlasy = GRUPY[klasaBroni];
  if (!dlaKlasy) return 0;

  for (const [grupa, numery] of Object.entries(dlaKlasy)) {
    if (numery.includes(obrazek)) return Number(grupa);
  }
  return 0;
}

/**
 * Plik probki — `GetWeaponSoundFile()`:
 *
 *     "sfx/wpn/wpn" + (wpnPic < 1 ? 1 : wpnClass) + "-"
 *       + (GetWeaponLevel(wpnClass, wpnPic) + 1) + "-" + useCase + ".mp3"
 *
 * Numer klasy schodzi do jedynki przy kazdej broni „nieprzedmiotowej"
 * (piesci, pazury, kije), bo takie odglosy sa wspolne dla wszystkich.
 */
export function plikDzwiekuBroni(
  klasaBroni: number,
  obrazek: number,
  uzycie: UzycieBroni,
): string {
  const klasaWNazwie = obrazek < 1 ? 1 : klasaBroni;
  const grupa = grupaBrzmieniaBroni(klasaBroni, obrazek) + 1;
  return `${SFX}/wpn/wpn${klasaWNazwie}-${grupa}-${LITERA[uzycie]}.mp3`;
}

/**
 * Rozklada numer broni tak, jak robi to klient przed walka:
 *
 *     while (charWeapon > 1000) { charWeapon -= 1000; charWeaponType++ }
 *
 * Numer ujemny albo zero to bron potwora — zostaje jak jest, a klasa
 * pozostaje jedynka.
 */
export function bronDoDzwieku(numer: number): { klasa: number; obrazek: number } {
  let obrazek = numer;
  let klasa = 1;
  while (obrazek > 1000) {
    obrazek -= 1000;
    klasa++;
  }
  return { klasa, obrazek };
}
