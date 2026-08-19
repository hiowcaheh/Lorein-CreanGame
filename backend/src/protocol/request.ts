/**
 * Rozbior parametru `req` — jedynego wejscia protokolu gry.
 *
 * Klient sklada go tak (`MainTimeline.as`):
 *
 *     reqStr = tunnelUrl.replace("%1", escape(sessionID + dataStr)) + "&rnd=..."
 *
 * a serwer rozbiera po pozycjach znakow (`req.php`):
 *
 *     $SSID         = substr($req, 0, 32);
 *     $action       = substr($req, 32, 3);
 *     $action_extra = substr($req, 35);
 */

export interface GameRequest {
  /** Token sesji gracza — 32 znaki, kolumna `user_data.ssid`. */
  readonly ssid: string;
  /** Trzycyfrowy kod akcji, np. `007` dla rankingu. */
  readonly action: string;
  /** Reszta parametrow, zwykle rozdzielona srednikami. */
  readonly extra: string;
  /** `extra` rozbite po srednikach — najczestszy format parametrow. */
  readonly params: readonly string[];
}

export function parseRequest(raw: string | null | undefined): GameRequest {
  const req = raw ?? '';

  const ssid = req.slice(0, 32);
  const action = req.slice(32, 35);
  const extra = req.slice(35);

  return {
    ssid,
    action,
    extra,
    params: extra.split(';'),
  };
}

/** Czy token sesji ma poprawny ksztalt (32 znaki alfanumeryczne). */
export function isWellFormedSsid(ssid: string): boolean {
  return /^[A-Za-z0-9]{32}$/.test(ssid);
}
