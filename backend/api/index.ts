/**
 * Wejscie dla Vercela.
 *
 * Cala aplikacja siedzi w `src/app.ts` i nie wie, gdzie jest uruchamiana.
 * Ten plik tylko ja opakowuje — analogicznie do `src/index.ts` dla Node
 * i `Deno.serve(app.fetch)` dla Deno.
 */

import { handle } from 'hono/vercel';
import { app } from '../src/app.js';

// Sterownik Postgresa uzywa gniazd TCP, ktorych srodowisko Edge nie udostepnia.
export const config = { runtime: 'nodejs' };

export default handle(app);
