/**
 * Klaser Dokladnosci — uklad ekranu i mapa stron.
 *
 * Cala wiedza o tym, ktory bit zapisu jest ktorym przedmiotem, siedzi
 * w kliencie, w `ShowAlbumContent()`. Serwer oddaje same bity
 * (`ACT_ALBUM`), a klient sam wie, co narysowac. Robimy tak samo — ten
 * plik jest przepisaniem tamtej funkcji.
 *
 * Klaser ma piec dzialow (`albumCat`) i strony, po CZTERY pozycje na
 * rozkladowce. Kazda pozycja to albo potwor, albo komplet pieciu barw
 * jednego wzoru, albo jeden przedmiot epicki.
 */

const POCZATEK_X = 280;
const POCZATEK_Y = 100;

export const TLO = '/res/sfgame/scr/album/album.jpg';
export const NIEZNANY_POTWOR = '/res/sfgame/scr/fight/monster/unknown.jpg';
export const RAMKA_POTWORA = '/res/sfgame/scr/fight/character_border.png';

/** `IMG_ALBUM_CAT_IN + i` i `CNT_ALBUM_CAT_OUT + i` — (290, 300 + i * 80). */
export const ZAKLADKA = { lewo: 290 - POCZATEK_X, gora: 300 - POCZATEK_Y, odstep: 80 };
export const LICZBA_DZIALOW = 5;

export function plikZakladki(dzial: number, wybrana: boolean): string {
  return `/res/sfgame/scr/album/tab_${dzial}_${wybrana ? 'in' : 'out'}.jpg`;
}

/** `LBL_ALBUM_COLLECTION` — (330, 135), `FontFormat_BookLeft` (16 px, do lewej). */
export const LICZNIK = { lewo: 330 - POCZATEK_X, gora: 135 - POCZATEK_Y };

/** Numery stron: lewy `DefineLbl(..., 340, 690)`, prawy konczy sie na 1205. */
export const NUMER_STRONY_Y = 690 - POCZATEK_Y;
export const NUMER_STRONY_LEWY_X = 340 - POCZATEK_X;
export const NUMER_STRONY_PRAWY_KONIEC = 1205 - POCZATEK_X;

/** `BTN_ALBUM_PREV` (340, 715) i `BTN_ALBUM_NEXT` (1180, 715), strzalki 33x33. */
export const STRZALKA = { rozmiar: 33, gora: 715 - POCZATEK_Y };
export const STRZALKA_WSTECZ_X = 340 - POCZATEK_X;
export const STRZALKA_DALEJ_X = 1180 - POCZATEK_X;

/**
 * Cztery gniazda rozkladowki.
 *
 *   `CNT_ALBUM_MONSTER + i`  x = (i <= 1) ? 420 : 890, y = (i % 2) ? 475 : 170
 *   ramka                    o 8 px w lewo i w gore, obie skalowane 0,8
 *   naglowek                 y = (i % 2) ? 440 : 135, srodek na (i<=1) ? 535 : 1005
 *   podpowiedz               y = (i % 2) ? 470 : 165, ten sam srodek
 */
export const SKALA_POTWORA = 0.8;
export const ODSUNIECIE_RAMKI = 8;

export interface Gniazdo {
  /** Lewy gorny rog kontenera potwora. */
  potwor: { lewo: number; gora: number };
  naglowekY: number;
  podpowiedzY: number;
  srodekX: number;
  /** Piec miejsc na barwy plus jedno na epik — przesuniecia wzgledem `potwor`. */
  wzory: { lewo: number; gora: number }[];
  epik: { lewo: number; gora: number };
}

export const GNIAZDA: Gniazdo[] = [0, 1, 2, 3].map((i) => {
  const x = (i <= 1 ? 420 : 890) - POCZATEK_X;
  const y = (i % 2 === 0 ? 170 : 475) - POCZATEK_Y;
  const gora = i % 2 === 0 ? 10 : 130;
  const dol = i % 2 === 0 ? 130 : 10;

  return {
    potwor: { lewo: x, gora: y },
    naglowekY: (i % 2 === 0 ? 135 : 440) - POCZATEK_Y,
    podpowiedzY: (i % 2 === 0 ? 165 : 470) - POCZATEK_Y,
    srodekX: (i <= 1 ? 535 : 1005) - POCZATEK_X,
    wzory: [
      { lewo: x + 25, gora: y + gora },
      { lewo: x + 135, gora: y + gora },
      { lewo: x - 30, gora: y + dol },
      { lewo: x + 75, gora: y + dol },
      { lewo: x + 180, gora: y + dol },
    ],
    epik: { lewo: x + 75, gora: y + 70 },
  };
});

/** Ostatnia strona kazdego dzialu — z `if (albumPage > N) albumPage = 0`. */
export const OSTATNIA_STRONA = [62, 25, 39, 29, 29];

