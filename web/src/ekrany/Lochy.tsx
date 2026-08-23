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
  KAFEL_PORTALU,
  KAFEL_WIEZY,
  KAFLE,
  KAFLE_DRUGIEJ,
  KLATEK_PORTALU,
  ODSTEP_KLATEK_PORTALU_MS,
  OBRAZ_PORTALU,
  OBRAZ_PORTAL_ZAMKNIETY,
  OBRAZ_WIEZY,
  UKONCZONYCH_NA_DRUGA_PLANSZE,
  klatkaPortalu,
  obrazDrugiejPlanszy,
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
  PODPOWIEDZ_GRZYBA,
  NAZWY_DRUGIEJ_PLANSZY,
  NAZWY_LOCHOW,
  OCZYSZCZONY,
  OPIS_POSTEPU,
  TYTUL_DRUGIEJ_PLANSZY,
  TYTUL_LISTY,
  TYTUL_LOCHU,
} from '../gra/lochy-teksty';
import { NAZWY_POTWOROW } from '../gra/klaser-teksty';
import { obrazPotwora, czas } from '../gra/karczmaUklad';
import { KLIK, zagraj } from '../gra/dzwieki';
import { NapisZIkona } from '../gra/NapisZIkona';
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

/**
 * Nazwa i motto lochu. Pierwsza dziewiatka ma je w `TXT_DUNGEON_NAME`,
 * lochy 10-13 — w `TXT_HL_MAINQUESTS_NAME`, na drugiej planszy.
 */
