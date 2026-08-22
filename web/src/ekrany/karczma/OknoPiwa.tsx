/**
 * Okno karczmarza.
 *
 * Ta sama plansza, co przy wyborze zadania — oryginal uzywa dokladnie
 * tych samych aktorow (`BNC_BEEROFFER` dzieli z `BNC_QUESTOFFER`
 * `SHP_QO_BLACK_SQUARE`, naglowek i tekst).
 *
 * Karczmarz ma trzy odpowiedzi, zaleznie od stanu bohatera: naleje,
 * odmowi bo dosc na dzis, albo odmowi bo bohater jest zbyt wypoczety
 * (`thirst > 4800`).
 */

import { PODPISY } from '../../gra/karczma-teksty';
import {
  OKNO,
  OKNO_NAGLOWEK,
  OKNO_OPIS,
  OKNO_PORTRET,
  OKNO_POWROT,
  OKNO_START,
  PORTRETY_KARCZMARZA,
} from '../../gra/karczmaUklad';
import type { StanKarczmy } from '../../gra/typy';
import { NapisZIkona } from '../../gra/NapisZIkona';

export function OknoPiwa({
  stan,
  onKup,
  onZamknij,
}: {
  stan: StanKarczmy;
  onKup: () => void;
  onZamknij: () => void;
}) {
  const zaZdrowy = stan.wytrzymalosc > stan.progZaZdrowy;
  const doscNaDzis = stan.piwa >= stan.piwaMaks;
  const staeNaGrzyba = stan.grzyby >= 1;
  const naleje = !zaZdrowy && !doscNaDzis && staeNaGrzyba;

  const tytul = doscNaDzis
    ? PODPISY.piwoTytulNie
    : zaZdrowy
      ? PODPISY.piwoTytulZaZdrowy
      : PODPISY.piwoTytulOk;

  const tekst = doscNaDzis
    ? PODPISY.piwoTekstDosc
    : zaZdrowy
      ? PODPISY.piwoTekstZaZdrowy
      : PODPISY.piwoTekstOk;

  return (
    <div
      className="karczma-okno"
      style={{ left: OKNO.lewo, top: OKNO.gora, width: OKNO.szerokosc, height: OKNO.wysokosc }}
    >
      <img
        className="karczma-okno-portret"
        style={{
          left: OKNO_PORTRET.lewo - OKNO.lewo,
          top: OKNO_PORTRET.gora - OKNO.gora,
          width: OKNO_PORTRET.szerokosc,
          height: OKNO_PORTRET.wysokosc,
        }}
        src={PORTRETY_KARCZMARZA[doscNaDzis ? 2 : zaZdrowy ? 1 : 0]}
        alt=""
        onError={(e) => { e.currentTarget.style.display = 'none'; }}
      />

      <div
        className="karczma-okno-naglowek"
        style={{ left: OKNO_NAGLOWEK.lewo - OKNO.lewo, top: OKNO_NAGLOWEK.gora - OKNO.gora }}
      >
        {tytul}
      </div>

      <div
        className="karczma-okno-opis"
        style={{
          left: OKNO_OPIS.lewo - OKNO.lewo,
          top: OKNO_OPIS.gora - OKNO.gora,
          width: OKNO_OPIS.szerokosc,
        }}
      >
        {tekst}
        <div className="karczma-piwa-licznik">
          {PODPISY.piwoWypite} {stan.piwa}/{stan.piwaMaks}
        </div>
        {naleje && <div className="karczma-piwa-efekt">{PODPISY.piwoEfekt}</div>}
      </div>

      <button
        type="button"
        className="przycisk"
        style={{
          position: 'absolute',
          left: OKNO_START.lewo - OKNO.lewo,
          top: OKNO_START.gora - OKNO.gora,
          width: OKNO_START.szerokosc,
          minHeight: OKNO_START.wysokosc,
        }}
        disabled={!naleje}
        onClick={onKup}
      >
        <NapisZIkona tekst={PODPISY.piwoKup} />
      </button>

      <button
        type="button"
        className="przycisk drugi"
        style={{
          position: 'absolute',
          left: OKNO_POWROT.lewo - OKNO.lewo,
          top: OKNO_POWROT.gora - OKNO.gora,
          width: OKNO_POWROT.szerokosc,
          minHeight: OKNO_POWROT.wysokosc,
        }}
        onClick={onZamknij}
      >
        {PODPISY.wroc}
      </button>
    </div>
  );
}
