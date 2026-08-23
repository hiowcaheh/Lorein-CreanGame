/**
 * Odegranie walki po powrocie z wyprawy.
 *
 * Wynik jest juz przesadzony — serwer rozegral cala walke i przyslal
 * liste ciosow. Tutaj tylko ja odtwarzamy: cios po ciosie, z paskami
 * zycia po obu stronach. Nic sie tu nie losuje, wiec nie ma czego
 * podmienic.
 *
 * Uklad ze stalych klienta Flash:
 *
 *   POS_FIGHT_CHARIMG_X = 315, POS_OPPIMG = (930, 130)  portrety 300x300
 *   nazwa wysrodkowana pod portretem, dolna krawedz na y = 420
 *   lifebar.png 300x46 na y = 445 (REL_LIFEBAR_Y = 15)
 *   POS_FIGHT_CHAR_PROP_Y = 520, wiersze co REL_FIGHT_CHAR_PROP_Y = 32
 *   kolumny 324/450 (bohater) i 1059/1185 (przeciwnik)
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { PODPISY, POTWORY, WYNIKI_WALKI } from '../../gra/karczma-teksty';
import { PRZEGRANE_W_WIEZY, WYGRANE_W_WIEZY } from '../../gra/wieza-teksty';
import { lacznaPremia } from '../../gra/premie';
import {
  OknoNagrody,
  SZEROKOSC_OKNA_NAGRODY,
  wysokoscOknaNagrody,
  type RodzajNagrody,
} from '../../gra/OknoNagrody';
import { PodpowiedzPrzedmiotu } from '../../gra/PodpowiedzPrzedmiotu';
import {
  FANFARY,
  bronDoDzwieku,
  plikDzwiekuBroni,
  przygotujDzwieki,
  zagraj,
  type UzycieBroni,
} from '../../gra/dzwieki';
import { Portret } from '../../gra/Portret';

/**
 * Numer obrazka, ktory znaczy „to kopia gracza, a nie potwor" —
 * `NUMER_KOPII` z `backend/src/game/lochy.ts`.
 */
const NUMER_KOPII = -1;
import {
  OBRAZ_PASKA_ZYCIA,
  OBRAZ_RAMKI_PORTRETU,
  OBRAZ_RAMKI_SRODKOWEJ,
  OBRAZ_RAMKI_STATOW,
  OBRAZ_WYPELNIENIA_ZYCIA,
  WALKA_KOLUMNY_GRACZA,
  WALKA_KOLUMNY_POTWORA,
  WALKA_NAZWA_GRACZA,
  WALKA_NAZWA_POTWORA,
  WALKA_ODSTEP_STATOW,
  WALKA_PASEK_GRACZA,
  WALKA_PASEK_POTWORA,
  WALKA_PORTRET_GRACZA,
  WALKA_PORTRET_POTWORA,
  WALKA_RAMKA_PORTRETU,
  WALKA_RAMKA_SRODKOWA,
  WALKA_RAMKA_STATOW_GRACZA,
  WALKA_RAMKA_STATOW_POTWORA,
  WALKA_STATY_Y,
  WALKA_SRODEK_X,
  KLATKI_UDERZENIA,
  WALKA_BRON_LEKKA_Y,
  WALKA_OBRAZENIA_ODSTEP,
  WALKA_OBRAZENIA_Y,
  WALKA_AWANS_Y,
  WALKA_DOSWIADCZENIE_X,
  WALKA_GRZYBY_Y,
  WALKA_NAGRODY_PRAWA,
  WALKA_PIENIADZE_Y,
  WALKA_PODSUMOWANIE_Y,
  WALKA_SZEROKOSC_PODSUMOWANIA,
  WALKA_ZDOBYCZ,
  WALKA_PRZYCISK,
  WALKA_SKALA_SPRITE,
  bronCiezkaObrot,
  bronCiezkaX,
  bronCiezkaY,
  bronLekkaX,
  klatkiLekkiegoCiosu,
  lekkiCios,
  obrazCiezkiegoCiosu,
  obrazPotwora,
  WALKA_BELT_Y,
  WALKA_KULA_Y,
  WALKA_LUK_Y,
  WALKA_ROZDZKA_OFFSET_X,
  WALKA_ROZDZKA_Y,
  beltObrot,
  beltX,
  kulaX,
  lukObrot,
  lukX,
  onoPrzyrostSkali,
  onoSkalaPoczatkowa,
  onoX,
  onoY,
  rozdzkaObrot,
  rozdzkaX,
  tarczaX,
  tarczaY,
  tloKrainy,
  LOKACJA_WIEZY,
  type Ramka,
} from '../../gra/karczmaUklad';
import type { CechyWalki, Gracz, Rozliczenie } from '../../gra/typy';
import { liczba } from '../../gra/liczby';

/*
 * Zegar animacji ciosu.
 *
 * Oryginal odlicza cios `StrikeAniTimer`em co 40 ms, a miedzy ciosami
 * czeka `DoStrikeTimer` — 200 ms. Zadna z tych liczb nie jest tu
 * przyblizeniem: caly przebieg ponizej to przepisany `StrikeAniTimerEvent`,
 * tik po tiku, wiec dlugosc ciosu wychodzi sama z siebie (760 ms przy
 * lekkiej galezi, 960 ms przy ciezkiej).
 */
const TIK = 40;
const PRZERWA_MIEDZY_CIOSAMI = 200;

/** Kto uderzyl: 1 to bohater, 2 przeciwnik. */
const BOHATER = 1;

/** Ekran gry ma 1000 px szerokosci — potrzebne do przeliczenia skali. */
const SZEROKOSC_EKRANU_GRY = 1000;

/**
 * Ktora piatka zdan opisze walke — port `fightStyle`.
 *
 * Klient patrzy, ile zycia zostalo ZWYCIEZCY: powyzej 80 procent to
 * zmiazdzenie, powyzej 40 zwykla wygrana, powyzej 20 ciezka, a ponizej
 * walka na styk. Przy przegranej liczy sie zycie przeciwnika.
 */
function stopienWalki(zycie: number, zycieMaks: number): number {
  const udzial = zycie / Math.max(1, zycieMaks);
  if (udzial > 0.8) return 0;
  if (udzial > 0.4) return 1;
  if (udzial > 0.2) return 2;
  return 3;
}

/**
 * Co klient wypisuje zamiast liczby obrazen.
 *
 * `LBL_DAMAGE_INDICATOR` dostaje „-" i liczbe, a kiedy ta liczba wyjdzie
 * zero — slowo: `TXT_GEBLOCKT` (164) przy bloku, `TXT_AUSGEWICHEN` (106)
 * przy uniku. Cios krytyczny NIE ma wlasnego napisu: to ta sama liczba,
 * tylko `FontFormat_CriticalDamage` — 34 px zamiast 30 i czerwien
 * `CLR_RED = 0xff4444`.
 */
