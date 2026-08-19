/**
 * Builder odpowiedzi zgodny z semantyka tablicy PHP.
 *
 * `req.php` konczy sie linia:
 *
 *     echo join("/", $ret);
 *
 * i to jest caly protokol odpowiedzi. Wierne odtworzenie wymaga jednak
 * uwzglednienia tego, ze tablica w PHP to **uporzadkowana mapa**, a nie
 * ciagly wektor:
 *
 *   - `$ret = array_fill(0, 511, '0')` daje klucze 0..510,
 *   - `$ret = ["007"]` **podmienia cala tablice** na jednoelementowa,
 *   - `$ret[600] = 'x'` na 511-elementowej tablicy dopisuje klucz na koncu,
 *     a `join` NIE wstawia w miejsce brakujacych kluczy zadnych wypelniaczy,
 *   - `$ret[] = ';'` dopisuje pod kluczem o jeden wiekszym od najwiekszego.
 *
 * Zwykla tablica JavaScript zachowalaby sie inaczej (dziury jako `empty`,
 * `join` wstawilby puste napisy), dlatego pod spodem jest `Map`, ktora
 * zachowuje kolejnosc wstawiania.
 */

import { toPhpString } from '../compat/php.js';

export class PhpResponse {
  private readonly values = new Map<number, string>();

  /** Odpowiednik `array_fill(0, count, value)`. */
  static filled(count = 511, value = '0'): PhpResponse {
    const response = new PhpResponse();
    for (let i = 0; i < count; i++) {
      response.values.set(i, value);
    }
    return response;
  }

  /** Odpowiednik `$ret = [...]` — podmiana calej tablicy. */
  static of(...values: readonly unknown[]): PhpResponse {
    const response = new PhpResponse();
    values.forEach((value, index) => response.values.set(index, stringify(value)));
    return response;
  }

  /** Odpowiednik `$ret[$index] = $value`. */
  set(index: number, value: unknown): this {
    this.values.set(index, stringify(value));
    return this;
  }

  /** Odczyt pola; `undefined` gdy klucz nie istnieje (jak `$ret[$i] ?? null`). */
  get(index: number): string | undefined {
    return this.values.get(index);
  }

  /**
   * Odczyt pola jako liczby. Nieistniejace pole daje 0 — tak samo jak
   * `(int)($ret[$i] ?? 0)` w PHP.
   */
  number(index: number): number {
    const raw = this.values.get(index);
    if (raw === undefined || raw === '') {
      return 0;
    }
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  /**
   * Odpowiednik `$ret[$index] += $value`.
   *
   * W PHP tablica jest wypelniona napisami `'0'`, ktore przy dodawaniu sa
   * po cichu rzutowane na liczby. Ta metoda odtwarza to zachowanie.
   */
  add(index: number, value: number): this {
    return this.set(index, this.number(index) + value);
  }

  /** Odpowiednik `$ret[] = $value` — dopisanie pod kolejnym kluczem. */
  push(value: unknown): this {
    const nextKey = this.values.size === 0 ? 0 : Math.max(...this.values.keys()) + 1;
    this.values.set(nextKey, stringify(value));
    return this;
  }

  /**
   * Odpowiednik `$ret[0] = "007" . $ret[0]` — doklejenie przedrostka.
   * Ten wzorzec powtarza sie w `req.php` na koncu wielu akcji.
   */
  prefix(index: number, text: string): this {
    this.values.set(index, text + (this.values.get(index) ?? ''));
    return this;
  }

  /** Liczba istniejacych kluczy. */
  get size(): number {
    return this.values.size;
  }

  /** Serializacja — dokladny odpowiednik `join("/", $ret)`. */
  toString(): string {
    return [...this.values.values()].join('/');
  }
}

/**
 * Konwersja wartosci na napis wedlug regul PHP: `null` i `undefined` daja
 * pusty napis, a `true`/`false` odpowiednio `'1'` i `''`.
 */
function stringify(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  if (typeof value === 'boolean') {
    return value ? '1' : '';
  }
  if (typeof value === 'number') {
    // PHP formatuje liczby inaczej niz JavaScript — patrz `toPhpString`.
    return toPhpString(value);
  }
  return String(value);
}
