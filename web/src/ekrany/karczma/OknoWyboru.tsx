/**
 * Okno wyboru zadania.
 *
 * Uklad ze stalych `POS_QO_*` i `REL_QO_*` klienta Flash: przydymiona
 * plansza 740x440 w punkcie (410, 230), portret rozdajacego po lewej,
 * opis wyprawy po prawej, trzy wybory u dolu i nagrody obok nich.
 */

import { useState } from 'react';
import { KRAINY, PODPISY } from '../../gra/karczma-teksty';
import {
  ODSTEP_NAGROD,
  ODSTEP_WYBOROW,
  OKNO,
  OKNO_NAGLOWEK,
  OKNO_NAGRODY,
  OKNO_OPIS,
  OKNO_PORTRET,
  OKNO_POWROT,
  OKNO_START,
  OKNO_WYBOR,
  PORTRETY_ZADAN,
  czas,
} from '../../gra/karczmaUklad';
import type { StanKarczmy, Zadanie } from '../../gra/typy';

/** Nazwa krainy, w ktora wysyla zadanie — `quest_location_N` liczy od jedynki. */
export function kraina(lokacja: number): string {
  return KRAINY[Math.max(0, Math.min(KRAINY.length - 1, lokacja - 1))] ?? '';
}

export function OknoWyboru({
  stan,
  wariant,
  onWyrusz,
  onZamknij,
}: {
  stan: StanKarczmy;
  wariant: number;
  onWyrusz: (numer: number) => void;
  onZamknij: () => void;
}) {
  const [wybrane, setWybrane] = useState<Zadanie | null>(stan.zadania[0] ?? null);
  if (!wybrane) return null;

  const zaKrotkaWytrzymalosc = stan.wytrzymalosc < wybrane.sekundy;

  return (
    <div className="karczma-okno" style={{ left: OKNO.lewo, top: OKNO.gora, width: OKNO.szerokosc, height: OKNO.wysokosc }}>
      <img
        className="karczma-okno-portret"
        style={{
          left: OKNO_PORTRET.lewo - OKNO.lewo,
          top: OKNO_PORTRET.gora - OKNO.gora,
          width: OKNO_PORTRET.szerokosc,
          height: OKNO_PORTRET.wysokosc,
        }}
        src={PORTRETY_ZADAN[wariant]}
        alt=""
        onError={(e) => { e.currentTarget.style.display = 'none'; }}
      />

      <div
        className="karczma-okno-naglowek"
        style={{ left: OKNO_NAGLOWEK.lewo - OKNO.lewo, top: OKNO_NAGLOWEK.gora - OKNO.gora }}
      >
        {PODPISY.wybierzZadanie}
      </div>

      <div
        className="karczma-okno-opis"
        style={{
          left: OKNO_OPIS.lewo - OKNO.lewo,
          top: OKNO_OPIS.gora - OKNO.gora,
          width: OKNO_OPIS.szerokosc,
        }}
      >
        {kraina(wybrane.lokacja)}
      </div>

      {/* --- trzy wyprawy do wyboru --- */}
      {stan.zadania.map((zadanie, i) => (
        <button
          key={zadanie.numer}
          type="button"
          className={`karczma-wybor${zadanie.numer === wybrane.numer ? ' wybrany' : ''}${zadanie.premia > 0 ? ' rzadkie' : ''}`}
          style={{
            left: OKNO_WYBOR.lewo - OKNO.lewo,
            top: OKNO_WYBOR.gora - OKNO.gora + i * ODSTEP_WYBOROW,
            width: OKNO_WYBOR.szerokosc,
            height: OKNO_WYBOR.wysokosc,
          }}
          onClick={() => setWybrane(zadanie)}
        >
          {kraina(zadanie.lokacja)}
        </button>
      ))}

      {/* --- co z tego bedzie --- */}
      <div
        className="karczma-nagrody"
        style={{
          left: OKNO_NAGRODY.lewo - OKNO.lewo,
          top: OKNO_NAGRODY.gora - OKNO.gora,
          width: OKNO_NAGRODY.szerokosc,
        }}
      >
        <div>
          {PODPISY.czasTrwania}: {czas(wybrane.sekundy)}
        </div>
        <div style={{ marginTop: ODSTEP_NAGROD - 26 }}>
          {PODPISY.doswiadczenie}: {wybrane.doswiadczenie.toLocaleString('pl-PL')}
        </div>
        <div style={{ marginTop: ODSTEP_NAGROD - 26 }}>
          {PODPISY.wynagrodzenie} {Math.floor(wybrane.zloto / 100).toLocaleString('pl-PL')}
          <img src="/res/sfgame/if/icon_gold.png" alt="złota" />
          {String(wybrane.zloto % 100).padStart(2, '0')}
          <img src="/res/sfgame/if/icon_silber.png" alt="srebra" />
        </div>
      </div>

      {/*
        Przedmiot do zdobycia. Serwer mowi tylko, CZY przy zadaniu cos
        czeka — jego wartosci gracz poznaje dopiero po powrocie, tak jak
        w oryginale.
      */}
      {wybrane.nagrodaPrzedmiotowa && (
        <div className="karczma-nagroda-przedmiot">
          Do zdobycia: przedmiot
          {!stan.wolneMiejsceWPlecaku && (
            <span className="karczma-ostrzezenie">
              {' '}— plecak pełny, nagroda przepadnie
            </span>
          )}
        </div>
      )}

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
        disabled={zaKrotkaWytrzymalosc}
        title={zaKrotkaWytrzymalosc ? 'Za mało awanturniczości na tak długą wyprawę' : undefined}
        onClick={() => onWyrusz(wybrane.numer)}
      >
        {PODPISY.przyjmij}
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
