/**
 * Ekran Klasera Dokladnosci — `BNC_SCREEN_ALBUM` i `ShowAlbumContent()`.
 *
 * Rozkladowka ma cztery pozycje: dwie na lewej stronie, dwie na prawej.
 * Kazda pokazuje albo portret potwora, albo piec barw jednego wzoru
 * przedmiotu, albo jeden przedmiot epicki. Czego gracz jeszcze nie ma,
 * to stoi przygaszone (`alpha = 0.3`) i bez nazwy — zamiast niej „???".
 *
 * Z boku pieć zakladek (dzialow), pod spodem numery stron i strzalki.
 * Serwer o niczym tu nie decyduje: oddaje same bity, a cala mapa
 * „ktory bit jest czym" jest przepisana do `gra/klaser.ts`.
 */

import { useLayoutEffect, useRef, useState } from 'react';
import {
  GNIAZDA,
  LICZBA_DZIALOW,
  LICZNIK,
  NIEZNANY_POTWOR,
  NUMER_STRONY_LEWY_X,
  NUMER_STRONY_PRAWY_KONIEC,
  NUMER_STRONY_Y,
  ODSUNIECIE_RAMKI,
  POZYCJI_W_DZIALE,
  RAMKA_POTWORA,
  STRZALKA,
  STRZALKA_DALEJ_X,
  STRZALKA_WSTECZ_X,
  TLO,
  ZAKLADKA,
  odkodujKlaser,
  plikPrzedmiotu,
  plikZakladki,
  policzDzialy,
  pozycjaNaStronie,
  przewin,
  type Pozycja,
} from '../gra/klaser';
import {
  NAZWY_DZIALOW,
  NAZWY_POTWOROW,
  NIEZNANE,
  OPIS_KLASERA,
  ZNALEZIONO,
} from '../gra/klaser-teksty';
import { nazwaWKlaserze } from '../gra/przedmioty';
import { obrazPotwora } from '../gra/karczmaUklad';
import { KLIK, zagraj } from '../gra/dzwieki';

export interface StanKlasera {
  dane: string;
  ile: number;
  wszystkich: number;
}

/** Ile procent, z dokladnoscia do setnej — `Math.round(x * 10000) / 100`. */
function procent(ile: number, ze: number): number {
  return Math.round((ile / ze) * 10000) / 100;
}

/** Podstawia `%1 %2 %3` i zamienia `#` na koniec wiersza — jak w kliencie. */
function zloz(wzor: string, ile: number, ze: number): string[] {
  return wzor
    .split('%1')
    .join(String(ile))
    .split('%2')
    .join(String(ze))
    .split('%3')
    .join(String(procent(ile, ze)))
    .split('#');
}

