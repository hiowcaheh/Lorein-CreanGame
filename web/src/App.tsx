/**
 * Rama gry: gorny pasek, menu i obszar tresci.
 *
 * Menu jest zawsze widoczne na szerokim ekranie, a na telefonie chowa sie
 * pod przycisk. Przelaczenie zakladki to zmiana widoku w przegladarce —
 * bez przeladowania strony i bez pytania serwera, bo stan gracza jest juz
 * pobrany.
 */

import { useCallback, useEffect, useState } from 'react';
import { BladApi, zapomnijToken, zapiszToken, token, zapytaj } from './gra/api';
import { Bohater } from './ekrany/Bohater';
import { Logowanie } from './ekrany/Logowanie';
import { TworzeniePostaci, type DanePostaci } from './ekrany/TworzeniePostaci';
import type { Gracz, OdpowiedzZTokenem } from './gra/typy';

type Zakladka =
  | 'karczma' | 'arena' | 'warta' | 'zbrojownia' | 'magia' | 'stajnia' | 'grzybiarz'
  | 'bohater' | 'poczta' | 'gildia' | 'sala' | 'lochy' | 'opcje';

const MENU: { klucz: Zakladka; nazwa: string; grupa: string }[] = [
  { klucz: 'karczma', nazwa: 'Karczma', grupa: 'Miasto' },
  { klucz: 'arena', nazwa: 'Arena', grupa: 'Miasto' },
  { klucz: 'warta', nazwa: 'Warta', grupa: 'Miasto' },
  { klucz: 'zbrojownia', nazwa: 'Zbrojownia', grupa: 'Miasto' },
  { klucz: 'magia', nazwa: 'Gabinet magii', grupa: 'Miasto' },
  { klucz: 'stajnia', nazwa: 'Stajnia', grupa: 'Miasto' },
  { klucz: 'grzybiarz', nazwa: 'Grzybiarz', grupa: 'Miasto' },
  { klucz: 'bohater', nazwa: 'Bohater', grupa: 'Ty' },
  { klucz: 'poczta', nazwa: 'Poczta', grupa: 'Ty' },
  { klucz: 'gildia', nazwa: 'Gildia', grupa: 'Ty' },
  { klucz: 'sala', nazwa: 'Sala Chwały', grupa: 'Świat' },
  { klucz: 'lochy', nazwa: 'Lochy', grupa: 'Świat' },
  { klucz: 'opcje', nazwa: 'Opcje', grupa: 'Świat' },
];

/** Zakladki, ktore juz cos pokazuja. Reszta czeka na swoja kolej. */
const GOTOWE: Zakladka[] = ['bohater'];

/** Co widzi gracz, zanim wejdzie do gry. */
type Brama = 'sprawdzam' | 'logowanie' | 'tworzenie';

