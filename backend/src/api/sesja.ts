/**
 * Hasla i tokeny sesji.
 *
 * Oryginal trzymal hasla jako MD5 bez soli, a klient wysylal je jawnie
 * przy rejestracji. Nowa wersja nie musi tego powtarzac: nowy klient
 * jest nasz, wiec zmieniamy schemat na porzadny.
 *
 * `scrypt` z modulu `node:crypto` — bez zadnej dodatkowej zaleznosci,
 * co ma znaczenie na serwerze bezstanowym, gdzie kazda biblioteka
 * z kodem natywnym to klopot przy wdrozeniu.
 *
 * Konta zalozone w starej wersji maja w bazie hasze MD5. Rozpoznajemy je
 * po braku przedrostka i przepisujemy na scrypt przy pierwszym udanym
 * logowaniu — gracz niczego nie zauwazy.
 */

import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt) as (
  haslo: string,
  sol: Buffer,
  dlugosc: number,
  opcje: { N: number; r: number; p: number },
) => Promise<Buffer>;

/** Parametry kosztu. N=16384 to okolo 100 ms — wystarczajaco drogo. */
const KOSZT = { N: 16384, r: 8, p: 1 };
const DLUGOSC = 32;

export async function zahashujHaslo(haslo: string): Promise<string> {
  const sol = randomBytes(16);
  const klucz = await scryptAsync(haslo, sol, DLUGOSC, KOSZT);
  return `scrypt$${KOSZT.N}$${KOSZT.r}$${KOSZT.p}$${sol.toString('hex')}$${klucz.toString('hex')}`;
}

export async function hasloPasuje(haslo: string, zapisane: string): Promise<boolean> {
  if (!zapisane.startsWith('scrypt$')) {
    // Konto z czasow starego backendu — MD5 bez soli.
    const { createHash } = await import('node:crypto');
    return createHash('md5').update(haslo, 'utf8').digest('hex') === zapisane;
  }

  const [, n, r, p, solHex, kluczHex] = zapisane.split('$');
  if (!n || !r || !p || !solHex || !kluczHex) return false;

  const oczekiwany = Buffer.from(kluczHex, 'hex');
  const policzony = await scryptAsync(haslo, Buffer.from(solHex, 'hex'), oczekiwany.length, {
    N: Number(n),
    r: Number(r),
    p: Number(p),
  });

  // Porownanie w stalym czasie — inaczej czas odpowiedzi zdradza,
  // ile pierwszych bajtow hasza sie zgadza.
  return policzony.length === oczekiwany.length && timingSafeEqual(policzony, oczekiwany);
}

export function czyStaryHash(zapisane: string): boolean {
  return !zapisane.startsWith('scrypt$');
}

/**
 * Token sesji. 32 znaki szesnastkowe — tyle samo, co dawne `ssid`,
 * wiec miesci sie w tej samej kolumnie i w starym protokole.
 */
export function nowyToken(): string {
  return randomBytes(16).toString('hex');
}
