/**
 * Lochy — lista dziewieciu wejsc i ekran jednego lochu.
 *
 * Przepisane z `ShowMainQuestsScreen()` (lista) i `ShowMainQuestScreen()`
 * (pojedynczy loch). Zamkniety loch przykrywa `unknown.png`, przejsty —
 * `done.png`, a swiezo otwarty odsłania sie zanikaniem zaslony
 * (`FadeOut(CNT_MQS_DISABLED + i, 20, 0.05)`) przy dzwieku `unlock.mp3`.
 */

import { useEffect, useMemo, useState } from 'react';
import {
  DZWIEK_OTWARCIA,
  KAFEL,
  KAFLE,
  KROKOW_OTWIERANIA,
  KROK_OTWIERANIA_MS,
  LOCHOW_NA_LISCIE,
  OBRAZ_PRZESZEDL,
  OBRAZ_RAMKI,
  OBRAZ_ZAMKNIETY,
  PODPOWIEDZ,
  POZIOMOW_W_LOCHU,
  PLANSZA,
  PRZECIWNIK,
  PRZESZEDL,
  PRZEZROCZYSTOSC_PLANSZY,
  PRZYCISK,
  RAMKA_PRZECIWNIKA,
  TEKST,
  TLO_LISTY,
  TYTUL,
  TYTUL_LOCHU_Y,
  obrazLochu,
  tloLochu,
} from '../gra/lochyUklad';
import {
  BRAK_KLUCZA,
  NAZWY_LOCHOW,
  OCZYSZCZONY,
  OPIS_POSTEPU,
  PODPOWIEDZ_GRZYBA,
  TYTUL_LISTY,
  TYTUL_LOCHU,
} from '../gra/lochy-teksty';
import { NAZWY_POTWOROW } from '../gra/klaser-teksty';
import { obrazPotwora, czas } from '../gra/karczmaUklad';
import { KLIK, zagraj } from '../gra/dzwieki';
import type { Gracz } from '../gra/typy';

export interface OpisLochu {
  numer: number;
  stan: number;
  poziom: number;
  potwor: number;
}

export interface StanLochow {
  lochy: OpisLochu[];
  swiezoOtwarte: number[];
  przerwaDo: number;
  teraz: number;
  grzyby: number;
  wolneMiejsceWPlecaku: boolean;
  gracz?: Gracz;
}

/** Nazwa przeciwnika: numer z tablicy albo sam gracz (kopia, numer -1). */
function nazwaPrzeciwnika(numer: number, nick: string): string {
  return numer > 0 ? (NAZWY_POTWOROW[numer - 1] ?? '') : nick;
}

/** Podstawia `%1` i `%2`, a `#` zamienia na koniec wiersza — jak w kliencie. */
function zloz(wzor: string, pierwsze: string, drugie: string): string[] {
  return wzor.split('%1').join(pierwsze).split('%2').join(drugie).split('#');
}

export function Lochy({
  stan,
  gracz,
  onWalcz,
  onOdswiez,
}: {
  stan: StanLochow;
  gracz: Gracz;
  onWalcz: (numer: number) => void;
  onOdswiez: () => void;
}) {
  const [wybrany, setWybrany] = useState<number | null>(null);

  /*
   * Zanikanie zaslony nad swiezo otwartym lochem. Oryginal robi to
   * dwudziestoma krokami po 0,05 przezroczystosci; my liczymy ten sam
   * postep i oddajemy go jako `opacity`.
   */
  const [krok, setKrok] = useState(0);
  const otwierane = stan.swiezoOtwarte;

  useEffect(() => {
    if (otwierane.length === 0) return;
    setKrok(0);
    const dzwiek = new Audio(DZWIEK_OTWARCIA);
    void dzwiek.play().catch(() => undefined);

    const zegar = setInterval(() => {
      setKrok((k) => {
        if (k >= KROKOW_OTWIERANIA) {
          clearInterval(zegar);
          return k;
        }
        return k + 1;
      });
    }, KROK_OTWIERANIA_MS);
    return () => clearInterval(zegar);
  }, [otwierane]);

  const zaslona = otwierane.length === 0 ? 1 : Math.max(0, 1 - krok / KROKOW_OTWIERANIA);

  const naLiscie = useMemo(
    () => stan.lochy.filter((l) => l.numer <= LOCHOW_NA_LISCIE),
    [stan.lochy],
  );

  const otwarty = wybrany === null ? null : (stan.lochy.find((l) => l.numer === wybrany) ?? null);

  return (
    <div className="lochy">
      <img className="lochy-tlo" src={otwarty ? tloLochu(otwarty.numer) : TLO_LISTY} alt="" />

      {otwarty === null ? (
        <>
          <div className="lochy-tytul" style={{ left: TYTUL.srodek, top: TYTUL.gora }}>
            {TYTUL_LISTY}
          </div>

          {naLiscie.map((loch, i) => {
            const kafel = KAFLE[i]!;
            const zamkniety = loch.stan <= KLUCZ_UZYTY_LUB_MNIEJ;
            const przeszedl = loch.stan >= PRZESZEDL;
            const swiezy = otwierane.includes(loch.numer);
            const nazwa = NAZWY_LOCHOW[loch.numer - 1];

            return (
              <button
                key={loch.numer}
                type="button"
                className="lochy-kafel"
                style={{
                  left: kafel.lewo,
                  top: kafel.gora,
                  width: KAFEL.szerokosc,
                  height: KAFEL.wysokosc,
                }}
                disabled={zamkniety && !swiezy}
                title={[
                  nazwa?.nazwa,
                  nazwa?.motto,
                  zamkniety && !swiezy
                    ? BRAK_KLUCZA
                    : przeszedl
                      ? OCZYSZCZONY
                      : zloz(
                          OPIS_POSTEPU,
                          String(loch.poziom),
                          nazwaPrzeciwnika(loch.potwor, gracz.nick),
                        ).join('\n'),
                ]
                  .filter(Boolean)
                  .join('\n')}
                onClick={() => {
                  if (zamkniety && !swiezy) return;
                  zagraj(KLIK);
                  setWybrany(loch.numer);
                }}
              >
                <img className="obraz" src={obrazLochu(loch.numer)} alt={nazwa?.nazwa ?? ''} />
                {zamkniety && (
                  <img
                    className="zaslona"
                    src={OBRAZ_ZAMKNIETY}
                    alt=""
                    style={{ opacity: swiezy ? zaslona : 1 }}
                  />
                )}
                {przeszedl && <img className="zaslona" src={OBRAZ_PRZESZEDL} alt="" />}
              </button>
            );
          })}
        </>
      ) : (
        <EkranLochu
          loch={otwarty}
          stan={stan}
          gracz={gracz}
          onWroc={() => {
            setWybrany(null);
            onOdswiez();
          }}
          onWalcz={() => onWalcz(otwarty.numer)}
        />
      )}
    </div>
  );
}

