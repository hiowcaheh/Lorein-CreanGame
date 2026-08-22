/**
 * Pasek doswiadczenia spod portretu.
 *
 * Klient pisze na nim SAM POZIOM — `txt[TXT_HALL_LIST_COLUMN_4] + " " +
 * SG_LEVEL`, czyli „Pzm 33", wysrodkowane nad paskiem
 * (`x = POS_EXPERIENCE_BAR_X + 127 - textWidth / 2`). Liczby doswiadczenia
 * sa w podpowiedzi obszaru klikalnego `CA_SCR_CHAR_EXPBAR`:
 *
 *     Doswiadczenie:  <SG_EXP>
 *     Nast. poziom:   <SG_EXP_FOR_NEXTLEVEL>
 *
 * (pozycje 102 i 108 pliku jezykowego). Jedyna roznica wobec oryginalu
 * jest ta sama, co przy podpowiedziach przedmiotow: tam pokazywalo ja
 * najechanie myszka, tutaj klikniecie — bo na telefonie nie ma czego
 * najezdzac.
 *
 * Pasek stoi na ekranie postaci i w OBU sklepach: `CA_SCR_CHAR_EXPBAR`
 * nalezy do `BNC_SCREEN_CHAR`, `BNC_SCREEN_SHAKES` i `BNC_SCREEN_FIDGET`.
 */

import { useEffect, useState } from 'react';
import { liczba } from './liczby';

/** Napis „Pzm" — pozycja 55 pliku jezykowego. */
const TXT_PZM = 'Pzm';
/** „Doswiadczenie" — pozycja 102. */
const TXT_DOSWIADCZENIE = 'Doświadczenie';
/** „Nast. poziom" — pozycja 108. */
const TXT_NASTEPNY_POZIOM = 'Nast. poziom';

export const WYPELNIENIE_PASKA = '/res/sfgame/scr/char/experience.jpg';

/** Szerokosc podpowiedzi i kolumna wartosci — jak w `PodpowiedzPrzedmiotu`. */
const SZEROKOSC_PODPOWIEDZI = 300;
const KOLUMNA_WARTOSCI = 137;

export interface Polozenie {
  lewo: number;
  gora: number;
  szerokosc: number;
  wysokosc: number;
}

export function PasekDoswiadczenia({
  poziom,
  doswiadczenie,
  doNastepnegoPoziomu,
  postep,
  ramka,
}: {
  poziom: number;
  doswiadczenie: number;
  doNastepnegoPoziomu: number;
  postep: number;
  ramka: Polozenie;
}) {
  const [otwarta, setOtwarta] = useState(false);

  // Klikniecie obok zamyka podpowiedz — tak samo jak przy przedmiotach.
  useEffect(() => {
    if (!otwarta) return;

    const zamknij = (e: PointerEvent) => {
      const cel = e.target as Element | null;
      if (cel?.closest('.postac-pasek') || cel?.closest('.podpowiedz')) return;
      setOtwarta(false);
    };

    document.addEventListener('pointerdown', zamknij);
    return () => document.removeEventListener('pointerdown', zamknij);
  }, [otwarta]);

  const lewo = Math.min(
    Math.max(0, ramka.lewo + ramka.szerokosc / 2 - SZEROKOSC_PODPOWIEDZI / 2),
    1000 - SZEROKOSC_PODPOWIEDZI,
  );

  return (
    <>
      <button
        type="button"
        className="postac-pasek"
        style={{
          left: ramka.lewo,
          top: ramka.gora,
          width: ramka.szerokosc,
          height: ramka.wysokosc,
        }}
        onClick={() => setOtwarta((o) => !o)}
      >
        <div
          className="wypelnienie"
          style={{
            width: `${Math.round(postep * 100)}%`,
            backgroundImage: `url('${WYPELNIENIE_PASKA}')`,
          }}
        />
        <span>
          {TXT_PZM} {poziom}
        </span>
      </button>

      {otwarta && (
        <div
          className="podpowiedz"
          style={{ left: lewo, top: ramka.gora + ramka.wysokosc + 8, width: SZEROKOSC_PODPOWIEDZI }}
          role="dialog"
          aria-label={TXT_DOSWIADCZENIE}
        >
          <div className="wiersz">
            <span>{TXT_DOSWIADCZENIE}:</span>
            <span style={{ left: KOLUMNA_WARTOSCI }}>{liczba(doswiadczenie)}</span>
          </div>
          <div className="wiersz">
            <span>{TXT_NASTEPNY_POZIOM}:</span>
            <span style={{ left: KOLUMNA_WARTOSCI }}>{liczba(doNastepnegoPoziomu)}</span>
          </div>
        </div>
      )}
    </>
  );
}
