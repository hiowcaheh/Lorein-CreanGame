/**
 * Zbrojownia — sklep z bronia i pancerzem („sklep 0" w oryginale).
 *
 * Uklad z klienta Flash: prawa polowa ekranu to sklep (tlo `shakes.jpg`
 * 500x700 od x = 780), lewa to zwykly ekran postaci z tymi samymi
 * miejscami na przedmioty. Kupuje sie i sprzedaje PRZECIAGAJAC — towar
 * na siebie albo swoja rzecz na sklep — bo tak dziala oryginal.
 *
 * Cala arytmetyka siedzi na serwerze. Klient mowi tylko „to miejsce na
 * ten slot" i dostaje odswiezony stan.
 */

import { Fragment, useEffect, useRef, useState } from 'react';
import { PodpowiedzPrzedmiotu } from '../gra/PodpowiedzPrzedmiotu';
import { Portret } from '../gra/Portret';
import { nazwaPrzedmiotu } from '../gra/przedmioty';
import { usePrzeciaganie } from '../gra/usePrzeciaganie';
import { PIERWSZY_SLOT_PLECAKA, slotDlaRodzaju } from '../gra/przedmioty';
import {
  KOLUMNY_CECH,
  MIEJSCA,
  ODSTEP_WIERSZA,
  PLECAK,
  PORTRET,
  TLO_LEWE,
  WIERSZ_CECHY_Y,
  pustaBron,
  wierszeCech,
  wierszePochodnych,
  type Ramka as RamkaPostaci,
} from '../gra/ekranPostaci';
import {
  MIEJSCA_TOWARU,
  MIEJSCE_SPRZEDAZY,
  OCZY_SPRZEDAWCY,
  PIERWSZE_MIEJSCE_TOWARU,
  PRZYCISK_TOWARU,
  SPRZEDAWCA,
  TLO,
  ZBROJOWNIA_OBRAZY,
  ciemno,
  czyMiejsceTowaru,
  czyMiejsceSprzedazy,
  type Ramka,
} from '../gra/sklepUklad';
import type { Gracz, Przedmiot, StanSklepu, TowarSklepu } from '../gra/typy';

const KATALOG_SLOTOW = '/res/sfgame/scr/char/';

/** Wiersz cech: `POS_CHAR_PROP_Y + i * REL_CHAR_PROP_Y`, minus poczatek ekranu. */
function wierszCechy(i: number): number {
  return WIERSZ_CECHY_Y - 100 + i * ODSTEP_WIERSZA;
}

function styl(r: Ramka): React.CSSProperties {
  return { left: r.lewo, top: r.gora, width: r.szerokosc, height: r.wysokosc };
}

