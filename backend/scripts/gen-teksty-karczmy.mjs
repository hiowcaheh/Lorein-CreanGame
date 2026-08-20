/**
 * Generuje `../web/src/gra/karczma-teksty.ts` z oryginalnego pliku
 * jezykowego.
 *
 * Nazwy krain, w ktore wysyla gracza karczma, teksty karczmarza i podpisy
 * w oknie wyboru zadania leza w `sfgame_pl.txt` pod numerami, ktore
 * w kliencie Flash maja swoje stale `TXT_*`. Przepisywanie ich recznie to
 * dwadziescia jeden nazw krain plus kilkanascie podpisow — i pewna
 * literowka.
 *
 * Uruchomienie:  npm run gen:teksty-karczmy
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const zrodloKlienta = resolve(here, '../../client-src/sfgame555.swf_as/sfgame_fla/MainTimeline.as');
const zrodloJezyka = resolve(here, '../../sf555/lang/sfgame_pl.txt');
const cel = resolve(here, '../../web/src/gra/karczma-teksty.ts');

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

function wez(numer) {
  const t = teksty.get(numer);
  if (t === undefined) throw new Error(`brak tekstu numer ${numer} w pliku jezykowym`);
  return t;
}

/** Dwadziescia jeden krain — `quest_location_N` w bazie ma wartosc 1..21. */
const POCZATEK_KRAIN = stala('TXT_QUEST_LOCATION');
const LICZBA_KRAIN = 21;
const krainy = [];
for (let i = 0; i < LICZBA_KRAIN; i++) krainy.push(wez(POCZATEK_KRAIN + i));

/*
 * Podpisy w oknach. Numery biora sie ze stalych klienta, zeby nie bylo
 * w kodzie golych liczb bez zrodla.
 */
const PODPISY = {
  wybierzZadanie: stala('TXT_QO_CHOOSE'),
  wynagrodzenie: stala('TXT_QO_REWARD'),
  przyjmij: 100,
  wroc: 101,
  doswiadczenie: 102,
  czasTrwania: 103,
  przerwij: stala('TXT_QUEST_CANCEL'),
  pomin: 105,
  awanturniczosc: 193,
  paskAwanturniczosci: stala('TXT_TIMEBAR'),
  piwoKup: stala('TXT_BO_BUY'),
  piwoEfekt: stala('TXT_BO_TIME'),
  piwoTytulOk: stala('TXT_BO_TITLE_OK'),
  piwoTytulNie: 187,
  piwoTekstOk: stala('TXT_BO_TEXT_OK'),
  piwoTekstDosc: 189,
  piwoWypite: stala('TXT_BO_BOUGHT'),
  piwoTytulZaZdrowy: 191,
  piwoTekstZaZdrowy: 192,
};

const podpisy = Object.fromEntries(Object.entries(PODPISY).map(([k, n]) => [k, wez(n)]));

const tresc = `/**
 * Napisy karczmy z oryginalu.
 *
 * PLIK GENEROWANY — nie poprawiaj recznie.
 * Zrodlo: sf555/lang/sfgame_pl.txt oraz stale TXT_* klienta Flash.
 * Generator: backend/scripts/gen-teksty-karczmy.mjs
 */

/** Kraina, w ktora wysyla zadanie — \`quest_location_N\` ma wartosc 1..21. */
export const KRAINY: string[] = ${JSON.stringify(krainy, null, 2)};

/** Podpisy w oknie wyboru zadania i u karczmarza. */
export const PODPISY = ${JSON.stringify(podpisy, null, 2)} as const;
`;

mkdirSync(dirname(cel), { recursive: true });
writeFileSync(cel, tresc, 'utf8');
console.log(`zapisano ${krainy.length} krain i ${Object.keys(podpisy).length} podpisow do ${cel}`);