const NAZWY_CIOSOW: Record<number, string> = {
  1: 'Blok!',
  2: 'Unik!',
};

/** Pieciowierszowa tabelka cech — te same podpisy, co na ekranie postaci. */
const WIERSZE_CECH: { nazwa: string; klucz: keyof CechyWalki }[] = [
  { nazwa: 'Siła', klucz: 'sila' },
  { nazwa: 'Zręczność', klucz: 'zrecznosc' },
  { nazwa: 'Inteligencja', klucz: 'intelekt' },
  { nazwa: 'Wytrzym.', klucz: 'wytrzymalosc' },
  { nazwa: 'Szczęście', klucz: 'szczescie' },
];

/**
 * Podskakujaca strzalka przy nagrodzie podbitej premia — ta sama, co
 * w oknie wyboru zadania (`btnClassArrowUp` z oryginalu). Stoi WEWNATRZ
 * grupy z liczba, wiec nie ma jak wejsc na sasiednie napisy.
 */
function ZnaczekPremii() {
  return (
    <img
      className="walka-premia"
      src="/res/ui/strzalka-gora.png"
      alt="z premią"
      title="w tym: Premia kolekcjonera"
    />
  );
}

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

  /*
   * Ile procent nagrody dokladaja premie. Przy wyprawie liczba jest juz
   * podbita w oknie wyboru i tam stoi znaczek; po walce w lochu nagroda
   * powstaje dopiero teraz, wiec znaczek nalezy sie tutaj.
   */
  /*
   * Kazda nagroda ma SWOJE premie i swoj znaczek. Doswiadczenie podbija
   * klaser i rzadkie zadanie; zlota nie podbija na razie nic (patrz
   * `zlotoZWyprawy()` na serwerze), wiec strzalka przy nim sie nie
   * pojawia — pojawi sie sama, gdy dojda premie gildii i wiezy.
   *
   * Loch nie odsyla osobnej listy dla zlota: tam premia jest jedna
   * i wtedy zloto dziedziczy `premie`.
   */
  const premiaDoswiadczenia = lacznaPremia(rozliczenie.premie);
  const premiaZlota = lacznaPremia(rozliczenie.premieZlota ?? rozliczenie.premie);

  /*
   * Ktora nagroda ma otwarte rozpisanie. Doswiadczenie i pieniadze maja
   * OSOBNE okienka — klikniecie w jedno nie mowi nic o drugim.
   */
  const [otwartaNagroda, setOtwartaNagroda] = useState<RodzajNagrody | null>(null);

  const przelacz = (co: RodzajNagrody) => setOtwartaNagroda((s) => (s === co ? null : co));

  /*
   * `odgrywany` to numer ciosu, ktory wlasnie leci; `zaliczonych` — ile
   * ciosow zdazylo juz ubrac zycie. To nie to samo: oryginal przestawia
   * paski dopiero w chwili trafienia (`SetLifeBars` w fazie 1), a nie
   * przy rozpoczeciu zamachu.
   */
  const [odgrywany, setOdgrywany] = useState(0);
  const [zaliczonych, setZaliczonych] = useState(0);
  const [pokazZdobycz, setPokazZdobycz] = useState(false);

  /*
   * Podpowiedz staje NAD ikona zdobyczy. Ikona siedzi w przeplywie
   * podsumowania, wiec jej polozenie znamy dopiero po zmierzeniu —
   * przeliczamy je na uklad sceny, bo w takim `PodpowiedzPrzedmiotu`
   * przyjmuje wspolrzedne.
   */
  const ramkaZdobyczy = useRef<HTMLButtonElement | null>(null);

  function miejsceZdobyczy() {
    const e = ramkaZdobyczy.current;
    const ekran = e?.closest('.walka');
    if (!e || !ekran) return { x: WALKA_SRODEK_X, y: WALKA_PODSUMOWANIE_Y };

    const p = e.getBoundingClientRect();
    const s = ekran.getBoundingClientRect();
    // Scena jest przeskalowana, wiec pomiar z przegladarki trzeba
    // przeliczyc z powrotem na piksele ukladu 1000x700.
    const skala = s.width / SZEROKOSC_EKRANU_GRY || 1;
    return { x: (p.x - s.x + p.width / 2) / skala, y: (p.y - s.y) / skala };
  }

  const koniec = odgrywany >= walka.ciosy.length;

  let zycieGracza = walka.gracz.zycie;
  let zyciePotwora = walka.potwor.zycie;
  for (const cios of walka.ciosy.slice(0, zaliczonych)) {
    if (cios.kto === BOHATER) zyciePotwora -= cios.obrazenia;
    else zycieGracza -= cios.obrazenia;
  }

  const biezacy = koniec ? undefined : walka.ciosy[odgrywany];
  /** Kto zadaje ten cios — z jego broni bierze sie cala animacja. */
  const atakujacy = biezacy && (biezacy.kto === BOHATER ? walka.gracz : walka.potwor);
  const nazwaPotwora = POTWORY[walka.potwor.obrazek - 1] ?? walka.potwor.nazwa;

  /*
   * Zdanie podsumowujace — losowane RAZ na walke, nie co render.
   *
   * `txt[(int(Math.random() * 5) + fightStyle) + (charWin ? TXT_FIGHT_WIN
   * : TXT_FIGHT_LOSE)]`. Zycie liczy sie z konca walki, wiec bierzemy je
   * z ostatniego stanu, a nie z tego, co juz odegrano.
   */
  const zdanieWyniku = useMemo(() => {
    /*
     * Wieza ma wlasne zdania i NIE oglada sie na to, jak walka poszla:
     *
     *     if (towerFightMode) {
     *         text = txt[(charWin ? TXT_TOWER_WON : TXT_TOWER_LOST)
     *                    + int(Math.random() * 5)];
     *     }
     */
    if (rozliczenie.lokacja === LOKACJA_WIEZY) {
      const zdania = wygrana ? WYGRANE_W_WIEZY : PRZEGRANE_W_WIEZY;
      return zdania[Math.floor(Math.random() * zdania.length)] ?? '';
    }

    let poGraczu = walka.gracz.zycie;
    let poPotworze = walka.potwor.zycie;
    for (const cios of walka.ciosy) {
      if (cios.kto === BOHATER) poPotworze -= cios.obrazenia;
      else poGraczu -= cios.obrazenia;
    }

    const stopien = wygrana
      ? stopienWalki(poGraczu, walka.gracz.zycie)
      : stopienWalki(poPotworze, walka.potwor.zycie);
    const piatka = (wygrana ? WYNIKI_WALKI.wygrana : WYNIKI_WALKI.przegrana)[stopien] ?? [];
    return piatka[Math.floor(Math.random() * piatka.length)] ?? '';
  }, [walka, wygrana, rozliczenie.lokacja]);

  /*
   * Klatki animacji sciagamy Z GORY, zanim pierwszy cios ich zazada.
   *
   * Oryginal robi dokladnie to samo przed walka — `Load(IMG_WEAPON_CLAW,
   * IMG_WEAPON_CLAW2, ...)`. Bez tego przegladarka przerywa poprzednie
   * pobranie przy kazdej podmianie `src` i klatki mrugaja.
   */
  /*
   * Fanfary po wygranej — `if (charWin) Play(SND_JINGLE)` w `DoSkipFight`.
   * Graja raz, w chwili gdy walka sie konczy, a nie przy kazdym renderze.
   */
  useEffect(() => {
    if (koniec && wygrana) zagraj(FANFARY);
  }, [koniec, wygrana]);

  /*
   * Probki obu broni sciagamy razem z klatkami — oryginal robi to samo
   * przed walka (`Load(GetWeaponSound(...))` dla wszystkich czterech
   * przypadkow uzycia).
   */
  useEffect(() => {
    const uzycia: UzycieBroni[] = ['zamach', 'trafienie', 'blok', 'krytyk'];
    const probki: string[] = [];
    for (const strona of [walka.gracz.bron, walka.potwor.bron]) {
      const { klasa, obrazek } = bronDoDzwieku(strona);
      for (const u of uzycia) probki.push(plikDzwiekuBroni(klasa, obrazek, u));
    }
    przygotujDzwieki(probki);
  }, [walka.gracz.bron, walka.potwor.bron]);

  useEffect(() => {
    const wszystkie = [
      ...klatkiLekkiegoCiosu(walka.gracz.bron),
      ...klatkiLekkiegoCiosu(walka.potwor.bron),
      ...walka.gracz.pociski,
      ...walka.potwor.pociski,
      ...KLATKI_UDERZENIA,
    ];
    for (const wybuch of [walka.gracz.pociskUderzenia, walka.potwor.pociskUderzenia]) {
      if (wybuch) wszystkie.push(wybuch);
    }
    for (const adres of new Set(wszystkie)) {
      const obraz = new Image();
      obraz.src = adres;
    }
  }, [walka.gracz, walka.potwor]);

  function pomin() {
    setZaliczonych(walka.ciosy.length);
    setOdgrywany(walka.ciosy.length);
  }

  return (
    <div className="walka">
      {/*
        Oryginal NIE ma osobnego tla walki. `BNC_SCREEN_FIGHT` sklada sie
        z `BLACK_SQUARE` polozonego na biezacym ekranie — czyli na
        krainie, w ktorej wyprawa sie odbywala. Stad tlo jest zawsze
        inne, zaleznie od tego, gdzie poszedl bohater.
      */}
      <img className="walka-tlo" src={tloKrainy(rozliczenie.lokacja)} alt="" />
      <div className="walka-zaciemnienie" />

      <Strona
        strona="lewa"
        nazwa={walka.gracz.nazwa}
        poziom={walka.gracz.poziom}
        cechy={walka.gracz.cechy}
        zycie={zycieGracza}
        zycieMaks={walka.gracz.zycie}
        portret={WALKA_PORTRET_GRACZA}
        pasek={WALKA_PASEK_GRACZA}
        podpis={WALKA_NAZWA_GRACZA}
        ramkaStatow={WALKA_RAMKA_STATOW_GRACZA}
        kolumny={WALKA_KOLUMNY_GRACZA}
        obraz={
          <Portret
            wyglad={{ rasa: gracz.rasa, plec: gracz.plec, klasa: gracz.klasa, czesci: gracz.wyglad }}
          />
        }
      />

      <Strona
        strona="prawa"
        nazwa={nazwaPotwora}
        poziom={walka.potwor.poziom}
        cechy={walka.potwor.cechy}
        zycie={zyciePotwora}
        zycieMaks={walka.potwor.zycie}
        portret={WALKA_PORTRET_POTWORA}
        pasek={WALKA_PASEK_POTWORA}
        podpis={WALKA_NAZWA_POTWORA}
        ramkaStatow={WALKA_RAMKA_STATOW_POTWORA}
        kolumny={WALKA_KOLUMNY_POTWORA}
        /*
          Ostatni przeciwnik w lochu Twierdza Cieni to KOPIA GRACZA —
          `getDungMonster()` nie ma dla niego zadnego wiersza i oryginal
          sklada go z samego gracza. Nie ma wiec obrazka potwora
          (`obrazek` rowna sie `NUMER_KOPII`); rysujemy tam ten sam
          portret, co po lewej stronie.
        */
        obraz={
          walka.potwor.obrazek === NUMER_KOPII ? (
            <Portret
              wyglad={{
                rasa: gracz.rasa,
                plec: gracz.plec,
                klasa: gracz.klasa,
                czesci: gracz.wyglad,
              }}
            />
          ) : (
            <img
              src={obrazPotwora(walka.potwor.obrazek)}
              alt=""
              onError={(e) => {
                e.currentTarget.style.visibility = 'hidden';
              }}
            />
          )
        }
      />

      {/*
        Srodkowa ramka `box2.png` pokazuje sie DOPIERO PO WALCE.

        SWIADOME ODSTEPSTWO (tabela w CLAUDE.md): klient 5.55 trzyma ja
        na scenie od poczatku (`AddBunch(BNC_SCREEN_FIGHT, ..., IMG_FIGHT_BOX2, ...)`
        i nigdzie jej nie zdejmuje), wiec przez cala walke stoi tam pusty
        szary prostokat. Wlasciciel gry pokazal zrzuty, na ktorych w
        trakcie walki widac samo pole bitwy i przycisk „Pomin".
      */}
      {koniec && (
        <img
          className="walka-ramka"
          style={ramkaNaStyl(WALKA_RAMKA_SRODKOWA)}
          src={OBRAZ_RAMKI_SRODKOWEJ}
          alt=""
        />
      )}

      {biezacy && atakujacy && (
        <Cios
          key={odgrywany}
          kto={biezacy.kto}
          rodzaj={biezacy.rodzaj}
          obrazenia={biezacy.obrazenia}
          bron={atakujacy.bron}
          bronObrazek={atakujacy.bronObrazek}
          typAnimacji={atakujacy.typAnimacji}
          pociski={atakujacy.pociski}
          pociskUderzenia={atakujacy.pociskUderzenia}
          /*
           * Tarcza nalezy do OBRONCY: przy ciosie bohatera broni sie
           * potwor, przy ciosie potwora — bohater.
           */
          tarczaObroncy={
            biezacy.kto === BOHATER ? walka.potwor.tarczaObrazek : walka.gracz.tarczaObrazek
          }
          /*
            Obie aktualizacje ida przez funkcje i nigdy nie cofaja
            licznika — „Pomin" ustawia go od razu na koniec, wiec
            spozniony sygnal z poprzedniego ciosu ma go nie ruszyc.
          */
          onTrafienie={() => setZaliczonych((n) => Math.max(n, odgrywany + 1))}
          onKoniec={() => setOdgrywany((n) => Math.max(n, odgrywany + 1))}
        />
      )}

      {/*
        Przycisk „Pomin" stoi na dole, wysrodkowany — POS_FIGHT_BTN_Y = 710
        i `x = POS_SCREEN_TITLE_X - width/2`. Po walce w tym samym miejscu
        jest „OK".
      */}
      {!koniec && (
        <button
          type="button"
          className="przycisk drugi walka-przycisk"
          style={{
            left: WALKA_PRZYCISK.lewo,
            top: WALKA_PRZYCISK.gora,
            width: WALKA_PRZYCISK.szerokosc,
            minHeight: WALKA_PRZYCISK.wysokosc,
          }}
          onClick={pomin}
        >
          {PODPISY.pomin}
        </button>
      )}

      {koniec && (
        <>
          {/*
            Zdanie o wyniku — `LBL_FIGHT_SUMMARY`: `POS_FIGHT_SUMMARY_Y = 520`,
            szerokosc `SIZE_FIGHT_RESULT_TEXT_X = 490`, zawijane
            i WYSRODKOWANE (`FontFormat_Default` ma `align = "center"`),
            na `POS_SCREEN_TITLE_X = 770`.
          */}
          <div
            className="walka-wynik"
            style={{
              left: WALKA_SRODEK_X - WALKA_SZEROKOSC_PODSUMOWANIA / 2,
              top: WALKA_PODSUMOWANIE_Y,
              width: WALKA_SZEROKOSC_PODSUMOWANIA,
            }}
          >
            {zdanieWyniku}
          </div>

          {/*
            Zdobyty przedmiot — `CNT_FIGHT_SLOT` na
            (POS_SCREEN_TITLE_X - 45, POS_FIGHT_SLOT_Y), czyli ikona 90x90
            wysrodkowana pod zdaniem. Klik pokazuje te sama podpowiedz ze
            statystykami, co przedmiot w plecaku (`ItemPopup`).
          */}
          {zdobytyPrzedmiot && (
            <>
              <button
                type="button"
                className="walka-zdobycz"
                ref={ramkaZdobyczy}
                style={ramkaNaStyl(WALKA_ZDOBYCZ)}
                onClick={() => setPokazZdobycz((czy) => !czy)}
              >
                <img src={zdobytyPrzedmiot.obrazek} alt="" draggable={false} />
              </button>
              {pokazZdobycz && (
                <PodpowiedzPrzedmiotu
                  przedmiot={zdobytyPrzedmiot}
                  miejsce={miejsceZdobyczy()}
                  onZamknij={() => setPokazZdobycz(false)}
                />
              )}
            </>
          )}

          {nagroda && (
            <>
              {/*
                Doswiadczenie — `LBL_FIGHT_REWARDEXP` na
                (POS_FIGHT_REWARDEXP_X, POS_FIGHT_REWARDGOLD_Y),
                wyrownane do lewej: „Doswiadczenie: N".
              */}
              {nagroda.doswiadczenie > 0 && (
                <div
                  className="walka-nagroda doswiadczenie zPremia"
                  style={{ left: WALKA_DOSWIADCZENIE_X, top: WALKA_PIENIADZE_Y }}
                  onClick={() => przelacz('exp')}
                >
                  {/*
                    Podpis skrocony do „EXP" — SWIADOME ODSTEPSTWO, patrz
                    tabela w CLAUDE.md. Dluzsze slowo zjadalo miejsce
                    liczbie i ikonie zdobyczy.
                  */}
                  {PODPISY.doswiadczenieKrotko}:{' '}
                  {premiaDoswiadczenia > 0 && <ZnaczekPremii />}
                  {liczba(nagroda.doswiadczenie)}
                </div>
              )}

              {/*
                Grzyby i pieniadze skladaja sie od PRAWEJ do lewej, obie
                grupy konczac sie na `POS_FIGHT_REWARDGOLD_X = 1000`.
                Grzyby stoja wierszem wyzej (`POS_FIGHT_REWARDMUSH_Y`).
              */}
              {nagroda.grzyby > 0 && (
                <div
                  className="walka-nagroda kwota"
                  style={{ right: SZEROKOSC_EKRANU_GRY - WALKA_NAGRODY_PRAWA, top: WALKA_GRZYBY_Y }}
                >
                  {nagroda.grzyby}
                  <img src="/res/sfgame/if/icon_pilz.png" alt="grzybów" />
                </div>
              )}

              {nagroda.zloto > 0 && (
                <div
                  className="walka-nagroda kwota zPremia"
                  style={{
                    right: SZEROKOSC_EKRANU_GRY - WALKA_NAGRODY_PRAWA,
                    top: WALKA_PIENIADZE_Y,
                  }}
                  onClick={() => przelacz('zloto')}
                >
                  {premiaZlota > 0 && <ZnaczekPremii />}
                  {/*
                    Samo ZLOTO. Srebro (koncowka ponizej stu) schodzi do
                    okienka — SWIADOME ODSTEPSTWO, patrz tabela w CLAUDE.md.
                    Nie mowi nic wartego miejsca, ktore zjadalo, a przy
                    dlugiej kwocie wchodzilo na ikone zdobyczy.
                  */}
                  {liczba(Math.floor(nagroda.zloto / 100))}
                  <img src="/res/sfgame/if/icon_gold.png" alt="złota" />
                </div>
              )}
            </>
          )}

          {/*
            Rozpisanie nagrody. Doswiadczenie i pieniadze maja OSOBNE
            okienka; kazde staje NAD swoim wierszem, zeby nie zaslonic
            przycisku „OK". Zloto premie ma tylko w lochu — przy wyprawie
            podbite jest samo doswiadczenie (`finishQuest` w `req.php`).
          */}
          {otwartaNagroda && nagroda && (
            <OknoNagrody
              rodzaj={otwartaNagroda}
              wartosc={otwartaNagroda === 'exp' ? nagroda.doswiadczenie : nagroda.zloto}
              /*
                Zloto ma swoje premie: rzadkie zadanie go nie dotyczy.
                Loch nie odsyla osobnej listy, bo tam premia jest jedna
                i podbija obie nagrody — wtedy zloto dziedziczy `premie`.
              */
              premie={
                otwartaNagroda === 'exp'
                  ? rozliczenie.premie
                  : (rozliczenie.premieZlota ?? rozliczenie.premie)
              }
              lewo={
                otwartaNagroda === 'exp'
                  ? WALKA_DOSWIADCZENIE_X
                  : WALKA_NAGRODY_PRAWA - SZEROKOSC_OKNA_NAGRODY
              }
              gora={
                WALKA_PIENIADZE_Y - wysokoscOknaNagrody(otwartaNagroda, rozliczenie.premie) - 8
              }
              onZamknij={() => setOtwartaNagroda(null)}
            />
          )}

          {plecakBylPelny && (
            <div
              className="walka-nagroda ostrzezenie"
              style={{
                left: WALKA_SRODEK_X - WALKA_SZEROKOSC_PODSUMOWANIA / 2,
                top: WALKA_GRZYBY_Y,
                width: WALKA_SZEROKOSC_PODSUMOWANIA,
              }}
            >
              Nagroda przepadła — plecak był pełny.
            </div>
          )}

          {/*
            Awans stoi PONIZEJ ramki z podsumowaniem, wlasnym elementem
            poza przeplywem — inaczej podskok zaslanialby zdanie o walce.
            Animacja siega trzykrotnej skali i 40 px w gore, wiec musi
            miec miejsce dla siebie.
          */}
          {awans !== null && (
            <div className="walka-awans" style={{ left: WALKA_SRODEK_X, top: WALKA_AWANS_Y }}>
              <span>Nowy poziom: {awans}!</span>
            </div>
          )}

          {/* „OK" staje dokladnie tam, gdzie przed chwila bylo „Pomin". */}
          <button
            type="button"
            className="przycisk drugi walka-przycisk"
            style={{
              left: WALKA_PRZYCISK.lewo,
              top: WALKA_PRZYCISK.gora,
              width: WALKA_PRZYCISK.szerokosc,
              minHeight: WALKA_PRZYCISK.wysokosc,
            }}
            onClick={onZamknij}
          >
            OK
          </button>
        </>
      )}
    </div>
  );
}

