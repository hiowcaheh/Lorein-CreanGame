/**
 * Wejscie dla Node — cienki adapter nad `app.ts`.
 *
 * Wersja dla Supabase Edge Functions rozni sie tylko tym plikiem:
 * zamiast `serve()` z @hono/node-server uzywa `Deno.serve(app.fetch)`.
 */

import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { app } from './app.js';
import { config } from './config.js';
import { closeSql } from './db/client.js';

// Lokalnie sami serwujemy pliki gry z `public/`. Na Vercelu robi to
// warstwa statyczna, a rewrite w vercel.json dziala dopiero wtedy, gdy
// zaden plik nie pasuje — wiec zasoby wygrywaja z funkcja.
app.use('/*', serveStatic({ root: './public' }));

const server = serve({ fetch: app.fetch, port: config.port }, (info) => {
  console.log(`Backend Lorein nasluchuje na http://localhost:${info.port}`);
  console.log(
    config.legacyBaseUrl
      ? `Akcje nieprzeniesione ida do: ${config.legacyBaseUrl}`
      : 'Przekazywanie do PHP wylaczone (brak SF_LEGACY_URL)',
  );
});

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    server.close(() => {
      void closeSql().then(() => process.exit(0));
    });
  });
}
