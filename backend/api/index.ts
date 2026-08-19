/**
 * Wejscie dla Vercela.
 *
 * Cala aplikacja siedzi w `src/app.ts` i nie wie, gdzie jest uruchamiana.
 * Ten plik tylko ja opakowuje — analogicznie do `src/index.ts` dla Node
 * i `Deno.serve(app.fetch)` dla Deno.
 *
 * UWAGA — tutaj NIE wolno uzyc `handle()` z `hono/vercel`.
 *
 * Vercel rozpoznaje rodzaj funkcji po jej ksztalcie, a nie po liczbie
 * argumentow (`@vercel/node`, `serverless-handler`):
 *
 *   isWebHandler = HTTP_METHODS.some(m => typeof listener[m] === 'function')
 *               || typeof listener.fetch === 'function';
 *
 * `handle(app)` zwraca zwykla funkcje — bez pol `GET`/`POST` i bez `fetch`.
 * Nie przechodzi wiec zadnego z tych dwoch warunkow i Vercel wola ja jak
 * zwyklego handlera Node'a: `listener(req, res)`. Hono dostaje wtedy zamiast
 * obiektu `Request` surowe `IncomingMessage`, nikt nie wola `res.end()`
 * i zapytanie wisi az do limitu czasu. Czesc sciezek konczy sie wyjatkiem —
 * stad mieszanka FUNCTION_INVOCATION_TIMEOUT i FUNCTION_INVOCATION_FAILED
 * na roznych adresach tego samego backendu.
 *
 * `getRequestListener` daje prawdziwego handlera `(req, res)`: sam buduje
 * `Request`, sam zapisuje odpowiedz i sam zamyka strumien. To ta sama droga,
 * ktora dziala w `api/ping.ts`.
 */

import { getRequestListener } from '@hono/node-server';
import { app } from '../src/app.js';

// Sterownik Postgresa uzywa gniazd TCP, ktorych srodowisko Edge nie udostepnia.
export const config = { runtime: 'nodejs' };

export default getRequestListener(app.fetch);
