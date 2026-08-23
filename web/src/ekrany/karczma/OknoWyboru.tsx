/**
 * Okno wyboru zadania.
 *
 * Uklad ze stalych `POS_QO_*` i `REL_QO_*` klienta Flash: przydymiona
 * plansza 740x440 w punkcie (410, 230), portret rozdajacego po lewej,
 * opis wyprawy po prawej, trzy wybory u dolu i nagrody obok nich.
 */

import { useState } from 'react';
import { PodpowiedzPrzedmiotu } from '../../gra/PodpowiedzPrzedmiotu';
import { lacznaPremia } from '../../gra/premie';
import {
  OknoNagrody,
  wysokoscOknaNagrody,
  type RodzajNagrody,
} from '../../gra/OknoNagrody';
import { KRAINY, PODPISY } from '../../gra/karczma-teksty';
import { nazwaWierzchowca, zyskZWierzchowca } from '../../gra/stajnia';
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
  OKNO_PRZEDMIOT,
  PORTRETY_ZADAN,
  czas,
  tytulWyprawy,
} from '../../gra/karczmaUklad';
import type { Gracz, StanKarczmy, Zadanie } from '../../gra/typy';
import { liczba } from '../../gra/liczby';

/** Nazwa krainy, w ktora wysyla zadanie — `quest_location_N` liczy od jedynki. */
export function kraina(lokacja: number): string {
  return KRAINY[Math.max(0, Math.min(KRAINY.length - 1, lokacja - 1))] ?? '';
}

/**
 * Jedna jednostka dlugosci zadania to piec minut — `quest_dur * 300`.
 * Wierzchowiec dopiero to skraca, wiec z dlugosci wychodzi czas
 * „na piechote".
 */
const SEKUND_NA_JEDNOSTKE = 300;

/** O ile procent skraca wyprawe kazdy wierzchowiec — `mountMultiplier()`. */
const SKROCENIE: Record<number, number> = { 1: 10, 2: 20, 3: 30, 4: 50 };

/**
 * Znaczek przy nagrodzie, ktora jest podbita premia.
 *
 * Oryginal nie oznacza jej niczym — po prostu podwiesza podpowiedz
 * (`EnablePopup(LBL_QO_REWARDEXP, ...)`), a na dotyku nie ma czego
 * najezdzac. Wlasciciel gry poprosil o widoczny znak; bierzemy na to
 * strzalke w gore z oryginalu (`btnClassArrowUp`).
 */
const ZNACZEK_PREMII = '/res/ui/strzalka-gora.png';

