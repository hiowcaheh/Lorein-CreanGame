/**
 * Przygotowuje katalog `public/` dla wdrozenia.
 *
 * Zasoby gry (96 MB grafik i 22 jezyki) leza w `sf555/` razem ze stara
 * wersja w PHP. Zamiast duplikowac je w repozytorium, kopiujemy je tutaj
 * przy budowaniu — Vercel klonuje caly projekt, wiec `../sf555` jest
 * dostepne mimo ustawienia Root Directory na `backend`.
 *
 * Uruchomienie:  npm run build
 */

import { cp, mkdir, rm, stat } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const gameRoot = resolve(here, '../../sf555');
const publicDir = resolve(here, '../public');
const staticSrc = resolve(here, '../static-src');

async function exists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

if (!(await exists(gameRoot))) {
  console.error(`Nie znaleziono zasobow gry w ${gameRoot}`);
  console.error('Na Vercelu upewnij sie, ze Root Directory wskazuje na "backend",');
  console.error('a repozytorium zawiera katalog sf555/.');
  process.exit(1);
}

await rm(publicDir, { recursive: true, force: true });
await mkdir(publicDir, { recursive: true });

// Zasoby czytane przez klienta Flash. Reszta `sf555/` to stary backend PHP,
// ktorego nie publikujemy — pliki .php trafilyby na serwer statyczny
// jako tekst do pobrania.
const assets = [
  ['res', 'res'],
  ['lang', 'lang'],
  ['favicon.ico', 'favicon.ico'],
  ['crossdomain.xml', 'crossdomain.xml'],
  // Konfiguracja sklepu grzybow jest plikiem tekstowym mimo rozszerzenia .php
  // — klient parsuje ja bajt w bajt, wiec kopiujemy bez zmian.
  ['papaya_cfg.php', 'papaya_cfg.php'],
];

for (const [from, to] of assets) {
  const source = resolve(gameRoot, from);
  if (!(await exists(source))) {
    console.warn(`pomijam brakujacy zasob: ${from}`);
    continue;
  }
  await cp(source, resolve(publicDir, to), { recursive: true });
  console.log(`skopiowano ${from}`);
}

// Strona uruchamiajaca gre.
await cp(resolve(staticSrc, 'index.html'), resolve(publicDir, 'index.html'));
console.log('skopiowano index.html');

console.log(`\nKatalog ${publicDir} gotowy.`);