function nazwaLochu(numer: number): { nazwa: string; motto: string } | undefined {
  return numer <= LOCHOW_NA_LISCIE
    ? NAZWY_LOCHOW[numer - 1]
    : NAZWY_DRUGIEJ_PLANSZY[numer - LOCHOW_NA_LISCIE - 1];
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

  /*
   * Ktora plansza. `Add((countDone >= 9) ? BNC_SCREEN_HLMAINQUESTS
   * : BNC_SCREEN_MAINQUESTS)` — liczy sie liczba PRZEJSZTYCH lochow,
   * a nie to, ktore konkretnie.
   */
  const ukonczonych = stan.lochy.filter((l) => l.stan >= PRZESZEDL).length;
  const drugaPlansza = ukonczonych >= UKONCZONYCH_NA_DRUGA_PLANSZE;

  const naLiscie = useMemo(
    () =>
      stan.lochy.filter((l) =>
        drugaPlansza ? l.numer > LOCHOW_NA_LISCIE : l.numer <= LOCHOW_NA_LISCIE,
      ),
    [stan.lochy, drugaPlansza],
  );

  const otwarty = wybrany === null ? null : (stan.lochy.find((l) => l.numer === wybrany) ?? null);

  return (
    <div className="lochy">
      <img className="lochy-tlo" src={otwarty ? tloLochu(otwarty.numer) : TLO_LISTY} alt="" />

      {otwarty === null ? (
        <>
          <div className="lochy-tytul" style={{ left: TYTUL.srodek, top: TYTUL.gora }}>
            {drugaPlansza ? TYTUL_DRUGIEJ_PLANSZY : TYTUL_LISTY}
          </div>

          {drugaPlansza && <WiezaIPortal />}

          {naLiscie.map((loch, i) => {
            const kafel = (drugaPlansza ? KAFLE_DRUGIEJ[i] : KAFLE[i])!;
            if (!kafel) return null;
            const zamkniety = loch.stan <= KLUCZ_UZYTY_LUB_MNIEJ;
            const przeszedl = loch.stan >= PRZESZEDL;
            const swiezy = otwierane.includes(loch.numer);
            const nazwa = nazwaLochu(loch.numer);

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
                <img
                  className="obraz"
                  src={drugaPlansza ? obrazDrugiejPlanszy(loch.numer) : obrazLochu(loch.numer)}
                  alt={nazwa?.nazwa ?? ''}
                />
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

/**
 * Wieza i Portal do piekiel — srodkowa kolumna drugiej planszy.
 *
 * Kafle stoja tam, gdzie w oryginale, ale zadnego z tych ekranow jeszcze
 * nie ma (patrz tabela odstepstw w CLAUDE.md), wiec obie plytki sa
 * przykryte zaslona i nie daja sie klikac. Portal ma pod nia swoja
 * animacje — dwanascie klatek z `scr/dungeons/portal/`.
 */
function WiezaIPortal() {
  const [klatka, setKlatka] = useState(0);

  useEffect(() => {
    const zegar = setInterval(
      () => setKlatka((k) => (k + 1) % KLATEK_PORTALU),
      ODSTEP_KLATEK_PORTALU_MS,
    );
    return () => clearInterval(zegar);
  }, []);

  const wieza = NAZWY_DRUGIEJ_PLANSZY[4];
  const portal = NAZWY_DRUGIEJ_PLANSZY[5];

  return (
    <>
      <div
        className="lochy-kafel niegotowy"
        style={{
          left: KAFEL_WIEZY.lewo,
          top: KAFEL_WIEZY.gora,
          width: KAFEL_WIEZY.szerokosc,
          height: KAFEL_WIEZY.wysokosc,
        }}
        title={[wieza?.nazwa, wieza?.motto, 'Jeszcze nie ma tu czego zwiedzać.']
          .filter(Boolean)
          .join('\n')}
      >
        <img className="obraz" src={OBRAZ_WIEZY} alt={wieza?.nazwa ?? ''} />
        <img className="zaslona" src={OBRAZ_ZAMKNIETY} alt="" />
      </div>

      <div
        className="lochy-kafel niegotowy"
        style={{
          left: KAFEL_PORTALU.lewo,
          top: KAFEL_PORTALU.gora,
          width: KAFEL_PORTALU.szerokosc,
          height: KAFEL_PORTALU.wysokosc,
        }}
        title={[portal?.nazwa, portal?.motto, 'Jeszcze nie ma tu czego zwiedzać.']
          .filter(Boolean)
          .join('\n')}
      >
        <img className="obraz" src={OBRAZ_PORTALU} alt={portal?.nazwa ?? ''} />
        <img className="obraz" src={klatkaPortalu(klatka)} alt="" />
        <img className="zaslona" src={OBRAZ_PORTAL_ZAMKNIETY} alt="" />
      </div>
    </>
  );
}

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
  const nazwa = nazwaLochu(loch.numer);
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

      <button
        type="button"
        className="przycisk lochy-start"
        style={{
          left: PRZYCISK.prawo - PRZYCISK.szerokosc,
          top: PRZYCISK.gora,
          width: PRZYCISK.szerokosc,
          minHeight: PRZYCISK.wysokosc,
        }}
        /*
          Wylaczamy TYLKO przejsty loch — tam naprawde nie ma co robic.
          O pelnym plecaku i braku grzyba decyduje serwer i odsyla powod
          (`ERR_INVENTORY_FULL` w oryginale), ktory laduje w pasku
          komunikatow. Guzik, ktory sam z siebie nie da sie kliknac i nie
          mowi dlaczego, wyglada jak zepsuty.
        */
        disabled={przeszedl}
        title={
          czekamy
            ? PODPOWIEDZ_GRZYBA.split('%1').join(czas(zostalo))
            : !stan.wolneMiejsceWPlecaku
              ? 'Plecak jest pełny.'
              : undefined
        }
        onClick={onWalcz}
      >
        {/*
          Licznik stoi NA przycisku, a nie osobnym napisem obok.
          Oryginal ma tu `SetBtnText(BTN_MAINQUEST_START, txt[TXT_OK]
          + " (1~P)")`, a czas pokazuje w `LBL_MAINQUEST_MUSHHINT` po
          lewej — ale tamto miejsce zajmuje u nas przycisk „Wroc",
          ktorego oryginal nie ma (wychodzi sie krzyzykiem).
        */}
        <NapisZIkona tekst={czekamy ? `${czas(zostalo)} (~P)` : 'OK'} />
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
