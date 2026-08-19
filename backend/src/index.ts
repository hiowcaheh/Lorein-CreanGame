/**
 * Wejscie dla Node — cienki adapter nad `app.ts`.
 *
 * Wersja dla Supabase Edge Functions rozni sie tylko tym plikiem:
 * zamiast `serve()` z @hono/node-server uzywa `Deno.serve(app.fetch)`.
 */

import { serve } from '@hono/node-server';
import { app } from './app.js';
import { config } from './config.js';
import { closePool } from './db/client.js';

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
      void closePool().then(() => process.exit(0));
    });
  });
}