function ramkaNaStyl(r: Ramka): React.CSSProperties {
  return { left: r.lewo, top: r.gora, width: r.szerokosc, height: r.wysokosc };
}

/**
 * Jedna strona pojedynku: portret w ozdobnej ramce, imie z poziomem,
 * pasek zycia i pieciowierszowa tabelka cech.
 */
function Strona({
  strona,
  nazwa,
  poziom,
  cechy,
  zycie,
  zycieMaks,
  portret,
  pasek,
  podpis,
  ramkaStatow,
  kolumny,
  obraz,
}: {
  strona: 'lewa' | 'prawa';
  nazwa: string;
  poziom: number;
  cechy: CechyWalki;
  zycie: number;
  zycieMaks: number;
  portret: Ramka;
  pasek: Ramka;
  podpis: Ramka;
  ramkaStatow: Ramka;
  kolumny: number[];
  obraz: React.ReactNode;
}) {
  const udzial = Math.max(0, Math.min(1, zycie / Math.max(1, zycieMaks)));

  return (
    <>
      <div className={`walka-portret ${strona}`} style={ramkaNaStyl(portret)}>
        {obraz}
      </div>

      {/* `character_border.png` ma 320x320 — o 10 px wieksza z kazdej strony. */}
      <img
        className="walka-ramka"
        style={{
          left: portret.lewo - WALKA_RAMKA_PORTRETU,
          top: portret.gora - WALKA_RAMKA_PORTRETU,
          width: portret.szerokosc + 2 * WALKA_RAMKA_PORTRETU,
          height: portret.wysokosc + 2 * WALKA_RAMKA_PORTRETU,
        }}
        src={OBRAZ_RAMKI_PORTRETU}
        alt=""
      />

      <div className="walka-podpis" style={ramkaNaStyl(podpis)}>
        {nazwa} (Poz. {poziom})
      </div>

      <img className="walka-ramka" style={ramkaNaStyl(pasek)} src={OBRAZ_PASKA_ZYCIA} alt="" />
      <div
        className="walka-zycie-wypelnienie"
        style={{
          left: pasek.lewo + 10,
          top: pasek.gora + 8,
          width: Math.round(udzial * (pasek.szerokosc - 20)),
          height: pasek.wysokosc - 16,
          backgroundImage: `url('${OBRAZ_WYPELNIENIA_ZYCIA}')`,
        }}
      />
      <div className="walka-zycie-napis" style={{ left: pasek.lewo, top: pasek.gora + 5, width: pasek.szerokosc }}>
        {liczba(Math.max(0, Math.round(zycie)))}
      </div>

      <img className="walka-ramka" style={ramkaNaStyl(ramkaStatow)} src={OBRAZ_RAMKI_STATOW} alt="" />

      {WIERSZE_CECH.map((wiersz, i) => (
        <span key={wiersz.klucz}>
          <span className="walka-cecha" style={{ left: kolumny[0], top: WALKA_STATY_Y + i * WALKA_ODSTEP_STATOW }}>
            {wiersz.nazwa}
          </span>
          <span className="walka-cecha" style={{ left: kolumny[1], top: WALKA_STATY_Y + i * WALKA_ODSTEP_STATOW }}>
            {liczba(cechy[wiersz.klucz])}
          </span>
        </span>
      ))}
    </>
  );
}

