/**
 * Okno dokupywania punktow cechy.
 *
 * SWIADOME ODSTEPSTWO (tabela w CLAUDE.md). Oryginal nie ma takiego okna
 * wcale: tam klika sie „+" tyle razy, ile trzeba, a cene widac przez
 * chwile po najechaniu myszka. Na dotyku to nie dziala — nie ma czego
 * najezdzac, a kazde stukniecie od razu kupuje.
 *
 * Samo okno, suwak i przycisk sa przepisane z ekranu Warty
 * (`BNC_SCREEN_ARBEITEN`): `okno.png` w `POS_IF_WIN`, `DefineSlider`
 * w `POS_ARBEITEN_SLIDER`, przycisk w `REL_ARBEITEN_BTN_Y`. Ceny licza
 * sie z tego samego cennika, co po stronie serwera — kolejny zakup jest
 * zawsze drozszy od poprzedniego.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  PUNKTOW_ZA_ZAKUP,
  ileStac,
  kosztZakupow,
  pomocDoCechy,
} from '../gra/cechy';
import {
  NAGLOWEK_Y,
  OBRAZ_TORU,
  OBRAZ_UCHWYTU,
  OBRAZ_ZNACZNIKA,
  ODSTEP_PRZYCISKOW,
  OKNO,
  PRZYCISK,
  SRODEK_OKNA,
  SUWAK,
  TEKST,
  TEKST2_Y,
  TLO_OKNA,
  TOR_SUWAKA,
  UCHWYT,
  ZNACZNIK,
  ZNACZNIK_NAD_TOREM,
  polozenieUchwytu,
  wartoscZPolozenia,
} from '../gra/oknoUklad';
import type { Gracz } from '../gra/typy';

/** Nazwy cech — pozycje 60..64 pliku jezykowego. */
const NAZWY = ['Siła', 'Zręczność', 'Inteligencja', 'Wytrzym.', 'Szczęście'];

/**
 * Powyzej tylu zakupow suwak nie ma juz podzialki — znaczniki staly by
 * jeden na drugim i niczego nie pokazywaly. Sam tor dziala tak samo.
 */
const NAJWIECEJ_ZNACZNIKOW = 12;

/** Ile srebra to jedno zloto — tak samo jak w pasku u gory. */
function naZloto(srebro: number): { zloto: number; srebro: number } {
  return { zloto: Math.floor(srebro / 100), srebro: srebro % 100 };
}

