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
  OBRAZ_PRZESZEDL_WIEZA,
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
  TLO_WIEZY,
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
import {
  NAZWY_PIETER,
  OPIS_WIEZY,
  TYTUL_WIEZY,
  WEJSCIE_DO_WIEZY,
} from '../gra/wieza-teksty';
import { NAZWY_POTWOROW } from '../gra/klaser-teksty';
import { obrazPotwora, czas } from '../gra/karczmaUklad';
import { KLIK, zagraj } from '../gra/dzwieki';
import { NapisZIkona } from '../gra/NapisZIkona';
import type { Gracz, StanWiezy } from '../gra/typy';

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
  /** Stan wiezy — dokłada go `GET /api/wieza`, patrz `App`. */
  wieza?: StanWiezy;
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

/**
 * Podpowiedz kafla wiezy — `TXT_TOWER_INFO`:
 *
 *     "Poziom: %1/100#Nastepny przeciwnik: %2#Premia zlota: %3%"
 *
 * z `%1` = pietro, `%2` = nazwa przeciwnika i `%3` = premia zlota
 * w procentach. Premia to `tower_level - 1`, czyli liczba PRZEJSZTYCH
 * pieter — tak samo liczy ja serwer:
 *
 *     $towerbonus = ((int)$db_data['tower_level'] - 1) / 100;
 */
function opisWiezy(wieza: StanWiezy): string[] {
  const przeciwnik = NAZWY_PIETER[wieza.pietro - 1]?.nazwa ?? '';
  return OPIS_WIEZY.split('%1')
    .join(String(wieza.pietro))
    .split('%2')
    .join(przeciwnik)
    .split('%3')
    .join(String(wieza.pietro - 1))
    .split('#');
}

export function Lochy({
  stan,
  gracz,
  onWalcz,
  onOdswiez,
  onWalczWWiezy,
}: {
  stan: StanLochow;
  gracz: Gracz;
  onWalcz: (numer: number) => void;
  onOdswiez: () => void;
  /** Wejscie na pietro wiezy — `ACT_TOWER_TRY`. */
  onWalczWWiezy: () => void;
}) {
  /*
   * Co jest otwarte: numer lochu albo wieza. Oryginal ma na to jeden
   * ekran — `ShowMainQuestScreen(DungeonNr, Enemy)`, gdzie wieza to
   * `DungeonNr == 100`.
   */
  const [wybrany, setWybrany] = useState<number | 'wieza' | null>(null);

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

  const wWiezy = wybrany === 'wieza' && stan.wieza !== undefined;
  const otwarty =
    typeof wybrany !== 'number' ? null : (stan.lochy.find((l) => l.numer === wybrany) ?? null);

  return (
    <div className="lochy">
      <img
        className="lochy-tlo"
        src={wWiezy ? TLO_WIEZY : otwarty ? tloLochu(otwarty.numer) : TLO_LISTY}
        alt=""
      />

      {otwarty === null && !wWiezy ? (
        <>
          <div className="lochy-tytul" style={{ left: TYTUL.srodek, top: TYTUL.gora }}>
            {drugaPlansza ? TYTUL_DRUGIEJ_PLANSZY : TYTUL_LISTY}
          </div>

          {drugaPlansza && (
            <WiezaIPortal wieza={stan.wieza ?? null} onWieza={() => setWybrany('wieza')} />
          )}

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
                /*
                  Przejscionego lochu nie da sie juz otworzyc — nie ma tam
                  czego robic. SWIADOME ODSTEPSTWO, patrz CLAUDE.md:
                  oryginal na pierwszej planszy otwiera go i tylko wygasza
                  przycisk walki (`CNT_MAINQUEST_GREY`), a na drugiej
                  klikniecie DOWOLNEGO kafla i tak pokazuje loch biezacy
                  (`if (countDone == 9) ShowMainQuestScreen(9, ...)`).
                */
                disabled={(zamkniety && !swiezy) || przeszedl}
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
                  if ((zamkniety && !swiezy) || przeszedl) return;
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
      ) : wWiezy ? (
        <EkranWiezy
          wieza={stan.wieza!}
          onWroc={() => {
            setWybrany(null);
            onOdswiez();
          }}
          onWalcz={onWalczWWiezy}
        />
      ) : otwarty ? (
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
      ) : null}
    </div>
  );
}