/**
 * Stan animacji ciosu — nazwy zmiennych jak w `StrikeAniTimerEvent`.
 */
interface StanCiosu {
  /** `strikePhase`: 0 zamach, 1 dolot, 2 gasniecie. */
  faza: number;
  /** `strikeVal`: 0 na poczatku zamachu, 1 w chwili trafienia. */
  s: number;
  /** `StrikeAlpha` — przezroczystosc broni. */
  aBron: number;
  /** `ShieldAlpha` — tarcza obroncy. */
  aTarcza: number;
  /** `DamageAlpha` — liczba obrazen. */
  aObrazen: number;
  /** `BulletAlpha` — pocisk broni dystansowej. */
  aPocisk: number;
  /** `OnoAlpha` i skala wybuchu przy trafieniu. */
  aOno: number;
  skalaOno: number;
  /** Napis z obrazeniami wedruje w gore po 2 px na tik. */
  yObrazen: number;
  widacObrazenia: boolean;
}

const POCZATEK_CIOSU: StanCiosu = {
  faza: 0,
  s: 0,
  aBron: 1,
  aTarcza: 0,
  aObrazen: 0,
  aPocisk: 0,
  aOno: 0,
  skalaOno: 0.6,
  yObrazen: 0,
  widacObrazenia: false,
};

