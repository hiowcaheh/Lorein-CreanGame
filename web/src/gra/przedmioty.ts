/**
 * Nazwy i opisy przedmiotow — przepisane z `GetItemName` i `ItemPopup`
 * klienta Flash.
 *
 * Nazwa nie jest zapisana przy przedmiocie. Sklada sie z dwoch czesci:
 *
 *   rodzaj + klasa  ->  poczatek tablicy nazw w pliku jezykowym
 *   numer obrazka   ->  przesuniecie w tej tablicy
 *
 * a do tego dochodzi przyrostek zalezny od NAJMOCNIEJSZEJ cechy
 * przedmiotu i od tego, jak wysoka jest jej wartosc. Dlatego dwa miecze
 * o tym samym obrazku moga nazywac sie "Tasak gamonia" i
 * "Tasak srogosci".
 */

import {
  BAZA_PRZYROSTKOW,
  BAZY_KLASOWE,
  BAZY_WSPOLNE,
  BEZ_PRZYROSTKA,
  NAZWY_CECH,
  TXT_DNI,
  TXT_DZIEN,
  TXT_GODZINA,
  TXT_GODZINY,
  PRZESUNIECIE_EPICKICH,
  TEKSTY,
  TXT_BLOK,
  TXT_OBRAZENIA,
  TXT_PANCERZ,
} from './przedmioty-dane';
import type { Przedmiot } from './typy';

/** Rodzaj przedmiotu: bron. */
const RODZAJ_BRON = 1;
/** Rodzaj przedmiotu: tarcza. */
const RODZAJ_TARCZA = 2;

/*
 * Progi wartosci cechy, od ktorych zmienia sie przyrostek nazwy.
 * Wprost z `GetItemName`: 3, 6, 11, 16, 25 punktow.
 */
const PROGI: [number, number][] = [
  [25, 250],
  [16, 200],
  [11, 150],
  [6, 100],
  [3, 50],
];

/** Od tego numeru obrazka przedmiot jest epicki i ma wlasna tablice nazw. */
const PIERWSZY_EPICKI = 50;

function tekst(numer: number): string | undefined {
  return TEKSTY[numer];
}

/**
 * Przyrostek nazwy: `TXT_ITMNAME_EXT + kod cechy + prog wartosci`.
 *
 * Kod cechy to `2^(rodzaj-1)`, wiec sila daje 1, zrecznosc 2, inteligencja
 * 4 i tak dalej. Przedmiot bez cech nie dostaje przyrostka.
 */
function przyrostek(atrybuty: Przedmiot['atrybuty']): string {
  let rodzaj = -1;
  let wartosc = 0;
  for (const a of atrybuty) {
    if (a.wartosc > wartosc) {
      rodzaj = a.rodzaj;
      wartosc = a.wartosc;
    }
  }
  if (rodzaj < 1) return '';

  const kod = 2 ** (rodzaj - 1);
  const prog = PROGI.find(([od]) => wartosc >= od)?.[1] ?? 0;
  return tekst(BAZA_PRZYROSTKOW + kod + prog) ?? '';
}

/**
 * Nazwa przedmiotu.
 *
 * Polski plik jezykowy nie ustawia trybu skladania (pozycja
 * `TXT_ITMNAME_EXT` jest pusta), wiec przyrostek idzie PO nazwie:
 * "Tasak gamonia". W innych jezykach bywa odwrotnie i klient obsluguje
 * oba warianty — tutaj wystarczy ten jeden.
 */
export function nazwaPrzedmiotu(p: Przedmiot): string {
  let numer = p.numer;
  let baza = BEZ_PRZYROSTKA.includes(p.typ)
    ? BAZY_WSPOLNE[p.typ]
    : (BAZY_WSPOLNE[p.typ] ?? BAZY_KLASOWE[p.typ]?.[p.podtyp]);

  if (baza === undefined) return 'Przedmiot';

  let koncowka = BEZ_PRZYROSTKA.includes(p.typ) ? '' : przyrostek(p.atrybuty);

  if (numer >= PIERWSZY_EPICKI && p.typ !== 14) {
    baza += PRZESUNIECIE_EPICKICH;
    numer -= PIERWSZY_EPICKI - 1;
    koncowka = '';
  }

  const nazwa = tekst(baza + numer - 1);
  if (nazwa === undefined) return 'Przedmiot';

  // Nazwy przedmiotow epickich maja po pionowej kresce cytat — w podpowiedzi
  // stoi on osobnym, wyroznionym wierszem.
  const bezCytatu = nazwa.split('|')[0] ?? nazwa;
  const pelna = koncowka === '' ? bezCytatu : `${bezCytatu} ${koncowka}`;

  // Ulepszenie pokazuje sie w nazwie — poza tarcza, ktorej sie nie ulepsza.
  if (p.typ >= 1 && p.typ < 10 && p.typ !== RODZAJ_TARCZA && p.ulepszenie > 0) {
    return `${pelna} (+${p.ulepszenie})`;
  }
  return pelna;
}

