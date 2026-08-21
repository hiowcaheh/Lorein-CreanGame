/**
 * Opcje — na razie TYLKO glosnosc.
 *
 * Pelny ekran opcji z oryginalu (zmiana hasla, nazwy, obrazka, kasowanie
 * konta) czeka na swoja kolej. Suwak glosnosci wyszedl przed nim, bo bez
 * niego nie da sie wyciszyc gry.
 *
 * Model jest z oryginalu: liczba calkowita 0..10, domyslnie 5, pamietana
 * miedzy sesjami. Podpisy tez — `TXT_VOLUME` (149) „Glosnosc:" i
 * `TXT_MUTE` (150) „Glosnosc: dzwiek wylaczony", a przy wartosciach
 * posrednich klient pisze „50% Glosnosc".
 */

import { useState } from 'react';
import { KLIK, glosnoscGry, ustawGlosnosc, zagraj } from '../gra/dzwieki';

export function Opcje() {
  const [poziom, setPoziom] = useState(glosnoscGry);

  function zmien(nowy: number) {
    const w = Math.min(10, Math.max(0, nowy));
    ustawGlosnosc(w);
    setPoziom(w);
    // Krotki klik, zeby od razu bylo slychac, jak teraz gra.
    if (w > 0) zagraj(KLIK);
  }

  return (
    <div className="opcje">
      <h2>Opcje</h2>

      <div className="opcje-wiersz">
        <span>{poziom === 0 ? 'Głośność: dźwięk wyłączony' : `${poziom * 10}% Głośność`}</span>

        <div className="opcje-suwak">
          <button type="button" className="przycisk drugi" onClick={() => zmien(poziom - 1)}>
            −
          </button>
          <input
            type="range"
            min={0}
            max={10}
            step={1}
            value={poziom}
            aria-label="Głośność"
            onChange={(e) => zmien(Number(e.target.value))}
          />
          <button type="button" className="przycisk drugi" onClick={() => zmien(poziom + 1)}>
            +
          </button>
        </div>
      </div>

      <p className="podpis">Reszta ustawień dojdzie razem z pełnym ekranem opcji.</p>
    </div>
  );
}
