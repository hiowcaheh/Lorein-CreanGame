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
import { Miasto } from './ekrany/Miasto';
import { TworzeniePostaci, type DanePostaci } from './ekrany/TworzeniePostaci';
import type { Gracz, OdpowiedzZTokenem } from './gra/typy';

type Zakladka =
  | 'miasto'
  | 'karczma' | 'arena' | 'warta' | 'zbrojownia' | 'magia' | 'stajnia' | 'grzybiarz'
  | 'bohater' | 'poczta' | 'gildia' | 'sala' | 'lochy' | 'opcje';

const MENU: { klucz: Zakladka; nazwa: string; grupa: string }[] = [
  { klucz: 'miasto', nazwa: 'Miasto', grupa: 'a' },
  { klucz: 'karczma', nazwa: 'Karczma', grupa: 'a' },
  { klucz: 'arena', nazwa: 'Arena', grupa: 'a' },
  { klucz: 'warta', nazwa: 'Warta', grupa: 'a' },
  { klucz: 'zbrojownia', nazwa: 'Zbrojownia', grupa: 'a' },
  { klucz: 'magia', nazwa: 'Gabinet magii', grupa: 'a' },
  { klucz: 'stajnia', nazwa: 'Stajnia', grupa: 'a' },
  { klucz: 'grzybiarz', nazwa: 'Grzybiarz', grupa: 'a' },
  { klucz: 'bohater', nazwa: 'Bohater', grupa: 'b' },
  { klucz: 'poczta', nazwa: 'Poczta', grupa: 'b' },
  { klucz: 'gildia', nazwa: 'Gildia', grupa: 'b' },
  { klucz: 'sala', nazwa: 'Sala Chwały', grupa: 'b' },
  { klucz: 'lochy', nazwa: 'Lochy', grupa: 'b' },
  { klucz: 'opcje', nazwa: 'Opcje', grupa: 'b' },
];

/** Zakladki, ktore juz cos pokazuja. Reszta czeka na swoja kolej. */
const GOTOWE: Zakladka[] = ['miasto', 'bohater'];

/** Co widzi gracz, zanim wejdzie do gry. */
type Brama = 'sprawdzam' | 'logowanie' | 'tworzenie';

export function App() {
  const [gracz, setGracz] = useState<Gracz | null>(null);
  const [brama, setBrama] = useState<Brama>(() => (token() ? 'sprawdzam' : 'logowanie'));
  const [zakladka, setZakladka] = useState<Zakladka>('miasto');
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
    setZakladka('miasto');
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
    <Rama menuOtwarte={menuOtwarte} onPrzelaczMenu={() => setMenuOtwarte((o) => !o)} onWyloguj={wyloguj}>
      <div className="srodek">
        <nav className={`menu${menuOtwarte ? ' otwarte' : ''}`}>
          {/* Zasoby stoja u gory panelu menu — tak jak w oryginale. */}
          <div className="zasoby">
            <span title="Złoto i srebro">
              <img src="/res/sfgame/if/icon_gold.png" alt="" />
              {Math.floor(gracz.srebro / 100).toLocaleString('pl-PL')}
              <img src="/res/sfgame/if/icon_silber.png" alt="" />
              {String(gracz.srebro % 100).padStart(2, '0')}
            </span>
            <span title="Grzyby">
              <img src="/res/sfgame/if/icon_pilz.png" alt="" />
              {gracz.grzyby.toLocaleString('pl-PL')}
            </span>
          </div>

          <ul>
            {MENU.map((poz) => {
              const naglowek = poz.grupa !== grupa ? ((grupa = poz.grupa), poz.grupa) : null;
              return (
                <li key={poz.klucz}>
                  {naglowek && <div className="przerwa" />}
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
                </li>
              );
            })}

          </ul>
        </nav>

        <main className={`tresc${zakladka === 'miasto' ? ' pelny' : ''}`}>
          {zakladka === 'miasto' && <Miasto onIdzDo={(cel) => setZakladka(cel as Zakladka)} />}
          {zakladka === 'bohater' && <Bohater gracz={gracz} />}
        </main>
      </div>
    </Rama>
  );
}

/**
 * Pas z tytulem u gory. W oryginale po jego lewej stronie stoi ItemShop,
 * po prawej wyjscie z gry — trzymamy sie tego ukladu.
 */
function Rama({
  children,
  menuOtwarte,
  onPrzelaczMenu,
  onWyloguj,
}: {
  children: React.ReactNode;
  menuOtwarte?: boolean;
  onPrzelaczMenu?: () => void;
  onWyloguj?: () => void;
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

        <h1>Lorein</h1>

        {onWyloguj && (
          <>
            <span className="link-gory lewy">ItemShop</span>
            <button className="link-gory prawy" onClick={onWyloguj}>
              Wyloguj
            </button>
          </>
        )}
      </header>

      {children}
    </div>
  );
}
