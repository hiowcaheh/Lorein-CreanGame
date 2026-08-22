/**
 * Generuje `../web/src/gra/klaser-teksty.ts` ze zrodel oryginalu.
 *
 * Klaser pokazuje 252 nazwy potworow i garsc wlasnych napisow. Nazwy
 * potworow leza w DWOCH zakresach pliku jezykowego, bo doszly pozniej:
 *
 *     if (((albumPage * 4) + i) >= 220)
 *         entryText = txt[TXT_NEW_MONSTER_NAMES + ((albumPage * 4) + i) - 220];
 *     else
 *         entryText = txt[TXT_MONSTER_NAME + (albumPage * 4) + i];
 *
 * Przepisywanie ich recznie to 252 linie i pewna literowka, wiec
 * wyciagamy je maszynowo — tak samo jak nazwy przedmiotow.
 *
 * Uruchomienie:  npm run gen:klaser
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const zrodloKlienta = resolve(here, '../../client-src/sfgame555.swf_as/sfgame_fla/MainTimeline.as');
const zrodloJezyka = resolve(here, '../../sf555/lang/sfgame_pl.txt');
const cel = resolve(here, '../../web/src/gra/klaser-teksty.ts');

const klient = readFileSync(zrodloKlienta, 'latin1');

function stala(nazwa) {
  const trafienie = klient.match(new RegExp(`public const ${nazwa}:\\* = (-?\\d+);`));
  if (!trafienie) throw new Error(`nie znaleziono stalej ${nazwa} w zrodle klienta`);
  return Number(trafienie[1]);
}

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

const TXT_MONSTER_NAME = stala('TXT_MONSTER_NAME');
const TXT_NEW_MONSTER_NAMES = stala('TXT_NEW_MONSTER_NAMES');
const TXT_UNKNOWN = stala('TXT_UNKNOWN');
const TXT_COLLECTION = stala('TXT_COLLECTION');

/*
 * Ile potworow ma klaser: `catMax = [252, ...]`, a klient rysuje je po
 * cztery na rozkladowke i przewija do strony 62 wlacznie.
 */
const POTWOROW = 252;
const OD_NOWEGO_ZAKRESU = 220;

const nazwy = [];
for (let i = 0; i < POTWOROW; i++) {
  const numer = i >= OD_NOWEGO_ZAKRESU
    ? TXT_NEW_MONSTER_NAMES + (i - OD_NOWEGO_ZAKRESU)
    : TXT_MONSTER_NAME + i;
  nazwy.push(teksty.get(numer) ?? '');
}

const apostrof = (s) => `'${s.replaceAll('\\', '\\\\').replaceAll("'", "\\'")}'`;

const wiersze = [];
for (let i = 0; i < nazwy.length; i += 4) {
  wiersze.push('  ' + nazwy.slice(i, i + 4).map(apostrof).join(', ') + ',');
}

const naglowki = [];
for (let i = 0; i < 5; i++) naglowki.push(teksty.get(TXT_COLLECTION + 2 + i) ?? '');

const wynik = `/*
 * PLIK GENEROWANY — nie poprawiaj recznie.
 * Zrodlo: sf555/lang/sfgame_pl.txt oraz stale TXT_* klienta Flash.
 * Generator: backend/scripts/gen-teksty-klasera.mjs
 */

/**
 * Nazwy potworow w kolejnosci klasera — pozycja w tablicy to numer bitu.
 * Potwor o numerze \`n\` z bazy siedzi pod \`n - 1\`.
 */
export const NAZWY_POTWOROW: readonly string[] = [
${wiersze.join('\n')}
];

/** \`TXT_UNKNOWN\` — podpis nieznalezionej pozycji. */
export const NIEZNANE = ${apostrof(teksty.get(TXT_UNKNOWN) ?? '???')};

/** \`TXT_COLLECTION\` — „Znaleziono:#%1 / %2#%3%". */
export const ZNALEZIONO = ${apostrof(teksty.get(TXT_COLLECTION) ?? '')};

/** \`TXT_COLLECTION + 1\` — nazwa premii do doswiadczenia. */
export const PREMIA_KOLEKCJONERA = ${apostrof(teksty.get(TXT_COLLECTION + 1) ?? '')};

/** \`TXT_COLLECTION + 2..6\` — podpisy piatki zakladek z boku klasera. */
export const NAZWY_DZIALOW: readonly string[] = [
${naglowki.map((n) => '  ' + apostrof(n) + ',').join('\n')}
];

/** \`TXT_COLLECTION + 7\` — objasnienie, co trafia do klasera. */
export const OPIS_KLASERA = ${apostrof(teksty.get(TXT_COLLECTION + 7) ?? '')};
`;

writeFileSync(cel, wynik, 'utf8');
console.log(`zapisano ${cel} (${nazwy.length} nazw potworow)`);
