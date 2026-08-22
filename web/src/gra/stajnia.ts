/**
 * Stajnia — dane ulozenia i napisy.
 *
 * Wszystkie liczby pochodza ze stalych `REL_STALL_*` i `SIZE_STALL_*`
 * klienta Flash. Sa podane wzgledem lewego gornego rogu ekranu gry
 * (klient dodaje do nich 280 i 100), wiec tutaj ida wprost.
 *
 * Scena ma dwie wersje: `stall_gut.jpg` dla ras dobrych i
 * `stall_boese.jpg` dla zlych. Wybiera je `CharVolk >= 5`, czyli ork,
 * mroczny elf, goblin i demon.
 */

/** Od tej rasy w gore stajnia jest „zla". */
export const PIERWSZA_ZLA_RASA = 5;

export interface Ramka {
  lewo: number;
  gora: number;
  szerokosc: number;
  wysokosc: number;
}

/**
 * Cztery boksy — obszary klikalne `CA_STALL_BOX_*`. Ich polozenie jest
 * wspolne dla obu wersji stajni; rozni sie tylko obrazek podswietlenia.
 */
const BOKSY: Ramka[] = [
  { lewo: 0, gora: 50, szerokosc: 200, wysokosc: 480 },
  { lewo: 225, gora: 81, szerokosc: 183, wysokosc: 382 },
  { lewo: 585, gora: 78, szerokosc: 176, wysokosc: 392 },
  { lewo: 778, gora: 50, szerokosc: 218, wysokosc: 476 },
];

/** Gdzie leza obrazki podswietlenia — `REL_STALL_OVL_*`. */
const PODSWIETLENIA_DOBRE: { x: number; y: number }[] = [
  { x: 80, y: 265 },
  { x: 303, y: 291 },
  { x: 580, y: 145 },
  { x: 761, y: 263 },
];

const PODSWIETLENIA_ZLE: { x: number; y: number }[] = [
  { x: 100, y: 305 },
  { x: 254, y: 217 },
  { x: 578, y: 310 },
  { x: 756, y: 168 },
];

const KATALOG = '/res/sfgame/scr/stall/';

/**
 * Jeden boks na obrazie: gdzie klikac, co podswietlic i KTOREGO
 * wierzchowca to znaczy.
 *
 * Ostatnie nie wynika z kolejnosci! W stajni dobrej klient przestawia
 * trzy pierwsze boksy (`ClickMount`):
 *
 *     case CA_STALL_BOX_GUT1: SelectedMount = 3;   // tygrys stoi z lewej
 *     case CA_STALL_BOX_GUT2: SelectedMount = 1;   // krowa
 *     case CA_STALL_BOX_GUT3: SelectedMount = 2;   // kon
 *     default:                SelectedMount = boks // gryfosmok i cala zla stajnia
 *
 * Czyli tygrys — trzeci co do ceny — jest namalowany jako pierwszy
 * z lewej. W stajni zlej numer boksu i numer wierzchowca sa zgodne.
 */
export interface BoksNaObrazie {
  /** Numer wierzchowca 1..4. */
  wierzchowiec: number;
  ramka: Ramka;
  podswietlenie: string;
  /** Gdzie postawic obrazek podswietlenia. */
  polozeniePodswietlenia: { x: number; y: number };
}

const PLIKI_DOBRE = ['tiger2', 'kuh', 'horse', 'greif'];
const PLIKI_ZLE = ['pig', 'wolf', 'raptor', 'dragon'];

/** Boks numer -> wierzchowiec, dla stajni dobrej. */
const WIERZCHOWIEC_W_BOKSIE_DOBRYM = [3, 1, 2, 4];

export function boksy(rasa: number): BoksNaObrazie[] {
  const zla = rasa >= PIERWSZA_ZLA_RASA;
  const pliki = zla ? PLIKI_ZLE : PLIKI_DOBRE;
  const polozenia = zla ? PODSWIETLENIA_ZLE : PODSWIETLENIA_DOBRE;

  return BOKSY.map((ramka, i) => ({
    wierzchowiec: zla ? i + 1 : WIERZCHOWIEC_W_BOKSIE_DOBRYM[i]!,
    ramka,
    podswietlenie: `${KATALOG}${pliki[i]}_mouseover.jpg`,
    polozeniePodswietlenia: polozenia[i]!,
  }));
}

export function tloStajni(rasa: number): string {
  return `${KATALOG}${rasa >= PIERWSZA_ZLA_RASA ? 'stall_boese' : 'stall_gut'}.jpg`;
}

/*
 * Ciemna plansza z opisem — `SHP_STALL_BLACK_SQUARE`:
 *
 *   POS_SCREEN_TITLE_X - SIZE_STALL_SQUARE_X / 2, POS_STALL_SQUARE_Y
 *   700 x 200, przezroczystosc 0,65
 *
 * `POS_SCREEN_TITLE_X` = 770 w pikselach sceny, czyli 490 od lewej
 * krawedzi ekranu gry — o dziesiec pikseli na lewo od jego srodka.
 */
export const SRODEK_PLANSZY = 490;
export const PLANSZA: Ramka = { lewo: SRODEK_PLANSZY - 350, gora: 460, szerokosc: 700, wysokosc: 200 };
/** `REL_STALL_TITEL_X` i `_Y` — margines napisow w planszy. */
export const MARGINES_PLANSZY = 10;
/** `REL_STALL_ZEILEN_Y` — odstep miedzy wierszami. */
export const ODSTEP_WIERSZY = 10;
/** `REL_STALL_GAIN_Y` — o tyle nizej niz opis stoi wiersz z zyskiem. */
export const ODSTEP_ZYSKU = 40;

