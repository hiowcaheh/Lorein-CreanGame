/**
 * Generuje `../web/src/gra/przedmioty-dane.ts` ze zrodel oryginalu.
 *
 * Nazwa przedmiotu w tej grze nie jest zapisana przy przedmiocie. Klient
 * sklada ja z trzech rzeczy: rodzaju i klasy przedmiotu (te wyznaczaja
 * poczatek zakresu w pliku jezykowym), numeru obrazka (przesuniecie
 * w zakresie) i przyrostka zaleznego od NAJMOCNIEJSZEJ cechy przedmiotu
 * — stad "Miecz sily" i "Miecz sily" o wiekszej wartosci nazywaja sie
 * inaczej.
 *
 * Wszystkie te tablice leza w `sfgame_pl.txt`, a numery poczatkowe
 * w stalych `TXT_ITMNAME_*` klienta. Przepisywanie tego recznie to
 * kilkaset linii i pewna literowka, wiec wyciagamy je maszynowo — tak
 * samo jak dane portretu.
 *
 * Uruchomienie:  npm run gen:nazwy
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const zrodloKlienta = resolve(here, '../../client-src/sfgame555.swf_as/sfgame_fla/MainTimeline.as');
const zrodloJezyka = resolve(here, '../../sf555/lang/sfgame_pl.txt');
const cel = resolve(here, '../../web/src/gra/przedmioty-dane.ts');

const klient = readFileSync(zrodloKlienta, 'latin1');

/** Wyciaga `public const NAZWA:* = 123;` ze zrodla klienta. */
function stala(nazwa) {
  const trafienie = klient.match(new RegExp(`public const ${nazwa}:\\* = (-?\\d+);`));
  if (!trafienie) throw new Error(`nie znaleziono stalej ${nazwa} w zrodle klienta`);
  return Number(trafienie[1]);
}

/*
 * Plik jezykowy to `numer<TAB>tresc`, po jednej pozycji na linie, plus
 * komentarze `//`. Tresc moze byc pusta — takie pozycje sa w oryginale
 * i po prostu ich nie ma w wyniku.
 */
const teksty = new Map();
for (const linia of readFileSync(zrodloJezyka, 'utf8').split('\n')) {
  if (linia.startsWith('//')) continue;
  const tab = linia.indexOf('\t');
  if (tab < 0) continue;
  const numer = Number(linia.slice(0, tab));
  if (!Number.isInteger(numer)) continue;
  const tresc = linia.slice(tab + 1).replace(/\r$/, '');
  if (tresc !== '') teksty.set(numer, tresc);
}

/*
 * Poczatki zakresow nazw. Klient wybiera je w `GetItemName`:
 * rodzaj przedmiotu 1..7 ma osobna tablice dla kazdej z trzech klas,
 * rodzaje 8..14 (kamienie, mikstury, zwoje) sa wspolne.
 */
const BAZY_KLASOWE = {};
for (const rodzaj of [1, 2, 3, 4, 5, 6, 7]) {
  const pierwsza = `TXT_ITMNAME_${rodzaj}_1`;
  if (!klient.includes(`public const ${pierwsza}:`)) continue;
  const przesuniecie = stala(pierwsza) - stala('TXT_ITMNAME_1_1');
  BAZY_KLASOWE[rodzaj] = {
    1: stala('TXT_ITMNAME_1_1') + przesuniecie,
    2: stala('TXT_ITMNAME_1_2') + przesuniecie,
    3: stala('TXT_ITMNAME_1_3') + przesuniecie,
  };
}

const BAZY_WSPOLNE = {};
for (const rodzaj of [8, 9, 10, 11, 12, 13, 14]) {
  const nazwa = `TXT_ITMNAME_${rodzaj}`;
  if (klient.includes(`public const ${nazwa}:`)) BAZY_WSPOLNE[rodzaj] = stala(nazwa);
}

/** Rodzaje, ktore NIE dostaja przyrostka od cechy (klient zeruje `txtSuffix`). */
const BEZ_PRZYROSTKA = [11, 12, 13, 14];

const PRZESUNIECIE_EPICKICH = stala('TXT_ITMNAME_1_1_EPIC') - stala('TXT_ITMNAME_1_1');
const BAZA_PRZYROSTKOW = stala('TXT_ITMNAME_EXT');

