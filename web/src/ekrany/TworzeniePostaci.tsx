/**
 * Tworzenie postaci.
 *
 * Ten ekran jest dowodem, ze podejscie dziala. Trzy rzeczy, ktore
 * w wersji na Flashu byly problemem, tutaj nie istnieja:
 *
 *   - pola tekstowe to prawdziwe `<input>`, wiec klawiatura na telefonie
 *     otwiera sie zawsze, bez sztuczek z fokusem,
 *   - uklad jest w CSS, wiec sam dopasowuje sie do ekranu — zadnego
 *     rozciagania sceny 1280x800 i czarnych pasow po bokach,
 *   - portret sklada sie z tych samych plikow PNG co w oryginale.
 */

import { useMemo, useState } from 'react';
import { Portret } from '../gra/Portret';
import {
  NAZWY_KLAS,
  NAZWY_RAS,
  RASY,
  liczbaKolorow,
  liczbaWariantow,
  losowyWyglad,
  warstwaKoloruje,
  type Wyglad,
} from '../gra/portret';
import type { Plec } from '../gra/postac-dane';

/** Nazwy plikow z przyciskami ras w oryginalnej grafice. */
const PLIK_RASY: Record<number, string> = {
  1: 'human', 2: 'elf', 3: 'dwarf', 4: 'gnome',
  5: 'orc', 6: 'darkelf', 7: 'goblin', 8: 'demon',
};

const PLIK_KLASY: Record<number, string> = { 1: 'warrior', 2: 'mage', 3: 'hunter' };

/** Warstwy, ktore gracz moze przelaczac recznie. */
const REGULOWANE = [
  { nr: 4, nazwa: 'Oczy', indeks: 3 },
  { nr: 5, nazwa: 'Brwi', indeks: 4 },
  { nr: 1, nazwa: 'Usta', indeks: 0 },
  { nr: 3, nazwa: 'Nos', indeks: 2 },
  { nr: 6, nazwa: 'Uszy', indeks: 5 },
  { nr: 7, nazwa: 'Włosy', indeks: 6 },
  { nr: 2, nazwa: 'Broda', indeks: 1 },
  { nr: 8, nazwa: 'Znak szczególny', indeks: 7 },
] as const;

export interface DanePostaci {
  nick: string;
  email: string;
  haslo: string;
  wyglad: Wyglad;
}

