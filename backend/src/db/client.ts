/**
 * Polaczenie z Postgresem (Supabase).
 *
 * Zapytania pisane sa jako szablony `sql\`...\`` z postgres.js. To nie jest
 * kwestia estetyki: wartosci wstawiane przez `${}` zawsze ida jako parametry,
 * nigdy jako sklejony tekst. Wstrzykniecie SQL staje sie wiec niemozliwe
 * z samej konstrukcji — a w `req.php` czesc zapytan jest jeszcze sklejana
 * recznie, wiec to realna poprawa, a nie ozdobnik.
 */

import postgres from 'postgres';
import { config } from '../config.js';

export type Sql = postgres.Sql;

let sql: Sql | undefined;

/**
 * Blad polaczenia z baza nie moze wywracac calej funkcji.
 *
 * Na Vercelu jedna instancja obsluguje wiele zapytan. Zawieszone albo
 * odrzucone polaczenie potrafi ubic proces, a wtedy KOLEJNE zapytania —
 * takze te niesiegajace bazy — dostaja `FUNCTION_INVOCATION_FAILED`.
 * Dokladnie tak wygladala awaria: `/req.php` zwracalo 500, mimo ze nie
 * dotyka bazy w ogole.
 */
export function getSql(): Sql {
  sql ??= postgres(config.databaseUrl, {
    // Supabase w trybie transakcyjnym (Supavisor, port 6543) nie obsluguje
    // instrukcji preparowanych — bez tego zapytania zaczynaja padac dopiero
    // pod obciazeniem, co jest wyjatkowo nieprzyjemne do zdiagnozowania.
    prepare: !config.usePooler,

    // Na Vercelu kazde wywolanie funkcji to osobny, krotko zyjacy proces.
    // Duza pula polaczen nie ma tam sensu i tylko wyczerpuje limity bazy.
    max: config.usePooler ? 1 : 10,
    idle_timeout: 20,

    // Krotki limit na nawiazanie polaczenia. Funkcja na Vercelu i tak zostanie
    // ubita po kilkunastu sekundach, a wtedy zamiast czytelnego bledu dostaje
    // sie pusta odpowiedz albo 504. Lepiej zglosic problem samemu.
    connect_timeout: 8,

    // Gra trzyma czasy jako liczby uniksowe w kolumnach tekstowych
    // i bigintach — nie chcemy automatycznej konwersji na Date.
    types: {
      bigint: postgres.BigInt,
    },

    onnotice: () => {},

    // Bez tego bledy polaczenia trafiaja do procesu jako nieobsluzone
    // i ubijaja cala instancje funkcji.
    onclose: () => {},
  });

  // postgres.js zglasza czesc problemow przez zdarzenie na obiekcie puli.
  // Bez nasluchu Node traktuje je jak nieobsluzony wyjatek.
  const emitter = sql as unknown as { on?: (event: string, handler: (e: unknown) => void) => void };
  emitter.on?.('error', (err) => {
    console.error('Blad puli polaczen (zignorowany, zapytanie zwroci wlasny blad):', err);
  });

  return sql;
}

export async function closeSql(): Promise<void> {
  await sql?.end({ timeout: 5 });
  sql = undefined;
}
