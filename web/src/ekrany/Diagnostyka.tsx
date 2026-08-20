/**
 * Strona diagnostyczna — otwiera sie adresem `?diag=1`.
 *
 * Powstala z prostego powodu: gdy gra nie dziala na telefonie, "nie dziala"
 * to za malo, zeby cokolwiek naprawic, a narzedzia deweloperskie na
 * telefonie sa niewygodne. Ta strona sama sprawdza kazda warstwe po kolei
 * i podaje wynik do skopiowania.
 *
 * Kazdy test ma wlasny limit czasu i idzie ROWNOLEGLE z pozostalymi —
 * inaczej jeden zawieszony adres blokuje wszystkie ponizej i nie widac,
 * czy dziala cokolwiek innego.
 */

import { useEffect, useState } from 'react';
import { pamiecDziala, token } from '../gra/api';

interface Wynik {
  nazwa: string;
  stan: 'czekam' | 'ok' | 'blad';
  opis: string;
}

const LIMIT_MS = 20000;

async function zbadaj(
  nazwa: string,
  sciezka: string,
  opcje: RequestInit,
  oceny: (odpowiedz: Response, tresc: string) => Wynik,
): Promise<Wynik> {
  const start = Date.now();
  const przerwanie = new AbortController();
  const licznik = setTimeout(() => przerwanie.abort(), LIMIT_MS);

  try {
    const odpowiedz = await fetch(sciezka, { ...opcje, signal: przerwanie.signal, cache: 'no-store' });
    const tresc = await odpowiedz.text();
    const wynik = oceny(odpowiedz, tresc);
    return { ...wynik, opis: `${Date.now() - start} ms · ${wynik.opis}` };
  } catch (e) {
    const powod = e instanceof Error && e.name === 'AbortError' ? `brak odpowiedzi w ${LIMIT_MS / 1000} s` : String(e);
    return { nazwa, stan: 'blad', opis: `${Date.now() - start} ms · ${powod}` };
  } finally {
    clearTimeout(licznik);
  }
}

export function Diagnostyka() {
  const [wyniki, setWyniki] = useState<Wynik[]>([]);
  const [nick, setNick] = useState('');
  const [haslo, setHaslo] = useState('');

  useEffect(() => {
    void uruchom();
  }, []);

  async function uruchom(zLogowaniem = false) {
    const testy: Promise<Wynik>[] = [
      zbadaj('wersja backendu (/api/version)', '/api/version', {}, (o, t) => ({
        nazwa: 'wersja backendu (/api/version)',
        stan: o.ok ? 'ok' : 'blad',
        opis: o.ok ? t.replace(/\n/g, ' | ') : `HTTP ${o.status} — ${t.slice(0, 120)}`,
      })),

      zbadaj('backend i baza (/api/health)', '/api/health', {}, (o, t) => {
        try {
          const j = JSON.parse(t) as Record<string, unknown>;
          return {
            nazwa: 'backend i baza (/api/health)',
            stan: j['database'] === 'ok' ? 'ok' : 'blad',
            opis: `baza: ${String(j['database'])} · region: ${String(j['region'])} · pierwsze zapytanie ${String(j['czasPierwszegoZapytaniaMs'])} ms`,
          };
        } catch {
          return { nazwa: 'backend i baza (/api/health)', stan: 'blad', opis: `HTTP ${o.status} — ${t.slice(0, 120)}` };
        }
      }),

      zbadaj('grafika interfejsu', '/res/ui/baner.png', {}, (o) => ({
        nazwa: 'grafika interfejsu',
        stan: o.ok ? 'ok' : 'blad',
        opis: o.ok ? 'dostepna' : `HTTP ${o.status}`,
      })),

      zbadaj('czcionka gry', '/res/ui/komika.woff', {}, (o) => ({
        nazwa: 'czcionka gry',
        stan: o.ok ? 'ok' : 'blad',
        opis: o.ok ? 'dostepna' : `HTTP ${o.status}`,
      })),
    ];

    if (zLogowaniem && nick) {
      testy.push(
        zbadaj(
          'logowanie (/api/login)',
          '/api/login',
          {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ nick, haslo }),
          },
          (o, t) => ({
            nazwa: 'logowanie (/api/login)',
            stan: o.ok ? 'ok' : 'blad',
            // Przy bledzie pokazujemy DOKLADNIE to, co odpowiedzial serwer —
            // to jest jedyna informacja, ktora naprawde cos tlumaczy.
            opis: `HTTP ${o.status} — ${t.slice(0, 200)}`,
          }),
        ),
      );
    }

    setWyniki(testy.map((_, i) => ({ nazwa: `test ${i + 1}`, stan: 'czekam', opis: '…' })));
    setWyniki(await Promise.all(testy));
  }

  const doSkopiowania = [
    `pamiec przegladarki: ${pamiecDziala() ? 'dziala' : 'ZABLOKOWANA (prywatne okno albo blokada ciasteczek)'}`,
    `token sesji: ${token() ? 'jest' : 'brak'}`,
    `strona: ${location.href}`,
    `przegladarka: ${navigator.userAgent}`,
    ...wyniki.map((w) => `${w.stan === 'ok' ? 'OK  ' : 'BLAD'} ${w.nazwa} — ${w.opis}`),
  ].join('\n');

  return (
    <>
      <h2>Diagnostyka</h2>

      <div className="karta" style={{ marginBottom: '1rem' }}>
        <div className="diag">
          <div className={pamiecDziala() ? 'ok' : 'blad'}>
            <b>{pamiecDziala() ? 'OK' : 'BŁĄD'}</b> pamięć przeglądarki
            <div>
              {pamiecDziala()
                ? `zapis działa · token sesji: ${token() ? 'jest' : 'brak'}`
                : 'zablokowana — prywatne okno albo blokada ciasteczek'}
            </div>
          </div>
          {wyniki.map((w) => (
            <div key={w.nazwa} className={w.stan}>
              <b>{w.stan === 'ok' ? 'OK' : w.stan === 'blad' ? 'BŁĄD' : '…'}</b> {w.nazwa}
              <div>{w.opis}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="karta" style={{ marginBottom: '1rem' }}>
        <p className="podpis">Sprawdź logowanie — pokaże dokładną odpowiedź serwera</p>
        <div className="pole">
          <label htmlFor="d-nick">Imię bohatera</label>
          <input id="d-nick" value={nick} onChange={(e) => setNick(e.target.value)} autoComplete="username" />
        </div>
        <div className="pole">
          <label htmlFor="d-haslo">Hasło</label>
          <input
            id="d-haslo"
            type="password"
            value={haslo}
            onChange={(e) => setHaslo(e.target.value)}
            autoComplete="current-password"
          />
        </div>
        <button type="button" className="przycisk" onClick={() => void uruchom(true)}>
          Sprawdź jeszcze raz
        </button>
      </div>

      <div className="karta">
        <p className="podpis">Do skopiowania i wysłania</p>
        <textarea className="diag-tekst" readOnly value={doSkopiowania} rows={10} />
      </div>
    </>
  );
}