/*
 * Zbieramy tylko te teksty, ktore sa naprawde potrzebne. Caly plik
 * jezykowy ma kilka tysiecy pozycji i pakowanie go do klienta byloby
 * marnotrawstwem — nazwy przedmiotow to okolo pieciuset.
 */
const potrzebne = new Set();

function dodajZakres(od, ile) {
  for (let i = od; i < od + ile; i++) if (teksty.has(i)) potrzebne.add(i);
}

// Kazda tablica nazw ma 50 pozycji (odstepy miedzy stalymi TXT_ITMNAME_*).
const DLUGOSC_TABLICY = 50;
for (const klasy of Object.values(BAZY_KLASOWE)) {
  for (const baza of Object.values(klasy)) {
    dodajZakres(baza, DLUGOSC_TABLICY);
    dodajZakres(baza + PRZESUNIECIE_EPICKICH, DLUGOSC_TABLICY);
  }
}
for (const baza of Object.values(BAZY_WSPOLNE)) dodajZakres(baza, DLUGOSC_TABLICY);

// Przyrostki: 4600 + kod cechy (1,2,4,8,16,32) + prog wartosci (0..250).
dodajZakres(BAZA_PRZYROSTKOW, 300);

// Nazwy cech przedmiotu i podpisy w podpowiedzi.
const NAZWY_CECH = stala('TXT_ITEM_ATTRIB_CLASSES');
dodajZakres(NAZWY_CECH, 10);
for (const n of [stala('TXT_SCHADEN'), stala('TXT_RUESTUNG'), stala('TXT_BLOCKEN')]) potrzebne.add(n);

const posortowane = [...potrzebne].sort((a, b) => a - b);

const naglowek = `/**
 * Nazwy przedmiotow z oryginalu.
 *
 * PLIK GENEROWANY — nie poprawiaj recznie.
 * Zrodlo: sf555/lang/sfgame_pl.txt oraz stale TXT_ITMNAME_* klienta Flash.
 * Generator: backend/scripts/gen-nazwy-przedmiotow.mjs
 */

`;

const tresc =
  naglowek +
  `/** Napisy z pliku jezykowego, tylko te potrzebne do nazw przedmiotow. */\n` +
  `export const TEKSTY: Record<number, string> = {\n` +
  posortowane.map((n) => `  ${n}: ${JSON.stringify(teksty.get(n))},`).join('\n') +
  `\n};\n\n` +
  `/** Poczatek tablicy nazw dla rodzaju 1..7, osobno dla kazdej klasy. */\n` +
  `export const BAZY_KLASOWE: Record<number, Record<number, number>> = ${JSON.stringify(BAZY_KLASOWE, null, 2)};\n\n` +
  `/** Poczatek tablicy nazw dla rodzajow wspolnych dla wszystkich klas. */\n` +
  `export const BAZY_WSPOLNE: Record<number, number> = ${JSON.stringify(BAZY_WSPOLNE, null, 2)};\n\n` +
  `/** Rodzaje bez przyrostka od cechy. */\n` +
  `export const BEZ_PRZYROSTKA: number[] = ${JSON.stringify(BEZ_PRZYROSTKA)};\n\n` +
  `/** O tyle przesuwa sie tablica nazw przy przedmiocie epickim (obrazek >= 50). */\n` +
  `export const PRZESUNIECIE_EPICKICH = ${PRZESUNIECIE_EPICKICH};\n\n` +
  `/** Poczatek tablicy przyrostkow (TXT_ITMNAME_EXT). */\n` +
  `export const BAZA_PRZYROSTKOW = ${BAZA_PRZYROSTKOW};\n\n` +
  `/** Poczatek nazw cech przedmiotu (TXT_ITEM_ATTRIB_CLASSES). */\n` +
  `export const NAZWY_CECH = ${NAZWY_CECH};\n\n` +
  `/** Podpisy w podpowiedzi. */\n` +
  `export const TXT_OBRAZENIA = ${stala('TXT_SCHADEN')};\n` +
  `export const TXT_PANCERZ = ${stala('TXT_RUESTUNG')};\n` +
  `export const TXT_BLOK = ${stala("TXT_BLOCKEN")};\n`;

mkdirSync(dirname(cel), { recursive: true });
writeFileSync(cel, tresc, 'utf8');
console.log(`zapisano ${posortowane.length} napisow do ${cel}`);