export function OknoCechy({
  gracz,
  cecha,
  onKup,
  onZamknij,
}: {
  gracz: Gracz;
  /** Numer cechy 1..5. */
  cecha: number;
  /** Kupuje `ile` zakupow po trzy punkty. */
  onKup: (cecha: number, ile: number) => void;
  onZamknij: () => void;
}) {
  const dokupione = gracz.cechyDokupione[cecha - 1] ?? 0;

  // Ile zakupow starczy srebra — to samo liczy serwer przy zakupie.
  const maks = useMemo(
    () => Math.max(1, ileStac(dokupione, gracz.srebro)),
    [dokupione, gracz.srebro],
  );

  const [ile, setIle] = useState(1);
  const tor = useRef<HTMLDivElement>(null);

  // Po zakupie ceny rosna, wiec suwak nie moze zostac poza zakresem.
  useEffect(() => setIle((n) => Math.min(Math.max(1, n), maks)), [maks]);

  const koszt = kosztZakupow(dokupione, ile);
  const stac = gracz.srebro >= koszt;
  const cena = naZloto(koszt);

  const wartoscTeraz = [
    gracz.cechy.sila,
    gracz.cechy.zrecznosc,
    gracz.cechy.intelekt,
    gracz.cechy.wytrzymalosc,
    gracz.cechy.szczescie,
  ][cecha - 1] ?? 0;

  /** Wartosc spod palca — `SliderMove` liczy ja z polozenia na torze. */
  function ustawZPunktu(klientX: number) {
    const el = tor.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = ((klientX - r.left) / r.width) * TOR_SUWAKA.szerokosc;
    setIle(wartoscZPolozenia(x, maks));
  }

  const znaczniki = maks <= NAJWIECEJ_ZNACZNIKOW ? maks : 0;

  return (
    <div className="okno-cechy">
      {/* Reszta ekranu przestaje reagowac — `CA_SCR_ARBEITEN_BLOCKCITY`. */}
      <div className="okno-zaslona" onClick={onZamknij} />

      <img
        className="okno-tlo"
        src={TLO_OKNA}
        alt=""
        style={{ left: OKNO.lewo, top: OKNO.gora, width: OKNO.szerokosc, height: OKNO.wysokosc }}
      />

      <div className="okno-naglowek" style={{ left: SRODEK_OKNA, top: NAGLOWEK_Y }}>
        {NAZWY[cecha - 1]}
      </div>

      {/* Co daje ta cecha TEJ klasie — `TXT_ATTRIBHELP` i sasiedzi. */}
      <div
        className="okno-tekst"
        style={{ left: TEKST.lewo, top: TEKST.gora, width: TEKST.szerokosc }}
      >
        {pomocDoCechy(cecha, gracz.klasa).map((zdanie) => (
          <div key={zdanie}>{zdanie}</div>
        ))}
        <div className="okno-wartosc">
          {NAZWY[cecha - 1]}: {wartoscTeraz} → {wartoscTeraz + PUNKTOW_ZA_ZAKUP * ile}
        </div>
      </div>

      {/* Suwak z Warty: tor, znaczniki i zlota strzalka. */}
      <div
        className="okno-suwak"
        ref={tor}
        style={{
          left: SUWAK.lewo,
          top: SUWAK.gora,
          width: TOR_SUWAKA.szerokosc,
          height: TOR_SUWAKA.wysokosc,
        }}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          ustawZPunktu(e.clientX);
        }}
        onPointerMove={(e) => {
          if (e.buttons === 0) return;
          ustawZPunktu(e.clientX);
        }}
      >
        <img className="tor" src={OBRAZ_TORU} alt="" />

        {znaczniki > 1 &&
          Array.from({ length: znaczniki }, (_, i) => (
            <img
              key={i}
              className="znacznik"
              src={OBRAZ_ZNACZNIKA}
              alt=""
              style={{
                left: polozenieUchwytu(i + 1, znaczniki) - ZNACZNIK.szerokosc / 2,
                top: -ZNACZNIK_NAD_TOREM,
                width: ZNACZNIK.szerokosc,
                height: ZNACZNIK.wysokosc,
              }}
            />
          ))}

        <img
          className="uchwyt"
          src={OBRAZ_UCHWYTU}
          alt=""
          style={{
            left: polozenieUchwytu(ile, maks) - 7,
            width: UCHWYT.szerokosc,
            height: UCHWYT.wysokosc,
          }}
        />
      </div>

      {/* Ile punktow i za ile — pod suwakiem, jak `LBL_SCR_ARBEITEN_TEXT2`. */}
      <div
        className="okno-tekst okno-koszt"
        style={{ left: TEKST.lewo, top: TEKST2_Y, width: TEKST.szerokosc }}
      >
        <span>
          + {PUNKTOW_ZA_ZAKUP * ile} {ile > 1 && `(${ile} × ${PUNKTOW_ZA_ZAKUP})`}
        </span>
        <span className="kwota">
          {cena.zloto > 0 && (
            <>
              {cena.zloto.toLocaleString('pl-PL')}
              <img src="/res/sfgame/if/icon_gold.png" alt="złota" />
            </>
          )}
          {cena.srebro}
          <img src="/res/sfgame/if/icon_silber.png" alt="srebra" />
        </span>
      </div>

      <button
        type="button"
        className="przycisk"
        style={{
          left: PRZYCISK.lewo,
          top: PRZYCISK.gora,
          width: PRZYCISK.szerokosc,
          minHeight: PRZYCISK.wysokosc,
        }}
        disabled={!stac}
        onClick={() => onKup(cecha, ile)}
      >
        Ulepsz
      </button>

      <button
        type="button"
        className="przycisk"
        style={{
          left: PRZYCISK.lewo,
          top: PRZYCISK.gora + ODSTEP_PRZYCISKOW,
          width: PRZYCISK.szerokosc,
          minHeight: PRZYCISK.wysokosc,
        }}
        onClick={onZamknij}
      >
        Wróć
      </button>
    </div>
  );
}
