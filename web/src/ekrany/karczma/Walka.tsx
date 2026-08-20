/**
 * Odegranie walki po powrocie z wyprawy.
 *
 * Wynik jest juz przesadzony — serwer rozegral cala walke i przyslal
 * liste ciosow. Tutaj tylko ja odtwarzamy: cios po ciosie, z paskami
 * zycia po obu stronach. Nic sie tu nie losuje, wiec nie ma czego
 * podmienic.
 *
 * Polozenia ze stalych klienta Flash: przeciwnik POS_OPPIMG = (930, 130),
 * portret bohatera POS_FIGHT_CHARIMG_X = 315, podsumowanie
 * POS_FIGHT_SUMMARY_Y = 520, przycisk POS_FIGHT_BTN_Y = 710.
 */

import { useEffect, useState } from 'react';
import { PODPISY } from '../../gra/karczma-teksty';
import { Portret } from '../../gra/Portret';
import type { Gracz, Rozliczenie } from '../../gra/typy';

/** Ile trwa jeden cios. */
const TEMPO_CIOSU = 620;

/** Kto uderzyl: 1 to bohater, 2 przeciwnik. */
const BOHATER = 1;

export function Walka({
  rozliczenie,
  gracz,
  onZamknij,
}: {
  rozliczenie: Rozliczenie;
  gracz: Gracz;
  onZamknij: () => void;
}) {
  const { walka, wygrana, nagroda, awans, zdobytyPrzedmiot, plecakBylPelny } = rozliczenie;
  const [zadanych, setZadanych] = useState(0);

  // Ciosy ida po kolei; po ostatnim pokazuje sie podsumowanie.
  useEffect(() => {
    if (zadanych >= walka.ciosy.length) return;
    const licznik = setTimeout(() => setZadanych((n) => n + 1), TEMPO_CIOSU);
    return () => clearTimeout(licznik);
  }, [zadanych, walka.ciosy.length]);

  const koniec = zadanych >= walka.ciosy.length;

  // Zycie po kazdej ze stron liczymy z ciosow, ktore juz padly.
  let zycieGracza = walka.gracz.zycie;
  let zyciePotwora = walka.potwor.zycie;
  for (const cios of walka.ciosy.slice(0, zadanych)) {
    if (cios.kto === BOHATER) zyciePotwora -= cios.obrazenia;
    else zycieGracza -= cios.obrazenia;
  }

  const ostatni = zadanych > 0 ? walka.ciosy[zadanych - 1] : undefined;

  return (
    <div className="walka" onClick={() => (koniec ? onZamknij() : setZadanych(walka.ciosy.length))}>
      <img className="walka-tlo" src="/res/sfgame/scr/fight/schlachtfeld.jpg" alt="" />

      <Strona
        nazwa={walka.gracz.nazwa}
        poziom={walka.gracz.poziom}
        zycie={zycieGracza}
        zycieMaks={walka.gracz.zycie}
        strona="lewa"
        uderza={ostatni?.kto === BOHATER && !koniec}
        portret={
          <Portret
            wyglad={{ rasa: gracz.rasa, plec: gracz.plec, klasa: gracz.klasa, czesci: gracz.wyglad }}
          />
        }
      />

      <Strona
        nazwa={walka.potwor.nazwa}
        poziom={walka.potwor.poziom}
        zycie={zyciePotwora}
        zycieMaks={walka.potwor.zycie}
        strona="prawa"
        uderza={ostatni !== undefined && ostatni.kto !== BOHATER && !koniec}
        obrazek={`/res/sfgame/scr/fight/monster/monster${walka.potwor.obrazek}.jpg`}
      />

      {/* Liczba nad tym, kto wlasnie oberwal. */}
      {ostatni && !koniec && (
        <div
          key={zadanych}
          className={`walka-obrazenia ${ostatni.kto === BOHATER ? 'prawa' : 'lewa'}`}
        >
          -{ostatni.obrazenia.toLocaleString('pl-PL')}
        </div>
      )}

      {koniec && (
        <div className="walka-podsumowanie">
          <div className={`walka-wynik ${wygrana ? 'wygrana' : 'przegrana'}`}>
            {wygrana ? 'Zwycięstwo!' : 'Porażka'}
          </div>

          {nagroda && (
            <div className="walka-nagrody">
              <div>
                {PODPISY.doswiadczenie}: {nagroda.doswiadczenie.toLocaleString('pl-PL')}
              </div>
              <div>
                {PODPISY.wynagrodzenie} {Math.floor(nagroda.zloto / 100).toLocaleString('pl-PL')}
                <img src="/res/sfgame/if/icon_gold.png" alt="złota" />
                {String(nagroda.zloto % 100).padStart(2, '0')}
                <img src="/res/sfgame/if/icon_silber.png" alt="srebra" />
              </div>
              {nagroda.grzyby > 0 && (
                <div>
                  Znalezione grzyby: {nagroda.grzyby}
                  <img src="/res/sfgame/if/icon_pilz.png" alt="grzybów" />
                </div>
              )}
            </div>
          )}

          {awans !== null && <div className="walka-awans">Nowy poziom: {awans}!</div>}

          {zdobytyPrzedmiot && <div className="walka-przedmiot">Zdobyto przedmiot — leży w plecaku.</div>}

          {plecakBylPelny && (
            <div className="walka-przedmiot ostrzezenie">
              Nagroda przepadła — plecak był pełny.
            </div>
          )}

          <button type="button" className="przycisk walka-dalej" onClick={onZamknij}>
            {PODPISY.wroc}
          </button>
        </div>
      )}
    </div>
  );
}

function Strona({
  nazwa,
  poziom,
  zycie,
  zycieMaks,
  strona,
  uderza,
  obrazek,
  portret,
}: {
  nazwa: string;
  poziom: number;
  zycie: number;
  zycieMaks: number;
  strona: 'lewa' | 'prawa';
  uderza: boolean;
  obrazek?: string;
  portret?: React.ReactNode;
}) {
  const udzial = Math.max(0, Math.min(1, zycie / Math.max(1, zycieMaks)));

  return (
    <div className={`walka-strona ${strona}${uderza ? ' uderza' : ''}`}>
      {obrazek ? (
        <img
          className="walka-portret"
          src={obrazek}
          alt=""
          onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }}
        />
      ) : (
        <div className="walka-portret">{portret}</div>
      )}

      <div className="walka-nazwa">
        {nazwa} · {poziom}
      </div>

      <div className="walka-zycie">
        <div className="wypelnienie" style={{ width: `${udzial * 100}%` }} />
        <span>{Math.max(0, Math.round(zycie)).toLocaleString('pl-PL')}</span>
      </div>
    </div>
  );
}
