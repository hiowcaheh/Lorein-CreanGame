import { describe, expect, it } from 'vitest';
import { Readable } from 'node:stream';
import handler, { odtworzAdres } from '../api/index.js';

/**
 * Most miedzy Node a Hono — testy przypadku, ktory kosztowal najwiecej czasu.
 *
 * Vercel dokleja do funkcji pomocnika, ktory SAM wyczytuje strumien zadania
 * i zostawia gotowa tresc w `req.body`. Most, ktory probuje przeczytac ten
 * sam strumien jeszcze raz, czeka w nieskonczonosc — bo strumien juz sie
 * skonczyl. Kazdy POST wisial wtedy do limitu czasu i konczyl sie bledem
 * 504, podczas gdy wszystkie GET-y dzialaly normalnie.
 *
 * Te testy pilnuja obu drog naraz: strumienia nietknietego i wyczytanego.
 */

interface Wynik {
  status: number;
  naglowki: Record<string, string>;
  tresc: string;
}

function atrapaOdpowiedzi(): { res: never; wynik: Promise<Wynik> } {
  let rozwiaz: (w: Wynik) => void;
  const wynik = new Promise<Wynik>((r) => (rozwiaz = r));

  const naglowki: Record<string, string> = {};
  const res = {
    statusCode: 200,
    setHeader(nazwa: string, wartosc: string) {
      naglowki[nazwa] = wartosc;
    },
    end(tresc?: Buffer | string) {
      rozwiaz({ status: res.statusCode, naglowki, tresc: tresc ? tresc.toString() : '' });
    },
  };

  return { res: res as never, wynik };
}

/** Zadanie takie, jakie dostaje zwykly serwer Node — ze strumieniem. */
function zadanieZeStrumieniem(metoda: string, sciezka: string, tresc?: string): never {
  const strumien = Readable.from(tresc === undefined ? [] : [Buffer.from(tresc)]) as unknown as Record<
    string,
    unknown
  >;
  strumien['url'] = sciezka;
  strumien['method'] = metoda;
  strumien['headers'] = { host: 'przyklad.test', 'content-type': 'application/json' };
  return strumien as never;
}

/**
 * Zadanie takie, jakie dostaje funkcja na Vercelu: tresc lezy sparsowana
 * w `body`, a strumien jest juz wyczerpany.
 *
 * Strumien celowo NIGDY sie nie konczy. Jesli most sprobuje go czytac
 * zamiast siegnac po `body`, test nie przejdzie przez przekroczenie czasu —
 * czyli dokladnie tak, jak zachowywala sie gra przed poprawka.
 */
function zadanieJakNaVercelu(metoda: string, sciezka: string, tresc: unknown): never {
  return {
    url: sciezka,
    method: metoda,
    headers: { host: 'przyklad.test', 'content-type': 'application/json' },
    body: tresc,
    readableEnded: true,
    [Symbol.asyncIterator]: () => ({
      next: () => new Promise<never>(() => {}),
    }),
  } as never;
}

async function wywolaj(zadanie: never): Promise<Wynik> {
  const { res, wynik } = atrapaOdpowiedzi();
  await handler(zadanie, res);
  return wynik;
}

describe('odtwarzanie adresu z parametru', () => {
  /*
   * Regula w vercel.json przepisuje `/api/(.*)` na `/api?sciezka=$1`.
   * Bez odtworzenia aplikacja widzialaby zawsze `/api` i nie trafialaby
   * w zadna trase — a przy nazwie pliku `[[...sciezka]]` Vercel podawal
   * wrecz `/api/[[...sciezka]]`, czyli nazwe pliku zamiast adresu.
   */
  it('sklada z powrotem adres jednoczlonowy', () => {
    const adres = odtworzAdres('/api?sciezka=login', 'przyklad.test');
    expect(adres.pathname).toBe('/api/login');
    expect(adres.searchParams.get('sciezka')).toBeNull();
  });

  it('sklada z powrotem adres wieloczlonowy', () => {
    const adres = odtworzAdres('/api?sciezka=karczma/podejmij', 'przyklad.test');
    expect(adres.pathname).toBe('/api/karczma/podejmij');
  });

  it('zachowuje pozostale parametry zapytania', () => {
    const adres = odtworzAdres('/api?sciezka=ranking&strona=3', 'przyklad.test');
    expect(adres.pathname).toBe('/api/ranking');
    expect(adres.searchParams.get('strona')).toBe('3');
  });

  it('zostawia adres w spokoju, gdy parametru nie ma', () => {
    const adres = odtworzAdres('/api/health', 'przyklad.test');
    expect(adres.pathname).toBe('/api/health');
  });
});

describe('most Node -> Hono', () => {
  it('GET dochodzi do aplikacji', async () => {
    const wynik = await wywolaj(zadanieZeStrumieniem('GET', '/api'));
    expect(wynik.status).toBe(200);
    expect(wynik.tresc).toContain('funkcja startuje');
  });

  it('GET na nieznany adres daje 404, a nie zawieszenie', async () => {
    const wynik = await wywolaj(zadanieZeStrumieniem('GET', '/api/nie-ma-takiego'));
    expect(wynik.status).toBe(404);
  });

  /*
   * Sedno sprawy. Oba warianty musza dojsc do tego samego miejsca
   * w aplikacji — czyli do sprawdzenia hasla, ktore bez bazy konczy sie
   * bledem 500 albo 401, ale NIGDY zawieszeniem.
   */
  it('POST ze strumieniem dociera z trescia do aplikacji', async () => {
    const wynik = await wywolaj(
      zadanieZeStrumieniem('POST', '/api/login', JSON.stringify({ nick: 'Ktos', haslo: 'x' })),
    );
    expect(wynik.status).not.toBe(504);
    expect([200, 401, 500]).toContain(wynik.status);
  });

  it('POST przez regule przepisujaca dociera pod wlasciwy adres', async () => {
    // Tak wyglada zapytanie na Vercelu: sciezka siedzi w parametrze.
    const wynik = await wywolaj(zadanieJakNaVercelu('POST', '/api?sciezka=login', { nick: 'Ktos', haslo: 'x' }));
    expect(wynik.status).not.toBe(404);
    expect(wynik.status).not.toBe(504);
    expect([200, 401, 500]).toContain(wynik.status);
  });

  it('POST z trescia juz wyczytana przez Vercela tez dociera', async () => {
    const wynik = await wywolaj(zadanieJakNaVercelu('POST', '/api/login', { nick: 'Ktos', haslo: 'x' }));
    expect(wynik.status).not.toBe(504);
    expect([200, 401, 500]).toContain(wynik.status);
  });

  it('brak tresci i wyczerpany strumien nie wieszaja mostu', async () => {
    // `body` puste, strumien juz zamkniety — most ma odpowiedziec, a nie czekac.
    const wynik = await wywolaj({
      url: '/api/login',
      method: 'POST',
      headers: { host: 'przyklad.test', 'content-type': 'application/json' },
      readableEnded: true,
    } as never);
    expect([200, 401, 500]).toContain(wynik.status);
  });
});
