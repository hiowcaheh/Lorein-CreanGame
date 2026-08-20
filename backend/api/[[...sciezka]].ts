/**
 * Wejscie dla Vercela — jedna funkcja obslugujaca cale `/api/*`.
 *
 * Nazwa pliku `[[...sciezka]]` to opcjonalny lapacz Vercela: pasuje do
 * `/api`, `/api/login`, `/api/karczma/podejmij` i wszystkiego innego pod
 * `/api`. Dzieki temu NIE potrzebujemy przepisywania sciezek w vercel.json,
 * a funkcja dostaje adres taki, jaki wpisal klient — Hono trasuje po nim
 * bez zadnych niespodzianek.
 *
 * Wczesniej byl tu `index.ts` plus regula przepisujaca. Regula dziala tylko
 * dla dokladnie wyliczonych adresow, a przy kazdym nowym endpoincie trzeba
 * bylo o niej pamietac — i nie bylo pewne, czy funkcja zobaczy adres
 * pierwotny, czy juz przepisany.
 *
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