/** Stan „jeszcze nie wszedl" — zaslona nad kaflem stoi do dwojki wlacznie. */
const KLUCZ_UZYTY_LUB_MNIEJ = 1;

/**
 * Wieza i Portal do piekiel.
 *
 * Wieza dziala — sto pieter, `getTowerMonster()`. Portalu jeszcze nie ma
 * (czeka na gildie, patrz DO-ZROBIENIA.md), wiec jego kafel zostaje pod
 * zaslona i nie daje sie kliknac; pod nia chodzi jego animacja,
 * dwanascie klatek z `scr/dungeons/portal/`.
 */
function WiezaIPortal({
  wieza: stanWiezy,
  onWieza,
}: {
  wieza: StanWiezy | null;
  onWieza: () => void;
}) {
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
      <button
        type="button"
        className="lochy-kafel"
        style={{
          left: KAFEL_WIEZY.lewo,
          top: KAFEL_WIEZY.gora,
          width: KAFEL_WIEZY.szerokosc,
          height: KAFEL_WIEZY.wysokosc,
        }}
        disabled={stanWiezy?.ukonczona ?? true}
        title={[
          wieza?.nazwa,
          wieza?.motto,
          stanWiezy
            ? stanWiezy.ukonczona
              ? OCZYSZCZONY
              : opisWiezy(stanWiezy).join('\n')
            : null,
        ]
          .filter(Boolean)
          .join('\n')}
        onClick={() => {
          if (stanWiezy?.ukonczona ?? true) return;
          zagraj(KLIK);
          onWieza();
        }}
      >
        <img className="obraz" src={OBRAZ_WIEZY} alt={wieza?.nazwa ?? ''} />
        {stanWiezy?.ukonczona && <img className="zaslona" src={OBRAZ_PRZESZEDL_WIEZA} alt="" />}
      </button>

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

/**
 * Ekran jednego pietra wiezy.
 *
 * To NIE jest `ShowTowerScreen()` — tamten ekran to zarzadzanie
 * pomocnikami (`BNC_SCREEN_TOWER`: trzy portrety kopii, ich ekwipunek
 * i przyciski ulepszania), a pomocnikow u nas nie ma. Wejscie na pietro
 * oryginal pokazuje na ekranie LOCHU:
 *
 *     case BTN_TOWER_TRY:
 *         ShowMainQuestScreen(100, (399 + towerLevel));
 *
 * czyli ta sama plansza, ten sam tytul na `POS_SCREEN_TITLE_X`, ta sama
 * ramka przeciwnika i ten sam przycisk — rozni sie tylko trzema
 * rzeczami, ktore `ShowMainQuestScreen` bierze z galezi `DungeonNr == 100`:
 *
 *     DungeonLevel = String(towerLevel + 1);
 *     text = txt[TXT_TOWER_LEVEL].split("%1").join(DungeonLevel) + " - "
 *          + txt[TXT_TOWER_ENEMY_NAMES + Enemy - 399].split("|")[0];
 *     questText = txt[TXT_TOWER_ENEMY_NAMES + towerLevel].split("|")[1];
 *     Add(IMG_SCR_TOWER_BG);
 */
function EkranWiezy({
  wieza,
  onWroc,
  onWalcz,
}: {
  wieza: StanWiezy;
  onWroc: () => void;
  onWalcz: () => void;
}) {
  const przeciwnik = NAZWY_PIETER[wieza.pietro - 1];
  const zostalo = Math.max(0, wieza.przerwaDo - wieza.teraz);
  const czekamy = zostalo > 0;

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
        {`${TYTUL_WIEZY.split('%1').join(String(wieza.pietro))} - ${przeciwnik?.nazwa ?? ''}`}
      </div>

      <div
        className="lochy-tekst"
        style={{ left: TEKST.lewo, top: TEKST.gora, width: TEKST.szerokosc }}
      >
        {(przeciwnik?.opis ?? '').split('#').map((wiersz, i) => (
          <div key={i}>{wiersz}</div>
        ))}
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
        src={obrazPotwora(wieza.potwor)}
        alt={przeciwnik?.nazwa ?? ''}
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
        title={
          czekamy
            ? PODPOWIEDZ_GRZYBA.split('%1').join(czas(zostalo))
            : !wieza.wolneMiejsceWPlecaku
              ? 'Plecak jest pełny.'
              : WEJSCIE_DO_WIEZY
        }
        onClick={onWalcz}
      >
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