export function Klaser({ stan }: { stan: StanKlasera }) {
  const [dzial, setDzial] = useState(0);
  const [strona, setStrona] = useState(0);
  const licznik = useRef<HTMLDivElement>(null);
  const [licznikY, setLicznikY] = useState(LICZNIK.gora);

  const bity = odkodujKlaser(stan.dane);
  const wDzialach = policzDzialy(bity);
  const zebrane = Math.min(
    bity.reduce((suma, b) => suma + (b ? 1 : 0), 0),
    stan.wszystkich,
  );

  /*
   * Licznik zjezdza pod naglowek, jesli by na niego wszedl:
   *
   *     if (hintText != "" && collection.x + collection.textWidth > hint.x - 5)
   *         collection.y = hint.y + hint.textHeight + 5;
   *     else if (collection.x + collection.textWidth > heading.x - 5)
   *         collection.y = heading.y + heading.textHeight + 5;
   *     else collection.y = 135;
   *
   * Dluga nazwa potwora („Wsciekly niedzwiedz brunatny") rozpycha sie
   * w lewo od srodka strony i naprawde tam dochodzi.
   */
  useLayoutEffect(() => {
    const el = licznik.current;
    const rodzic = el?.offsetParent as HTMLElement | null;
    if (!el || !rodzic) return;

    const r0 = rodzic.getBoundingClientRect();
    const skX = r0.width / 1000;
    const skY = r0.height / 700;

    const wKlaserze = (nazwa: string) => {
      const cel = rodzic.querySelector<HTMLElement>(nazwa);
      if (!cel || cel.textContent === '') return null;
      const r = cel.getBoundingClientRect();
      return { lewo: (r.left - r0.left) / skX, dol: (r.bottom - r0.top) / skY };
    };

    const prawa = LICZNIK.lewo + el.getBoundingClientRect().width / skX;

    /*
     * Oryginal patrzy tu na `hintText` PO petli, czyli na podpowiedz
     * ostatniego z czterech gniazd, a polozenie bierze z pierwszego.
     * My pytamy o podpowiedz tego samego gniazda, ktorego polozenia
     * uzywamy — inaczej licznik zjezdzalby przez cytat z drugiej strony.
     */
    const pod =
      wKlaserze('.klaser-podpowiedz[data-gniazdo="0"]') ??
      wKlaserze('.klaser-naglowek[data-gniazdo="0"]');
    setLicznikY(pod && prawa > pod.lewo - 5 ? pod.dol + 5 : LICZNIK.gora);
  }, [dzial, strona, stan.dane]);

  function przejdz(oIle: number) {
    zagraj(KLIK);
    setStrona((s) => przewin(dzial, s + oIle));
  }

  function wybierzDzial(nowy: number) {
    zagraj(KLIK);
    setDzial(nowy);
    setStrona(0);
  }

  return (
    <div className="klaser">
      <img className="klaser-tlo" src={TLO} alt="" />

      {/* `LBL_ALBUM_COLLECTION` — „Znaleziono: x / y  z%". */}
      <div
        ref={licznik}
        className="klaser-licznik"
        style={{ left: LICZNIK.lewo, top: licznikY }}
        title={OPIS_KLASERA.split('#').join('\n')}
      >
        {zloz(ZNALEZIONO, zebrane, stan.wszystkich).map((wiersz, i) => (
          <div key={i}>{wiersz}</div>
        ))}
      </div>

      {/* Piec zakladek z boku — wybrana ma wersje „in". */}
      {Array.from({ length: LICZBA_DZIALOW }, (_, i) => (
        <button
          key={i}
          type="button"
          className="klaser-zakladka"
          style={{ left: ZAKLADKA.lewo, top: ZAKLADKA.gora + i * ZAKLADKA.odstep }}
          onClick={() => wybierzDzial(i)}
          aria-pressed={dzial === i}
          title={`${NAZWY_DZIALOW[i] ?? ''}\n${wDzialach[i] ?? 0} / ${POZYCJI_W_DZIALE[i] ?? 0} = ${procent(
            wDzialach[i] ?? 0,
            POZYCJI_W_DZIALE[i] ?? 1,
          )}%`}
        >
          <img src={plikZakladki(i, dzial === i)} alt={NAZWY_DZIALOW[i] ?? ''} />
        </button>
      ))}

      {GNIAZDA.map((gniazdo, i) => (
        <Gniazdo
          key={i}
          numer={i}
          gniazdo={gniazdo}
          pozycja={pozycjaNaStronie(dzial, strona, i)}
          bity={bity}
        />
      ))}

      {/* Numery stron: lewa i prawa polowa rozkladowki. */}
      <div
        className="klaser-numer klaser-numer-lewy"
        style={{ left: NUMER_STRONY_LEWY_X, top: NUMER_STRONY_Y }}
      >
        {strona * 2 + 1}
      </div>
      <div
        className="klaser-numer klaser-numer-prawy"
        style={{ left: NUMER_STRONY_PRAWY_KONIEC, top: NUMER_STRONY_Y }}
      >
        {strona * 2 + 2}
      </div>

      <button
        type="button"
        className="klaser-strzalka klaser-wstecz"
        style={{ left: STRZALKA_WSTECZ_X, top: STRZALKA.gora }}
        onClick={() => przejdz(-1)}
        aria-label="Poprzednia strona"
      />
      <button
        type="button"
        className="klaser-strzalka klaser-dalej"
        style={{ left: STRZALKA_DALEJ_X, top: STRZALKA.gora }}
        onClick={() => przejdz(1)}
        aria-label="Następna strona"
      />
    </div>
  );
}

