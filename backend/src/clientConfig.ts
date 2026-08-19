/**
 * Konfiguracja wysylana klientowi Flash przy starcie — zamiennik `config.php`.
 *
 * Format to `numer<TAB>wartosc` w kazdej linii. Klient czyta stad m.in.
 * pole 25, czyli szablon adresu endpointu gry:
 *
 *     25\thttps://host/req.php?req=%1&random=%2
 *
 * Dzieki temu przestawienie gry na inny backend nie wymaga rekompilacji
 * `.swf` — wystarczy, ze ta odpowiedz wskaze inny adres.
 *
 * Adresy budowane sa z adresu, pod ktorym przyszlo zapytanie, wiec ta sama
 * aplikacja dziala lokalnie, na Vercelu i na VPS-ie bez zmiany ustawien.
 */

import type { Sql } from './db/client.js';

async function configValue(sql: Sql, name: string, fallback: string): Promise<string> {
  const rows = await sql<{ value: string }[]>`
    SELECT value FROM server_config WHERE name = ${name} LIMIT 1
  `;
  return rows[0]?.value ?? fallback;
}

export async function buildClientConfig(sql: Sql, requestUrl: URL): Promise<string> {
  const [language, mail, background] = await Promise.all([
    configValue(sql, 'LANGUAGE', 'pl'),
    configValue(sql, 'MAIL', 'admin@example.com'),
    configValue(sql, 'BACKGROUND', '6'),
  ]);

  const origin = requestUrl.origin;
  const host = requestUrl.host;

  /**
   * Skad klient bierze grafiki.
   *
   * Oryginal wskazywal na serwer wydawcy (`img.playa-games.com`). Dla
   * wlasnego serwera to zla zaleznosc, wiec domyslnie uzywamy zasobow
   * spod tego samego adresu. `SF_IMG_URL` pozwala przeniesc je na CDN
   * bez ruszania kodu — przy 96 MB grafik to sie przyda.
   */
  const imgUrl = process.env['SF_IMG_URL'] || `${origin}/res/sfgame/`;

  const lines: [number, string][] = [
    [1, language],
    [2, imgUrl],
    [3, imgUrl],
    [7, host],
    [8, `${origin}/`],
    [9, '0'],
    [10, ''],
    [11, `${origin}/support`],
    [12, 'shop'],
    [13, ''],
    [14, ''],
    [17, '3'],
    [18, `${host}/`],
    [21, '3'],
    [23, '1'],
    // Szablon endpointu gry — %1 to token sesji z akcja, %2 liczba losowa.
    [25, `${origin}/req.php?req=%1&random=%2`],
    [29, mail],
    [30, `${origin}/res/papaya44.swf`],
    [31, `${origin}/papaya_cfg.php`],
    [32, '1'],
    [34, '2'],
    [35, ''],
    [42, '1'],
    [43, '529'],
    [48, imgUrl],
    [46, 'ar/cs/da/de/el/en/es/fi/fr/hr/hu/it/ja/nl/pl/pt/pt-br/ro/ru/sk/sv/tr'],
    [
      47,
      'arabian/czech/danish/german/greek/english/spanish/fi/french/hr/hungarian/italian/japanese/dutch/polish/portugese/brazilian portugese/romanian/russian/slovakian/swedish/turkish',
    ],
    [54, '0'],
    [55, ''],
    [
      56,
      `${origin}/html_payment.php?playerid=<playerid>&eventid=<eventid>&country=<country>&androidversion=<androidversion>&store=<store>`,
    ],
    [57, background],
    // Podpisany blok weryfikacji domeny. W tym buildzie klienta sprawdzenie
    // jest wylaczone (galaz bledu ustawia flage na te sama wartosc, ktora
    // ma na starcie), ale pole musi istniec, bo klient je parsuje.
    [
      62,
      'Ghu2o1I87j/fC8hdF+sm4Ve7CFUaRz3L9xp8Yr+gmJbqliU+d+6gadf178nmpJoUtjgK3VQRCr+xy0tBW/P3Vyk52gzdBGTAWuMZ6NF7r2vC8q3UJR1mSM51o7xgICkYPfQMdpcFrWM12eajOsu4jqSJHiqr8OVukRIlvnx9hRg=',
    ],
  ];

  return lines.map(([key, value]) => `${key}\t${value}`).join('\n') + '\n';
}