export function App() {
  const [gracz, setGracz] = useState<Gracz | null>(null);
  const [brama, setBrama] = useState<Brama>(() => (token() ? 'sprawdzam' : 'logowanie'));
  const [zakladka, setZakladka] = useState<Zakladka>('bohater');
  const [menuOtwarte, setMenuOtwarte] = useState(false);
  const [pracuje, setPracuje] = useState(false);
  const [blad, setBlad] = useState<string | null>(null);

  /** Zapisany token moze byc juz niewazny — sprawdzamy go przy starcie. */
  useEffect(() => {
    if (brama !== 'sprawdzam') return;

    let anulowane = false;
    void zapytaj<{ gracz: Gracz }>('/me')
      .then(({ gracz: g }) => {
        if (!anulowane) setGracz(g);
      })
      .catch(() => {
        if (anulowane) return;
        zapomnijToken();
        setBrama('logowanie');
      });

    return () => {
      anulowane = true;
    };
  }, [brama]);

  const wejdz = useCallback((odpowiedz: OdpowiedzZTokenem) => {
    zapiszToken(odpowiedz.token);
    setGracz(odpowiedz.gracz);
    setZakladka('bohater');
  }, []);

  async function sprobuj(dzialanie: () => Promise<OdpowiedzZTokenem>) {
    setPracuje(true);
    setBlad(null);
    try {
      wejdz(await dzialanie());
    } catch (e) {
      setBlad(e instanceof BladApi ? e.message : 'Coś poszło nie tak. Spróbuj jeszcze raz.');
    } finally {
      setPracuje(false);
    }
  }

  function wyloguj() {
    zapomnijToken();
    setGracz(null);
    setBlad(null);
    setMenuOtwarte(false);   // inaczej menu zostaje otwarte pod ekranem logowania
    setBrama('logowanie');
  }

  // ------------------------------------------------------- widoki --

  if (!gracz) {
    return (
      <Rama>
        <main className="tresc">
          {brama === 'sprawdzam' && <p className="podpis">Wczytuję…</p>}

          {brama === 'logowanie' && (
            <Logowanie
              pracuje={pracuje}
              blad={blad}
              onNowyBohater={() => {
                setBlad(null);
                setBrama('tworzenie');
              }}
              onZaloguj={(nick, haslo) =>
                void sprobuj(() => zapytaj<OdpowiedzZTokenem>('/login', { nick, haslo }))
              }
            />
          )}

          {brama === 'tworzenie' && (
            <TworzeniePostaci
              pracuje={pracuje}
              blad={blad}
              onWroc={() => {
                setBlad(null);
                setBrama('logowanie');
              }}
              onZapisz={(dane: DanePostaci) =>
                void sprobuj(() =>
                  zapytaj<OdpowiedzZTokenem>('/register', {
                    nick: dane.nick,
                    email: dane.email,
                    haslo: dane.haslo,
                    rasa: dane.wyglad.rasa,
                    plec: dane.wyglad.plec,
                    klasa: dane.wyglad.klasa,
                    wyglad: dane.wyglad.czesci,
                  }),
                )
              }
            />
          )}
        </main>
      </Rama>
    );
  }

  let grupa = '';

  return (
    <Rama gracz={gracz} menuOtwarte={menuOtwarte} onPrzelaczMenu={() => setMenuOtwarte((o) => !o)}>
      <div className="srodek">
        <nav className={`menu${menuOtwarte ? ' otwarte' : ''}`}>
          {MENU.map((poz) => {
            const naglowek = poz.grupa !== grupa ? ((grupa = poz.grupa), poz.grupa) : null;
            return (
              <div key={poz.klucz}>
                {naglowek && <div className="rozdzial">{naglowek}</div>}
                <button
                  aria-current={zakladka === poz.klucz}
                  disabled={!GOTOWE.includes(poz.klucz)}
                  title={GOTOWE.includes(poz.klucz) ? undefined : 'Jeszcze nie gotowe'}
                  onClick={() => {
                    setZakladka(poz.klucz);
                    setMenuOtwarte(false);
                  }}
                >
                  {poz.nazwa}
                </button>
              </div>
            );
          })}

          <div className="rozdzial">Konto</div>
          <button onClick={wyloguj}>Wyloguj</button>
        </nav>

        <main className="tresc">{zakladka === 'bohater' && <Bohater gracz={gracz} />}</main>
      </div>
    </Rama>
  );
}

function Rama({
  children,
  gracz,
  menuOtwarte,
  onPrzelaczMenu,
}: {
  children: React.ReactNode;
  gracz?: Gracz;
  menuOtwarte?: boolean;
  onPrzelaczMenu?: () => void;
}) {
  return (
    <div className="gra">
      <header className="gora">
        {onPrzelaczMenu && (
          <button
            className="przelacznik-menu"
            onClick={onPrzelaczMenu}
            aria-label="Menu"
            aria-expanded={menuOtwarte ?? false}
          >
            ☰
          </button>
        )}
        <h1>LOREIN</h1>

        {gracz && (
          <div className="zasoby">
            <span title="Srebro">
              <img src="/res/sfgame/if/icon_silber.png" alt="" /> {gracz.srebro.toLocaleString('pl-PL')}
            </span>
            <span title="Grzyby">
              <img src="/res/sfgame/if/icon_pilz.png" alt="" /> {gracz.grzyby.toLocaleString('pl-PL')}
            </span>
          </div>
        )}
      </header>

      {children}
    </div>
  );
}
