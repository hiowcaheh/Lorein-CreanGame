/**
 * Generuje tablice potworow z lochow ze zrodel oryginalu.
 *
 * `getDungMonster($dung, $stage)` w `req.php` to 13 lochow po 10 poziomow,
 * a kazdy potwor to piecnascie liczb w wywolaniu konstruktora:
 *
 *     new Monster($lvl, $class, $str, $agi, $int, $wit, $luck,
 *                 $dmg_min, $dmg_max, $hp, $armor, $id, $exp,
 *                 $weapon_id, $shield_id)
 *
 * Przepisywanie tego recznie to 130 wierszy i pewna literowka, wiec
 * wyciagamy je maszynowo — tak samo jak nazwy przedmiotow i potworow.
 *
 * Wyjatek: dziesiaty poziom dziewiatego lochu to KOPIA GRACZA, liczona
 * z jego wlasnych statystyk. Nie ma tam liczb do przepisania, wiec
 * wychodzi `null`, a kod buduje ja sam.
 *
 * Uruchomienie:  npm run gen:lochy
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const zrodloPhp = resolve(here, '../../sf555/req.php');
const zrodloKlienta = resolve(here, '../../client-src/sfgame555.swf_as/sfgame_fla/MainTimeline.as');
const zrodloJezyka = resolve(here, '../../sf555/lang/sfgame_pl.txt');
const celPotworow = resolve(here, '../src/game/lochy-dane.ts');
const celTekstow = resolve(here, '../../web/src/gra/lochy-teksty.ts');

const php = readFileSync(zrodloPhp, 'utf8');
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

/* ------------------------------------------------ potwory z lochow -- */

const poczatek = php.indexOf('function getDungMonster(');
if (poczatek < 0) throw new Error('nie znaleziono getDungMonster w req.php');
const koniec = php.indexOf('function getTowerMonster(', poczatek);
const blok = php.slice(poczatek, koniec < 0 ? undefined : koniec);

const LOCHOW = 13;
const POZIOMOW = 10;

/** `case N:` na poziomie lochu ma dokladnie osiem spacji wciecia. */
const lochy = new Map();
let biezacyLoch = 0;

for (const linia of blok.split('\n')) {
  const naglowek = linia.match(/^ {8}case (\d+):\s*$/);
  if (naglowek) {
    biezacyLoch = Number(naglowek[1]);
    lochy.set(biezacyLoch, new Map());
    continue;
  }

  const potwor = linia.match(/^ {16}case (\d+): return new Monster\((.+)\);\s*$/);
  if (potwor && biezacyLoch > 0) {
    const liczby = potwor[2].split(',').map((x) => Number(x.trim()));
    // `$shield_id = -1` ma wartosc domyslna, wiec czesc wierszy ma 14 liczb.
    if (liczby.length === 14) liczby.push(-1);
    if (liczby.length !== 15 || liczby.some((x) => !Number.isFinite(x))) {
      throw new Error(`zly wiersz potwora w lochu ${biezacyLoch}: ${linia.trim()}`);
    }
    lochy.get(biezacyLoch).set(Number(potwor[1]), liczby);
  }
}

const POLA = [
  'poziom', 'klasa', 'sila', 'zrecznosc', 'intelekt', 'wytrzymalosc', 'szczescie',
  'obrazeniaMin', 'obrazeniaMaks', 'zycie', 'pancerz', 'numer', 'doswiadczenie',
  'bron', 'tarcza',
];

const wiersze = [];
for (let loch = 1; loch <= LOCHOW; loch++) {
  const poziomy = lochy.get(loch);
  if (!poziomy) throw new Error(`brak lochu ${loch} w req.php`);

  const opisy = [];
  for (let poziom = 1; poziom <= POZIOMOW; poziom++) {
    const liczby = poziomy.get(poziom);
    if (!liczby) {
      // Jedyny brak to kopia gracza — dziewiaty loch, dziesiaty poziom.
      opisy.push('    null,');
      continue;
    }
    const pola = POLA.map((nazwa, i) => `${nazwa}: ${liczby[i]}`).join(', ');
    opisy.push(`    { ${pola} },`);
  }
  wiersze.push(`  // loch ${loch}\n  [\n${opisy.join('\n')}\n  ],`);
}

const brakujace = [];
for (let loch = 1; loch <= LOCHOW; loch++) {
  for (let poziom = 1; poziom <= POZIOMOW; poziom++) {
    if (!lochy.get(loch)?.get(poziom)) brakujace.push(`${loch}/${poziom}`);
  }
}

const potworyTs = `/*
 * PLIK GENEROWANY — nie poprawiaj recznie.
 * Zrodlo: sf555/req.php, funkcja getDungMonster().
 * Generator: backend/scripts/gen-lochy.mjs
 */

/** Potwor z lochu — pietnascie liczb z konstruktora \`Monster\`. */
export interface PotworLochu {
  poziom: number;
  /** 1 wojownik, 2 mag, 3 zwiadowca. */
  klasa: number;
  sila: number;
  zrecznosc: number;
  intelekt: number;
  wytrzymalosc: number;
  szczescie: number;
  /** Obrazenia GOTOWE — tablica trzyma juz przemnozone wartosci. */
  obrazeniaMin: number;
  obrazeniaMaks: number;
  zycie: number;
  pancerz: number;
  /** Numer potwora — ten sam, ktory wskazuje obrazek i nazwe. */
  numer: number;
  doswiadczenie: number;
  /** Numer broni; wartosc ujemna to pazury i kly. */
  bron: number;
  /** Numer tarczy; -1 znaczy „bez tarczy". */
  tarcza: number;
}

/** Ile lochow i po ile poziomow — \`for ($i = 1; $i <= 13; $i++)\`. */
export const LOCHOW = ${LOCHOW};
export const POZIOMOW_W_LOCHU = ${POZIOMOW};

/**
 * Potwory: \`POTWORY[loch - 1][poziom - 1]\`.
 *
 * \`null\` stoi tam, gdzie oryginal nie ma liczb: dziesiaty poziom
 * dziewiatego lochu to kopia gracza, liczona z jego wlasnych statystyk.
 */
export const POTWORY: (PotworLochu | null)[][] = [
${wiersze.join('\n')}
];
`;