export function Zbrojownia({
  stan,
  gracz,
  onKup,
  onSprzedaj,
  onWymien,
}: {
  stan: StanSklepu;
  gracz: Gracz;
  /** `cel === null` znaczy „zaloz na wlasciwe miejsce". */
  onKup: (miejsce: number, cel: number | null) => void;
  onSprzedaj: (slot: number) => void;
  onWymien: () => void;
}) {
  const [pokazany, setPokazany] = useState<Przedmiot | null>(null);
  const ekran = useRef<HTMLDivElement>(null);

  const przeciaganie = usePrzeciaganie({
    ekran,
    onKlik: (p) => setPokazany((s) => (s?.slot === p.slot ? null : p)),
    onUpusc: (przedmiot, cel) => {
      setPokazany(null);

      // Z pólki na siebie — zakup. `cel === null` znaczy „zaloz".
      if (czyMiejsceTowaru(przedmiot.slot)) {
        const miejsce = przedmiot.slot - PIERWSZE_MIEJSCE_TOWARU;
        if (cel === null || !czyMiejsceTowaru(cel)) onKup(miejsce, cel);
        return;
      }

      /*
       * Ze swojego ekwipunku na sklep — sprzedaz.
       *
       * Liczy sie CALY obszar sklepu, nie same miejsca z towarem:
       * `DefineClickArea(CA_SELL_ITEM, ..., 280 + 550, 100, 450, 700)`.
       * W oryginale rzuca sie rzecz sprzedawcy pod nogi, a nie celuje
       * w pólke.
       */
      if (cel !== null && (czyMiejsceTowaru(cel) || czyMiejsceSprzedazy(cel))) {
        onSprzedaj(przedmiot.slot);
      }
    },
  });

  const ciagniety = przeciaganie.ciagnie ? przeciaganie.stan : null;

  // Klikniecie obok zamyka podpowiedz — tak samo jak na ekranie postaci.
  useEffect(() => {
    if (!pokazany) return;
    const zamknij = (e: PointerEvent) => {
      const cel = e.target as Element | null;
      if (cel?.closest('[data-slot]') || cel?.closest('.podpowiedz')) return;
      setPokazany(null);
    };
    document.addEventListener('pointerdown', zamknij);
    return () => document.removeEventListener('pointerdown', zamknij);
  }, [pokazany]);

  /*
   * Miejsce podswietlane przy zlapaniu towaru — to, w ktore rzecz ma
   * prawo trafic. Przy sprzedazy podswietlamy caly sklep.
   */
  const sugerowane =
    ciagniety && czyMiejsceTowaru(ciagniety.przedmiot.slot)
      ? slotDlaRodzaju(ciagniety.przedmiot.typ)
      : null;
  const sprzedaje = ciagniety !== null && !czyMiejsceTowaru(ciagniety.przedmiot.slot);

  const wSlocie = (slot: number) => gracz.ekwipunek.find((p) => p.slot === slot);
  const [mruga, setMruga] = useState(false);

  /*
   * Sprzedawca mruga co jakis czas — `ShakesBlinzeln` w oryginale losuje
   * odstep i podmienia same oczy na dwie klatki.
   */
  useEffect(() => {
    let zegar: ReturnType<typeof setTimeout>;
    const nastepne = () => {
      zegar = setTimeout(() => {
        setMruga(true);
        setTimeout(() => setMruga(false), 160);
        nastepne();
      }, 2000 + Math.random() * 4000);
    };
    nastepne();
    return () => clearTimeout(zegar);
  }, []);

  const noc = ciemno(new Date(stan.czasSerwera * 1000).getHours());
  const cechy = wierszeCech(gracz);
  const pochodne = wierszePochodnych(gracz);

  return (
    <div className="sklep" ref={ekran}>
      {/*
        Lewa polowa to zwykly ekran postaci — `IMG_SCR_CHAR_BG` w punkcie
        (280, 100). Prawa, ktora na ekranie bohatera zajmuje
        `character_right_new.jpg`, jest tu zastapiona wnetrzem sklepu.
      */}
      <img className="postac-tlo lewe" src={TLO_LEWE} alt="" />

      {/* --------------------------------------------- lewa polowa -- */}

      <div className="postac-portret" style={styl(przeliczRamke(PORTRET))}>
        <Portret
          wyglad={{ rasa: gracz.rasa, plec: gracz.plec, klasa: gracz.klasa, czesci: gracz.wyglad }}
        />
      </div>

      {MIEJSCA.map((m) => (
        <Miejsce
          key={m.slot}
          slot={m.slot}
          nazwa={m.nazwa}
          ramka={przeliczRamke(m.ramka)}
          pusty={m.slot === 8 ? pustaBron(gracz.klasa) : m.pusty}
          przedmiot={wSlocie(m.slot)}
          ciagniety={ciagniety?.przedmiot}
          sugerowane={sugerowane === m.slot}
          uchwyty={przeciaganie.uchwyty}
        />
      ))}

      {PLECAK.map((r, i) => (
        <Miejsce
          key={PIERWSZY_SLOT_PLECAKA + i}
          slot={PIERWSZY_SLOT_PLECAKA + i}
          nazwa="Plecak"
          ramka={przeliczRamke(r)}
          przedmiot={wSlocie(PIERWSZY_SLOT_PLECAKA + i)}
          ciagniety={ciagniety?.przedmiot}
          sugerowane={false}
          uchwyty={przeciaganie.uchwyty}
        />
      ))}

      {/*
        Cechy i wartosci pochodne — `BNC_SCREEN_SHAKES` dostaje te same
        piec wierszy, co ekran postaci. Bez przyciskow „+":
        `BTN_SCR_CHAR_STEIGERN1` nalezy wylacznie do ekranu postaci.
      */}
      {cechy.map((cecha, i) => (
        <Fragment key={cecha.nazwa}>
          <span className="postac-cecha" style={{ left: KOLUMNY_CECH[0], top: wierszCechy(i) }}>
            {cecha.nazwa}
          </span>
          <span className="postac-cecha" style={{ left: KOLUMNY_CECH[1], top: wierszCechy(i) }}>
            {cecha.wartosc}
          </span>
          <span
            className="postac-cecha"
            style={{ left: KOLUMNY_CECH[3], top: wierszCechy(i) }}
            title={pochodne[i]!.tytul}
          >
            {pochodne[i]!.nazwa}
          </span>
          <span className="postac-cecha" style={{ left: KOLUMNY_CECH[4], top: wierszCechy(i) }}>
            {pochodne[i]!.wartosc}
          </span>
        </Fragment>
      ))}

      {/* --------------------------------------------- prawa polowa -- */}

      <img className="sklep-tlo" style={styl(TLO)} src={ZBROJOWNIA_OBRAZY.tlo} alt="" />

      {/*
        Obszar sprzedazy — `CA_SELL_ITEM`. Zwykly, niewidoczny prostokat;
        lezy pod towarem i pod przyciskiem, wiec upuszczenie na pólke
        dalej trafia w pólke.
      */}
      <div
        className="sklep-obszar-sprzedazy"
        style={styl(MIEJSCE_SPRZEDAZY.ramka)}
        data-slot={MIEJSCE_SPRZEDAZY.numer}
        aria-hidden="true"
      />

      <img
        className="sklep-sprzedawca"
        style={styl(SPRZEDAWCA)}
        src={noc ? ZBROJOWNIA_OBRAZY.noc : ZBROJOWNIA_OBRAZY.dzien}
        alt=""
      />
      {mruga && !noc && (
        <img
          className="sklep-sprzedawca"
          style={styl(OCZY_SPRZEDAWCY)}
          src={ZBROJOWNIA_OBRAZY.mrugniecie[0]}
          alt=""
        />
      )}

      {/*
        Cena NIE stoi pod ikona — oryginal jej tam nie pisze. Widac ja
        w podpowiedzi, ostatnim wierszem, tak jak przy kazdym innym
        przedmiocie w grze.
      */}
      {MIEJSCA_TOWARU.map((r, i) => {
        const towar = stan.towar.find((t: TowarSklepu) => t.slot === i);
        const numer = PIERWSZE_MIEJSCE_TOWARU + i;
        return (
          <Miejsce
            key={numer}
            slot={numer}
            nazwa="Towar"
            ramka={r}
            przedmiot={towar ? { ...towar, slot: numer } : undefined}
            ciagniety={ciagniety?.przedmiot}
            sugerowane={sprzedaje}
            uchwyty={przeciaganie.uchwyty}
          />
        );
      })}

      <button
        type="button"
        className="przycisk sklep-wymiana"
        style={styl(PRZYCISK_TOWARU)}
        onClick={onWymien}
        disabled={gracz.grzyby < stan.kosztWymiany}
        title={`Nowy towar za ${stan.kosztWymiany} grzyba`}
      >
        Nowy towar
        <img src="/res/sfgame/if/icon_pilz.png" alt="grzyb" />
      </button>

      {/* Przedmiot w locie — leci za palcem. */}
      {ciagniety && (
        <img
          className="postac-ciagniety"
          src={ciagniety.przedmiot.obrazek}
          alt=""
          style={{ left: ciagniety.x - 45, top: ciagniety.y - 45 }}
        />
      )}

      {pokazany && (
        <PodpowiedzPrzedmiotu
          przedmiot={pokazany}
          miejsce={miejscePodpowiedzi(pokazany)}
          onZamknij={() => setPokazany(null)}
        />
      )}
    </div>
  );
}

