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
  // Rozpisanie premii do doswiadczenia — `EnablePopup(LBL_QO_REWARDEXP, ...)`.
  wTym: stala('TXT_EXPBONUS_PREFIX'),
  premiaKolekcjonera: stala('TXT_COLLECTION') + 1,
};

const podpisy = Object.fromEntries(Object.entries(PODPISY).map(([k, n]) => [k, wez(n)]));

/*
 * Nazwy potworow.
 *
 * `getQuestMonster()` losuje numer 1..158, a klient szuka nazwy pod
 * `TXT_MONSTER_NAME + numer - 1`. Bez tej tablicy przeciwnik nazywalby
 * sie po prostu „Potwor".
 */
const POCZATEK_POTWOROW = stala('TXT_MONSTER_NAME');
const LICZBA_POTWOROW = 158;
const potwory = [];
for (let i = 0; i < LICZBA_POTWOROW; i++) {
  potwory.push(teksty.get(POCZATEK_POTWOROW + i) ?? `Potwór ${i + 1}`);
}

/*
 * Tytuly wypraw.
 *
 * `GetQuestTitle()` wybiera zakres wedlug RODZAJU zadania, a przesuniecie
 * w zakresie liczy `GetQuestRandom()` — suma kontrolna z danych zadania
 * modulo dlugosc zakresu. Nie ma tu zadnego losowania: ten sam komplet
 * zadan zawsze daje te same tytuly, wiec odswiezenie strony niczego nie
 * podmienia.
 *
 * Ten serwer PHP ustawia rodzaje na stale — 3, 1 i 5 (`$ret[$SF_QUEST_DESC_*]`
 * w req.php), czyli „przynies", „zwiedz" i „przewiez". Pozostale zakresy
 * i tak przepisujemy, zeby dolozenie reszty rodzajow bylo pozniej samym
 * przelaczeniem numeru.
 */
const ZAKRESY_TYTULOW = {
  1: [stala('TXT_QUEST_SCOUT_TITLE'), 20],
  2: [stala('TXT_QUEST_COLLECT_TITLE'), 20],
  3: [stala('TXT_QUEST_FETCH_TITLE'), 20],
  5: [stala('TXT_QUEST_TRANSPORT_TITLE'), 21],
  6: [stala('TXT_QUEST_ESCORT_TITLE'), 23],
};

/*
 * Podsumowanie walki — `LBL_FIGHT_SUMMARY`.
 *
 * Klient bierze `txt[(int(Math.random() * 5) + fightStyle) + (charWin ?
 * TXT_FIGHT_WIN : TXT_FIGHT_LOSE)]`, gdzie `fightStyle` to 0, 5, 10 albo
 * 15 zaleznie od tego, ile zycia zostalo zwyciezcy. Daje to cztery
 * piatki zdan po kazdej stronie: od zmiazdzenia po walke na styk.
 */
const TXT_FIGHT_WIN = 4300;
const TXT_FIGHT_LOSE = 4320;

const wyniki = { wygrana: [], przegrana: [] };
for (const [klucz, poczatek] of [['wygrana', TXT_FIGHT_WIN], ['przegrana', TXT_FIGHT_LOSE]]) {
  for (let styl = 0; styl < 20; styl += 5) {
    const piatka = [];
    for (let i = 0; i < 5; i++) piatka.push(teksty.get(poczatek + styl + i) ?? '');
    wyniki[klucz].push(piatka);
  }
}

const tytuly = {};
for (const [rodzaj, [poczatek, ile]] of Object.entries(ZAKRESY_TYTULOW)) {
  const lista = [];
  for (let i = 0; i < ile; i++) lista.push(teksty.get(poczatek + i) ?? '');
  tytuly[rodzaj] = lista;
}

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

/** Nazwy potworow — numer z serwera liczy od jedynki. */
export const POTWORY: string[] = ${JSON.stringify(potwory, null, 2)};

/**
 * Tytuly wypraw, zgrupowane wedlug rodzaju zadania.
 *
 * Wybor tytulu w zakresie liczy \`tytulWyprawy()\` — patrz \`karczmaUklad.ts\`.
 */
export const TYTULY_WYPRAW: Record<number, string[]> = ${JSON.stringify(tytuly, null, 2)};

/**
 * Zdania podsumowujace walke, po piec na kazdy stopien \`fightStyle\`.
 *
 * Indeks zewnetrzny to stopien: 0 gdy zwyciezcy zostalo ponad 80% zycia,
 * 1 ponad 40%, 2 ponad 20%, 3 ponizej. Wewnatrz klient losuje jedno
 * z pieciu.
 */
export const WYNIKI_WALKI: { wygrana: string[][]; przegrana: string[][] } = ${JSON.stringify(wyniki, null, 2)};
`;

mkdirSync(dirname(cel), { recursive: true });
writeFileSync(cel, tresc, 'utf8');
console.log(
  `zapisano ${krainy.length} krain, ${Object.keys(podpisy).length} podpisow, ` +
    `${potwory.length} nazw potworow i ${Object.keys(tytuly).length} zakresow tytulow do ${cel}`,
);
