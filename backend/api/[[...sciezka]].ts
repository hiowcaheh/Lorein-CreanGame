/**
 * Wejscie dla Vercela — jedna funkcja obslugujaca cale `/api/*`.
 *
 * Nazwa pliku `[[...sciezka]]` to opcjonalny lapacz Vercela: pasuje do
 * `/api`, `/api/login`, `/api/karczma/podejmij` i wszystkiego innego pod
 * `/api`. Dzieki temu nie potrzeba zadnej reguly przepisujacej sciezki,
 * a funkcja dostaje adres taki, jaki wpisal klient.
 *
 * Most miedzy Node a Hono jest tu napisany wprost, zamiast gotowym
 * `getRequestListener`. Powod jest konkretny i kosztowal sporo szukania.
 *
 * ZAPYTANIA POST WISIALY DO LIMITU CZASU
 *
 * Vercel dokleja do funkcji wlasnego pomocnika (`shouldAddHelpers`), ktory
 * SAM wyczytuje strumien zadania i zostawia gotowa tresc w `req.body`.
 * Gdy potem most probuje przeczytac ten sam strumien, ten juz nigdy nie
 * zglosi konca — bo zostal wyczerpany wczesniej. Zapytanie stoi, funkcja
 * dobija do limitu czasu, klient dostaje 504.
 *
 * Objaw byl mylacy, bo dotyczyl wylacznie POST-ow:
 *
 *   GET  /api/version, /api/health   dzialaly, i to szybko
 *   POST /api/login, /api/register   504 za kazdym razem
 *
 * Dziennik zdarzen w bazie zostawal przy tym pusty — logowanie nie
 * docieralo nawet do zapytania o konto, bo wisialo na odczycie tresci.
 *
 * Dlatego tresc zadania odczytujemy sami, biorac pod uwage OBIE mozliwosci:
 * strumien juz wyczytany przez Vercela albo jeszcze nietkniety.
 */

import { app } from '../src/app.js';

// Sterownik Postgresa uzywa gniazd TCP, ktorych srodowisko Edge nie udostepnia.
export const config = { runtime: 'nodejs' };

/** To, czego naprawde potrzebujemy z obiektu zadania Node'a. */
interface ZadanieNode {
  url?: string | undefined;
  method?: string | undefined;
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
  readableEnded?: boolean;
  [Symbol.asyncIterator]?: () => AsyncIterableIterator<Buffer | string>;
}

interface OdpowiedzNode {
  statusCode: number;
  setHeader: (nazwa: string, wartosc: string) => void;
  end: (tresc?: Buffer | string) => void;
}

/**
 * Tresc zadania.
 *
 * Gdy Vercel wyczytal ja wczesniej, `req.body` jest juz gotowe — moze byc
 * obiektem (dla JSON-a), napisem albo buforem. Gdy strumien jest nietkniety,
 * czytamy go normalnie. Rozroznienie po `readableEnded` jest kluczowe:
 * czekanie na strumien, ktory sie juz skonczyl, nigdy nie wraca.
 */
async function odczytajTresc(req: ZadanieNode): Promise<string> {
  if (req.body !== undefined && req.body !== null) {
    if (typeof req.body === 'string') return req.body;
    if (Buffer.isBuffer(req.body)) return req.body.toString('utf8');
    return JSON.stringify(req.body);
  }

  if (req.readableEnded) return '';
  if (!req[Symbol.asyncIterator]) return '';

  const kawalki: Buffer[] = [];
  for await (const kawalek of req as AsyncIterable<Buffer | string>) {
    kawalki.push(Buffer.from(kawalek));
  }
  return Buffer.concat(kawalki).toString('utf8');
}

function zbierzNaglowki(surowe: ZadanieNode['headers']): Headers {
  const naglowki = new Headers();
  for (const [nazwa, wartosc] of Object.entries(surowe)) {
    if (wartosc === undefined) continue;
    for (const pojedyncza of Array.isArray(wartosc) ? wartosc : [wartosc]) {
      naglowki.append(nazwa, pojedyncza);
    }
  }
  return naglowki;
}

export default async function handler(req: ZadanieNode, res: OdpowiedzNode): Promise<void> {
  try {
    const gospodarz = (req.headers['host'] as string | undefined) ?? 'localhost';
    const adres = new URL(req.url ?? '/', `https://${gospodarz}`);
    const metoda = (req.method ?? 'GET').toUpperCase();

    const bezTresci = metoda === 'GET' || metoda === 'HEAD';
    const tresc = bezTresci ? undefined : await odczytajTresc(req);

    const zadanie = new Request(adres, {
      method: metoda,
      headers: zbierzNaglowki(req.headers),
      ...(tresc === undefined ? {} : { body: tresc }),
    });

    const odpowiedz = await app.fetch(zadanie);

    res.statusCode = odpowiedz.status;
    odpowiedz.headers.forEach((wartosc, nazwa) => res.setHeader(nazwa, wartosc));
    res.end(Buffer.from(await odpowiedz.arrayBuffer()));
  } catch (blad) {
    // Blad samego mostu nie trafi do `app.onError`, wiec musi zostac
    // obsluzony tutaj — inaczej gracz zobaczylby znowu pusta odpowiedz.
    console.error('Blad mostu Node -> Hono:', blad);
    res.statusCode = 500;
    res.setHeader('content-type', 'text/plain; charset=utf-8');
    res.end(`Blad serwera: ${blad instanceof Error ? blad.message : String(blad)}`);
  }
}