writeFileSync(celPotworow, potworyTs, 'utf8');

/* ---------------------------------------------------------- napisy -- */

const TXT_DUNGEON_NAME = stala('TXT_DUNGEON_NAME');
const TXT_DUNGEON_INFO = stala('TXT_DUNGEON_INFO');
const TXT_MQ_MUSHHINT = stala('TXT_MQ_MUSHHINT');
const TXT_HL_MAINQUESTS_NAME = stala('TXT_HL_MAINQUESTS_NAME');
const TXT_HL_MAINQUESTS_TITLE = stala('TXT_HL_MAINQUESTS_TITLE');

const apostrof = (s) => `'${(s ?? '').replaceAll('\\', '\\\\').replaceAll("'", "\\'")}'`;

/** Nazwa lochu ma po pionowej kresce motto — klient rozdziela je na dwa wiersze. */
const nazwy = [];
for (let i = 0; i < 9; i++) {
  const pelna = teksty.get(TXT_DUNGEON_NAME + i) ?? '';
  const [nazwa, motto] = pelna.split('|');
  nazwy.push(`  { nazwa: ${apostrof(nazwa)}, motto: ${apostrof(motto)} },`);
}

/*
 * Druga plansza lochow (`BNC_SCREEN_HLMAINQUESTS`): cztery lochy 10-13,
 * wieza i portal. Nazwy sa rozdzielone pionowa kreska tak samo, jak przy
 * pierwszej dziewiatce, tylko bez cudzyslowow wokol motta.
 */
const nazwyDrugiej = [];
for (let i = 0; i < 6; i++) {
  const pelna = teksty.get(TXT_HL_MAINQUESTS_NAME + i) ?? '';
  const [nazwa, motto] = pelna.split('|');
  nazwyDrugiej.push(`  { nazwa: ${apostrof(nazwa)}, motto: ${apostrof(motto)} },`);
}

const tekstyTs = `/*
 * PLIK GENEROWANY — nie poprawiaj recznie.
 * Zrodlo: sf555/lang/sfgame_pl.txt oraz stale TXT_* klienta Flash.
 * Generator: backend/scripts/gen-lochy.mjs
 */

/**
 * Nazwy lochow i ich motta — \`TXT_DUNGEON_NAME + i\` dla i = 0..8,
 * czyli lochy 1..9. Motto stoi po pionowej kresce i klient pokazuje je
 * osobnym, blekitnym wierszem (\`FontFormat_EpicItemQuote\`).
 */
export const NAZWY_LOCHOW: { nazwa: string; motto: string }[] = [
${nazwy.join('\n')}
];

/**
 * Druga plansza — \`TXT_HL_MAINQUESTS_NAME + i\` dla i = 0..5:
 * lochy 10-13, potem wieza i portal.
 */
export const NAZWY_DRUGIEJ_PLANSZY: { nazwa: string; motto: string }[] = [
${nazwyDrugiej.join('\n')}
];

/** \`TXT_HL_MAINQUESTS_TITLE\` — tytul drugiej planszy. */
export const TYTUL_DRUGIEJ_PLANSZY = ${apostrof(teksty.get(TXT_HL_MAINQUESTS_TITLE))};

/** \`TXT_DUNGEON_INFO\` — „Poziom: %1/10#Kolejny przeciwnik: %2". */
export const OPIS_POSTEPU = ${apostrof(teksty.get(TXT_DUNGEON_INFO))};
/** \`TXT_DUNGEON_INFO + 1\` — nad zamknietym lochem. */
export const BRAK_KLUCZA = ${apostrof(teksty.get(TXT_DUNGEON_INFO + 1))};
/** \`TXT_DUNGEON_INFO + 2\` — nad przejsztym lochem. */
export const OCZYSZCZONY = ${apostrof(teksty.get(TXT_DUNGEON_INFO + 2))};
/** \`TXT_DUNGEON_INFO + 3\` — tytul ekranu lochu: „%1 - Poziom %2/10". */
export const TYTUL_LOCHU = ${apostrof(teksty.get(TXT_DUNGEON_INFO + 3))};
/** \`TXT_DUNGEON_INFO + 4\` — tytul listy lochow. */
export const TYTUL_LISTY = ${apostrof(teksty.get(TXT_DUNGEON_INFO + 4))};
/** \`TXT_MQ_MUSHHINT\` — ile jeszcze czekac, zanim mozna wejsc znowu. */
export const PODPOWIEDZ_GRZYBA = ${apostrof(teksty.get(TXT_MQ_MUSHHINT))};
`;

writeFileSync(celTekstow, tekstyTs, 'utf8');

console.log(
  `zapisano ${celPotworow} (${LOCHOW} lochow po ${POZIOMOW} poziomow` +
    (brakujace.length ? `, bez liczb: ${brakujace.join(', ')}` : '') +
    `) oraz ${celTekstow}`,
);
