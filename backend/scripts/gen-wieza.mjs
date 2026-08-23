/**
 * Generuje tablice potworow z Wiezy ze zrodel oryginalu.
 *
 * `getTowerMonster($stage, $db_data)` w `req.php` to sto pieter, kazde
 * jako jedno wywolanie konstruktora `Monster` — dokladnie ten sam ksztalt,
 * co lochy:
 *
 *     new Monster($lvl, $class, $str, $agi, $int, $wit, $luck,
 *                 $dmg_min, $dmg_max, $hp, $armor, $id, $exp,
 *                 $weapon_id, $shield_id)
 *
 * Dwie liczby sa tam wyrazeniami, a nie stalymi:
 *
 *     $lvl = 198 + 2 * $stage      poziom rosnie o dwa na pietro
 *     $id  = 399 + $stage          numer potwora, czyli i jego obrazek
 *
 * Liczymy je wiec przy wyciaganiu. Przepisywanie stu wierszy recznie to
 * pewna literowka, wiec idzie to maszynowo — tak samo jak lochy.
 *
 * Uruchomienie:  npm run gen:wieza
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const zrodloPhp = resolve(here, '../../sf555/req.php');
const cel = resolve(here, '../src/game/wieza-dane.ts');

const php = readFileSync(zrodloPhp, 'utf8');

const poczatek = php.indexOf('function getTowerMonster(');
if (poczatek < 0) throw new Error('nie znaleziono getTowerMonster w req.php');
const koniec = php.indexOf('function getRaidMonster(', poczatek);
const blok = php.slice(poczatek, koniec < 0 ? undefined : koniec);

const PIETER = 100;

/**
 * Wylicza jedno z pol. Poza dwoma wyrazeniami z `$stage` wszystko jest
 * stala liczba — kazde inne wyrazenie ma tu wysadzic generator, zeby
 * cicho nie wpisac zera.
 */
function liczba(wyrazenie, pietro) {
  const tekst = wyrazenie.trim();
  if (/^-?\d+$/.test(tekst)) return Number(tekst);

  const przez2 = tekst.match(/^\(\s*(\d+)\s*\+\s*2\s*\*\s*\$stage\s*\)$/);
  if (przez2) return Number(przez2[1]) + 2 * pietro;

  const wprost = tekst.match(/^\(\s*(\d+)\s*\+\s*\$stage\s*\)$/);
  if (wprost) return Number(wprost[1]) + pietro;

  throw new Error(`nieznane wyrazenie na pietrze ${pietro}: ${tekst}`);
}

/** Dzieli argumenty konstruktora po przecinkach SPOZA nawiasow. */
function podziel(argumenty) {
  const czesci = [];
  let glebokosc = 0;
  let biezaca = '';

  for (const znak of argumenty) {
    if (znak === '(') glebokosc += 1;
    if (znak === ')') glebokosc -= 1;
    if (znak === ',' && glebokosc === 0) {
      czesci.push(biezaca);
      biezaca = '';
      continue;
    }
    biezaca += znak;
  }
  czesci.push(biezaca);
  return czesci;
}

const pietra = new Map();
for (const linia of blok.split('\n')) {
  const trafienie = linia.match(/^ {8}case (\d+): return new Monster\((.+)\);\s*$/);
  if (!trafienie) continue;

  const pietro = Number(trafienie[1]);
  const liczby = podziel(trafienie[2]).map((x) => liczba(x, pietro));
  // `$shield_id = -1` ma wartosc domyslna, wiec czesc wierszy ma 14 liczb.
  if (liczby.length === 14) liczby.push(-1);
  if (liczby.length !== 15) {
    throw new Error(`pietro ${pietro} ma ${liczby.length} liczb zamiast 15`);
  }
  pietra.set(pietro, liczby);
}

const brakujace = [];
for (let pietro = 1; pietro <= PIETER; pietro++) {
  if (!pietra.has(pietro)) brakujace.push(pietro);
}
if (brakujace.length > 0) {
  throw new Error(`brakuje pieter w req.php: ${brakujace.join(', ')}`);
}

const POLA = [
  'poziom', 'klasa', 'sila', 'zrecznosc', 'intelekt', 'wytrzymalosc', 'szczescie',
  'obrazeniaMin', 'obrazeniaMaks', 'zycie', 'pancerz', 'numer', 'doswiadczenie',
  'bron', 'tarcza',
];