/** Ile pozycji miesci kazdy dzial — `catMax` z klienta. Razem 1700. */
export const POZYCJI_W_DZIALE = [252, 246, 506, 348, 348];

/** Granice dzialow w zapisie bitowym — petla liczaca `catCount`. */
export const GRANICE_DZIALOW = [300, 792, 1804, 2500];

/** Do ktorego dzialu nalezy bit o tym numerze. */
export function dzialBitu(bit: number): number {
  const i = GRANICE_DZIALOW.findIndex((g) => bit < g);
  return i === -1 ? 4 : i;
}

export type Pozycja =
  | { rodzaj: 'pusta' }
  | { rodzaj: 'potwor'; bit: number }
  /** Piec barw jednego wzoru — bity `bit`..`bit + 4`. */
  | { rodzaj: 'wzor'; bit: number; typ: number; obrazek: number; klasa: number }
  /** Jeden przedmiot bez barwy: epik albo talizman. */
  | { rodzaj: 'epik'; bit: number; typ: number; obrazek: number; klasa: number };

function wzor(bit: number, typ: number, obrazek: number, klasa: number): Pozycja {
  return { rodzaj: 'wzor', bit, typ, obrazek, klasa };
}
function epik(bit: number, typ: number, obrazek: number, klasa: number): Pozycja {
  return { rodzaj: 'epik', bit, typ, obrazek, klasa };
}
const PUSTA: Pozycja = { rodzaj: 'pusta' };

/**
 * Dzial „Przedmioty wartosciowe" — rodzaje 8 (naszyjniki), 9 (pierscienie)
 * i 10 (talizmany). Klasy nie maja, wiec `itmClass` jest zerem.
 */
function dzialBizuterii(strona: number, i: number): Pozycja {
  if (strona <= 5) {
    if (strona < 5 || i <= 0) return wzor(300 + strona * 20 + i * 5, 8, 1 + strona * 4 + i, 0);
    return PUSTA;
  }
  if (strona <= 7) return epik(510 + (strona - 6) * 4 + i, 8, 50 + (strona - 6) * 4 + i, 0);
  if (strona <= 11) return wzor(526 + (strona - 8) * 20 + i * 5, 9, 1 + (strona - 8) * 4 + i, 0);
  if (strona <= 13) return epik(686 + (strona - 12) * 4 + i, 9, 50 + (strona - 12) * 4 + i, 0);
  if (strona <= 23) {
    // Talizman barwy nie ma, wiec i on idzie po jednym miejscu.
    if (strona < 23 || i <= 0) return epik(702 + (strona - 14) * 4 + i, 10, 1 + (strona - 14) * 4 + i, 0);
    return PUSTA;
  }
  if (strona <= 25) return epik(776 + (strona - 24) * 4 + i, 10, 50 + (strona - 24) * 4 + i, 0);
  return PUSTA;
}

/**
 * Dzial „Wyposazenie wojownika" — jako jedyny ma tarcze (rodzaj 2)
 * i najdluzszy blok broni.
 */
function dzialWojownika(strona: number, i: number): Pozycja {
  const pelna = (od: number, rodzaj: number, pierwszaStrona: number) =>
    wzor(od + (strona - pierwszaStrona) * 20 + i * 5, rodzaj, 1 + (strona - pierwszaStrona) * 4 + i, 1);
  const epicka = (od: number, rodzaj: number, pierwszaStrona: number) =>
    epik(od + (strona - pierwszaStrona) * 4 + i, rodzaj, 50 + (strona - pierwszaStrona) * 4 + i, 1);

  if (strona <= 7) return strona < 7 || i <= 1 ? pelna(792, 1, 0) : PUSTA;
  if (strona <= 9) return epicka(1092, 1, 8);
  if (strona <= 12) return strona < 12 || i <= 1 ? pelna(1108, 2, 10) : PUSTA;
  if (strona <= 14) return epicka(1208, 2, 13);
  if (strona <= 17) return strona < 17 || i <= 1 ? pelna(1224, 3, 15) : PUSTA;
  if (strona <= 19) return epicka(1324, 3, 18);
  if (strona <= 22) return strona < 22 || i <= 1 ? pelna(1340, 4, 20) : PUSTA;
  if (strona <= 24) return epicka(1440, 4, 23);
  if (strona <= 27) return strona < 27 || i <= 1 ? pelna(1456, 5, 25) : PUSTA;
  if (strona <= 29) return epicka(1556, 5, 28);
  if (strona <= 32) return strona < 32 || i <= 1 ? pelna(1572, 6, 30) : PUSTA;
  if (strona <= 34) return epicka(1672, 6, 33);
  if (strona <= 37) return strona < 37 || i <= 1 ? pelna(1688, 7, 35) : PUSTA;
  if (strona <= 39) return epicka(1788, 7, 38);
  return PUSTA;
}

