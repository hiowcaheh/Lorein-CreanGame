/**
 * Grzybiarz.
 *
 * Tlo i reka sa z oryginalu; pólka z paczkami jest nasza, bo oryginalny
 * ekran to zewnetrzna strona operatora platnosci — szczegoly w naglowku
 * `web/src/gra/grzybiarz.ts` i w tabeli odstepstw w CLAUDE.md.
 *
 * Platnosci nie ma i nie bedzie tutaj: przycisk mowi wprost, ze to
 * podglad. Grzyby dodaje sie do konta wylacznie przez gre.
 */

import { useEffect, useState } from 'react';
import {
  LICZBA_KLATEK_RAMIENIA,
  MARGINES,
  ODSTEP_KLATEK_MS,
  ODSTEP_PACZEK,
  PACZKI,
  PLANSZA,
  RAMIE,
  TLO,
  WYSOKOSC_PACZKI,
  cenaSlownie,
  plikRamienia,
} from '../gra/grzybiarz';

export function Grzybiarz({ grzyby }: { grzyby: number }) {
  /** Reka grzybiarza rusza sie jak reka stajennego — losowa klatka co chwile. */
  const [klatka, setKlatka] = useState(0);
  useEffect(() => {
    const zegar = setInterval(
      () => setKlatka(Math.floor(Math.random() * LICZBA_KLATEK_RAMIENIA)),
      ODSTEP_KLATEK_MS,
    );
    return () => clearInterval(zegar);
  }, []);

  const [wybrana, setWybrana] = useState<number | null>(null);

  return (
    <div className="grzybiarz">
      <img className="grzybiarz-tlo" src={TLO} alt="" />
      <img
        className="grzybiarz-ramie"
        src={plikRamienia(klatka)}
        alt=""
        style={{
          left: RAMIE.x,
          top: RAMIE.y,
          width: RAMIE.szerokosc,
          height: RAMIE.wysokosc,
        }}
      />

      <div
        className="grzybiarz-plansza"
        style={{
          left: PLANSZA.lewo,
          top: PLANSZA.gora,
          width: PLANSZA.szerokosc,
          height: PLANSZA.wysokosc,
        }}
      />

      <div
        className="grzybiarz-tresc"
        style={{
          left: PLANSZA.lewo + MARGINES,
          top: PLANSZA.gora + MARGINES,
          width: PLANSZA.szerokosc - MARGINES * 2,
        }}
      >
        <div className="tytul">Grzybiarz</div>
        <div className="masz">
          Masz {grzyby.toLocaleString('pl-PL')}
          <img src="/res/sfgame/if/icon_pilz.png" alt="grzybów" />
        </div>
      </div>

      {PACZKI.map((paczka, i) => (
        <button
          key={paczka.grzyby}
          type="button"
          className={`grzybiarz-paczka${wybrana === i ? ' wybrana' : ''}`}
          style={{
            left: PLANSZA.lewo + MARGINES,
            top: PLANSZA.gora + 86 + i * (WYSOKOSC_PACZKI + ODSTEP_PACZEK),
            width: PLANSZA.szerokosc - MARGINES * 2,
            height: WYSOKOSC_PACZKI,
          }}
          onClick={() => setWybrana(i)}
        >
          <img src="/res/sfgame/if/icon_pilz.png" alt="" />
          <span className="ile">{paczka.grzyby.toLocaleString('pl-PL')}</span>
          {paczka.rabat > 0 && <span className="rabat">−{paczka.rabat}%</span>}
          <span className="cena">{cenaSlownie(paczka.cena)}</span>
        </button>
      ))}

      <div
        className="grzybiarz-uwaga"
        style={{
          left: PLANSZA.lewo + MARGINES,
          top: PLANSZA.gora + PLANSZA.wysokosc - 62,
          width: PLANSZA.szerokosc - MARGINES * 2,
        }}
      >
        {wybrana === null
          ? 'Wybierz paczkę, żeby zobaczyć, jak to wygląda.'
          : `Paczka ${PACZKI[wybrana]!.grzyby} grzybów za ${cenaSlownie(PACZKI[wybrana]!.cena)}.`}
        <div className="podglad">To podgląd wyglądu — płatności nie są podłączone.</div>
      </div>
    </div>
  );
}
