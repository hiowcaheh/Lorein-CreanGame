/**
 * Wierne odpowiedniki funkcji PHP uzywanych w `req.php`.
 *
 * Nie jest to kwestia wygody, tylko poprawnosci: JavaScript i PHP roznia sie
 * w miejscach, ktore przy porcie logiki gry cicho psuja balans. Najbardziej
 * podstepne jest zaokraglanie:
 *
 *     PHP:  round(-2.5) = -3        JS:  Math.round(-2.5) = -2
 *
 * PHP zaokragla polowki *od zera*, JavaScript zawsze *w gore*. W `req.php`
 * jest 60 wywolan `round` i 26 `ceil` — uzycie `Math.round` rozjechaloby
 * obrazenia i nagrody o jeden w losowych miejscach.
 *
 * Zgodnosc zweryfikowana wzgledem prawdziwego PHP — patrz `test/php.test.ts`.
 */

/** Zaokraglenie polowek od zera — tak, jak robi to PHP. */
function roundHalfAwayFromZero(value: number): number {
  return value >= 0 ? Math.floor(value + 0.5) : Math.ceil(value - 0.5);
}

/**
 * Odpowiednik `round($value, $precision)`.
 *
 * Precyzja moze byc ujemna (`round(1234, -2) === 1200`), tak jak w PHP.
 * Krok z `toPrecision(15)` odtwarza kompensacje bledu reprezentacji
 * zmiennoprzecinkowej, ktora PHP wykonuje wewnetrznie — bez niej
 * `round(0.285, 2)` dawaloby 0.28 zamiast 0.29.
 */
export function round(value: number, precision = 0): number {
  if (!Number.isFinite(value) || value === 0) {
    return value;
  }

  const factor = 10 ** precision;
  const scaled = value * factor;

  if (!Number.isFinite(scaled)) {
    return value;
  }

  const compensated = Number(scaled.toPrecision(15));
  return roundHalfAwayFromZero(compensated) / factor;
}

/** Odpowiednik `ceil()`. W PHP zwraca float, tutaj zawsze liczbe. */
export function ceil(value: number): number {
  return Math.ceil(value);
}

/** Odpowiednik `floor()`. */
export function floor(value: number): number {
  return Math.floor(value);
}

/**
 * Odpowiednik rzutowania `(int)$value` — obcina w strone zera,
 * a z napisu bierze wiodaca liczbe calkowita (`"12abc"` → `12`).
 */
export function intval(value: unknown): number {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? Math.trunc(value) : 0;
  }
  if (typeof value === 'boolean') {
    return value ? 1 : 0;
  }
  if (value === null || value === undefined) {
    return 0;
  }

  const match = /^[\s]*([+-]?\d+)/.exec(String(value));
  return match ? Math.trunc(Number(match[1])) : 0;
}

/** Odpowiednik rzutowania `(float)$value`. */
export function floatval(value: unknown): number {
  if (typeof value === 'number') {
    return value;
  }
  if (value === null || value === undefined) {
    return 0;
  }

  const match = /^[\s]*([+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?)/.exec(String(value));
  return match ? Number(match[1]) : 0;
}

/**
 * Odpowiednik `ctype_digit()`.
 *
 * Uwaga: dla pustego napisu PHP zwraca `false`, i tak samo robi ta funkcja.
 * Akcja rankingu (`007`) opiera na tym rozroznienie „numer pozycji"
 * od „nazwa gracza".
 */
export function ctypeDigit(value: unknown): boolean {
  return typeof value === 'string' && value.length > 0 && /^\d+$/.test(value);
}

/**
 * Odpowiednik `urlencode()` — kodowanie w stylu RFC 1738.
 *
 * Rozni sie od `encodeURIComponent()`: spacja to `+` (a nie `%20`),
 * a znaki `!'()*` sa kodowane. Serwer uzywa tego m.in. przy nazwach
 * w rankingu i tresci wiadomosci, wiec roznica byloby widoczna w grze.
 */
export function urlencode(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let out = '';

  for (const byte of bytes) {
    const char = String.fromCharCode(byte);
    if (/[A-Za-z0-9_.-]/.test(char)) {
      out += char;
    } else if (byte === 0x20) {
      out += '+';
    } else {
      out += '%' + byte.toString(16).toUpperCase().padStart(2, '0');
    }
  }

  return out;
}

/**
 * Odpowiednik `explode()`.
 *
 * PHP na pustym napisie zwraca tablice z jednym pustym elementem — tak samo
 * dziala `String.prototype.split`, wiec zachowanie sie zgadza. Dodatkowo
 * obslugiwany jest dodatni limit.
 */
export function explode(separator: string, subject: string, limit?: number): string[] {
  if (separator === '') {
    throw new Error('explode: separator nie moze byc pusty');
  }

  const parts = subject.split(separator);

  if (limit === undefined || limit <= 0 || parts.length <= limit) {
    return parts;
  }

  // PHP scala nadmiarowe czesci w ostatni element.
  return [...parts.slice(0, limit - 1), parts.slice(limit - 1).join(separator)];
}

/** Odpowiednik `implode()` / `join()`. */
export function implode(separator: string, pieces: readonly unknown[]): string {
  return pieces.map((piece) => (piece === null || piece === undefined ? '' : String(piece))).join(separator);
}

/** Odpowiednik `time()` — liczba sekund od epoki, nie milisekund. */
export function time(): number {
  return Math.floor(Date.now() / 1000);
}
