/**
 * Konfiguracja czytana wylacznie ze zmiennych srodowiskowych.
 *
 * Zadnych hasel w repozytorium — ta sama zasada, ktora obowiazuje juz
 * w `sf555/dbconnect.php`. Brak wymaganej zmiennej konczy sie bledem przy
 * starcie, zamiast cichego dzialania na domyslnych wartosciach.
 */

function required(name: string): string {
  const value = process.env[name];
  if (value === undefined || value === '') {
    throw new Error(`Brak wymaganej zmiennej srodowiskowej: ${name}`);
  }
  return value;
}

function optional(name: string, fallback: string): string {
  const value = process.env[name];
  return value === undefined || value === '' ? fallback : value;
}

export const config = {
  port: Number(optional('PORT', '8787')),

  db: {
    host: optional('SF_DB_HOST', 'localhost'),
    port: Number(optional('SF_DB_PORT', '3306')),
    database: optional('SF_DB_NAME', 'sf555'),
    user: required('SF_DB_USER'),
    password: required('SF_DB_PASS'),
  },

  /**
   * Adres starego backendu PHP. Akcje jeszcze nieprzeniesione sa do niego
   * przekazywane, dzieki czemu gra dziala przez caly czas migracji.
   * Pusta wartosc wylacza przekazywanie — wtedy nieznana akcja zwraca blad.
   */
  legacyBaseUrl: optional('SF_LEGACY_URL', ''),
} as const;