/** Cytat z przedmiotu epickiego, jesli go ma. */
export function cytatPrzedmiotu(p: Przedmiot): string {
  const baza = BEZ_PRZYROSTKA.includes(p.typ)
    ? BAZY_WSPOLNE[p.typ]
    : (BAZY_WSPOLNE[p.typ] ?? BAZY_KLASOWE[p.typ]?.[p.podtyp]);
  if (baza === undefined) return '';

  const numer = p.numer >= PIERWSZY_EPICKI && p.typ !== 14
    ? p.numer - (PIERWSZY_EPICKI - 1)
    : p.numer;
  const przesuniecie = p.numer >= PIERWSZY_EPICKI && p.typ !== 14 ? PRZESUNIECIE_EPICKICH : 0;

  const nazwa = tekst(baza + przesuniecie + numer - 1) ?? '';
  if (!nazwa.includes('|')) return '';

  // `#` w pliku jezykowym to koniec wiersza — tak samo czyta go klient
  // (`hintText = ...split("#").join(String.fromCharCode(13))`).
  return (nazwa.split('|')[1] ?? '').split('#').join('\n');
}

/**
 * Czy przedmiot jest epicki — obrazek od 50 w gore, poza miksturami.
 * To samo, co `czyEpicki()` na serwerze.
 */
export function czyEpicki(p: Przedmiot): boolean {
  return p.numer >= PIERWSZY_EPICKI && p.typ !== 14;
}

/** Za epika sklep oddaje 10 grzybow; za reszte nic — `api/sklep.ts`. */
export const GRZYBY_ZA_SPRZEDAZ_EPIKA = 10;

export interface WierszOpisu {
  etykieta: string;
  wartosc: string;
}

/**
 * Wiersze podpowiedzi, w kolejnosci z oryginalu:
 *
 *   bron    -> "Obrazenia"  min-max (~srednia)
 *   tarcza  -> "Blok"       N %
 *   reszta  -> "Pancerz"    N          (tylko gdy wieksze od zera)
 *   dalej   -> nazwa cechy  + wartosc
 */
export function wierszeOpisu(p: Przedmiot): WierszOpisu[] {
  const wiersze: WierszOpisu[] = [];

  if (p.typ === RODZAJ_BRON) {
    const srednio = Math.round((p.obrazenia.min + p.obrazenia.max) / 2);
    wiersze.push({
      etykieta: tekst(TXT_OBRAZENIA) ?? 'Obrażenia',
      wartosc: `${p.obrazenia.min}-${p.obrazenia.max}  (~${srednio})`,
    });
  } else if (p.typ === RODZAJ_TARCZA) {
    wiersze.push({ etykieta: tekst(TXT_BLOK) ?? 'Blok', wartosc: `${p.obrazenia.min} %` });
  } else if (p.obrazenia.min > 0) {
    wiersze.push({ etykieta: tekst(TXT_PANCERZ) ?? 'Pancerz', wartosc: String(p.obrazenia.min) });
  }

  for (const a of p.atrybuty) {
    if (a.wartosc <= 0) continue;
    wiersze.push({
      etykieta: tekst(NAZWY_CECH + a.rodzaj) ?? '?',
      wartosc: wartoscCechy(p, a.rodzaj, a.wartosc),
    });
  }

  return wiersze;
}

/** Cecha „czas dzialania" i cecha „punkty zycia" — numery z oryginalu. */
const CECHA_CZAS = 11;
const CECHA_ZYCIE = 12;
const RODZAJ_MIKSTURA = 12;

/**
 * Jak zapisac wartosc cechy w podpowiedzi.
 *
 * Klient ma tu trzy przypadki (`EnablePopup`): czas dzialania rozpisuje
 * na dni i godziny, punkty zycia i mikstury podaje w procentach, a przy
 * miksturze mocniejszej niz 25 wraca do zwyklej liczby. Reszta to samo
 * „+ liczba".
 */