/** Stan „jeszcze nie wszedl" — zaslona nad kaflem stoi do dwojki wlacznie. */
const KLUCZ_UZYTY_LUB_MNIEJ = 1;

function EkranLochu({
  loch,
  stan,
  gracz,
  onWroc,
  onWalcz,
}: {
  loch: OpisLochu;
  stan: StanLochow;
  gracz: Gracz;
  onWroc: () => void;
  onWalcz: () => void;
}) {
  const nazwa = NAZWY_LOCHOW[loch.numer - 1];
  const przeciwnik = nazwaPrzeciwnika(loch.potwor, gracz.nick);
  const zostalo = Math.max(0, stan.przerwaDo - stan.teraz);
  const czekamy = zostalo > 0;
  const przeszedl = loch.stan >= PRZESZEDL;

  return (
    <>
      <div
        className="lochy-plansza"
        style={{
          left: PLANSZA.lewo,
          top: PLANSZA.gora,
          width: PLANSZA.szerokosc,
          height: PLANSZA.wysokosc,
          opacity: PRZEZROCZYSTOSC_PLANSZY,
        }}
      />

      <div className="lochy-tytul" style={{ left: TYTUL.srodek, top: TYTUL_LOCHU_Y }}>
        {zloz(TYTUL_LOCHU, nazwa?.nazwa ?? '', String(loch.poziom)).join(' ')}
      </div>

      <div
        className="lochy-tekst"
        style={{ left: TEKST.lewo, top: TEKST.gora, width: TEKST.szerokosc }}
      >
        {nazwa?.motto && <div className="motto">{nazwa.motto}</div>}
        {zloz(OPIS_POSTEPU, String(loch.poziom), przeciwnik).map((wiersz, i) => (
          <div key={i}>{wiersz}</div>
        ))}
        {przeszedl && <div>{OCZYSZCZONY}</div>}
      </div>

      <img
        className="lochy-ramka"
        src={OBRAZ_RAMKI}
        alt=""
        style={{
          left: RAMKA_PRZECIWNIKA.lewo,
          top: RAMKA_PRZECIWNIKA.gora,
          width: RAMKA_PRZECIWNIKA.rozmiar,
          height: RAMKA_PRZECIWNIKA.rozmiar,
        }}
      />
      <img
        className="lochy-przeciwnik"
        src={obrazPotwora(loch.potwor > 0 ? loch.potwor : 1)}
        alt={przeciwnik}
        style={{
          left: PRZECIWNIK.lewo,
          top: PRZECIWNIK.gora,
          width: PRZECIWNIK.rozmiar,
          height: PRZECIWNIK.rozmiar,
        }}
      />

      {czekamy && (
        <div
          className="lochy-podpowiedz"
          style={{
            left: PODPOWIEDZ.lewo,
            top: PODPOWIEDZ.gora,
            width: PODPOWIEDZ.szerokosc,
          }}
        >
          {PODPOWIEDZ_GRZYBA.split('%1').join(czas(zostalo))}
        </div>
      )}

      <button
        type="button"
        className="przycisk lochy-start"
        style={{
          left: PRZYCISK.prawo - PRZYCISK.szerokosc,
          top: PRZYCISK.gora,
          width: PRZYCISK.szerokosc,
          minHeight: PRZYCISK.wysokosc,
        }}
        disabled={przeszedl || (czekamy && stan.grzyby <= 0) || !stan.wolneMiejsceWPlecaku}
        onClick={onWalcz}
      >
        OK{czekamy ? ' (1~P)' : ''}
      </button>

      <button
        type="button"
        className="przycisk lochy-wroc"
        style={{
          left: PODPOWIEDZ.lewo,
          top: PRZYCISK.gora,
          width: PRZYCISK.szerokosc,
          minHeight: PRZYCISK.wysokosc,
        }}
        onClick={onWroc}
      >
        Wróć
      </button>
    </>
  );
}

export { POZIOMOW_W_LOCHU };