/**
 * Dzialy maga i zwiadowcy maja ten sam ksztalt — rozni je jedno
 * przesuniecie:
 *
 *     hunterOffs = ((albumCat == 3) ? 0 : 696) + 16;
 */
function dzialKlasowy(strona: number, i: number, dzial: number): Pozycja {
  const przesuniecie = (dzial === 3 ? 0 : 696) + 16;
  const klasa = dzial - 1;

  const pelna = (od: number, rodzaj: number, pierwszaStrona: number) =>
    wzor(
      od + przesuniecie + (strona - pierwszaStrona) * 20 + i * 5,
      rodzaj,
      1 + (strona - pierwszaStrona) * 4 + i,
      klasa,
    );
  const epicka = (od: number, rodzaj: number, pierwszaStrona: number) =>
    epik(
      od + przesuniecie + (strona - pierwszaStrona) * 4 + i,
      rodzaj,
      50 + (strona - pierwszaStrona) * 4 + i,
      klasa,
    );

  if (strona <= 2) return strona < 2 || i <= 1 ? pelna(1788, 1, 0) : PUSTA;
  if (strona <= 4) return epicka(1888, 1, 3);
  if (strona <= 7) return strona < 7 || i <= 1 ? pelna(1904, 3, 5) : PUSTA;
  if (strona <= 9) return epicka(2004, 3, 8);
  if (strona <= 12) return strona < 12 || i <= 1 ? pelna(2020, 4, 10) : PUSTA;
  if (strona <= 14) return epicka(2120, 4, 13);
  if (strona <= 17) return strona < 17 || i <= 1 ? pelna(2136, 5, 15) : PUSTA;
  if (strona <= 19) return epicka(2236, 5, 18);
  if (strona <= 22) return strona < 22 || i <= 1 ? pelna(2252, 6, 20) : PUSTA;
  if (strona <= 24) return epicka(2352, 6, 23);
  if (strona <= 27) return strona < 27 || i <= 1 ? pelna(2368, 7, 25) : PUSTA;
  if (strona <= 29) return epicka(2468, 7, 28);
  return PUSTA;
}

/** Co stoi w gniezdzie `i` (0..3) na tej stronie tego dzialu. */
export function pozycjaNaStronie(dzial: number, strona: number, i: number): Pozycja {
  if (dzial === 0) return { rodzaj: 'potwor', bit: strona * 4 + i };
  if (dzial === 1) return dzialBizuterii(strona, i);
  if (dzial === 2) return dzialWojownika(strona, i);
  return dzialKlasowy(strona, i, dzial);
}

/** Strona po przewinieciu — klient zawija ja na obu koncach. */
export function przewin(dzial: number, strona: number): number {
  const ostatnia = OSTATNIA_STRONA[dzial] ?? 0;
  if (strona > ostatnia) return 0;
  if (strona < 0) return ostatnia;
  return strona;
}

/** Zapis base64url na bity — tak samo jak `RESP_ALBUM` w kliencie. */
export function odkodujKlaser(dane: string): boolean[] {
  const znaki = dane.replaceAll('-', '+').replaceAll('_', '/');
  const surowe = atob(znaki.padEnd(Math.ceil(znaki.length / 4) * 4, '='));
  const bity: boolean[] = [];

  for (let i = 0; i < surowe.length; i++) {
    const bajt = surowe.charCodeAt(i);
    for (let b = 7; b >= 0; b--) bity.push(((bajt >> b) & 1) === 1);
  }
  return bity;
}

/** Ile pozycji zebrano w kazdym dziale — petla liczaca `catCount`. */
export function policzDzialy(bity: readonly boolean[]): number[] {
  const ile = [0, 0, 0, 0, 0];
  for (let i = 0; i < bity.length; i++) {
    if (!bity[i]) continue;
    const d = dzialBitu(i);
    ile[d] = (ile[d] ?? 0) + 1;
  }
  return ile.map((n, d) => Math.min(n, POZYCJI_W_DZIALE[d] ?? n));
}

/**
 * Plik ikony przedmiotu — `GetItemFile(itmTyp, itmPic, itmColor, itmClass)`.
 *
 * Klaser rysuje przedmioty SAM, bez pytania serwera, wiec sciezke sklada
 * tak samo jak klient. Barwa jest tu numerem miejsca (0..4), a nie suma
 * z pol przedmiotu — w klaserze kazdy wzor pokazuje wszystkie piec.
 *
 * `klasa` to ta sama liczba, co przy nazwie (0 dla bizuterii, 1..3 dla
 * ekwipunku). Do sciezki idzie o jeden mniejsza, bo tak robi klaser
 * tuz przed rysowaniem:
 *
 *     if (itmClass > 0) itmClass--;
 *     SetCnt(CNT_ALBUM_WEAPON_1 + i, GetItemID(itmTyp, itmPic, 0, itmClass));
 */
