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

import { execFileSync } from 'node:child_process';
import { cp, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const gameRoot = resolve(here, '../../sf555');
const publicDir = resolve(here, '../public');
const staticSrc = resolve(here, '../static-src');
const webRoot = resolve(here, '../../web');

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
  // Oprawa interfejsu wyciagnieta z pliku SWF. Lezy w `res/`, ale `res`
  // jest kopiowane tylko raz — a te pliki dochodza i zmieniaja sie razem
  // z kodem, wiec musza isc przy kazdym budowaniu.
  ['res/ui', 'res/ui'],
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

const stamp = [
  process.env['VERCEL_GIT_COMMIT_SHA']?.slice(0, 7) ?? 'lokalnie',
  new Date().toISOString().replace('T', ' ').slice(0, 16),
].join(' · ');

/**
 * Stara strona z Flashem i Ruffle zostaje pod `/stare.html`.
 *
 * Nie jest juz punktem wejscia — gra chodzi teraz jako aplikacja webowa.
 * Zostawiamy ja jako punkt odniesienia przy przenoszeniu kolejnych ekranow;
 * jej zaplecze (`/req.php`, `/config.php`) siedzi teraz pod `/api/`.
 */
const staraStrona = await readFile(resolve(staticSrc, 'index.html'), 'utf8');
await writeFile(resolve(publicDir, 'stare.html'), staraStrona.replaceAll('__WERSJA__', stamp), 'utf8');
console.log('zapisano stare.html (dawna wersja na Ruffle)');

/**
 * Wlasciwa gra: aplikacja webowa z katalogu `web/`.
 *
 * Budujemy ja tutaj, bo Vercel uruchamia polecenie budowania w katalogu
 * `backend` — ale caly projekt jest sklonowany, wiec `../web` jest na miejscu.
 */
console.log('\nBuduje aplikacje webowa...');

const cichy = { cwd: webRoot, stdio: 'inherit' };
execFileSync('npm', ['ci', '--no-audit', '--no-fund'], cichy);
execFileSync('npm', ['run', 'build'], cichy);

// Wynik budowania idzie do `public/`: index.html w korzeniu, reszta w assets/.
const webDist = resolve(webRoot, 'dist');
await rm(resolve(publicDir, 'assets'), { recursive: true, force: true });
await cp(webDist, publicDir, { recursive: true, force: true });
console.log('skopiowano aplikacje webowa do public/');

console.log(`\nKatalog ${publicDir} gotowy (wersja: ${stamp}).`);
