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
import { parseRequest } from './protocol/request';
import { PhpResponse } from './protocol/response';
import { ACT } from './protocol/constants';
import { ranking } from './actions/ranking';
import { register, login, loginFollowUp } from './actions/account';
import { hero } from './actions/hero';
import { buildClientConfig } from './clientConfig';
import { getSql } from './db/client';
import { config } from './config';
import type { GameRequest } from './protocol/request';
import type { Sql } from './db/client';

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

/**
 * Najprostszy mozliwy dowod zycia — bez bazy, bez zadnej pracy.
 *
 * Gdy `/version` odpowiada, a `/health` nie, problem jest wylacznie
 * w polaczeniu z baza. Gdy nie odpowiada nawet `/version`, funkcja nie
 * uruchamia sie w ogole.
 */
app.get('/version', (c) =>
  c.text(
    [
      'commit: ' + (process.env['VERCEL_GIT_COMMIT_SHA']?.slice(0, 7) ?? 'lokalnie'),
      'region: ' + (process.env['VERCEL_REGION'] ?? '-'),
      'DATABASE_URL: ' + (process.env['DATABASE_URL'] ? 'ustawione' : 'BRAK'),
      'host bazy: ' + opiszHostBazy(),
    ].join('\n'),
    200,
    { 'content-type': 'text/plain; charset=utf-8', 'access-control-allow-origin': '*' },
  ),
);

/**
 * Sam host i port adresu bazy, bez loginu i hasla — zeby dalo sie sprawdzic,
 * czy do Vercela trafil pooler (port 6543), czy polaczenie bezposrednie.
 */
function opiszHostBazy(): string {
  const raw = process.env['DATABASE_URL'];
  if (!raw) return 'brak zmiennej';
  try {
    const u = new URL(raw);
    return `${u.hostname}:${u.port || '(domyslny)'}`;
  } catch {
    return 'adres nie da sie sparsowac — sprawdz znaki specjalne w hasle';
  }
}

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