const wiersze = [];
for (let pietro = 1; pietro <= PIETER; pietro++) {
  const liczby = pietra.get(pietro);
  const pola = POLA.map((nazwa, i) => `${nazwa}: ${liczby[i]}`).join(', ');
  wiersze.push(`  { ${pola} },`);
}

const tresc = `/*
 * PLIK GENEROWANY — nie poprawiaj recznie.
 * Zrodlo: sf555/req.php, funkcja getTowerMonster().
 * Generator: backend/scripts/gen-wieza.mjs
 */

import type { PotworLochu } from './lochy-dane.js';

/** Ile pieter ma wieza — \`case 1\` az do \`case 100\` w \`getTowerMonster()\`. */
export const PIETER_WIEZY = ${PIETER};

/**
 * Potwory: \`POTWORY_WIEZY[pietro - 1]\`.
 *
 * Ten sam ksztalt, co potwory z lochow — piecnascie liczb konstruktora
 * \`Monster\`. Poziom i numer sa w oryginale wyrazeniami \`198 + 2 * $stage\`
 * i \`399 + $stage\`; tutaj stoja juz policzone.
 */
export const POTWORY_WIEZY: PotworLochu[] = [
${wiersze.join('\n')}
];
`;

writeFileSync(cel, tresc, 'utf8');
console.log(`zapisano ${PIETER} pieter do ${cel}`);

/* ---------------------------------------------------------- napisy -- */

/*
 * Napisy wiezy i pliki portretow — do klienta.
 *
 * `TXT_TOWER_ENEMY_NAMES + i` to sto pozycji „nazwa|opis" (i = 0..99,
 * czyli pietra 1..100). Klient bierze z nich nazwe do tytulu
 * (`ShowMainQuestScreen`, galaz `DungeonNr == 100`) i opis do tresci
 * ekranu.
 *
 * Portrety potworow z wiezy maja w oryginale nazwy zamazane skrotem:
 *
 *     if (i >= 399 && i < 499) {
 *         monsterChecksum = MD5(String(i) + "ScriptKiddieLovesToPeek");
 *         DefineImg(..., "scr/fight/monster/monster" + monsterChecksum + ".jpg");
 *     }
 *
 * gdzie `i` to NUMER OBRAZKA, o jeden mniejszy od numeru potwora
 * (poza wieza klient sklada `monster{i + 1}.jpg`). Potwor z pietra N ma
 * numer `399 + N`, wiec jego obrazek to `i = 398 + N`.
 */

import { createHash } from 'node:crypto';

const zrodloKlienta = resolve(here, '../../client-src/sfgame555.swf_as/sfgame_fla/MainTimeline.as');
const zrodloJezyka = resolve(here, '../../sf555/lang/sfgame_pl.txt');
const celTekstow = resolve(here, '../../web/src/gra/wieza-teksty.ts');

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

const apostrof = (s) => `'${(s ?? '').replaceAll('\\', '\\\\').replaceAll("'", "\\'")}'`;

const TXT_TOWER_TRY = stala('TXT_TOWER_TRY');
const TXT_TOWER_ENEMY_NAMES = stala('TXT_TOWER_ENEMY_NAMES');
const TXT_TOWER_LEVEL = stala('TXT_TOWER_LEVEL');
const TXT_TOWER_INFO = stala('TXT_TOWER_INFO');
const TXT_TOWER_BONUS = stala('TXT_TOWER_BONUS');
const TXT_TOWER_WON = stala('TXT_TOWER_WON');
const TXT_TOWER_LOST = stala('TXT_TOWER_LOST');

/**
 * Zdanie po walce w wiezy losuje sie z PIECIU, bez ogladania sie na to,
 * jak walka poszla:
 *
 *     text = txt[TXT_TOWER_WON  + int(Math.random() * 5)];
 *     text = txt[TXT_TOWER_LOST + int(Math.random() * 5)];
 *
 * Wyprawa i loch maja tego czterokrotnie wiecej, bo dobieraja piatke
 * wedlug `fightStyle` — wieza tego nie robi.
 */
const ZDAN_PO_WALCE = 5;

