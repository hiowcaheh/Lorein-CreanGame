/**
 * Karczma — ekran, na ktorym bierze sie wyprawy.
 *
 * Uklad wprost ze stalych `REL_TAVERNE_*` klienta Flash (patrz
 * `gra/karczmaUklad.ts`). Klikalne sa dwa miejsca: grupa przy stole
 * rozdaje zadania, karczmarz za barem nalewa piwo.
 *
 * CZAS JEST SERWEROWY. Odpowiedz podaje `koniec` i `teraz` w zegarze
 * serwera; klient zapamietuje roznice wobec swojego zegara i odlicza od
 * niej. Przestawienie zegarka w telefonie niczego nie zmienia, bo i tak
 * dopiero serwer rozlicza wyprawe.
 */

import { useEffect, useRef, useState } from 'react';
import { KRAINY, PODPISY } from '../gra/karczma-teksty';
import {
  GRUPA_ZADAN,
  KLATKI_GRUPY,
  KLATKI_KARCZMARZA,
  KLIK_BARU,
  KLIK_ZADANIA,
  KARCZMARZ,
  NAPIS_PASKA,
  OBRAZ_MRUGNIECIA,
  OBRAZ_PASKA,
  OBRAZ_PODSWIETLENIA_BARU,
  OBRAZ_SWIEC,
  OBRAZ_WYPELNIENIA,
  OCZY_NAGANIACZA,
  PASEK,
  PODSWIETLENIA_GRUPY,
  PODSWIETLENIE_BARU,
  SWIECE,
  TLO,
  WYPELNIENIE_PASKA,
  czas,
  wariantGrupy,
  type Ramka,
} from '../gra/karczmaUklad';
import { OknoWyboru } from './karczma/OknoWyboru';
import { OknoPiwa } from './karczma/OknoPiwa';
import { PostepWyprawy } from './karczma/PostepWyprawy';
import { Walka } from './karczma/Walka';
import type { Gracz, Rozliczenie, StanKarczmy } from '../gra/typy';

/** Co ile karczmarz zmienia poze. */
const TEMPO_KARCZMARZA = 2600;
/** Co ile mruga naganiacz do kubkow. */
const TEMPO_MRUGNIECIA = 4300;

function styl(r: Ramka): React.CSSProperties {
  return { left: r.lewo, top: r.gora, width: r.szerokosc, height: r.wysokosc };
}

