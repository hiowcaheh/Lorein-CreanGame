/**
 * Czy baza ma juz te kolumne.
 *
 * `db/schema.sql` tworzy baze od zera i nie da sie go puscic na
 * dzialajacej, wiec nowe kolumny dokładaja pliki z `db/migracje/`.
 * Miedzy wdrozeniem kodu a puszczeniem migracji jest jednak chwila,
 * w ktorej kod juz kolumny uzywa, a baza jeszcze jej nie ma — i wtedy
 * kazde zapytanie z ta kolumna wywala cala akcje.
 *
 * Zamiast tego pytamy RAZ na proces, czy kolumna istnieje, i po prostu
 * jej nie ruszamy, dopoki jej nie ma. Gra dziala dalej, tylko bez tego
 * jednego dodatku.
 */

import type { Sql } from './client.js';

const sprawdzone = new Map<string, Promise<boolean>>();

export function maKolumne(sql: Sql, tabela: string, kolumna: string): Promise<boolean> {
  const klucz = `${tabela}.${kolumna}`;
  const znane = sprawdzone.get(klucz);
  if (znane) return znane;

  const pytanie = sql<{ jest: boolean }[]>`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = ${tabela} AND column_name = ${kolumna}
    ) AS jest
  `
    .then((wiersze) => wiersze[0]?.jest === true)
    .catch(() => false);

  sprawdzone.set(klucz, pytanie);
  return pytanie;
}

/**
 * Upewnia sie, ze kolumna istnieje — a jesli nie, DOKLADA ja.
 *
 * `ADD COLUMN IF NOT EXISTS` jest bezpieczne i mozna je puscic wiele
 * razy. Robimy to samo, co plik z `db/migracje/`, tylko bez czekania,
 * az ktos przypomni sobie o `npm run db:migruj` — na Supabase nie ma
 * pod reka `psql`, a bez kolumny gra po cichu gubi funkcje.
 *
 * Gdy konto bazy nie ma prawa do zmiany schematu, zapytanie po prostu
 * sie nie uda i wracamy do dzialania bez kolumny. Nic sie nie psuje.
 */
export async function dolozKolumne(
  sql: Sql,
  tabela: string,
  kolumna: string,
  definicja: string,
): Promise<boolean> {
  if (await maKolumne(sql, tabela, kolumna)) return true;

  try {
    // Nazwy tabeli i kolumny NIE moga isc jako parametry — to czesc
    // instrukcji, nie wartosc. Ida przez `sql()`, ktore je cytuje.
    await sql`ALTER TABLE ${sql(tabela)} ADD COLUMN IF NOT EXISTS ${sql(kolumna)} ${sql.unsafe(definicja)}`;
  } catch {
    return false;
  }

  sprawdzone.delete(`${tabela}.${kolumna}`);
  return maKolumne(sql, tabela, kolumna);
}

/** Tylko do testow — kasuje zapamietany wynik. */
export function zapomnijKolumny(): void {
  sprawdzone.clear();
}