function piatka(od) {
  const zdania = [];
  for (let i = 0; i < ZDAN_PO_WALCE; i++) {
    const tresc = teksty.get(od + i);
    if (tresc === undefined) throw new Error(`brak zdania po walce w wiezy (pozycja ${od + i})`);
    zdania.push(`  ${apostrof(tresc)},`);
  }
  return zdania.join('\n');
}

/** Numer obrazka pierwszego potwora z wiezy — `i >= 399 && i < 499`. */
const PIERWSZY_OBRAZEK = 399;
/** Sol, ktora oryginal zamazuje nazwy plikow. */
const SOL_OBRAZKA = 'ScriptKiddieLovesToPeek';

const nazwy = [];
const obrazy = [];
for (let i = 0; i < PIETER; i++) {
  const pelna = teksty.get(TXT_TOWER_ENEMY_NAMES + i);
  if (pelna === undefined) {
    throw new Error(`brak nazwy potwora wiezy na pietrze ${i + 1} (pozycja ${TXT_TOWER_ENEMY_NAMES + i})`);
  }
  const [nazwa, opis] = pelna.split('|');
  nazwy.push(`  { nazwa: ${apostrof(nazwa)}, opis: ${apostrof(opis)} },`);

  const skrot = createHash('md5').update(String(PIERWSZY_OBRAZEK + i) + SOL_OBRAZKA).digest('hex');
  obrazy.push(`  'monster${skrot}.jpg',`);
}

const tekstyTs = `/*
 * PLIK GENEROWANY — nie poprawiaj recznie.
 * Zrodlo: sf555/lang/sfgame_pl.txt oraz stale TXT_* klienta Flash.
 * Generator: backend/scripts/gen-wieza.mjs
 */

/**
 * Przeciwnicy z pieter — \`TXT_TOWER_ENEMY_NAMES + i\` dla i = 0..99,
 * czyli \`NAZWY_PIETER[pietro - 1]\`. Nazwa idzie do tytulu ekranu, opis
 * w miejsce tresci zadania:
 *
 *     text = txt[TXT_TOWER_LEVEL].split("%1").join(DungeonLevel) + " - "
 *          + txt[TXT_TOWER_ENEMY_NAMES + Enemy - 399].split("|")[0];
 *     questText = txt[TXT_TOWER_ENEMY_NAMES + towerLevel].split("|")[1];
 */
export const NAZWY_PIETER: { nazwa: string; opis: string }[] = [
${nazwy.join('\n')}
];

/**
 * Pliki portretow — \`OBRAZY_PIETER[pietro - 1]\`, katalog
 * \`scr/fight/monster/\`. Oryginal zamazuje te nazwy skrotem MD5
 * (patrz generator), wiec nie da sie ich zlozyc z numeru w kliencie.
 */
export const OBRAZY_PIETER: string[] = [
${obrazy.join('\n')}
];

/** \`TXT_TOWER_LEVEL\` — pierwsza czesc tytulu ekranu wiezy. */
export const TYTUL_WIEZY = ${apostrof(teksty.get(TXT_TOWER_LEVEL))};
/** \`TXT_TOWER_INFO\` — podpowiedz kafla: pietro, przeciwnik, premia zlota. */
export const OPIS_WIEZY = ${apostrof(teksty.get(TXT_TOWER_INFO))};
/** \`TXT_TOWER_TRY\` — napis na przycisku wejscia. */
export const WEJSCIE_DO_WIEZY = ${apostrof(teksty.get(TXT_TOWER_TRY))};
/** \`TXT_TOWER_BONUS\` — nazwa premii zlota z wiezy. */
export const PREMIA_Z_WIEZY = ${apostrof(teksty.get(TXT_TOWER_BONUS))};

/**
 * Zdanie po wygranej walce — \`TXT_TOWER_WON + rand(0..4)\`. Wieza nie
 * dobiera go wedlug tego, jak walka poszla; losuje wprost z pieciu.
 */
export const WYGRANE_W_WIEZY: string[] = [
${piatka(TXT_TOWER_WON)}
];

/** Zdanie po przegranej — \`TXT_TOWER_LOST + rand(0..4)\`. */
export const PRZEGRANE_W_WIEZY: string[] = [
${piatka(TXT_TOWER_LOST)}
];
`;

writeFileSync(celTekstow, tekstyTs, 'utf8');
console.log(`zapisano napisy wiezy do ${celTekstow}`);