/**
 * Jeden tik zegara — przepisany `switch (weaponType)` i `switch (strikePhase)`
 * z klienta.
 *
 * Kazdy typ broni ma wlasne progi i wlasny krok `strikeVal`, wiec i wlasna
 * dlugosc ciosu:
 *
 *   bron biala, lekka (pazur, machniecie)   2 + 3 + 14 tikow   760 ms
 *   bron biala, ciezka (ikona broni)        8 + 2 + 14         960 ms
 *   rozdzka maga                            3 + 4 + 14         840 ms
 *   luk i kusza                             6 + 7 + 14        1080 ms
 *
 * Do tego 200 ms przerwy `DoStrikeTimer` miedzy ciosami.
 */
function tikCiosu(st: StanCiosu, galaz: Galaz, blok: boolean): StanCiosu {
  const n = { ...st };

  if (n.faza === 0) {
    n.s += galaz.krokZamachu;
    if (blok && n.s >= galaz.progTarczy) n.aTarcza = 1;
    if (n.s >= galaz.progFazy) n.faza = 1;
    // Belt jest widoczny od pierwszego tiku, kula dopiero po zamachu.
    if (galaz.pociskOdRazu) n.aPocisk = 1;
    else if (n.faza === 1) n.aPocisk = 1;
    return n;
  }

  if (n.faza === 1) {
    n.s += galaz.krokDolotu;
    if (blok && n.s >= galaz.progTarczy) n.aTarcza = 1;
    if (n.s >= 1) {
      n.s = 1;
      n.faza = 2;
      n.widacObrazenia = true;
      n.aObrazen = 1;
      if (galaz.zWybuchem) {
        n.aOno = 1;
        n.skalaOno = galaz.skalaOno;
      }
    }
    return n;
  }

  n.aObrazen = Math.max(0, n.aObrazen - 0.075);
  n.aBron = Math.max(0, n.aBron - 0.2);
  n.aTarcza = Math.max(0, n.aTarcza - 0.2);
  n.aPocisk = Math.max(0, n.aPocisk - 0.2);
  if (n.aOno > 0) {
    n.skalaOno += galaz.przyrostOno;
    n.aOno = Math.max(0, n.aOno - 0.2);
  }
  n.yObrazen -= 2;
  return n;
}

