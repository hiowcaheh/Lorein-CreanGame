/**
 * Przygotowuje katalog `public/` dla wdrozenia.
 *
 * Zasoby gry (96 MB grafik i 22 jezyki) leza w `sf555/` razem ze stara
 * wersja w PHP. Zamiast duplikowac je w repozytorium, kopiujemy je tutaj
 * przy budowaniu — Vercel klonuje caly projekt, wiec `../sf555` jest
 * dostepne mimo ustawienia Root Directory na `backend`.
 *
 * Dwie pulapki, ktore ten skrypt musi omijac naraz:
 *
 *   1. Vercel potrafi uruchomic polecenie budowania WIECEJ NIZ RAZ.
 *      Skrypt nie moze wiec niczego usuwac — wczesniejsze `rm -rf public`
 *      kasowalo katalog dokladnie wtedy, gdy Vercel zbieral z niego pliki:
 *      `ENOENT: ... /public/res/sfgame/char/...`
 *
 *   2. Vercel przywraca `public/` z cache budowania miedzy wdrozeniami.
 *      Pomijanie calego kopiowania na podstawie znacznika powodowalo, ze
 *      wdrazala sie STARA strona, mimo nowego commita.
 *
 * Rozwiazanie: male pliki kopiujemy ZAWSZE (to one sie zmieniaja), a ciezkie
 * katalogi `res/` i `lang/` tylko wtedy, gdy jeszcze ich nie ma.
 *
 * Uruchomienie:  npm run build
 */

import { cp, mkdir, readFile, stat, writeFile } from 'node:fs/promises';
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

const haveAssets = await exists(gameRoot);

await mkdir(publicDir, { recursive: true });

if (!haveAssets) {
  console.warn('');
  console.warn('  UWAGA: nie znaleziono zasobow gry w ' + gameRoot);
  console.warn('  Backend zostanie wdrozony i /health bedzie dzialac,');
  console.warn('  ale sama gra sie nie wczyta.');
  console.warn('');
}

/**
 * Ciezkie katalogi — kopiowane tylko raz.
 *
 * Ich zawartosc pochodzi z paczki gry i nie zmienia sie miedzy wdrozeniami,
 * wiec ponowne przepisywanie 96 MB niczego nie wnosi.
 */
const heavy = [
  ['res', 'res'],
  ['lang', 'lang'],
];

/**
 * Male pliki — kopiowane ZAWSZE.
 *
 * To one zmieniaja sie razem z kodem, wiec pominiecie ich oznaczaloby
 * wdrozenie starej wersji strony.
 */
const light = [
  ['favicon.ico', 'favicon.ico'],
  ['crossdomain.xml', 'crossdomain.xml'],
  ['papaya_cfg.php', 'papaya_cfg.php'],
];

if (haveAssets) {
  for (const [from, to] of heavy) {
    const source = resolve(gameRoot, from);
    const target = resolve(publicDir, to);

    if (!(await exists(source))) {
      console.warn(`pomijam brakujacy zasob: ${from}`);
      continue;
    }
    if (await exists(target)) {
      console.log(`${from} jest juz na miejscu — pomijam kopiowanie`);
      continue;
    }

    await cp(source, target, { recursive: true });
    console.log(`skopiowano ${from}`);
  }

  for (const [from, to] of light) {
    const source = resolve(gameRoot, from);
    if (!(await exists(source))) {
      console.warn(`pomijam brakujacy zasob: ${from}`);
      continue;
    }
    await cp(source, resolve(publicDir, to), { recursive: true, force: true });
    console.log(`skopiowano ${from}`);
  }
}

/**
 * Strona uruchamiajaca gre — zawsze swieza, ze znacznikiem wersji.
 *
 * Znacznik trafia do diagnostyki (`?debug=1`), wiec od razu widac, czy
 * przegladarka albo cache Vercela nie podaja starej strony.
 */
const stamp = [
  process.env['VERCEL_GIT_COMMIT_SHA']?.slice(0, 7) ?? 'lokalnie',
  new Date().toISOString().replace('T', ' ').slice(0, 16),
].join(' · ');

const page = await readFile(resolve(staticSrc, 'index.html'), 'utf8');
await writeFile(resolve(publicDir, 'index.html'), page.replaceAll('__WERSJA__', stamp), 'utf8');
console.log(`skopiowano index.html (wersja: ${stamp})`);

console.log(`\nKatalog ${publicDir} gotowy.`);
