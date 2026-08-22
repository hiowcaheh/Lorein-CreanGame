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

  /**
   * Czy traktowac polaczenie jak serverless (jedno polaczenie na proces,
   * bez instrukcji preparowanych).
   *
   * Wlacza sie w trzech przypadkach:
   *   - adres wskazuje pooler Supabase (port 6543),
   *   - kod dziala na Vercelu (`VERCEL` ustawia platforma),
   *   - wymuszono recznie przez `DB_USE_POOLER=true`.
   *
   * Drugi warunek to zabezpieczenie przed latwa pomylka: w panelu Supabase
   * domyslnie widac polaczenie BEZPOSREDNIE (port 5432). Wklejone na Vercelu
   * dziala do czasu, az kilkanascie rownoleglych wywolan funkcji wyczerpie
   * limit polaczen bazy — a taki blad pojawia sie dopiero pod obciazeniem
   * i trudno go powiazac z przyczyna. Przy jednym polaczeniu na proces
   * problem nie wystepuje.
   */
  /**
   * Czy dzialamy jako funkcja bezstanowa (Vercel), a nie jako zwykly proces.
   *
   * Rozroznienie ma konkretny skutek: przy funkcji trzeba po kazdym
   * zapytaniu zamknac polaczenie z baza — patrz komentarz w `app.ts`.
   */
  get serverless(): boolean {
    return process.env['VERCEL'] === '1' || process.env['AWS_LAMBDA_FUNCTION_NAME'] !== undefined;
  },

  get usePooler(): boolean {
    return (
      this.databaseUrl.includes(':6543') ||
      process.env['VERCEL'] === '1' ||
      optional('DB_USE_POOLER', '') === 'true'
    );
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

  /**
   * Panel testowy u grzybiarza: awans, zloto, grzyby, reset piw i poziomu.
   *
   * To CHEATY — kazdy, kto ma konto, moze ich uzyc, wiec domyslnie sa
   * wylaczone. Wlacza sie je swiadomie:
   *
   *     LOREIN_PANEL_TESTOWY=1
   *
   * Lokalnie (`npm run dev`) wlaczaja sie same, zeby nie trzeba bylo
   * pamietac o zmiennej przy kazdym uruchomieniu.
   */
  get panelTestowy(): boolean {
    const ustawiony = optional('LOREIN_PANEL_TESTOWY', '');
    if (ustawiony !== '') return ustawiony === '1' || ustawiony === 'true';
    return !this.serverless;
  },
};
