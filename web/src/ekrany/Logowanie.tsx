/**
 * Wejscie do gry: logowanie albo zalozenie nowego bohatera.
 */

import { useState } from 'react';

export function Logowanie({
  onZaloguj,
  onNowyBohater,
  pracuje,
  blad,
}: {
  onZaloguj: (nick: string, haslo: string) => void;
  onNowyBohater: () => void;
  pracuje: boolean;
  blad: string | null;
}) {
  const [nick, setNick] = useState('');
  const [haslo, setHaslo] = useState('');

  const mozna = nick.trim().length >= 3 && haslo.length >= 4 && !pracuje;

  return (
    <>
      <h2>Witaj w Lorein</h2>

      <div className="karta" style={{ maxWidth: '26rem', margin: '0 auto' }}>
        {blad && <p className="blad">{blad}</p>}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (mozna) onZaloguj(nick.trim(), haslo);
          }}
        >
          <div className="pole">
            <label htmlFor="logowanie-nick">Imię bohatera</label>
            <input
              id="logowanie-nick"
              value={nick}
              onChange={(e) => setNick(e.target.value)}
              autoComplete="username"
              autoCapitalize="off"
              autoCorrect="off"
            />
          </div>

          <div className="pole">
            <label htmlFor="logowanie-haslo">Hasło</label>
            <input
              id="logowanie-haslo"
              type="password"
              value={haslo}
              onChange={(e) => setHaslo(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          <button type="submit" className="przycisk" disabled={!mozna}>
            {pracuje ? 'Sprawdzam…' : 'Wejdź do gry'}
          </button>
        </form>

        <p className="podpis" style={{ margin: '1rem 0 .5rem' }}>albo</p>

        <button type="button" className="przycisk drugi" onClick={onNowyBohater}>
          Stwórz nowego bohatera
        </button>
      </div>
    </>
  );
}