export function plikPrzedmiotu(typ: number, obrazek: number, barwa: number, klasa: number): string {
  const k = klasa > 0 ? klasa - 1 : 0;
  const b = obrazek >= 50 && typ !== 14 ? 0 : barwa;
  const podstawa = `itm${typ}-${obrazek}`;

  if (typ >= 1 && typ <= 7) {
    return `/res/sfgame/itm/${typ}-${k + 1}/${podstawa}-${b + 1}-${k + 1}.png`;
  }
  const zBarwa = typ < 10 ? `${b + 1}-` : '';
  return `/res/sfgame/itm/${typ}-1/${podstawa}-${zBarwa}1.png`;
}

/**
 * Kolejnosc „od najnowszych" — SWIADOME ODSTEPSTWO (tabela w CLAUDE.md).
 *
 * Oryginal rozklada klaser na sztywno: strona i gniazdo wynikaja wprost
 * z numeru bitu (`ShowAlbumContent()`), wiec pierwsza strona to zawsze
 * te same przedmioty. Wlasciciel gry poprosil, zeby najswiezsze zdobycze
 * staly na poczatku dzialu, a najstarsze na koncu.
 *
 * Sam UKLAD strony zostaje bez zmian: cztery gniazda, te same rozmiary
 * i te same napisy. Zmienia sie wylacznie to, KTORA pozycja gdzie stoi.
 *
 * Pozycje jeszcze niezdobyte ida na koniec, w kolejnosci z oryginalu —
 * inaczej klaser stalby sie nie do przejrzenia.
 */
export function pozycjeDzialu(dzial: number): Pozycja[] {
  const wszystkie: Pozycja[] = [];
  const ostatnia = OSTATNIA_STRONA[dzial] ?? 0;

  for (let strona = 0; strona <= ostatnia; strona++) {
    for (let i = 0; i < 4; i++) {
      const pozycja = pozycjaNaStronie(dzial, strona, i);
      if (pozycja.rodzaj !== 'pusta') wszystkie.push(pozycja);
    }
  }
  return wszystkie;
}

/** Ile bitow zajmuje pozycja: wzor piec, reszta jeden. */
function bitowPozycji(pozycja: Pozycja): number {
  return pozycja.rodzaj === 'wzor' ? 5 : 1;
}

/**
 * Najswiezsza data w pozycji. Wzor ma piec bitow i piec dat — liczy sie
 * najpozniejsza z nich. Pozycja bez ani jednej daty dostaje zero.
 */
export function czasPozycji(pozycja: Pozycja, daty: Record<number, number>): number {
  if (pozycja.rodzaj === 'pusta') return 0;

  let najnowsza = 0;
  for (let b = 0; b < bitowPozycji(pozycja); b++) {
    najnowsza = Math.max(najnowsza, daty[pozycja.bit + b] ?? 0);
  }
  return najnowsza;
}

/** Czy gracz ma w klaserze cokolwiek z tej pozycji. */
export function zdobytaPozycja(pozycja: Pozycja, bity: readonly boolean[]): boolean {
  if (pozycja.rodzaj === 'pusta') return false;

  for (let b = 0; b < bitowPozycji(pozycja); b++) {
    if (bity[pozycja.bit + b] === true) return true;
  }
  return false;
}

/**
 * Dzial ulozony od najnowszych zdobyczy do najstarszych, a na koncu to,
 * czego gracz jeszcze nie ma.
 *
 * Pozycje zdobyte PRZED wprowadzeniem dat maja czas zerowy i stoja za
 * datowanymi, ale przed niezdobytymi — daty im juz nie przybedzie,
 * a schowanie ich na sam koniec zgubiloby je miedzy nieznanymi.
 */
export function ulozonyDzial(
  dzial: number,
  bity: readonly boolean[],
  daty: Record<number, number>,
): Pozycja[] {
  return pozycjeDzialu(dzial)
    .map((pozycja, kolejnosc) => ({
      pozycja,
      kolejnosc,
      zdobyta: zdobytaPozycja(pozycja, bity),
      czas: czasPozycji(pozycja, daty),
    }))
    .sort((a, b) => {
      if (a.zdobyta !== b.zdobyta) return a.zdobyta ? -1 : 1;
      if (a.czas !== b.czas) return b.czas - a.czas;
      return a.kolejnosc - b.kolejnosc;
    })
    .map((w) => w.pozycja);
}

/** Ile stron ma ulozony dzial — po cztery pozycje na rozkladowke. */
export function stronDzialu(dzial: number): number {
  return Math.max(1, Math.ceil(pozycjeDzialu(dzial).length / 4));
}
