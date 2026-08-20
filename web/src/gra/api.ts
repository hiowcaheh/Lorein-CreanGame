/**
 * Rozmowa z backendem.
 *
 * Stary klient wysylal wszystko jednym adresem `req.php?req=<32 znaki
 * sesji><3 znaki akcji><reszta>`, a odpowiedz byla lista 511 pol
 * sklejonych ukosnikami. Tutaj jest zwykly JSON i zwykle trasy.
 */

const KLUCZ_TOKENU = 'lorein.token';

export function token(): string | null {
  try {
    return localStorage.getItem(KLUCZ_TOKENU);
  } catch {
    // Prywatne okno albo zablokowane ciasteczka — gra dziala, tyle ze
    // trzeba sie logowac za kazdym razem.
    return null;
  }
}

export function zapiszToken(nowy: string): void {
  try {
    localStorage.setItem(KLUCZ_TOKENU, nowy);
  } catch { /* patrz wyzej */ }
}

export function zapomnijToken(): void {
  try {
    localStorage.removeItem(KLUCZ_TOKENU);
  } catch { /* patrz wyzej */ }
}

/** Blad, ktory da sie pokazac graczowi. */
/**
 * Zrozumialy komunikat zamiast samego numeru.
 *
 * Gracz nie ma pojecia, co znaczy 504 — a to akurat najczestszy blad
 * przy grze na serwerze bezstanowym i zwykle mija po chwili.
 */
function opiszBlad(status: number): string {
  if (status === 504 || status === 502) {
    return 'Serwer nie odpowiedział na czas. Spróbuj jeszcze raz za chwilę.';
  }
  if (status === 429) {
    return 'Za dużo prób z tego adresu. Odczekaj chwilę.';
  }
  if (status >= 500) {
    return 'Coś się popsuło po stronie serwera. Spróbuj ponownie.';
  }
  return `Serwer odpowiedział błędem ${status}.`;
}

export class BladApi extends Error {
  constructor(komunikat: string, readonly status: number) {
    super(komunikat);
  }
}

export async function zapytaj<T>(sciezka: string, cialo?: unknown): Promise<T> {
  const t = token();

  let odpowiedz: Response;
  try {
    odpowiedz = await fetch(`/api${sciezka}`, {
      method: cialo === undefined ? 'GET' : 'POST',
      headers: {
        ...(cialo === undefined ? {} : { 'content-type': 'application/json' }),
        ...(t ? { authorization: `Bearer ${t}` } : {}),
      },
      ...(cialo === undefined ? {} : { body: JSON.stringify(cialo) }),
    });
  } catch {
    throw new BladApi('Brak połączenia z serwerem.', 0);
  }

  const tresc = (await odpowiedz.json().catch(() => ({}))) as { blad?: string };

  if (!odpowiedz.ok) {
    throw new BladApi(tresc.blad ?? opiszBlad(odpowiedz.status), odpowiedz.status);
  }

  return tresc as T;
}
