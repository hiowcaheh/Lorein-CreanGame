/**
 * Konfiguracja czytana wylacznie ze zmiennych srodowiskowych.
 *
 * Zadnych hasel w repozytorium — ta sama zasada, ktora obowiazuje juz
 * w `sf555/dbconnect.php`.
 *
 * Wartosci wymagane sa czytane LENIWIE (przez gettery). Na Vercelu moduly
 * sa importowane takze podczas budowania, gdzie zmienne srodowiskowe
 * czasem jeszcze nie sa dostepne — sprawdzanie ich przy imporcie
 * wywracaloby build zamiast zglosic blad dopiero przy pierwszym zapytaniu.
 */

function required(name: string): string {
  const value = process.env[name];
  if (value === undefined || value === '') {
    throw new Error(
      `Brak wymaganej zmiennej srodowiskowej: ${name}. ` +
        'Lokalnie: skopiuj .env.example do .env. Na Vercelu: Settings > Environment Variables.',
    );
  }
  return value;
}

function optional(name: string, fallback: string): string {
  const value = process.env[name];
  return value === undefined || value === '' ? fallback : value;
}

export const config = {
  get port(): number {
    return Number(optional('PORT', '8787'));
  },

  /**
   * Adres bazy. Na Supabase sa dwa:
   *
   *   - pooler w trybie transakcyjnym (port 6543) — WYMAGANY na Vercelu,
   *     bo kazde wywolanie funkcji otwiera wlasne polaczenie i bez poolera
   *     baza szybko wyczerpuje limit,
   *   - polaczenie bezposrednie (port 5432) — dla VPS-a i dlugo zyjacych
   *     procesow, gdzie pula polaczen zyje miedzy zapytaniami.
   */
  get databaseUrl(): string {
    return required('DATABASE_URL');
  },

  /** Rozpoznane po porcie poolera Supabase — wplywa na ustawienia sterownika. */
  get usePooler(): boolean {
    return this.databaseUrl.includes(':6543') || optional('DB_USE_POOLER', '') === 'true';
  },

  /**
   * Adres starego backendu PHP dla akcji jeszcze nieprzeniesionych.
   *
   * Uwaga: przekazywanie ma sens WYLACZNIE wtedy, gdy PHP i nowy backend
   * pracuja na tej samej bazie. Po przeniesieniu danych do Postgresa stary
   * PHP (pisany pod MySQL) juz jej nie obsluzy — patrz README, sekcja
   * o przelaczeniu.
   */
  get legacyBaseUrl(): string {
    return optional('SF_LEGACY_URL', '');
  },
};
