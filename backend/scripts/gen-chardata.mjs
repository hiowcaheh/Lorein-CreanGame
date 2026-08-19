/**
 * Generuje `../web/src/gra/postac-dane.ts` ze zrodla klienta Flash.
 *
 * Portret postaci sklada sie z dziesieciu warstw PNG. Ile wariantow ma
 * kazda warstwa, zalezy od rasy i plci — a ta tabela siedzi w kliencie
 * jako `getCharImageBound()`: 432 linie zagniezdzonych instrukcji switch.
 *
 * Przepisywanie jej recznie to prosta droga do literowki, ktorej nikt
 * nie zauwazy — zla liczba wariantow objawi sie dopiero brakujacym
 * obrazkiem u jednej rasy. Dlatego wyciagamy ja maszynowo.
 *
 * Uruchomienie:  npm run gen:chardata
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const zrodlo = resolve(here, '../../client-src/sfgame555.swf_as/sfgame_fla/MainTimeline.as');
const cel = resolve(here, '../../web/src/gra/postac-dane.ts');

const linie = readFileSync(zrodlo, 'latin1').split('\n');

const poczatek = linie.findIndex((l) => l.includes('public function getCharImageBound'));
if (poczatek < 0) throw new Error('nie znaleziono getCharImageBound w zrodle klienta');

/**
 * Maska koloru (czesc 11) nie jest liczba, tylko suma stalych klienta:
 * `return ((this.C_BROWS + this.C_HAIR) + this.C_BEARD)`. Wartosci
 * pochodza z deklaracji w tym samym pliku — i sa sprawdzane, zeby cicha
 * zmiana w zrodle nie przeszla niezauwazona.
 */
const STALE = { C_BEARD: 1, C_BROWS: 2, C_HAIR: 4, C_SPECIAL2: 8 };

for (const [nazwa, oczekiwana] of Object.entries(STALE)) {
  const wzorzec = new RegExp(`public const ${nazwa}:\\* = (\\d+);`);
  const trafienie = linie.map((l) => l.match(wzorzec)).find(Boolean);
  if (!trafienie) throw new Error(`nie znaleziono stalej ${nazwa} w zrodle klienta`);
  if (Number(trafienie[1]) !== oczekiwana) {
    throw new Error(`stala ${nazwa} zmienila wartosc: ${trafienie[1]} zamiast ${oczekiwana}`);
  }
}

/** Zamienia `12` albo `(this.C_HAIR + this.C_BEARD)` na liczbe. */
function policz(wyrazenie) {
  const czyste = wyrazenie.replaceAll('this.', '').replaceAll('(', '').replaceAll(')', '');
  return czyste
    .split('+')
    .map((skladnik) => {
      const s = skladnik.trim();
      if (/^\d+$/.test(s)) return Number(s);
      if (s in STALE) return STALE[s];
      throw new Error(`nieznany skladnik w getCharImageBound: ${s}`);
    })
    .reduce((a, b) => a + b, 0);
}

/** Tabela [plec][rasa][czesc] = liczba wariantow. */
const granice = { m: {}, f: {} };

let plec = null;
let rasa = null;
let czesc = null;

/*
 * Ktorego `switch` dotyczy dana etykieta `case`, rozstrzygamy po
 * zagniezdzeniu nawiasow klamrowych — a nie po tym, ktory `switch`
 * widzielismy ostatnio. Ta druga droga myli sie natychmiast po
 * zamknieciu wewnetrznego switcha: kolejne `case` to juz znowu rasa,
 * a nie czesc twarzy.
 */
let glebokosc = 0;
let glebokoscRasy = null;
let glebokoscCzesci = null;

for (let i = poczatek; i < linie.length; i++) {
  const l = linie[i].trim();

  if (i > poczatek + 5 && l.startsWith('public function')) break;

  if (l === 'if (isMann)') plec = 'm';
  else if (l === 'else' && plec === 'm') plec = 'f';
  else if (l === 'switch (isVolk)') glebokoscRasy = glebokosc + 1;
  else if (l === 'switch (itemIndex)') glebokoscCzesci = glebokosc + 1;
  else {
    const przypadek = l.match(/^case (\d+):$/);
    if (przypadek) {
      const n = Number(przypadek[1]);
      if (glebokosc === glebokoscCzesci) {
        czesc = n;
      } else if (glebokosc === glebokoscRasy) {
        rasa = n;
        czesc = null;
        granice[plec][rasa] ??= {};
      }
    }

    const zwrot = l.match(/^return \((.+)\);$/);
    if (zwrot && plec && rasa && czesc !== null) {
      granice[plec][rasa][czesc] = policz(zwrot[1]);
    }
  }

  for (const znak of linie[i]) {
    if (znak === '{') glebokosc++;
    else if (znak === '}') glebokosc--;
  }
}

// --- kontrola sensownosci -------------------------------------------------
const braki = [];
for (const p of ['m', 'f']) {
  for (let r = 1; r <= 8; r++) {
    const wpis = granice[p][r];
    if (!wpis) { braki.push(`${p}/rasa ${r}: brak calego wpisu`); continue; }
    for (let cz = 1; cz <= 11; cz++) {
      if (wpis[cz] === undefined) braki.push(`${p}/rasa ${r}/czesc ${cz}: brak`);
    }
  }
}
if (braki.length > 0) {
  console.error('Tabela wyszla niekompletna:');
  for (const b of braki.slice(0, 20)) console.error('  ' + b);
  throw new Error(`brakuje ${braki.length} wartosci — parser nie zgadza sie ze zrodlem`);
}

const wynik = `/**
 * WYGENEROWANE AUTOMATYCZNIE — nie edytuj recznie.
 * Zrodlo: client-src/.../MainTimeline.as, funkcja getCharImageBound().
 * Odswiezenie: npm run gen:chardata (w katalogu backend/)
 *
 * Ile wariantow ma kazda warstwa portretu, dla danej rasy i plci.
 * Numery czesci odpowiadaja kolejnosci warstw w oryginale:
 *
 *   1 usta, 2 broda, 3 nos, 4 oczy, 5 brwi, 6 uszy, 7 wlosy,
 *   8 special, 9 special2, 10 liczba kolorow, 11 maska: ktore
 *   warstwy w ogole reaguja na kolor (bitowo)
 */

export type Plec = 'm' | 'f';

export const GRANICE_PORTRETU: Record<Plec, Record<number, Record<number, number>>> = ${JSON.stringify(granice, null, 2)};
`;

mkdirSync(dirname(cel), { recursive: true });
writeFileSync(cel, wynik, 'utf8');

const ile = Object.keys(granice.m).length + Object.keys(granice.f).length;
console.log(`Zapisano ${cel}`);
console.log(`Ras x plci: ${ile}, po 11 wartosci kazda — tabela kompletna.`);
