/**
 * Generator liczb pseudolosowych zgodny z `mt_rand()` z PHP.
 *
 * Po co wierna kopia, skoro losowosc ma byc losowa: bez niej nie da sie
 * porownac starego backendu PHP z nowym. Przy tym samym ziarnie oba musza
 * wygenerowac ten sam przedmiot, tego samego potwora i ten sam przebieg walki
 * — dopiero wtedy roznica w wyniku oznacza blad w porcie, a nie przypadek.
 *
 * Implementacja odtwarza Mersenne Twister MT19937 w wariancie uzywanym przez
 * PHP 7.1+ (gdzie `rand()` jest aliasem `mt_rand()`) wraz z algorytmem
 * zawezania do zakresu opartym na odrzucaniu probek.
 *
 * Zgodnosc zweryfikowana empirycznie wzgledem PHP 8.4 — patrz
 * `test/rng.test.ts` i `test/fixtures/php-mt-rand.json`.
 */

const N = 624;
const M = 397;
const MATRIX_A = 0x9908b0df;
const UPPER_MASK = 0x80000000;
const LOWER_MASK = 0x7fffffff;
const UINT32_MAX = 0xffffffff;

export class PhpMtRand {
  private readonly state = new Uint32Array(N);
  private index = N + 1;

  constructor(seed?: number) {
    this.seed(seed ?? Math.floor(Math.random() * 0x7fffffff));
  }

  /** Odpowiednik `mt_srand($seed)`. */
  seed(seed: number): void {
    this.state[0] = seed >>> 0;
    for (let i = 1; i < N; i++) {
      const prev = this.state[i - 1]!;
      this.state[i] = (Math.imul(1812433253, prev ^ (prev >>> 30)) + i) >>> 0;
    }
    this.index = N;
  }

  private reload(): void {
    const s = this.state;
    for (let i = 0; i < N; i++) {
      const u = s[i]!;
      const v = s[(i + 1) % N]!;
      const mixed = (u & UPPER_MASK) | (v & LOWER_MASK);
      // PHP uzywa najmlodszego bitu z `v` (wariant MT_RAND_MT19937).
      const twisted = (mixed >>> 1) ^ (v & 1 ? MATRIX_A : 0);
      s[i] = (s[(i + M) % N]! ^ twisted) >>> 0;
    }
    this.index = 0;
  }

  /** Surowa 32-bitowa wartosc — odpowiednik wewnetrznego `php_mt_rand()`. */
  next32(): number {
    if (this.index >= N) {
      this.reload();
    }
    let y = this.state[this.index++]!;
    y ^= y >>> 11;
    y = (y ^ ((y << 7) & 0x9d2c5680)) >>> 0;
    y = (y ^ ((y << 15) & 0xefc60000)) >>> 0;
    y = (y ^ (y >>> 18)) >>> 0;
    return y;
  }

  /**
   * Losowa wartosc z przedzialu [0, umax] metoda odrzucania probek —
   * odpowiednik `rand_range32()` z PHP. Zwykle `% (umax+1)` dawaloby
   * lekkie przechylenie rozkladu i rozjazd z PHP.
   */
  private range32(umax: number): number {
    let result = this.next32();

    if (umax === UINT32_MAX) {
      return result;
    }

    const count = umax + 1;

    // Potega dwojki — wystarczy maska, bez odrzucania.
    if ((count & (count - 1)) === 0) {
      return result & umax;
    }

    const limit = UINT32_MAX - ((UINT32_MAX % count) + 1);
    while (result > limit) {
      result = this.next32();
    }

    return result % count;
  }

  /**
   * Odpowiednik `mt_rand($min, $max)` oraz `rand($min, $max)`.
   * Bez argumentow zwraca wartosc 31-bitowa, tak jak PHP.
   */
  rand(min?: number, max?: number): number {
    if (min === undefined || max === undefined) {
      return this.next32() >>> 1;
    }
    if (min > max) {
      throw new RangeError(`mt_rand: min (${min}) wieksze niz max (${max})`);
    }
    return min + this.range32(max - min);
  }
}

/**
 * Domyslny generator uzywany przez logike gry.
 *
 * W testach podmieniany przez `setRng()` na instancje z ustalonym ziarnem,
 * dzieki czemu ten sam scenariusz zawsze daje ten sam wynik.
 */
let current = new PhpMtRand();

export function setRng(rng: PhpMtRand): void {
  current = rng;
}

export function getRng(): PhpMtRand {
  return current;
}

/** Odpowiednik `rand($min, $max)` / `mt_rand($min, $max)` z PHP. */
export function rand(min: number, max: number): number {
  return current.rand(min, max);
}