/** Jedno z czterech miejsc rozkladowki. */
function Gniazdo({
  numer,
  gniazdo,
  pozycja,
  bity,
}: {
  /** 0..3 — potrzebny licznikowi, ktory patrzy na PIERWSZE gniazdo. */
  numer: number;
  gniazdo: (typeof GNIAZDA)[number];
  pozycja: Pozycja;
  bity: readonly boolean[];
}) {
  if (pozycja.rodzaj === 'pusta') return null;

  let naglowek = NIEZNANE;
  let podpowiedz = '';

  if (pozycja.rodzaj === 'potwor') {
    const znaleziony = bity[pozycja.bit] === true;
    if (znaleziony) naglowek = NAZWY_POTWOROW[pozycja.bit] ?? NIEZNANE;

    return (
      <>
        <Naglowek numer={numer} gniazdo={gniazdo} tekst={naglowek} podpowiedz="" />
        {/*
          Ramka i portret sa skalowane 0,8 — `actor[...].scaleX = 0.8`.
          Ramka stoi o 8 px w lewo i w gore od portretu.
        */}
        <img
          className="klaser-ramka"
          src={RAMKA_POTWORA}
          alt=""
          style={{
            left: gniazdo.potwor.lewo - ODSUNIECIE_RAMKI,
            top: gniazdo.potwor.gora - ODSUNIECIE_RAMKI,
          }}
        />
        <img
          className="klaser-potwor"
          src={znaleziony ? obrazPotwora(pozycja.bit + 1) : NIEZNANY_POTWOR}
          alt=""
          style={{ left: gniazdo.potwor.lewo, top: gniazdo.potwor.gora }}
        />
      </>
    );
  }

  const { typ, obrazek, klasa } = pozycja;
  const nazwa = nazwaWKlaserze(typ, obrazek, klasa);

  if (pozycja.rodzaj === 'epik') {
    // `SetAlbumEpic` pokazuje nazwe DOPIERO, gdy przedmiot jest w klaserze.
    const jest = bity[pozycja.bit] === true;
    if (jest) {
      naglowek = nazwa.nazwa;
      podpowiedz = nazwa.podpowiedz;
    }

    return (
      <>
        <Naglowek numer={numer} gniazdo={gniazdo} tekst={naglowek} podpowiedz={podpowiedz} />
        {jest && (
          <img
            className="klaser-wzor"
            src={plikPrzedmiotu(typ, obrazek, 0, klasa)}
            alt=""
            style={{ left: gniazdo.epik.lewo, top: gniazdo.epik.gora }}
          />
        )}
      </>
    );
  }

  /*
   * `SetAlbumItems` rysuje wszystkie piec barw, ale tylko wtedy, gdy
   * gracz ma CHOC JEDNA. Brakujace stoja przygaszone.
   */
  const barwy = [0, 1, 2, 3, 4].map((b) => bity[pozycja.bit + b] === true);
  const cokolwiek = barwy.some(Boolean);
  if (cokolwiek) naglowek = nazwa.nazwa;

  return (
    <>
      <Naglowek numer={numer} gniazdo={gniazdo} tekst={naglowek} podpowiedz="" />
      {cokolwiek &&
        barwy.map((ma, b) => (
          <img
            key={b}
            className="klaser-wzor"
            src={plikPrzedmiotu(typ, obrazek, b, klasa)}
            alt=""
            style={{
              left: gniazdo.wzory[b]?.lewo,
              top: gniazdo.wzory[b]?.gora,
              opacity: ma ? 1 : 0.3,
            }}
          />
        ))}
    </>
  );
}

/** Napis nad pozycja i — przy epikach — cytat pod nim. */
function Naglowek({
  numer,
  gniazdo,
  tekst,
  podpowiedz,
}: {
  numer: number;
  gniazdo: (typeof GNIAZDA)[number];
  tekst: string;
  podpowiedz: string;
}) {
  return (
    <>
      <div
        className="klaser-naglowek"
        data-gniazdo={numer}
        style={{ left: gniazdo.srodekX, top: gniazdo.naglowekY }}
      >
        {tekst}
      </div>
      {podpowiedz !== '' && (
        <div
          className="klaser-podpowiedz"
          data-gniazdo={numer}
          style={{ left: gniazdo.srodekX, top: gniazdo.podpowiedzY }}
        >
          {podpowiedz.split('\n').map((w, i) => (
            <div key={i}>{w}</div>
          ))}
        </div>
      )}
    </>
  );
}
