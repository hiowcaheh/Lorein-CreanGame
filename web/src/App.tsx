/**
 * Rama gry: gorny pasek, menu i obszar tresci.
 *
 * Menu jest zawsze widoczne na szerokim ekranie, a na telefonie chowa sie
 * pod przycisk. Przelaczenie zakladki to zmiana widoku w przegladarce —
 * bez przeladowania strony i bez czekania na serwer, o ile dane sa juz
 * pobrane.
 */

import { useState } from 'react';
import { TworzeniePostaci, type DanePostaci } from './ekrany/TworzeniePostaci';

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
const GOTOWE: Zakladka[] = [];

export function App() {
  const [zakladka, setZakladka] = useState<Zakladka>('bohater');
  const [menuOtwarte, setMenuOtwarte] = useState(false);
  const [pracuje, setPracuje] = useState(false);
  const [blad, setBlad] = useState<string | null>(null);

  async function zaloz(dane: DanePostaci) {
    setPracuje(true);
    setBlad(null);
    try {
      // DO ZROBIENIA: wolanie POST /api/register (zadanie #3).
      console.log('postac do zalozenia:', dane);
      setBlad('Zakładanie konta bedzie dzialac po podlaczeniu API — nastepny krok.');
    } finally {
      setPracuje(false);
    }
  }

  let grupa = '';

  return (
    <div className="gra">
      <header className="gora">
        <button
          className="przelacznik-menu"
          onClick={() => setMenuOtwarte((o) => !o)}
          aria-label="Menu"
          aria-expanded={menuOtwarte}
        >
          ☰
        </button>
        <h1>LOREIN</h1>
        <div className="zasoby">
          <span>
            <img src="/res/sfgame/if/icon_silber.png" alt="" /> 0
          </span>
          <span>
            <img src="/res/sfgame/if/icon_pilz.png" alt="" /> 0
          </span>
        </div>
      </header>

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
        </nav>

        <main className="tresc">
          <TworzeniePostaci onZapisz={zaloz} pracuje={pracuje} blad={blad} />
        </main>
      </div>
    </div>
  );
}
