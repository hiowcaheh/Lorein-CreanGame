/**
 * Najprostsza mozliwa funkcja — bez zadnych importow.
 *
 * Sluzy do jednej rzeczy: rozroznienia dwoch sytuacji, ktore z zewnatrz
 * wygladaja identycznie.
 *
 *   /api/ping dziala, a /version nie  ->  problem jest w kodzie aplikacji
 *                                          albo w jej zaleznosciach
 *   /api/ping tez nie dziala          ->  problem jest w samej konfiguracji
 *                                          funkcji na Vercelu
 */

export const config = { runtime: 'nodejs' };

export default function handler(_request: unknown, response: { end: (t: string) => void }) {
  response.end('pong ' + new Date().toISOString());
}