/**
 * Parametry jednej galezi animacji, wyjete z `StrikeAniTimerEvent`.
 *
 * `progTarczy` rozni sie miedzy galeziami: bron biala lekka podnosi
 * tarcze przy `strikeVal >= 0.4`, cala reszta przy `>= 0.5`.
 */
interface Galaz {
  krokZamachu: number;
  krokDolotu: number;
  progFazy: number;
  progTarczy: number;
  zWybuchem: boolean;
  skalaOno: number;
  przyrostOno: number;
  pociskOdRazu: boolean;
  /**
   * Kiedy odzywa sie zamach.
   *
   * `naStarcie` to bron biala — `if (strikeVal == 0) Play(..., 0)`, czyli
   * przy pierwszym tiku. Bron dystansowa czeka do konca zamachu: mag do
   * `strikeVal >= 0.4`, zwiadowca do `>= 0.3` — tam, gdzie klient wola
   * `Play` razem z pokazaniem pocisku.
   */
  zamachNaStarcie: boolean;
}

function galazAnimacji(typAnimacji: number, lekki: boolean): Galaz {
  if (typAnimacji === 2) {
    return { krokZamachu: 0.15, krokDolotu: 0.15, progFazy: 0.4, progTarczy: 0.5,
             zWybuchem: true, skalaOno: onoSkalaPoczatkowa(2), przyrostOno: onoPrzyrostSkali(2),
             pociskOdRazu: false, zamachNaStarcie: false };
  }
  if (typAnimacji === 3) {
    return { krokZamachu: 0.05, krokDolotu: 0.1, progFazy: 0.3, progTarczy: 0.5,
             zWybuchem: true, skalaOno: onoSkalaPoczatkowa(3), przyrostOno: onoPrzyrostSkali(3),
             pociskOdRazu: true, zamachNaStarcie: false };
  }
  if (lekki) {
    // Galaz lekka nie ma wybuchu — klient ustawia `CNT_FIGHT_ONO` tylko
    // w galezi ciezkiej i dystansowej.
    return { krokZamachu: 0.2, krokDolotu: 0.2, progFazy: 0.4, progTarczy: 0.4,
             zWybuchem: false, skalaOno: 0, przyrostOno: 0, pociskOdRazu: false,
             zamachNaStarcie: true };
  }
  return { krokZamachu: 0.1, krokDolotu: 0.15, progFazy: 0.8, progTarczy: 0.5,
           zWybuchem: true, skalaOno: onoSkalaPoczatkowa(1), przyrostOno: onoPrzyrostSkali(1),
           pociskOdRazu: false, zamachNaStarcie: true };
}

/**
 * Jeden cios — port `WeaponStrike()`.
 *
 * O tym, co poleci przez ekran, decyduje `typAnimacji` (`charWeaponType`
 * w oryginale): bron biala leci sama, mag posyla kule, zwiadowca belt.
 * Po stronie obroncy staje tarcza, kiedy flaga ciosu ma wartosc 1,
 * a przy ciosie zwyklym i krytycznym trafienie wybucha. Wszystkie
 * polozenia licza sie ze `strikeVal` tymi samymi wzorami, co w kliencie.
 */
