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
    connect_timeout: 10,

    // Gra trzyma czasy jako liczby uniksowe w kolumnach tekstowych
    // i bigintach — nie chcemy automatycznej konwersji na Date.
    types: {
      bigint: postgres.BigInt,
    },

    onnotice: () => {},
  });

  return sql;
}

export async function closeSql(): Promise<void> {
  await sql?.end({ timeout: 5 });
  sql = undefined;
}
