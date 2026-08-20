/**
 * Rama gry: gorny pasek, menu i obszar tresci.
 *
 * Menu jest zawsze widoczne na szerokim ekranie, a na telefonie chowa sie
 * pod przycisk. Przelaczenie zakladki to zmiana widoku w przegladarce —
 * bez przeladowania strony i bez pytania serwera, bo stan gracza jest juz
 * pobrany.
 */

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { BladApi, zapomnijToken, zapiszToken, token, zapytaj } from './gra/api';
import { useSkalaSceny } from './gra/useSkalaSceny';
import { Bohater } from './ekrany/Bohater';
import { Diagnostyka } from './ekrany/Diagnostyka';
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

  // `?diag=1` — strona sprawdzajaca kazda warstwe po kolei. Dziala takze
  // przed zalogowaniem, bo najczesciej wtedy jest potrzebna.
  if (new URLSearchParams(location.search).has('diag')) {
    return (
      <Rama maMenu={false}>
        <main className="tresc">
          <Diagnostyka />
        </main>
      </Rama>
    );
  }

  if (!gracz) {
    return (
      <Rama maMenu={false}>
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
    <Rama
      maMenu
      menuOtwarte={menuOtwarte}
      onPrzelaczMenu={() => setMenuOtwarte((o) => !o)}
      onWyloguj={wyloguj}
    >
      <nav className={`menu${menuOtwarte ? ' otwarte' : ''}`}>
        {/*
          Zasoby u gory panelu — w kolejnosci z oryginalu: najpierw LICZBA,
          potem ikona, a calosc wyrownana do prawej krawedzi panelu.
          Zloto i srebro w jednym wierszu, grzyby w nastepnym.
        */}
        <div className="zasoby">
          <div className="linia" title="Złoto i srebro">
            <span>{Math.floor(gracz.srebro / 100).toLocaleString('pl-PL')}</span>
            <img src="/res/sfgame/if/icon_gold.png" alt="złota" />
            <span>{String(gracz.srebro % 100).padStart(2, '0')}</span>
            <img src="/res/sfgame/if/icon_silber.png" alt="srebra" />
          </div>
          <div className="linia" title="Grzyby">
            <span>{gracz.grzyby.toLocaleString('pl-PL')}</span>
            <img className="grzyb" src="/res/sfgame/if/icon_pilz.png" alt="grzybów" />
          </div>
        </div>

        <ul>
          {MENU.map((poz) => {
            // Przerwa (REL_IF_BTN_2 = 20) dzieli grupy — ale nie stoi przed
            // pierwszym przyciskiem, bo ten zaczyna sie dokladnie na y=180.
            const przerwa = grupa !== '' && poz.grupa !== grupa;
            grupa = poz.grupa;
            return (
              <li key={poz.klucz}>
                {przerwa && <div className="przerwa" />}
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

      <main className={`tresc${zakladka === 'miasto' || zakladka === 'bohater' ? ' pelny' : ''}`}>
        {zakladka === 'miasto' && <Miasto onIdzDo={(cel) => setZakladka(cel as Zakladka)} />}
        {zakladka === 'bohater' && <Bohater gracz={gracz} />}
      </main>
    </Rama>
  );
}

/*
 * Ponizej tej szerokosci panel menu nie miesci sie obok gry i wjezdza na nia
 * jako nakladka. Ten sam prog co w arkuszu stylow.
 */
const WASKI = '(max-width: 640px)';

/*
 * Telefon trzymany pionowo. Scena gry ma proporcje 1000x700 — polozona na
 * ekranie 390x844 zajmuje pasek na srodku i reszta stoi pusta. Gra jest
 * z zalozenia pozioma, wiec zamiast udawac, ze da sie inaczej, mowimy
 * o tym wprost.
 */
const PIONOWO = '(max-width: 640px) and (orientation: portrait)';

function useZapytanieMedia(zapytanie: string): boolean {
  return useSyncExternalStore(
    (zmiana) => {
      const pytanie = window.matchMedia(zapytanie);
      pytanie.addEventListener('change', zmiana);
      return () => pytanie.removeEventListener('change', zmiana);
    },
    () => window.matchMedia(zapytanie).matches,
    () => false,
  );
}

/**
 * Pas z tytulem u gory. W oryginale po jego lewej stronie stoi ItemShop,
 * po prawej wyjscie z gry — trzymamy sie tego ukladu.
 *
 * Ponizej pasa lezy scena: panel menu i ekran gry. `useSkalaSceny` mierzy
 * to miejsce i ustawia mnoznik `--skala`, z ktorego arkusz stylow wylicza
 * KAZDY rozmiar w grze. Dzieki temu uklad jest zawsze ten sam co
 * w oryginale i zawsze miesci sie w oknie.
 */
function Rama({
  children,
  maMenu,
  menuOtwarte,
  onPrzelaczMenu,
  onWyloguj,
}: {
  children: React.ReactNode;
  maMenu: boolean;
  menuOtwarte?: boolean;
  onPrzelaczMenu?: () => void;
  onWyloguj?: () => void;
}) {
  const waski = useZapytanieMedia(WASKI);
  const pionowo = useZapytanieMedia(PIONOWO);
  const [mimoTo, setMimoTo] = useState(false);
  const scena = useSkalaSceny<HTMLDivElement>(maMenu && !waski);

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

      <div className="srodek" ref={scena}>
        {children}
      </div>

      {pionowo && !mimoTo && (
        <div className="obroc">
          <div className="obroc-ikona" aria-hidden="true">
            ⟳
          </div>
          <p>Obróć telefon poziomo</p>
          <p className="podpis">Gra ma szeroki ekran — poziomo widać ją w całości.</p>
          <button type="button" className="przycisk drugi" onClick={() => setMimoTo(true)}>
            Graj mimo to
          </button>
        </div>
      )}
    </div>
  );
}
