/**
 * Nazwy przedmiotow.
 *
 * Nazwa nie jest zapisana przy przedmiocie — klient sklada ja z rodzaju,
 * klasy, numeru obrazka i najmocniejszej cechy. Latwo tu o pomylke
 * o jeden, ktorej nikt nie zauwazy, bo wynikiem jest po prostu INNA
 * poprawnie wygladajaca nazwa. Dlatego sprawdzamy konkretne pozycje
 * z oryginalnego pliku jezykowego.
 */

import { describe, expect, it } from 'vitest';
import { nazwaPrzedmiotu, wierszeOpisu } from '../src/gra/przedmioty';
import type { Przedmiot } from '../src/gra/typy';

function przedmiot(czesci: Partial<Przedmiot>): Przedmiot {
  return {
    slot: 0,
    typ: 1,
    podtyp: 1,
    numer: 1,
    ulepszenie: 0,
    obrazek: '',
    obrazenia: { min: 0, max: 0 },
    atrybuty: [],
    zloto: 0,
    grzyby: 0,
    ...czesci,
  };
}

describe('nazwaPrzedmiotu', () => {
  it('bierze nazwe z tablicy rodzaju i klasy', () => {
    // TXT_ITMNAME_1_1 = 3000, pozycja 3000 to "Tłuk".
    expect(nazwaPrzedmiotu(przedmiot({ typ: 1, podtyp: 1, numer: 1 }))).toBe('Tłuk');
    // TXT_ITMNAME_2_1 = 3050, pozycja 3050 to "Taboret".
    expect(nazwaPrzedmiotu(przedmiot({ typ: 2, podtyp: 1, numer: 1 }))).toBe('Taboret');
  });

  it('dokleja przyrostek od najmocniejszej cechy', () => {
    // Sila daje kod 1; wartosc 7 wpada w prog 6 (przesuniecie 100),
    // czyli pozycja 4600 + 1 + 100 = 4701 — "brutalności".
    const bron = przedmiot({ typ: 1, numer: 1, atrybuty: [{ rodzaj: 1, wartosc: 7 }] });
    expect(nazwaPrzedmiotu(bron)).toBe('Tłuk brutalności');

    // Ta sama cecha, ale slabsza: prog 3 (przesuniecie 50) — pozycja 4651.
    const slabsza = przedmiot({ typ: 1, numer: 1, atrybuty: [{ rodzaj: 1, wartosc: 4 }] });
    expect(nazwaPrzedmiotu(slabsza)).toBe('Tłuk osiłka');
  });

  it('liczy przyrostek z NAJMOCNIEJSZEJ cechy, nie z pierwszej', () => {
    const p = przedmiot({
      typ: 1,
      numer: 1,
      atrybuty: [
        { rodzaj: 1, wartosc: 2 },
        { rodzaj: 6, wartosc: 4 },
      ],
    });
    // Cecha 6 ("wszystkie") daje kod 32, prog 3 -> 4600 + 32 + 50 = 4682.
    expect(nazwaPrzedmiotu(p)).not.toBe('Tłuk');
    expect(nazwaPrzedmiotu(p).startsWith('Tłuk ')).toBe(true);
  });

  it('dopisuje poziom ulepszenia, ale nie tarczy', () => {
    expect(nazwaPrzedmiotu(przedmiot({ typ: 1, numer: 1, ulepszenie: 3 }))).toBe('Tłuk (+3)');
    expect(nazwaPrzedmiotu(przedmiot({ typ: 2, numer: 1, ulepszenie: 3 }))).toBe('Taboret');
  });
});

describe('wierszeOpisu', () => {
  it('bron pokazuje obrazenia ze srednia', () => {
    const p = przedmiot({ typ: 1, obrazenia: { min: 4, max: 8 } });
    expect(wierszeOpisu(p)[0]).toEqual({ etykieta: 'Obrażenia', wartosc: '4-8  (~6)' });
  });

  it('tarcza pokazuje blok w procentach', () => {
    const p = przedmiot({ typ: 2, obrazenia: { min: 15, max: 0 } });
    expect(wierszeOpisu(p)[0]).toEqual({ etykieta: 'Blok', wartosc: '15 %' });
  });

  it('reszta pokazuje pancerz, a cechy ida po nim', () => {
    const p = przedmiot({
      typ: 3,
      obrazenia: { min: 6, max: 0 },
      atrybuty: [{ rodzaj: 1, wartosc: 5 }],
    });
    expect(wierszeOpisu(p)).toEqual([
      { etykieta: 'Pancerz', wartosc: '6' },
      { etykieta: 'Siła', wartosc: '+ 5' },
    ]);
  });
});