export function TworzeniePostaci({
  onZapisz,
  onWroc,
  pracuje,
  blad,
}: {
  onZapisz: (dane: DanePostaci) => void;
  onWroc: () => void;
  pracuje: boolean;
  blad: string | null;
}) {
  const [rasa, setRasa] = useState(1);
  const [plec, setPlec] = useState<Plec>('m');
  const [klasa, setKlasa] = useState(1);
  const [czesci, setCzesci] = useState<number[]>(() => losowyWyglad(1, 'm', 1).czesci as number[]);

  const [nick, setNick] = useState('');
  const [email, setEmail] = useState('');
  const [haslo, setHaslo] = useState('');

  const wyglad: Wyglad = useMemo(() => ({ rasa, plec, klasa, czesci }), [rasa, plec, klasa, czesci]);

  /** Zmiana rasy albo plci wymaga nowego wygladu — inne rasy maja inne warstwy. */
  function zmienRase(nowa: number) {
    setRasa(nowa);
    setCzesci(losowyWyglad(nowa, plec, klasa).czesci as number[]);
  }

  function zmienPlec(nowa: Plec) {
    setPlec(nowa);
    setCzesci(losowyWyglad(rasa, nowa, klasa).czesci as number[]);
  }

  /** Przesuwa jedna warstwe o krok, zawijajac na koncu zakresu. */
  function przesun(warstwa: number, indeks: number, krok: number) {
    setCzesci((poprzednie) => {
      const ile = liczbaWariantow(rasa, plec, warstwa);
      if (ile === 0) return poprzednie;

      const teraz = poprzednie[indeks] ?? 1;
      const kolor = Math.floor(teraz / 100);
      const wariant = teraz - kolor * 100;

      let nowy = wariant + krok;
      if (nowy > ile) nowy = 1;
      if (nowy < 1) nowy = ile;

      const kopia = [...poprzednie];
      kopia[indeks] = warstwaKoloruje(rasa, plec, warstwa) ? nowy + Math.max(1, kolor) * 100 : nowy;
      return kopia;
    });
  }

  /** Kolor dotyczy wlosow, brody i brwi naraz — inaczej postac wyglada dziwnie. */
  function zmienKolor(krok: number) {
    setCzesci((poprzednie) => {
      const ile = liczbaKolorow(rasa, plec);
      if (ile <= 1) return poprzednie;

      const pierwszyKolorowy = REGULOWANE.find((w) => warstwaKoloruje(rasa, plec, w.nr));
      const teraz = pierwszyKolorowy ? Math.floor((poprzednie[pierwszyKolorowy.indeks] ?? 100) / 100) : 1;

      let nowy = teraz + krok;
      if (nowy > ile) nowy = 1;
      if (nowy < 1) nowy = ile;

      return poprzednie.map((wartosc, i) => {
        const warstwa = REGULOWANE.find((w) => w.indeks === i);
        if (!warstwa || !warstwaKoloruje(rasa, plec, warstwa.nr)) return wartosc;
        const wariant = wartosc - Math.floor(wartosc / 100) * 100;
        return wariant + nowy * 100;
      });
    });
  }

  const nazwaGotowa = nick.trim().length >= 3;
  const mozna = nazwaGotowa && haslo.length >= 4 && /\S+@\S+\.\S+/.test(email) && !pracuje;

  return (
    <>
      <h2>Stwórz bohatera</h2>

      <div className="kolumny">
      <div className="lewa">
      <div className="karta" style={{ marginBottom: '1rem' }}>
        <Portret wyglad={wyglad} opis={`${NAZWY_RAS[rasa]}, ${NAZWY_KLAS[klasa]}`} />

        <p className="podpis">
          {NAZWY_RAS[rasa]} · {plec === 'm' ? 'mężczyzna' : 'kobieta'} · {NAZWY_KLAS[klasa]}
        </p>

        <button
          type="button"
          className="przycisk drugi"
          onClick={() => setCzesci(losowyWyglad(rasa, plec, klasa).czesci as number[])}
        >
          🎲 Losuj wygląd
        </button>
      </div>
      </div>

      <div className="prawa">

      <div className="karta" style={{ marginBottom: '1rem' }}>
        <p className="podpis">Płeć</p>
        <div className="wybor">
          {(['m', 'f'] as Plec[]).map((p) => (
            <button
              key={p}
              type="button"
              aria-pressed={plec === p}
              onClick={() => zmienPlec(p)}
              title={p === 'm' ? 'Mężczyzna' : 'Kobieta'}
            >
              <img src={`/res/sfgame/scr/buildchar/button_${p === 'm' ? 'male' : 'female'}_idle.jpg`} alt="" />
            </button>
          ))}
        </div>

        <p className="podpis">Rasa</p>
        <div className="wybor">
          {Object.keys(RASY).map(Number).map((r) => (
            <button key={r} type="button" aria-pressed={rasa === r} onClick={() => zmienRase(r)} title={NAZWY_RAS[r]}>
              <img
                src={`/res/sfgame/scr/buildchar/button_${PLIK_RASY[r]}_${plec === 'm' ? 'male' : 'female'}_idle.jpg`}
                alt=""
              />
            </button>
          ))}
        </div>

        <p className="podpis">Klasa</p>
        <div className="wybor">
          {[1, 2, 3].map((k) => (
            <button key={k} type="button" aria-pressed={klasa === k} onClick={() => setKlasa(k)} title={NAZWY_KLAS[k]}>
              <img src={`/res/sfgame/scr/buildchar/button_${PLIK_KLASY[k]}_idle.jpg`} alt="" />
            </button>
          ))}
        </div>
      </div>

      <div className="karta" style={{ marginBottom: '1rem' }}>
        <p className="podpis">Szczegóły wyglądu</p>

        {liczbaKolorow(rasa, plec) > 1 && (
          <RzadRegulacji nazwa="Kolor włosów" onMniej={() => zmienKolor(-1)} onWiecej={() => zmienKolor(1)} />
        )}

        {REGULOWANE.filter((w) => liczbaWariantow(rasa, plec, w.nr) > 1).map((w) => (
          <RzadRegulacji
            key={w.nr}
            nazwa={w.nazwa}
            onMniej={() => przesun(w.nr, w.indeks, -1)}
            onWiecej={() => przesun(w.nr, w.indeks, 1)}
          />
        ))}
      </div>

      <div className="karta">
        {blad && <p className="blad">{blad}</p>}

        <div className="pole">
          <label htmlFor="nick">Imię bohatera</label>
          <input
            id="nick"
            value={nick}
            onChange={(e) => setNick(e.target.value)}
            autoComplete="username"
            maxLength={20}
            placeholder="min. 3 znaki"
          />
        </div>

        <div className="pole">
          <label htmlFor="email">E-mail</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            inputMode="email"
          />
        </div>

        <div className="pole">
          <label htmlFor="haslo">Hasło</label>
          <input
            id="haslo"
            type="password"
            value={haslo}
            onChange={(e) => setHaslo(e.target.value)}
            autoComplete="new-password"
            placeholder="min. 4 znaki"
          />
        </div>

        <button
          type="button"
          className="przycisk"
          disabled={!mozna}
          onClick={() => onZapisz({ nick: nick.trim(), email: email.trim(), haslo, wyglad })}
        >
          {pracuje ? 'Tworzę…' : 'Rozpocznij grę'}
        </button>

        <button type="button" className="przycisk drugi" style={{ marginTop: '.5rem' }} onClick={onWroc}>
          Mam już bohatera
        </button>
      </div>
      </div>
      </div>
    </>
  );
}

function RzadRegulacji({
  nazwa,
  onMniej,
  onWiecej,
}: {
  nazwa: string;
  onMniej: () => void;
  onWiecej: () => void;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.4rem' }}>
      <span style={{ flex: 1, fontSize: '.9rem' }}>{nazwa}</span>
      <button type="button" className="przycisk maly" onClick={onMniej} aria-label={`${nazwa}: poprzedni`}>
        ‹
      </button>
      <button type="button" className="przycisk maly" onClick={onWiecej} aria-label={`${nazwa}: następny`}>
        ›
      </button>
    </div>
  );
}