/*
 * Napisy. Numery to pozycje w `sf555/lang/sfgame_pl.txt`.
 */

/** 109 i 110 — powitanie stajennego, dopoki nikt nie wybral boksu. */
export const TYTUL_STAJNI = 'Witaj w mojej stajni!';
export const OPIS_STAJNI =
  'Oferuję ci moje niezawodne, wydajne wierzchowce w leasingu. ' +
  'Zaoszczędzisz na kosztach przeglądu. Daję też na nie pełną gwarancję mobilności.';

/** 111, 112, 213, 214 i 278. */
export const OKRES_WYNAJMU = 'Okres wynajmu: 14 dni';
export const WYNAJMIJ = 'Wynajmij';
export const PRZEDLUZ = 'Przedłuż';
export const ULEPSZENIE = 'Ulepszenie';
export const PREMIA = 'Premia środowiskowa';

/** 194, 195 i 196 — panel wierzchowca na ekranie postaci. */
export const WIERZCHOWIEC = 'Wierzchowiec:';
export const OKRES_NAJMU = 'Okres wynajmu:';
export const BRAK_WIERZCHOWCA = '(brak)';

/** 197 i 198 — „Dzień" i „Dni" w liczeniu pozostalego czasu. */
export const DZIEN = 'Dzień';
export const DNI = 'Dni';

/**
 * Nazwy wierzchowcow — pozycje 2420..2427.
 *
 * Klient siega po nie wzorem `TXT_STALL_MOUNTTITEL + numer +
 * (rasa >= 5 ? 3 : -1)`, czyli pierwsza czworka to stajnia dobra,
 * druga zla.
 */
const NAZWY = ['Krowa', 'Koń', 'Tygrys', 'Gryfosmok', 'Świnia', 'Wilk', 'Raptor', 'Smokogryf'];

/** Opisy — pozycje 2430..2437, w tej samej kolejnosci. */
const OPISY = [
  'Zwykła mućka, ale przynajmniej nie musisz wędrować z buta.',
  'Dumny rumak dla dumnego śmiałka! Jest się na czym pokazać.',
  'Żaden tam potulny kociak, ale dziki tygrys błękitny!',
  'Dosiadając gryfosmoka zyskasz sobie szacunek i zazdrosne spojrzenia.',
  'Lepsza świnia pod siedzeniem, niż gryfosmok na dachu.',
  'Na wilku, choć groźnie wygląda, można polegać.',
  'Raptor jest groźnym stworzeniem, jakby nie z tej ziemi.',
  'Na widok smokogryfa miękną kulasy co mniej odważnych awanturników.',
];

/** Pozycja w tablicach nazw i opisow: 0..7. */
function indeks(wierzchowiec: number, rasa: number): number {
  return wierzchowiec - 1 + (rasa >= PIERWSZA_ZLA_RASA ? 4 : 0);
}

export function nazwaWierzchowca(wierzchowiec: number, rasa: number): string {
  if (wierzchowiec < 1 || wierzchowiec > 4) return BRAK_WIERZCHOWCA;
  return NAZWY[indeks(wierzchowiec, rasa)] ?? BRAK_WIERZCHOWCA;
}

export function opisWierzchowca(wierzchowiec: number, rasa: number): string {
  if (wierzchowiec < 1 || wierzchowiec > 4) return '';
  return OPISY[indeks(wierzchowiec, rasa)] ?? '';
}

/**
 * Portret wierzchowca na ekranie postaci — `mount_portrait_{1..8}.jpg`.
 * Numer liczy sie tak samo jak nazwa, wiec zla rasa dostaje drugi komplet.
 */
export function portretWierzchowca(wierzchowiec: number, rasa: number): string {
  return `/res/sfgame/scr/char/mount_portrait_${indeks(wierzchowiec, rasa) + 1}.jpg`;
}

/**
 * „Czas wędrówki - 30%" — napisy 4520..4527. Czwarty ma za pionowa
 * kreska premie srodowiskowa, ktora klient wypisuje osobno.
 */
export function zyskZWierzchowca(skrocenie: number): string {
  return `Czas wędrówki - ${skrocenie}%`;
}

/**
 * Ile czasu zostalo do konca najmu — port `WaitingTime()`.
 *
 * Powyzej doby klient pisze same dni („3 Dni"), ponizej zegar
 * „H:MM:SS". Odjecia godziny z oryginalu nie ma: to byla poprawka na
 * strefe czasowa starego serwera, a nasz wysyla zwykly czas uniksowy.
 */
export function pozostalyCzas(doKiedy: number, teraz: number): string {
  const sekundy = Math.max(0, doKiedy - teraz);
  const dni = Math.floor(sekundy / 86400);

  if (dni > 0) return `${dni + 1} ${dni === 0 ? DZIEN : DNI}`;

  const godziny = Math.floor(sekundy / 3600);
  const minuty = Math.floor((sekundy % 3600) / 60);
  const reszta = sekundy % 60;
  const lz = (n: number) => String(n).padStart(2, '0');

  return `${godziny > 0 ? `${godziny}:` : ''}${lz(minuty)}:${lz(reszta)}`;
}
