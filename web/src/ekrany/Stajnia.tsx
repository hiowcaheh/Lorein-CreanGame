/**
 * Stajnia.
 *
 * Cztery boksy na tle stajni; klikniecie w boks pokazuje na ciemnej
 * planszy nazwe, opis, zysk i cene, a pod nia przycisk najmu. Dokladnie
 * tak, jak `ClickMount` w oryginale — z tym, ze tam plansza reagowala
 * na najechanie myszka, a tu na dotkniecie.
 *
 * Podswietlenie boksu to osobny obrazek (`*_mouseover.jpg`) nalozony na
 * tlo w miejscu podanym stalymi `REL_STALL_OVL_*`.
 */

import { useEffect, useState } from 'react';
import {
  DRZWI,
  LICZBA_RAK,
  MARGINES_PLANSZY,
  ODSTEP_RAK_MS,
  RECE,
  ODSTEP_WIERSZY,
  ODSTEP_ZYSKU,
  OKRES_WYNAJMU,
  OPIS_STAJNI,
  PLANSZA,
  PREMIA,
  PRZEDLUZ,
  TYTUL_STAJNI,
  ULEPSZENIE,
  WYNAJMIJ,
  boksy,
  nazwaWierzchowca,
  plikDrzwi,
  plikRak,
  poraDnia,
  opisWierzchowca,
  tloStajni,
  zyskZWierzchowca,
} from '../gra/stajnia';
import type { Gracz } from '../gra/typy';

export interface BoksStajni {
  numer: number;
  cena: { srebro: number; grzyby: number };
  skrocenie: number;
  premia: number;
  odmowa: string | null;
}

export interface StanStajni {
  wierzchowiec: number;
  najemDo: number;
  czasSerwera: number;
  boksy: BoksStajni[];
}

/** Zloto to sto srebra — tak samo jak w pasku u gory. */
function naZloto(srebro: number): { zloto: number; srebro: number } {
  return { zloto: Math.floor(srebro / 100), srebro: srebro % 100 };
}

