/**
 * Aplikacja Hono — niezalezna od runtime'u.
 *
 * Ten sam obiekt uruchamia sie pod Node (`src/index.ts`), pod Deno,
 * pod Supabase Edge Functions i pod Cloudflare Workers. Decyzja o hostingu
 * nie jest tutaj zaszyta i mozna ja zmienic pozniej.
 *
 * Sercem migracji jest **przekazywanie do starego backendu**: akcje juz
 * przeniesione obsluguje TypeScript, cala reszta leci do `req.php`. Dzieki
 * temu gra dziala nieprzerwanie, a akcje przenosi sie pojedynczo — zamiast
 * przepisywac 10 370 linii i wlaczac wszystko naraz.
 */

import { Hono } from 'hono';
import { parseRequest } from './protocol/request.js';
import { PhpResponse } from './protocol/response.js';
import { ACT } from './protocol/constants.js';
import { ranking } from './actions/ranking.js';
import { getSql } from './db/client.js';
import { config } from './config.js';

/** Akcje obslugiwane juz przez nowy backend. */
const handlers = {
  [ACT.RANKING]: ranking,
} as const;

export const app = new Hono();

app.get('/health', (c) => c.json({ status: 'ok', ported: Object.keys(handlers) }));

/**
 * Jedyny endpoint gry. Sciezka jest dowolna — klient bierze ja z pola 25
 * konfiguracji, wiec przestawienie gry na ten backend to zmiana jednej
 * linii w konfiguracji, bez rekompilacji klienta Flash.
 */
app.get('/req.php', async (c) => {
  const req = parseRequest(c.req.query('req'));
  const handler = handlers[req.action as keyof typeof handlers];

  if (handler) {
    const response = await handler(getSql(), req);
    return textResponse(c.body.bind(c), response.toString());
  }

  if (config.legacyBaseUrl) {
    return proxyToLegacy(c.req.url);
  }

  // Odpowiednik gałęzi `default` w `req.php`.
  return textResponse(c.body.bind(c), PhpResponse.of('0').toString());
});

type BodyFn = (data: string, init: { headers: Record<string, string> }) => Response;

function textResponse(body: BodyFn, text: string): Response {
  return body(text, {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'no-store',
      // Klient laduje sie z innego adresu niz backend, wiec przegladarka
      // wymaga jawnej zgody na zapytanie miedzydomenowe.
      'access-control-allow-origin': '*',
    },
  });
}

/**
 * Przekazuje zapytanie do starego backendu PHP i zwraca jego odpowiedz
 * bez zmian. Query string idzie w calosci — lacznie z `rnd`, ktore klient
 * dokleja jako zabezpieczenie przed cache'owaniem.
 */
async function proxyToLegacy(originalUrl: string): Promise<Response> {
  const incoming = new URL(originalUrl);
  const target = new URL(config.legacyBaseUrl);
  target.search = incoming.search;

  const upstream = await fetch(target, { headers: { accept: 'text/plain' } });
  const text = await upstream.text();

  return new Response(text, {
    status: upstream.status,
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'no-store',
      'access-control-allow-origin': '*',
      // Ulatwia sprawdzenie w narzedziach deweloperskich, ktora akcja
      // nie zostala jeszcze przeniesiona.
      'x-lorein-backend': 'legacy-php',
    },
  });
}
