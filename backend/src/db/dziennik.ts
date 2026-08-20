/**
 * Dziennik zdarzen serwera.
 *
 * Gra dziala na serwerze bezstanowym — nie ma tam dokad zajrzec, gdy cos
 * padnie u gracza. Logi Vercela sa dostepne tylko przez panel, a komunikat
 * w przegladarce czesto nie mowi nic poza numerem bledu.
 *
 * Dlatego wazne zdarzenia trafiaja do tabeli `dziennik`. Zapis jest
 * NAJLEPSZYM STARANIEM: jesli sie nie uda, nie moze zepsuc odpowiedzi dla
 * gracza — bo to tylko diagnostyka, a nie dzialanie gry.
 *
 * Do dziennika nie trafiaja hasla ani tresc zapytan.
 */

import { getSql } from './client.js';

export type Rodzaj =
  | 'blad'                 // wyjatek w obsludze zapytania
  | 'logowanie-brak-konta'
  | 'logowanie-zle-haslo'
  | 'logowanie-ok'
  | 'rejestracja-ok'
  | 'rejestracja-odmowa';

export async function zapiszWDzienniku(
  sciezka: string,
  status: number,
  rodzaj: Rodzaj,
  szczegoly = '',
): Promise<void> {
  try {
    await getSql()`
      INSERT INTO dziennik (sciezka, status, rodzaj, szczegoly)
      VALUES (${sciezka}, ${status}, ${rodzaj}, ${szczegoly.slice(0, 2000)})
    `;
  } catch {
    // Diagnostyka nie moze przeszkadzac w graniu.
  }
}