export function Stajnia({
  stan,
  gracz,
  onWynajmij,
}: {
  stan: StanStajni;
  gracz: Gracz;
  onWynajmij: (wierzchowiec: number) => void;
}) {
  const [wybrany, setWybrany] = useState<number | null>(null);

  /*
   * Stajenny macha rekami: `BauerHandEvent` co 200 ms losuje jedna
   * z pieciu klatek i pokazuje tylko ja. Na tle rak nie ma wcale.
   */
  const [reka, setReka] = useState(0);
  useEffect(() => {
    const zegar = setInterval(
      () => setReka(Math.floor(Math.random() * LICZBA_RAK)),
      ODSTEP_RAK_MS,
    );
    return () => clearInterval(zegar);
  }, []);

  const drzwi = plikDrzwi(poraDnia(new Date(stan.czasSerwera * 1000).getHours()));

  const naObrazie = boksy(gracz.rasa);
  const boks = wybrany === null ? null : stan.boksy.find((b) => b.numer === wybrany);

  /*
   * Napis na przycisku zalezy od tego, co gracz juz ma:
   * `TXT_STALL_BUY`, `TXT_STALL_UPGRADE` albo `TXT_STALL_PROLONG`.
   */
  const napisPrzycisku =
    stan.wierzchowiec === 0
      ? WYNAJMIJ
      : wybrany !== null && stan.wierzchowiec < wybrany
        ? ULEPSZENIE
        : PRZEDLUZ;

  const cena = boks ? naZloto(boks.cena.srebro) : null;

  return (
    <div className="stajnia">
      <img className="stajnia-tlo" src={tloStajni(gracz.rasa)} alt="" />

      {/* Zmierzch albo noc za drzwiami w glebi. W dzien nie ma nic. */}
      {drzwi && (
        <img className="stajnia-drzwi" src={drzwi} alt="" style={{ left: DRZWI.x, top: DRZWI.y }} />
      )}

      {/* Rece stajennego — jedna z pieciu klatek, zmieniana co 200 ms. */}
      <img className="stajnia-rece" src={plikRak(reka)} alt="" style={{ left: RECE.x, top: RECE.y }} />

      {naObrazie.map((b) => (
        <button
          key={b.wierzchowiec}
          type="button"
          className={`stajnia-boks${wybrany === b.wierzchowiec ? ' wybrany' : ''}`}
          style={{
            left: b.ramka.lewo,
            top: b.ramka.gora,
            width: b.ramka.szerokosc,
            height: b.ramka.wysokosc,
          }}
          title={nazwaWierzchowca(b.wierzchowiec, gracz.rasa)}
          aria-label={nazwaWierzchowca(b.wierzchowiec, gracz.rasa)}
          onClick={() => setWybrany(b.wierzchowiec)}
        />
      ))}

      {/* Podswietlenie wybranego boksu — obrazek stoi w swoim wlasnym miejscu. */}
      {wybrany !== null &&
        naObrazie
          .filter((b) => b.wierzchowiec === wybrany)
          .map((b) => (
            <img
              key={b.wierzchowiec}
              className="stajnia-podswietlenie"
              src={b.podswietlenie}
              alt=""
              style={{ left: b.polozeniePodswietlenia.x, top: b.polozeniePodswietlenia.y }}
            />
          ))}

      {/* Ciemna plansza z opisem — `SHP_STALL_BLACK_SQUARE`, alfa 0,65. */}
      <div
        className="stajnia-plansza"
        style={{
          left: PLANSZA.lewo,
          top: PLANSZA.gora,
          width: PLANSZA.szerokosc,
          height: PLANSZA.wysokosc,
        }}
      />

      <div
        className="stajnia-tresc"
        style={{
          left: PLANSZA.lewo + MARGINES_PLANSZY,
          top: PLANSZA.gora + MARGINES_PLANSZY,
          width: PLANSZA.szerokosc - MARGINES_PLANSZY * 2,
        }}
      >
        <div className="tytul">
          {boks ? nazwaWierzchowca(boks.numer, gracz.rasa) : TYTUL_STAJNI}
        </div>
        <div className="opis" style={{ marginTop: ODSTEP_WIERSZY }}>
          {boks ? opisWierzchowca(boks.numer, gracz.rasa) : OPIS_STAJNI}
        </div>

        {boks && (
          <div className="zysk" style={{ marginTop: ODSTEP_ZYSKU - ODSTEP_WIERSZY }}>
            <span>{zyskZWierzchowca(boks.skrocenie)}</span>
            {/*
              Czwarty wierzchowiec doklada srebro przy najmie —
              „Premia srodowiskowa" z napisu 278. W oryginale stoi tu
              kwota z Warty; serwer wyplaca `(23 + poziom) * poziom^2`.
            */}
            {boks.premia > 0 && (
              <span className="premia">
                {PREMIA}
                {naZloto(boks.premia).zloto > 0 && (
                  <>
                    {' '}
                    {naZloto(boks.premia).zloto}
                    <img src="/res/sfgame/if/icon_gold.png" alt="złota" />
                  </>
                )}{' '}
                {naZloto(boks.premia).srebro}
                <img src="/res/sfgame/if/icon_silber.png" alt="srebra" />
              </span>
            )}
          </div>
        )}
      </div>

      {boks && cena && (
        <>
          <div
            className="stajnia-okres"
            style={{
              left: PLANSZA.lewo + MARGINES_PLANSZY,
              top: PLANSZA.gora + PLANSZA.wysokosc - MARGINES_PLANSZY - 56,
            }}
          >
            {OKRES_WYNAJMU}
          </div>

          <div
            className="stajnia-cena"
            style={{
              left: PLANSZA.lewo + MARGINES_PLANSZY,
              top: PLANSZA.gora + PLANSZA.wysokosc - MARGINES_PLANSZY - 26,
            }}
          >
            {boks.cena.srebro > 0 && (
              <>
                {cena.zloto > 0 && (
                  <>
                    {cena.zloto}
                    <img src="/res/sfgame/if/icon_gold.png" alt="złota" />
                  </>
                )}
                {cena.srebro}
                <img src="/res/sfgame/if/icon_silber.png" alt="srebra" />
              </>
            )}
            {boks.cena.grzyby > 0 && (
              <>
                {boks.cena.grzyby}
                <img src="/res/sfgame/if/icon_pilz.png" alt="grzybów" />
              </>
            )}
          </div>

          {/*
            Przycisku nie ma, gdy najem jest niemozliwy — oryginal robi
            dokladnie to (`Remove(BTN_STALL_BUY)`), zamiast pokazywac
            wylaczony guzik. Powod idzie pod spodem, zeby nie zgadywac.
          */}
          {boks.odmowa === null ? (
            <button
              type="button"
              className="przycisk stajnia-najmij"
              style={{
                left: PLANSZA.lewo + PLANSZA.szerokosc - MARGINES_PLANSZY - 170,
                top: PLANSZA.gora + PLANSZA.wysokosc - MARGINES_PLANSZY - 40,
              }}
              onClick={() => onWynajmij(boks.numer)}
            >
              {napisPrzycisku}
            </button>
          ) : (
            <div
              className="stajnia-odmowa"
              style={{
                left: PLANSZA.lewo + PLANSZA.szerokosc - MARGINES_PLANSZY - 300,
                top: PLANSZA.gora + PLANSZA.wysokosc - MARGINES_PLANSZY - 34,
                width: 300,
              }}
            >
              {boks.odmowa}
            </div>
          )}
        </>
      )}

    </div>
  );
}
