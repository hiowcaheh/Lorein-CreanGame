/**
 * Rozmowa z backendem.
 *
 * Stary klient wysylal wszystko jednym adresem `req.php?req=<32 znaki
 * sesji><3 znaki akcji><reszta>`, a odpowiedz byla lista 511 pol
 * sklejonych ukosnikami. Tutaj jest zwykly JSON i zwykle trasy.
 */

const KLUCZ_TOKENU = 'lorein.token';

/**
 * Token sesji trzymamy PRZEDE WSZYSTKIM w pamieci, a w `localStorage` tylko
 * dodatkowo — zeby przetrwal odswiezenie strony.
 *
 * Odwrotna kolejnosc byla realna usterka. Safari na iPhonie potrafi odmowic
 * dostepu do `localStorage` (prywatne okno, blokada ciasteczek, brak
 * miejsca). Zapis cicho przepadal, kolejne zapytania szly bez tokenu,
 * serwer odpowiadal 401 i gra wyrzucala gracza z powrotem na logowanie —
 * co wygladalo dokladnie tak, jakby logowanie nie dzialalo, mimo ze serwer
 * przyjmowal haslo bez zastrzezen.
 */
let wPamieci: string | null = null;

export function token(): string | null {
  if (wPamieci) return wPamieci;
  try {
    wPamieci = localStorage.getItem(KLUCZ_TOKENU);
  } catch {
    wPamieci = null;
  }
  return wPamieci;
}

export function zapiszToken(nowy: string): void {
  wPamieci = nowy;
  try {
    localStorage.setItem(KLUCZ_TOKENU, nowy);
  } catch {
    // Trudno — sesja przetrwa do odswiezenia strony, ale gra dziala.
  }
}

export function zapomnijToken(): void {
  wPamieci = null;
  try {
    localStorage.removeItem(KLUCZ_TOKENU);
  } catch { /* patrz wyzej */ }
}

/** Czy przegladarka pozwala nam cokolwiek zapamietac miedzy odswiezeniami. */
export function pamiecDziala(): boolean {
  try {
    localStorage.setItem('lorein.proba', '1');
    localStorage.removeItem('lorein.proba');
    return true;
  } catch {
    return false;
  }
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
