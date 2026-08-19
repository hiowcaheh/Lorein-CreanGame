/**
 * Generuje `src/protocol/gamedata.ts` ze zrodla `sf555/req.php`.
 *
 * Wyciaga dwie tabele danych, ktore sa potrzebne do zbudowania ekranu postaci:
 *
 *   LEVELS      — progi doswiadczenia dla kolejnych poziomow,
 *   PORTAL_HP   — pelne HP potwora portalowego dla pary (akt, etap).
 *
 * Przy HP potwora nie przenosimy calej klasy `Monster` — `loadDefaultData`
 * potrzebuje z niej wylacznie zycia, wiec wystarczy tabela. Reszta klasy
 * przyjdzie razem z portem walki.
 *
 * Uruchomienie:  npm run gen:gamedata
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const phpPath = resolve(here, '../../sf555/req.php');
const outPath = resolve(here, '../src/protocol/gamedata.ts');

const source = readFileSync(phpPath, 'latin1');

// --- progi doswiadczenia -----------------------------------------------
const levelsMatch = /^\$LEVELS\s*=\s*\[([\s\S]*?)\];/m.exec(source);
if (!levelsMatch) {
  throw new Error('Nie znaleziono tablicy $LEVELS w req.php');
}

const levels = levelsMatch[1]
  .split(',')
  .map((entry) => entry.trim())
  .filter((entry) => entry !== '')
  .map(Number);

if (levels.some(Number.isNaN)) {
  throw new Error('Tablica $LEVELS zawiera wartosc, ktorej nie da sie zamienic na liczbe');
}

// --- HP potworow portalowych -------------------------------------------
const fnMatch = /^function getPortalMonster[\s\S]*?\n}/m.exec(source);
if (!fnMatch) {
  throw new Error('Nie znaleziono funkcji getPortalMonster w req.php');
}

const portalHp = new Map(); // "akt:etap" -> hp
let currentAct = null;

for (const line of fnMatch[0].split('\n')) {
  const actMatch = /^\s*case\s+(\d+):\s*$/.exec(line);
  if (actMatch) {
    currentAct = Number(actMatch[1]);
    continue;
  }

  const stageMatch = /^\s*case\s+(\d+):\s*return new Monster\((.*)\);\s*$/.exec(line);
  if (!stageMatch || currentAct === null) {
    continue;
  }

  const stage = Number(stageMatch[1]);

  // Argumenty rozdzielone przecinkami na najwyzszym poziomie zagniezdzenia —
  // pierwszy z nich to wyrazenie w nawiasach, np. `(194 + 6 * $stage)`.
  const args = [];
  let depth = 0;
  let buffer = '';

  for (const char of stageMatch[2]) {
    if (char === '(') depth++;
    if (char === ')') depth--;
    if (char === ',' && depth === 0) {
      args.push(buffer.trim());
      buffer = '';
      continue;
    }
    buffer += char;
  }
  args.push(buffer.trim());

  // Kolejnosc argumentow konstruktora Monster:
  // lvl, class, str, agi, int, wit, luck, dmg_min, dmg_max, hp, armor, id, exp, weapon, shield
  const hp = Number(args[9]);
  if (Number.isNaN(hp)) {
    throw new Error(`HP nie jest liczba dla aktu ${currentAct}, etapu ${stage}: ${args[9]}`);
  }

  portalHp.set(`${currentAct}:${stage}`, hp);
}

if (portalHp.size === 0) {
  throw new Error('Nie odczytano zadnego HP potwora portalowego');
}

const out = `/**
 * Tabele danych gry wygenerowane ze zrodla \`sf555/req.php\`.
 *
 * NIE edytuj recznie — uruchom \`npm run gen:gamedata\`.
 */

/** Doswiadczenie wymagane do awansu z danego poziomu (indeks = poziom). */
export const LEVELS: readonly number[] = [
${levels.map((v, i) => `  ${v},${i % 5 === 4 ? '' : ''}`).join('\n')}
];

/** Pelne HP potwora portalowego, klucz \`"akt:etap"\`. */
export const PORTAL_HP: Readonly<Record<string, number>> = {
${[...portalHp].map(([key, hp]) => `  '${key}': ${hp},`).join('\n')}
};

/** HP potwora portalowego; 0 gdy para (akt, etap) nie istnieje. */
export function portalMonsterHp(act: number, stage: number): number {
  return PORTAL_HP[\`\${act}:\${stage}\`] ?? 0;
}
`;

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, out, 'utf8');

console.log(`Zapisano ${outPath}`);
console.log(`LEVELS: ${levels.length} progow, PORTAL_HP: ${portalHp.size} wpisow`);