function Cios({
  kto,
  rodzaj,
  obrazenia,
  bron,
  bronObrazek,
  typAnimacji,
  pociski,
  pociskUderzenia,
  tarczaObroncy,
  onTrafienie,
  onKoniec,
}: {
  kto: number;
  rodzaj: number;
  obrazenia: number;
  bron: number;
  bronObrazek: string | null;
  typAnimacji: 1 | 2 | 3;
  pociski: string[];
  pociskUderzenia: string | null;
  tarczaObroncy: string | null;
  onTrafienie: () => void;
  onKoniec: () => void;
}) {
  const odBohatera = kto === BOHATER;
  const lekki = typAnimacji === 1 && lekkiCios(bron);
  const blok = rodzaj === 1;
  const krytyczny = rodzaj === 3;
  /*
   * Parametry galezi musza byc STALE miedzy renderami — zegar ciosu
   * trzyma je w zaleznosciach `useEffect`. Swiezy obiekt co render
   * kasowalby i zakladal zegar na nowo, wiec `strikeVal` nigdy nie
   * ruszalby dalej niz pierwszy tik.
   */
  const galaz = useMemo(() => galazAnimacji(typAnimacji, lekki), [typAnimacji, lekki]);

  const [stan, setStan] = useState({ ...POCZATEK_CIOSU, skalaOno: galaz.skalaOno });

  /*
   * Wybuch przy trafieniu.
   *
   * Bron biala losuje jedna z szesciu klatek „SMASH"
   * (`int(Math.random() * 6)`), a dystansowa ma swoja: mag czwarty
   * wariant wlasnego pocisku, zwiadowca `arrowsmash.png`.
   */
  const [ono] = useState(
    () =>
      pociskUderzenia ??
      (KLATKI_UDERZENIA[Math.floor(Math.random() * KLATKI_UDERZENIA.length)] as string),
  );

  /*
   * Klatka kuli maga. Klient przelacza ja co tik
   * (`GetArrowID(..., int(Math.random() * 3))`), wiec kula pulsuje.
   * Przy broni epickiej wszystkie trzy warianty wskazuja ten sam plik
   * i pulsowania po prostu nie widac.
   */
  const [klatkaPocisku, setKlatkaPocisku] = useState(0);

  const trafienie = useRef(onTrafienie);
  const koniec = useRef(onKoniec);
  trafienie.current = onTrafienie;
  koniec.current = onKoniec;

  useEffect(() => {
    let biezacy = { ...POCZATEK_CIOSU, skalaOno: galaz.skalaOno };
    let dobity = false;
    let przerwa: ReturnType<typeof setTimeout> | undefined;

    const { klasa, obrazek } = bronDoDzwieku(bron);
    const probka = (uzycie: UzycieBroni) => plikDzwiekuBroni(klasa, obrazek, uzycie);

    // Bron biala zamachuje sie od razu, dystansowa dopiero po zamachu.
    if (galaz.zamachNaStarcie) zagraj(probka('zamach'));

    const zegar = setInterval(() => {
      const poprzedniaFaza = biezacy.faza;
      biezacy = tikCiosu(biezacy, galaz, blok);
      setStan(biezacy);
      if (typAnimacji === 2) setKlatkaPocisku(Math.floor(Math.random() * 3));

      if (!galaz.zamachNaStarcie && poprzedniaFaza === 0 && biezacy.faza === 1) {
        zagraj(probka('zamach'));
      }

      // Wejscie w faze 2 to chwila trafienia — wtedy spadaja paski zycia.
      if (poprzedniaFaza === 1 && biezacy.faza === 2) {
        trafienie.current();
        /*
         * Odglos trafienia zalezy od rodzaju ciosu:
         *
         *     "-0" i flaga 1  -> blok   (`useCase` 2)
         *     "-0" i unik     -> cisza, oryginal nic nie gra
         *     krytyk          -> `useCase` 3
         *     zwykly          -> `useCase` 1
         */
        if (rodzaj === 1) zagraj(probka('blok'));
        else if (rodzaj !== 2) zagraj(probka(rodzaj === 3 ? 'krytyk' : 'trafienie'));
      }

      if (biezacy.faza === 2 && biezacy.aObrazen <= 0 && !dobity) {
        dobity = true;
        clearInterval(zegar);
        przerwa = setTimeout(() => koniec.current(), PRZERWA_MIEDZY_CIOSAMI);
      }
    }, TIK);

    /*
     * Sprzatamy OBA zegary.
     *
     * Zapomniana `przerwa` byla powodem, dla ktorego walka po nacisnieciu
     * „Pomin" na chwile wracala do zycia: cios konczyl sie tuz przed
     * kliknieciem, zostawial 200-milisekundowy `setTimeout`, a ten juz po
     * pominieciu wolal `onKoniec()` i cofal licznik ciosow.
     */
    return () => {
      clearInterval(zegar);
      if (przerwa) clearTimeout(przerwa);
    };
  }, [galaz, blok, typAnimacji, bron, rodzaj]);

  return (
    <>
      {typAnimacji === 1 && lekki && (
        <BronLekka bron={bron} odBohatera={odBohatera} blok={blok} stan={stan} />
      )}
      {typAnimacji === 1 && !lekki && (
        <BronCiezka
          bron={bron}
          bronObrazek={bronObrazek}
          odBohatera={odBohatera}
          blok={blok}
          krytyczny={krytyczny}
          stan={stan}
        />
      )}
      {typAnimacji === 2 && (
        <Rozdzka
          bronObrazek={bronObrazek}
          odBohatera={odBohatera}
          stan={stan}
          pocisk={pociski[klatkaPocisku] ?? pociski[0] ?? null}
        />
      )}
      {typAnimacji === 3 && (
        <Luk
          bronObrazek={bronObrazek}
          odBohatera={odBohatera}
          blok={blok}
          stan={stan}
          pocisk={pociski[0] ?? null}
        />
      )}

      {/*
        Tarcza obroncy. `visible = (opponent ? oppFlag : charFlag) == 1`,
        skala 1.5, odbita lustrzanie po stronie potwora.
      */}
      {blok && tarczaObroncy && stan.aTarcza > 0 && (
        <img
          className="walka-tarcza"
          src={tarczaObroncy}
          alt=""
          style={{
            left: tarczaX(odBohatera, stan.s, !lekki) - (90 * WALKA_SKALA_SPRITE) / 2,
            top: tarczaY(stan.s) - (90 * WALKA_SKALA_SPRITE) / 2,
            width: 90 * WALKA_SKALA_SPRITE,
            height: 90 * WALKA_SKALA_SPRITE,
            opacity: stan.aTarcza,
            transform: odBohatera ? 'scaleX(-1)' : undefined,
          }}
        />
      )}

      {/* Wybuch trafienia — klient chowa go przy bloku i uniku. */}
      {galaz.zWybuchem && (rodzaj === 0 || rodzaj === 3) && stan.aOno > 0 && (
        <img
          className="walka-ono"
          src={ono}
          alt=""
          style={{
            left: onoX(odBohatera, typAnimacji),
            top: onoY(typAnimacji),
            opacity: stan.aOno,
            transform: `translate(-50%, -50%) scale(${
              typAnimacji === 3 && !odBohatera ? -stan.skalaOno : stan.skalaOno
            }, ${stan.skalaOno})`,
          }}
        />
      )}

      {stan.widacObrazenia && (
        <div
          className={`walka-obrazenia${krytyczny ? ' krytyk' : ''}`}
          style={{
            top: WALKA_OBRAZENIA_Y + stan.yObrazen,
            left: WALKA_SRODEK_X + (odBohatera ? 1 : -1) * WALKA_OBRAZENIA_ODSTEP - 200,
            opacity: stan.aObrazen,
          }}
        >
          {NAZWY_CIOSOW[rodzaj] ?? `-${liczba(obrazenia)}`}
        </div>
      )}
    </>
  );
}

