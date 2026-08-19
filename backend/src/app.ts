/**
 * Aplikacja Hono — niezalezna od runtime'u.
 *
 * Ten sam obiekt uruchamia sie pod Node (`src/index.ts`), na Vercelu
 * (`api/index.ts`), pod Deno i pod Bunem. Decyzja o hostingu nie jest
 * tutaj zaszyta.
 *
 * Akcje juz przeniesione obsluguje TypeScript; reszta trafia do starego
 * `req.php`, o ile wskazano `SF_LEGACY_URL` i oba backendy pracuja na tej
 * samej bazie.
 */

import { Hono } from 'hono';
import { parseRequest } from './protocol/request.js';
import { PhpResponse } from './protocol/response.js';
import { ACT } from './protocol/constants.js';
import { ranking } from './actions/ranking.js';
import { register, login, loginFollowUp } from './actions/account.js';
import { hero } from './actions/hero.js';
import { buildClientConfig } from './clientConfig.js';
import { getSql } from './db/client.js';
import { config } from './config.js';
import type { GameRequest } from './protocol/request.js';
import type { Sql } from './db/client.js';

type Handler = (sql: Sql, req: GameRequest, ip: string) => Promise<PhpResponse>;

/** Akcje obslugiwane juz przez nowy backend. */
const handlers: Record<string, Handler> = {
  [ACT.REGISTER]: register,
  [ACT.LOGIN]: login,
  [ACT.LOGIN_FOLLOW_UP]: (sql, req) => loginFollowUp(sql, req),
  [ACT.HERO]: hero,
  [ACT.RANKING]: (sql, req) => ranking(sql, req),
};

export const app = new Hono();

/**
 * Awaria po stronie serwera nie moze konczyc sie pusta odpowiedzia.
 *
 * Klient Flash, ktory dostanie 500 bez tresci, po prostu stoi — gracz widzi
 * czarny ekran i nie ma zadnej wskazowki. Tutaj przyczyna trafia do logow
 * Vercela, a w odpowiedzi zostaje krotki komunikat mozliwy do odczytania
 * w przegladarce.
 */
app.onError((err, c) => {
  console.error('Blad obslugi zapytania:', c.req.path, err);

  const message = err instanceof Error ? err.message : String(err);
  return c.text(`Blad serwera: ${message}`, 500, {
    'content-type': 'text/plain; charset=utf-8',
    'access-control-allow-origin': '*',
  });
});

app.get('/health', async (c) => {
  // Sprawdzamy takze baze — samo "aplikacja wstala" niewiele mowi, gdy
  // najczestsza przyczyna problemow jest zle ustawione DATABASE_URL.
  let database = 'ok';
  try {
    await getSql()`SELECT 1`;
  } catch (err) {
    database = err instanceof Error ? err.message : String(err);
  }

  return c.json({
    status: 'ok',
    database,
    ported: Object.keys(handlers).sort(),
    legacyProxy: config.legacyBaseUrl !== '',
  });
});

/**
 * Konfiguracja pobierana przez klienta Flash przy starcie.
 *
 * Zastepuje `config.php`. Klient bierze stad m.in. adres endpointu gry
 * (pole 25), wiec to jest miejsce, w ktorym gra dowiaduje sie, gdzie ma
 * wysylac zapytania.
 */
app.get('/config.php', async (c) => {
  const body = await buildClientConfig(getSql(), new URL(c.req.url));
  return c.body(body, {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'no-store',
      'access-control-allow-origin': '*',
    },
  });
});

/** Jedyny endpoint gry. */
app.get('/req.php', async (c) => {
  const req = parseRequest(c.req.query('req'));
  const handler = handlers[req.action];

  if (handler) {
    const response = await handler(getSql(), req, clientIp(c.req.raw));
    return gameResponse(response.toString());
  }

  if (config.legacyBaseUrl) {
    return proxyToLegacy(c.req.url);
  }

  // Odpowiednik galezi `default` w `req.php`.
  return gameResponse(PhpResponse.of('0').toString());
});

function gameResponse(text: string): Response {
  return new Response(text, {
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
 * Adres IP gracza.
 *
 * Za posrednikiem (Vercel, proxy na VPS-ie) prawdziwy adres jest
 * w naglowku — bez tego wszyscy gracze wygladaliby jak jeden i limit
 * trzech kont na IP zablokowalby rejestracje po trzecim koncie w ogole.
 */
function clientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0]!.trim();
  }
  return request.headers.get('x-real-ip') ?? '0.0.0.0';
}

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
      'x-lorein-backend': 'legacy-php',
    },
  });
}