/** Ekran postaci podaje ramki napisami z `px`; tutaj liczymy liczbami. */
function przeliczRamke(r: RamkaPostaci): Ramka {
  return {
    lewo: Number.parseFloat(r.lewo),
    gora: Number.parseFloat(r.gora),
    szerokosc: Number.parseFloat(r.szerokosc),
    wysokosc: Number.parseFloat(r.wysokosc),
  };
}

/** Podpowiedz staje nad miejscem, z ktorego wyszla. */
function miejscePodpowiedzi(p: Przedmiot): { x: number; y: number } {
  if (czyMiejsceTowaru(p.slot)) {
    const r = MIEJSCA_TOWARU[p.slot - PIERWSZE_MIEJSCE_TOWARU];
    if (r) return { x: r.lewo + r.szerokosc / 2, y: r.gora };
  }

  const m = MIEJSCA.find((x) => x.slot === p.slot);
  const r = m ? przeliczRamke(m.ramka) : przeliczRamke(PLECAK[p.slot - PIERWSZY_SLOT_PLECAKA] ?? PLECAK[0]!);
  return { x: r.lewo + r.szerokosc / 2, y: r.gora };
}

function Miejsce({
  slot,
  nazwa,
  ramka,
  pusty,
  przedmiot,
  ciagniety,
  sugerowane,
  uchwyty,
}: {
  slot: number;
  nazwa: string;
  ramka: Ramka;
  pusty?: string | undefined;
  przedmiot?: Przedmiot | undefined;
  ciagniety?: Przedmiot | undefined;
  sugerowane: boolean;
  uchwyty: (przedmiot: Przedmiot) => Record<string, unknown>;
}) {
  const klasy = ['postac-slot'];
  if (sugerowane) klasy.push('sugerowane');

  if (!przedmiot) {
    return (
      <div className={klasy.join(' ')} style={styl(ramka)} title={nazwa} data-slot={slot}>
        {pusty && <img className="pusty" src={KATALOG_SLOTOW + pusty} alt="" />}
      </div>
    );
  }

  return (
    <button
      type="button"
      className={klasy.join(' ')}
      style={styl(ramka)}
      title={nazwaPrzedmiotu(przedmiot)}
      data-slot={slot}
      {...uchwyty(przedmiot)}
    >
      <img
        style={ciagniety?.slot === slot ? { visibility: 'hidden' } : undefined}
        src={przedmiot.obrazek}
        alt={nazwa}
        draggable={false}
      />
    </button>
  );
}