export function Karczma({
  stan,
  gracz,
  onPodejmij,
  onPrzerwij,
  onPrzyspiesz,
  onPiwo,
  onOdswiez,
}: {
  stan: StanKarczmy;
  gracz: Gracz;
  onPodejmij: (numer: number) => void;
  onPrzerwij: () => void;
  onPrzyspiesz: () => void;
  onPiwo: () => void;
  onOdswiez: () => void;
}) {
  const [otwarte, setOtwarte] = useState<'zadania' | 'piwo' | null>(null);
  const [pokazWalke, setPokazWalke] = useState<Rozliczenie | null>(null);

  const karczmarz = useKlatka(KLATKI_KARCZMARZA.length, TEMPO_KARCZMARZA);
  const mruga = useKlatka(2, TEMPO_MRUGNIECIA) === 1;
  const wariant = wariantGrupy(stan.zadania);

  /*
   * Rozliczenie przychodzi razem ze stanem — wtedy zamiast karczmy
   * pokazuje sie walka. Klucz po czasie konca, zeby to samo rozliczenie
   * nie wracalo po kazdym przerysowaniu.
   */
  const ostatnieRozliczenie = useRef<Rozliczenie | null>(null);
  useEffect(() => {
    if (stan.rozliczenie && stan.rozliczenie !== ostatnieRozliczenie.current) {
      ostatnieRozliczenie.current = stan.rozliczenie;
      setOtwarte(null);
      setPokazWalke(stan.rozliczenie);
    }
  }, [stan.rozliczenie]);

  if (pokazWalke) {
    return <Walka rozliczenie={pokazWalke} gracz={gracz} onZamknij={() => setPokazWalke(null)} />;
  }

  const naWyprawie = stan.status === 2;

  return (
    <div className="karczma">
      <img className="karczma-tlo" src={TLO} alt="" />
      <img style={styl(SWIECE)} src={OBRAZ_SWIEC} alt="" />

      {/* --- grupa przy stole: to ona rozdaje zadania --- */}
      <img style={styl(GRUPA_ZADAN)} src={KLATKI_GRUPY[wariant]} alt="" />

      <img
        style={styl(KARCZMARZ)}
        src={KLATKI_KARCZMARZA[karczmarz]}
        alt=""
      />

      {mruga && <img style={styl(OCZY_NAGANIACZA)} src={OBRAZ_MRUGNIECIA} alt="" />}

      {!naWyprawie && (
        <>
          <button
            className="karczma-klik"
            style={styl(KLIK_ZADANIA)}
            title={PODPISY.wybierzZadanie}
            aria-label={PODPISY.wybierzZadanie}
            onClick={() => setOtwarte('zadania')}
          >
            <img
              className="karczma-podswietlenie"
              src={PODSWIETLENIA_GRUPY[wariant]!.obraz}
              alt=""
              style={{
                left: PODSWIETLENIA_GRUPY[wariant]!.przesuniecieX,
                top: PODSWIETLENIA_GRUPY[wariant]!.przesuniecieY,
                width: PODSWIETLENIA_GRUPY[wariant]!.szerokosc,
                height: PODSWIETLENIA_GRUPY[wariant]!.wysokosc,
              }}
            />
          </button>

          <button
            className="karczma-klik"
            style={styl(KLIK_BARU)}
            title={PODPISY.piwoTytulOk}
            aria-label={PODPISY.piwoTytulOk}
            onClick={() => setOtwarte('piwo')}
          >
            <img
              className="karczma-podswietlenie"
              src={OBRAZ_PODSWIETLENIA_BARU}
              alt=""
              style={{
                left: PODSWIETLENIE_BARU.lewo - KLIK_BARU.lewo,
                top: PODSWIETLENIE_BARU.gora - KLIK_BARU.gora,
                width: PODSWIETLENIE_BARU.szerokosc,
                height: PODSWIETLENIE_BARU.wysokosc,
              }}
            />
          </button>
        </>
      )}

      {/*
        U dolu stoi jeden pasek: awanturniczosc, kiedy bohater jest
        w karczmie, i postep wyprawy, kiedy go w niej nie ma. Oryginal ma
        na to dwa osobne ekrany (`ShowQuestScreen`), wiec nigdy nie widac
        obu naraz.
      */}
      {naWyprawie ? (
        <PostepWyprawy
          stan={stan}
          onPrzerwij={onPrzerwij}
          onPrzyspiesz={onPrzyspiesz}
          onKoniecCzasu={onOdswiez}
        />
      ) : (
        <PasekAwanturniczosci wytrzymalosc={stan.wytrzymalosc} maks={stan.wytrzymaloscMaks} />
      )}

      {/* --- okna --- */}
      {otwarte === 'zadania' && (
        <OknoWyboru
          stan={stan}
          wariant={wariant}
          onWyrusz={(numer) => {
            setOtwarte(null);
            onPodejmij(numer);
          }}
          onZamknij={() => setOtwarte(null)}
        />
      )}

      {otwarte === 'piwo' && (
        <OknoPiwa stan={stan} onKup={onPiwo} onZamknij={() => setOtwarte(null)} />
      )}
    </div>
  );
}

/** Prosty licznik klatek — dla mrugniec i drobnych animacji tla. */
function useKlatka(ile: number, tempo: number): number {
  const [klatka, setKlatka] = useState(0);
  useEffect(() => {
    const licznik = setInterval(() => setKlatka((k) => (k + 1) % ile), tempo);
    return () => clearInterval(licznik);
  }, [ile, tempo]);
  return klatka;
}

/**
 * Pasek awanturniczosci.
 *
 * `RefreshTimeBar` w oryginale: szerokosc wypelnienia to
 * `(thirst / 6000) * 555` pikseli, a napis obok pokazuje pozostaly czas
 * w postaci `h:mm:ss` albo `m:ss`.
 */
function PasekAwanturniczosci({ wytrzymalosc, maks }: { wytrzymalosc: number; maks: number }) {
  const szerokosc = Math.round((Math.min(wytrzymalosc, maks) / maks) * WYPELNIENIE_PASKA.szerokosc);

  return (
    <>
      {/* Rama idzie POD wypelnienie — w oryginale `IMG_TIMEBAR_BG` jest
          dodawany do grupy przed `IMG_TIMEBAR_FILL`. */}
      <img style={styl(PASEK)} src={OBRAZ_PASKA} alt={PODPISY.awanturniczosc} title={PODPISY.paskAwanturniczosci} />
      <div
        className="karczma-wypelnienie"
        style={{
          left: WYPELNIENIE_PASKA.lewo,
          top: WYPELNIENIE_PASKA.gora,
          width: szerokosc,
          height: WYPELNIENIE_PASKA.wysokosc,
          backgroundImage: `url('${OBRAZ_WYPELNIENIA}')`,
        }}
      />
      <div className="karczma-czas" style={{ left: NAPIS_PASKA.lewo, top: NAPIS_PASKA.gora }}>
        {czas(wytrzymalosc)}
      </div>
    </>
  );
}

/** Nazwa krainy, w ktora wysyla zadanie. */
export function krainaZadania(lokacja: number): string {
  return KRAINY[Math.max(0, Math.min(KRAINY.length - 1, lokacja - 1))] ?? '';
}