function wartoscCechy(p: Przedmiot, rodzaj: number, wartosc: number): string {
  if (rodzaj === CECHA_CZAS) return czasDzialania(wartosc);
  if (rodzaj === CECHA_ZYCIE) return `+ ${wartosc}%`;
  if (p.typ === RODZAJ_MIKSTURA) return wartosc <= 25 ? `+ ${wartosc}%` : `+ ${wartosc}`;
  return `+ ${wartosc}`;
}

/**
 * Godziny rozpisane na dni i godziny — dokladnie jak w oryginale:
 *
 *     int(hours / 24) + " " + (== 1 ? TXT_DAY : TXT_DAYS)
 *       + (hours % 24 > 0 ? ", " : "")
 *       + (hours % 24) + " " + (== 1 ? TXT_HOUR : TXT_HOURS)
 */
function czasDzialania(godziny: number): string {
  const dni = Math.floor(godziny / 24);
  const reszta = godziny % 24;
  const czesci: string[] = [];

  if (dni > 0) czesci.push(`${dni} ${tekst(dni === 1 ? TXT_DZIEN : TXT_DNI) ?? 'dni'}`);
  if (reszta > 0) czesci.push(`${reszta} ${tekst(reszta === 1 ? TXT_GODZINA : TXT_GODZINY) ?? 'godz.'}`);

  return czesci.join(', ');
}

/**
 * Ktore miejsce nalezy sie danemu rodzajowi przedmiotu.
 *
 * Ta sama tablica, co `getSlotIndex()` w oryginalnym `req.php` i co
 * `slotDlaRodzaju()` po stronie serwera. Klientowi jest potrzebna
 * wylacznie do PODPOWIEDZI — zeby przy przeciaganiu podswietlic wlasciwe
 * miejsce. O tym, czy przedmiot da sie zalozyc, decyduje i tak serwer.
 */
export function slotDlaRodzaju(rodzaj: number): number {
  switch (rodzaj) {
    case 1: return 8;    // bron
    case 2: return 9;    // tarcza
    case 3: return 1;    // zbroja
    case 4: return 3;    // buty
    case 5: return 2;    // rekawice
    case 6: return 0;    // helm
    case 7: return 5;    // pas
    case 8: return 4;    // amulet
    case 9: return 6;    // pierscien
    case 10: return 7;   // talizman
    default: return 10;  // reszta ida do plecaka
  }
}

/** Rodzaj przedmiotu, ktory sie pije, a nie zaklada. */
export const RODZAJ_MIKSTURY = 12;

/** Pierwszy slot plecaka. Nizsze numery to miejsca na zalozone rzeczy. */
export const PIERWSZY_SLOT_PLECAKA = 10;

/** Cena w zlocie i srebrze — sto srebra to jedno zloto, jak w oryginale. */
export function cenaPrzedmiotu(p: Przedmiot): { zloto: number; srebro: number; grzyby: number } {
  return {
    zloto: Math.floor(p.zloto / 100),
    srebro: p.zloto % 100,
    grzyby: p.grzyby % 100,
  };
}

/**
 * Nazwa pozycji klasera — `GetItemName(itmTyp, itmPic, albumMode)`.
 *
 * Klaser wola te sama funkcje z trzecim argumentem, co przelacza ja
 * w tryb „mam gole typ, numer i klase":
 *
 *     if (albumMode >= 0) { itmTyp = SGIndex; itmPic = SG; itmClass = albumMode; }
 *
 * Przyrostka nie ma, bo nie ma z czego go policzyc — w klaserze nie
 * stoi konkretny przedmiot, tylko sam WZOR. Nazwa epika bywa dwuczlonowa:
 * po pionowej kresce idzie cytat, ktory klaser stawia osobnym wierszem
 * pod nazwa.
 */
export function nazwaWKlaserze(
  typ: number,
  obrazek: number,
  klasa: number,
): { nazwa: string; podpowiedz: string } {
  let baza = BEZ_PRZYROSTKA.includes(typ)
    ? BAZY_WSPOLNE[typ]
    : (BAZY_WSPOLNE[typ] ?? BAZY_KLASOWE[typ]?.[klasa]);
  if (baza === undefined) return { nazwa: '', podpowiedz: '' };

  let numer = obrazek;
  if (numer >= PIERWSZY_EPICKI && typ !== 14) {
    baza += PRZESUNIECIE_EPICKICH;
    numer -= PIERWSZY_EPICKI - 1;
  }

  const pelna = tekst(baza + numer - 1);
  if (pelna === undefined) return { nazwa: '', podpowiedz: '' };

  const czesci = pelna.split('|');
  return {
    nazwa: czesci[0] ?? '',
    podpowiedz: (czesci[1] ?? '').split('#').join('\n'),
  };
}