export function OknoWyboru({
  stan,
  gracz,
  wariant,
  onWyrusz,
  onZamknij,
}: {
  stan: StanKarczmy;
  gracz: Gracz;
  wariant: number;
  onWyrusz: (numer: number) => void;
  onZamknij: () => void;
}) {
  const [wybrane, setWybrane] = useState<Zadanie | null>(stan.zadania[0] ?? null);
  const [pokazanyPrzedmiot, setPokazanyPrzedmiot] = useState(false);
  /*
   * Ktora nagroda ma otwarte rozpisanie. Doswiadczenie i pieniadze maja
   * OSOBNE okienka — to samo, co na ekranie po walce.
   */
  const [otwartaNagroda, setOtwartaNagroda] = useState<RodzajNagrody | null>(null);
  const przelacz = (co: RodzajNagrody) => setOtwartaNagroda((s) => (s === co ? null : co));
  const [pokazanyCzas, setPokazanyCzas] = useState(false);
  if (!wybrane) return null;

  const zaKrotkaWytrzymalosc = stan.wytrzymalosc < wybrane.sekundy;

  /*
   * Ile procent doswiadczenia dokladaja premie. `req.php` liczy je
   * osobno i dodaje do jedynki:
   *
   *     $exp = quest_exp * ($ebonus + $albumbonus + $rqbonus);
   *
   * Premii gildii jeszcze nie ma czym wypelnic, wiec zostaja dwie:
   * klaser i rzadkie zadanie.
   */
  /*
   * Kazda nagroda ma swoje premie i swoj znaczek. Zlota nie podbija na
   * razie nic (patrz `zlotoZWyprawy()` na serwerze), wiec strzalka przy
   * nim sie nie pojawia — pojawi sie sama, gdy dojda gildia i wieza.
   */
  const premiaDoswiadczenia = wybrane.premie.klaser + wybrane.premie.rzadkie;
  const premiaZlota = lacznaPremia(wybrane.premieZlota);

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

      {/*
        Naglowek to TYTUL wyprawy, a nie staly napis — tak jak
        `LBL_QO_QUESTNAME` w oryginale, wysrodkowany w punkcie
        REL_QO_QUESTNAME_X = 480.
      */}
      <div
        className="karczma-okno-naglowek"
        style={{ left: OKNO_NAGLOWEK.lewo - OKNO.lewo, top: OKNO_NAGLOWEK.gora - OKNO.gora }}
      >
        {tytulWyprawy(wybrane) || PODPISY.wybierzZadanie}
      </div>

      <div
        className="karczma-okno-opis"
        style={{
          left: OKNO_OPIS.lewo - OKNO.lewo,
          top: OKNO_OPIS.gora - OKNO.gora,
          width: OKNO_OPIS.szerokosc,
        }}
      >
        {/*
          DO PRZENIESIENIA: oryginal sklada tu cale zdanie z kilku
          czesci (`GetQuestText`) — cytat zleceniodawcy, nazwa krainy
          i tresc zadania, kazda z osobnego zakresu pliku jezykowego.
          Na razie stoi sama nazwa krainy, ktora jest najwazniejsza.
        */}
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
          {/*
            Na liscie stoi TYTUL wyprawy — `LBL_QO_CHOICE1.text =
            GetQuestTitle(i)` w oryginale. Nazwa krainy jest dluga i jej
            miejsce jest w opisie obok, nie tutaj.
          */}
          {tytulWyprawy(zadanie) || kraina(zadanie.lokacja)}
        </button>
      ))}

      {/* --- co z tego bedzie --- */}
      {/*
        Cztery wiersze w jednej kolumnie, co 40 px — jak w oryginale:
        napis „Wynagrodzenie", zloto ze srebrem, doswiadczenie, czas.
      */}
      {[
        <>{PODPISY.wynagrodzenie}</>,
        /*
          Pieniadze. Na ekranie stoi samo ZLOTO — srebro (koncowka ponizej
          stu) schodzi do okienka, tak samo jak po walce. SWIADOME
          ODSTEPSTWO, patrz tabela w CLAUDE.md.
        */
        <button type="button" className="karczma-premia" onClick={() => przelacz('zloto')}>
          {premiaZlota > 0 && <img className="skacze" src={ZNACZEK_PREMII} alt="z premią" />}
          {liczba(Math.floor(wybrane.zloto / 100))}
          <img src="/res/sfgame/if/icon_gold.png" alt="złota" />
        </button>,
        /*
          Doswiadczenie. Liczba jest juz Z PREMIAMI — tak samo podaje ja
          `req.php` (`round(quest_exp * ($ebonus + $albumbonus + $rqbonus))`).
          Klikniecie rozpisuje, ile z tego dokłada klaser i rzadkie
          zadanie — to samo mowi podpowiedz w oryginale.
        */
        <button type="button" className="karczma-premia" onClick={() => przelacz('exp')}>
          {/* „EXP", nie pelne slowo — SWIADOME ODSTEPSTWO, patrz CLAUDE.md. */}
          {PODPISY.doswiadczenieKrotko}: {liczba(wybrane.doswiadczenie)}
          {premiaDoswiadczenia > 0 && (
            <img className="skacze" src={ZNACZEK_PREMII} alt="z premią" />
          )}
        </button>,
        /*
          Czas trwania. Klikniecie pokazuje, ile wyprawa zajelaby PIESZO
          i o ile skraca ja wierzchowiec — tego w oryginale nie ma
          (patrz tabela odstepstw w CLAUDE.md), ale sama liczba nie mowi
          nic o tym, za co sie placi najem.
        */
        <button
          type="button"
          className="karczma-czas-wyprawy"
          onClick={() => setPokazanyCzas((czy) => !czy)}
        >
          {PODPISY.czasTrwania}: {czas(wybrane.sekundy)}
        </button>,
      ].map((tresc, i) => (
        <div
          key={i}
          className="karczma-nagrody"
          style={{
            left: OKNO_NAGRODY.lewo - OKNO.lewo,
            top: OKNO_NAGRODY.gora - OKNO.gora + i * ODSTEP_NAGROD,
            width: OKNO_NAGRODY.szerokosc,
          }}
        >
          {tresc}
        </div>
      ))}

      {/*
        Rozpisanie nagrody. Doswiadczenie ma premie (klaser, rzadkie
        zadanie) — tak samo, jak mowi o nich podpowiedz w oryginale:

            txt[TXT_EXPBONUS_PREFIX] + " " + SG_EXP_BONUS + "% " + txt[TXT_EXPBONUS_SUFFIX]
              + " + " + round((SG_ALBUM - 10000) / contentMax * 100) + "% " + txt[TXT_COLLECTION + 1]

        Pieniedzy przy wyprawie zadna premia nie dotyczy (`finishQuest`
        podbija samo doswiadczenie), wiec ich okienko podaje tylko zloto
        i srebro. Oba staja NAD swoim wierszem, zeby nie zaslonic przyciskow.
      */}
      {otwartaNagroda && (
        <OknoNagrody
          rodzaj={otwartaNagroda}
          wartosc={otwartaNagroda === 'exp' ? wybrane.doswiadczenie : wybrane.zloto}
          premie={otwartaNagroda === 'exp' ? wybrane.premie : wybrane.premieZlota}
          lewo={OKNO_NAGRODY.lewo - OKNO.lewo}
          gora={
            OKNO_NAGRODY.gora -
            OKNO.gora +
            (otwartaNagroda === 'exp' ? 2 : 1) * ODSTEP_NAGROD -
            wysokoscOknaNagrody(
              otwartaNagroda,
              otwartaNagroda === 'exp' ? wybrane.premie : wybrane.premieZlota,
            ) -
            8
          }
          onZamknij={() => setOtwartaNagroda(null)}
        />
      )}

      {/*
        Rozpisany czas wyprawy: ile trwalaby pieszo, ktory wierzchowiec
        ja skraca i o ile. Stoi tuz pod wierszem z czasem.
      */}
      {pokazanyCzas && (
        <div
          className="podpowiedz karczma-czas-podpowiedz"
          style={{
            left: OKNO_NAGRODY.lewo - OKNO.lewo,
            /*
             * NAD wierszem z czasem, zeby nie wyjsc poza ramke okna
             * (740x440) ani nie zaslonic przyciskow. Dwa wiersze pisma
             * po 26 px plus margines — tyle, ile ma `.podpowiedz`.
             */
            top: OKNO_NAGRODY.gora - OKNO.gora + 3 * ODSTEP_NAGROD - 84,
            width: 300,
          }}
        >
          <div>
            Pieszo: {czas(wybrane.dlugosc * SEKUND_NA_JEDNOSTKE)}
          </div>
          {stan.wierzchowiec > 0 && (
            <div>
              {nazwaWierzchowca(stan.wierzchowiec, gracz.rasa)}:{' '}
              {zyskZWierzchowca(SKROCENIE[stan.wierzchowiec] ?? 0)}
            </div>
          )}
        </div>
      )}

      {/*
        Przedmiot do zdobycia stoi w swoim miejscu (REL_QO_SLOT) jako
        zwykla ikona — klikniecie pokazuje ta sama podpowiedz, co
        w plecaku. Oryginal robi dokladnie to samo: `CNT_QUEST_SLOT`
        z `ItemPopup`.
      */}
      {wybrane.nagrodaPrzedmiotowa && (
        <button
          type="button"
          className={`karczma-nagroda-slot${stan.wolneMiejsceWPlecaku ? '' : ' przepadnie'}`}
          style={{
            left: OKNO_PRZEDMIOT.lewo - OKNO.lewo,
            top: OKNO_PRZEDMIOT.gora - OKNO.gora,
            width: OKNO_PRZEDMIOT.szerokosc,
            height: OKNO_PRZEDMIOT.wysokosc,
          }}
          title={
            stan.wolneMiejsceWPlecaku
              ? 'Do zdobycia — kliknij, żeby zobaczyć'
              : 'Plecak pełny — ta nagroda przepadnie'
          }
          onClick={() => setPokazanyPrzedmiot((p) => !p)}
        >
          <img src={wybrane.nagrodaPrzedmiotowa.obrazek} alt="" draggable={false} />
        </button>
      )}

      {pokazanyPrzedmiot && wybrane.nagrodaPrzedmiotowa && (
        <PodpowiedzPrzedmiotu
          przedmiot={wybrane.nagrodaPrzedmiotowa}
          miejsce={{
            x: OKNO_PRZEDMIOT.lewo - OKNO.lewo + OKNO_PRZEDMIOT.szerokosc / 2,
            y: OKNO_PRZEDMIOT.gora - OKNO.gora,
          }}
          onZamknij={() => setPokazanyPrzedmiot(false)}
        />
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