/**
 * Galaz maga: rozdzka zostaje w rece i sie kolysze, a kula leci i rosnie.
 *
 * Rozdzka ma obrazek przesuniety o (30, -30) — inaczej niz bron biala,
 * ktora ma (-30, -30). Kula nie jest srodkowana wcale: jej lewy gorny
 * rog stoi w punkcie kontenera, a `y` odejmuje polowe JUZ PRZESKALOWANEJ
 * wysokosci, wiec srodek kuli trzyma sie stalej wysokosci.
 */
function Rozdzka({
  bronObrazek,
  odBohatera,
  stan,
  pocisk,
}: {
  bronObrazek: string | null;
  odBohatera: boolean;
  stan: StanCiosu;
  pocisk: string | null;
}) {
  const znak = odBohatera ? 1 : -1;

  return (
    <>
      {bronObrazek && (
        <div
          className="walka-bron-ciezka"
          style={{
            left: rozdzkaX(odBohatera),
            top: WALKA_ROZDZKA_Y,
            opacity: stan.aBron,
            transform: `rotate(${rozdzkaObrot(odBohatera, stan.s)}deg) scale(${znak * WALKA_SKALA_SPRITE}, ${WALKA_SKALA_SPRITE})`,
          }}
        >
          <img
            src={bronObrazek}
            alt=""
            width={90}
            height={90}
            style={{ left: WALKA_ROZDZKA_OFFSET_X - 45, top: -30 - 45 }}
          />
        </div>
      )}

      {pocisk && stan.aPocisk > 0 && (
        <div
          className="walka-pocisk"
          style={{
            left: kulaX(odBohatera, stan.s),
            top: WALKA_KULA_Y,
            opacity: stan.aPocisk,
            transform: `scale(${znak * stan.s * 2}, ${stan.s * 2}) translateY(-50%)`,
          }}
        >
          <img src={pocisk} alt="" />
        </div>
      )}
    </>
  );
}

/**
 * Galaz zwiadowcy: luk stoi przechylony przy strzelajacym, belt rusza
 * dopiero po `strikeVal > 0.3` i leci 400 px, obracajac sie po drodze.
 *
 * Ani luk, ani belt nie sa srodkowane — `SetCnt` bez zadnych offsetow
 * stawia ich lewy gorny rog w punkcie kontenera.
 */
function Luk({
  bronObrazek,
  odBohatera,
  blok,
  stan,
  pocisk,
}: {
  bronObrazek: string | null;
  odBohatera: boolean;
  blok: boolean;
  stan: StanCiosu;
  pocisk: string | null;
}) {
  const znak = odBohatera ? 1 : -1;

  return (
    <>
      {bronObrazek && (
        <div
          className="walka-bron-ciezka"
          style={{
            left: lukX(odBohatera),
            top: WALKA_LUK_Y,
            opacity: stan.aBron,
            transform: `rotate(${lukObrot(odBohatera)}deg) scale(${znak * WALKA_SKALA_SPRITE}, ${WALKA_SKALA_SPRITE})`,
          }}
        >
          <img src={bronObrazek} alt="" width={90} height={90} style={{ left: 0, top: 0 }} />
        </div>
      )}

      {pocisk && stan.aPocisk > 0 && (
        <div
          className="walka-pocisk"
          style={{
            left: beltX(odBohatera, Math.max(0.05, stan.s), blok),
            top: WALKA_BELT_Y,
            opacity: stan.aPocisk,
            transform: `rotate(${beltObrot(odBohatera, stan.s)}deg) scale(${znak}, 1)`,
          }}
        >
          <img src={pocisk} alt="" />
        </div>
      )}
    </>
  );
}

/**
 * Galaz lekka: plaska klatka postawiona przy celu.
 *
 * `scaleY = 1` — bez `SPRITE_SCALE` — a punkt zaczepienia to LEWY GORNY
 * rog obrazka, bo klient wola tu `SetCnt` bez srodkowania. Bohaterowi
 * obrazek odbija sie w poziomie, potworowi nie.
 */
function BronLekka({
  bron,
  odBohatera,
  blok,
  stan,
}: {
  bron: number;
  odBohatera: boolean;
  blok: boolean;
  stan: StanCiosu;
}) {
  const klatki = klatkiLekkiegoCiosu(bron);
  const mnoznik = bron === -1 ? 3.9 : 2.9;
  const numer = Math.min(klatki.length - 1, Math.max(0, Math.floor(stan.s * mnoznik)));

  return (
    <img
      className="walka-bron-lekka"
      src={klatki[numer] as string}
      alt=""
      style={{
        left: bronLekkaX(odBohatera, blok),
        top: WALKA_BRON_LEKKA_Y,
        opacity: stan.aBron,
        transform: odBohatera ? 'scaleX(-1)' : undefined,
      }}
    />
  );
}

/**
 * Galaz ciezka: ikona broni leci lukiem i obraca sie po drodze.
 *
 * Kontener stoi w punkcie `(x, y)`, a obrazek 90x90 wisi w nim ze
 * srodkiem w `(-30, -30)` — dokladnie tak, jak ustawia to
 * `SetCnt(CNT_WEAPON_CHAR, ..., -30, -30, true)`. Obrot i skala licza
 * sie wzgledem punktu kontenera, nie srodka obrazka, i to wlasnie daje
 * ten charakterystyczny zamach.
 */
function BronCiezka({
  bron,
  bronObrazek,
  odBohatera,
  blok,
  krytyczny,
  stan,
}: {
  bron: number;
  bronObrazek: string | null;
  odBohatera: boolean;
  blok: boolean;
  krytyczny: boolean;
  stan: StanCiosu;
}) {
  const skalaX = (odBohatera ? -1 : 1) * WALKA_SKALA_SPRITE;

  return (
    <div
      className="walka-bron-ciezka"
      style={{
        left: bronCiezkaX(odBohatera, blok, stan.s),
        top: bronCiezkaY(stan.s, krytyczny),
        opacity: stan.aBron,
        transform: `rotate(${bronCiezkaObrot(odBohatera, stan.s)}deg) scale(${skalaX}, ${WALKA_SKALA_SPRITE})`,
      }}
    >
      <img src={obrazCiezkiegoCiosu(bron, bronObrazek)} alt="" width={90} height={90} />
    </div>
  );
}
