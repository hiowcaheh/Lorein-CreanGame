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
  PODZIALKA_POD_TOREM,
  PRZYCISK,
  PRZYCISKI_Y,
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
 * Podzialka pod torem. Znacznik przy KAZDYM punkcie nie da sie odczytac —
 * przy stu punktach staly by co dwa piksele — wiec opisane sa tylko co
 * ktorys. Krok dobiera sie tak, zeby wyszlo najwyzej szesc podpisow.
 */
const NAJWIECEJ_PODPISOW = 6;
const KROKI = [1, 2, 5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000];

function krokPodzialki(maks: number): number {
  for (const k of KROKI) if (Math.ceil(maks / k) + 1 <= NAJWIECEJ_PODPISOW) return k;
  return Math.ceil(maks / (NAJWIECEJ_PODPISOW - 1));
}

/** Wartosci, przy ktorych stoi znacznik i podpis: 1, potem co `krok`, na koncu `maks`. */
function podzialka(maks: number): number[] {
  if (maks <= 1) return [1];
  const krok = krokPodzialki(maks);
  const wartosci = [1];
  for (let v = krok; v < maks; v += krok) if (v > 1) wartosci.push(v);
  // Ostatni podpis to zawsze maksimum — ale nie wtedy, gdy przykrylby poprzedni.
  const ostatni = wartosci[wartosci.length - 1] ?? 1;
  if (maks - ostatni < krok / 2) wartosci.pop();
  wartosci.push(maks);
  return wartosci;
}

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
  /** Kupuje `ile` punktow — kazdy kolejny drozszy. */
  onKup: (cecha: number, ile: number) => void;
  onZamknij: () => void;
}) {
  const dokupione = gracz.cechyDokupione[cecha - 1] ?? 0;

  // Na ile punktow starczy srebra — to samo liczy serwer przy zakupie.
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

  const znaczniki = useMemo(() => podzialka(maks), [maks]);

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

        {znaczniki.length > 1 &&
          znaczniki.map((v) => (
            <img
              key={`z${v}`}
              className="znacznik"
              src={OBRAZ_ZNACZNIKA}
              alt=""
              style={{
                left: polozenieUchwytu(v, maks) - ZNACZNIK.szerokosc / 2,
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

        {/* Podpisy podzialki — ile punktow dokupi suwak. */}
        {znaczniki.length > 1 &&
          znaczniki.map((v) => (
            <span
              key={`p${v}`}
              className="podpis"
              style={{ left: polozenieUchwytu(v, maks), top: TOR_SUWAKA.wysokosc + PODZIALKA_POD_TOREM }}
            >
              {v}
            </span>
          ))}
      </div>

      {/*
        Ile z tego wyjdzie i za ile — pod podzialka, jak
        `LBL_SCR_ARBEITEN_TEXT2`. Wartosc cechy stoi wlasnie TU, a nie
        pod podpowiedzia: nad suwakiem nie ma na nia miejsca, bo pole
        okna konczy sie na `WNETRZE_DOL`.
      */}
      <div
        className="okno-tekst okno-koszt"
        style={{ left: TEKST.lewo, top: TEKST2_Y, width: TEKST.szerokosc }}
      >
        <span>
          {NAZWY[cecha - 1]}: {wartoscTeraz} → {wartoscTeraz + PUNKTOW_ZA_ZAKUP * ile}
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
          left: SRODEK_OKNA - PRZYCISK.szerokosc - ODSTEP_PRZYCISKOW / 2,
          top: PRZYCISKI_Y,
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
          left: SRODEK_OKNA + ODSTEP_PRZYCISKOW / 2,
          top: PRZYCISKI_Y,
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
