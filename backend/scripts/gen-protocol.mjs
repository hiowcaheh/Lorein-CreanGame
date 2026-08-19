/**
 * Generuje `src/protocol/constants.ts` ze zrodla `sf555/req.php`.
 *
 * Stale protokolu przepisywane recznie to proszenie sie o literowke, ktora
 * ujawni sie dopiero jako dziwnie dzialajacy ekran w grze. Dlatego czytamy je
 * prosto z PHP — dopoki stary backend jest zrodlem prawdy, ta generacja
 * gwarantuje zgodnosc.
 *
 * Uruchomienie:  npm run gen:protocol
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const phpPath = resolve(here, '../../sf555/req.php');
const outPath = resolve(here, '../src/protocol/constants.ts');

const source = readFileSync(phpPath, 'latin1');

/**
 * Zbiera definicje `$PREFIX_NAZWA = wartosc;` z poczatku linii.
 * Wartosc moze byc w cudzyslowie lub goła liczba. Przy powtorzonej nazwie
 * wygrywa ostatnia definicja — dokladnie tak, jak zachowa sie PHP.
 */
function collect(prefix) {
  const re = new RegExp(String.raw`^\$${prefix}_([A-Z0-9_]+)\s*=\s*(?:"([^"]*)"|(\d+))\s*;`, 'gm');
  const found = new Map();

  for (const match of source.matchAll(re)) {
    const [, name, quoted, bare] = match;
    found.set(name, { value: quoted ?? bare, quoted: quoted !== undefined });
  }

  return found;
}

function emit(constName, entries, doc) {
  const lines = [`/** ${doc} */`, `export const ${constName} = {`];

  for (const [name, { value, quoted }] of entries) {
    lines.push(`  ${name}: ${quoted ? `'${value}'` : value},`);
  }

  lines.push('} as const;', '');
  return lines.join('\n');
}

const groups = [
  ['ACT', 'Kody akcji przyjmowane w parametrze `req` (znaki 32-34).'],
  ['SF', 'Indeksy pol w odpowiedzi — plaskiej tablicy ~511 wartosci.'],
  ['RESP', 'Kody odpowiedzi sukcesu.'],
  ['ERR', 'Kody bledow.'],
];

let out = `/**
 * Stale protokolu wygenerowane ze zrodla \`sf555/req.php\`.
 *
 * NIE edytuj recznie — uruchom \`npm run gen:protocol\`. Klient Flash czyta
 * odpowiedz po numerach pol, wiec przesuniecie indeksu psuje interfejs
 * w losowych miejscach.
 */

`;

const summary = [];

for (const [prefix, doc] of groups) {
  const entries = collect(prefix);
  summary.push(`${prefix}: ${entries.size}`);
  out += emit(prefix, entries, doc) + '\n';
}

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, out, 'utf8');

console.log(`Zapisano ${outPath}`);
console.log(summary.join(', '));
