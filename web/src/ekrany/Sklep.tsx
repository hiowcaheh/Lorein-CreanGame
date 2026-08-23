/**
 * Sklep — zbrojownia albo gabinet magii.
 *
 * Oba maja ten sam uklad i te same zasady; rozni je numer, tlo,
 * sprzedawca i asortyment. Dlatego jest to jeden ekran, ktory dostaje
 * `wyglad`, a nie dwa prawie identyczne pliki.
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
import { CECHY_PO_KOLEI, RozbicieCechy } from '../gra/RozbicieCechy';
import { Portret } from '../gra/Portret';
import { PasekDoswiadczenia } from '../gra/PasekDoswiadczenia';
import { nazwaPrzedmiotu } from '../gra/przedmioty';
import { usePrzeciaganie } from '../gra/usePrzeciaganie';
import {
  PIERWSZY_SLOT_PLECAKA,
  RODZAJ_MIKSTURY,
  czyEpicki,
  slotDlaRodzaju,
} from '../gra/przedmioty';
import {
  KOLUMNY_CECH,
  MIEJSCA,
  NAZWA_W_POLU,
  PASEK_DOSWIADCZENIA,
  ODSTEP_WIERSZA,
  PLECAK,
  PORTRET,
  TLO_LEWE,
  WIERSZ_CECHY_Y,
  pustaBron,
  pustaTarcza,
  SLOT_BRONI,
  SLOT_TARCZY,
  wierszeCech,
  wierszePochodnych,
  type Ramka as RamkaPostaci,
} from '../gra/ekranPostaci';
import {
  MIEJSCA_TOWARU,
  MIEJSCE_SPRZEDAZY,
  PIERWSZE_MIEJSCE_TOWARU,
  PRZYCISK_TOWARU,
  TLO,
  ciemno,
  czyMiejsceSprzedazy,
  czyMiejsceTowaru,
  type Ramka,
  type WygladSklepu,
} from '../gra/sklepUklad';
import {
  NAGLOWEK_Y,
  ODSTEP_PRZYCISKOW,
  OKNO,
  PRZYCISK,
  PRZYCISKI_Y,
  SRODEK_OKNA,
  TEKST,
  TLO_OKNA,
} from '../gra/oknoUklad';
import type { Gracz, Przedmiot, StanSklepu, TowarSklepu } from '../gra/typy';

const KATALOG_SLOTOW = '/res/sfgame/scr/char/';

/** Wiersz cech: `POS_CHAR_PROP_Y + i * REL_CHAR_PROP_Y`, minus poczatek ekranu. */
function wierszCechy(i: number): number {
  return WIERSZ_CECHY_Y - 100 + i * ODSTEP_WIERSZA;
}

function styl(r: Ramka): React.CSSProperties {
  return { left: r.lewo, top: r.gora, width: r.szerokosc, height: r.wysokosc };
}

export function Sklep({
  stan,
  gracz,
  wyglad,
  onKup,
  onSprzedaj,
  onWymien,
  onPrzenies,
  onWypij,
}: {
  stan: StanSklepu;
  gracz: Gracz;
  wyglad: WygladSklepu;
  /** `cel === null` znaczy „zaloz na wlasciwe miejsce". */
  onKup: (miejsce: number, cel: number | null) => void;
  onSprzedaj: (slot: number) => void;
  onWymien: () => void;
  /**
   * Przelozenie WLASNEGO przedmiotu — dokladnie to samo, co na ekranie
   * postaci. Lewa polowa sklepu to ten sam ekran (`BNC_SCREEN_SHAKES`
   * dostaje komplet `CNT_CHAR_SLOT_*`), wiec zakladanie i zdejmowanie
   * ma tu dzialac tak samo.
   */
  onPrzenies: (zrodlo: number, cel: number | null) => void;
  onWypij: (slot: number) => void;
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
        return;
      }

      /*
       * Mikstury sie nie zaklada — sie ja pije. Tak samo, jak na ekranie
       * postaci: rzucenie jej na siebie ma ja WYPIC, a nie przelozyc.
       * Bez tego wyjatku sklep wysylal zwykle przeniesienie i mikstura
       * ladowala w pierwszym wolnym miejscu ekwipunku.
       */
      if (przedmiot.typ === RODZAJ_MIKSTURY && cel === null) {
        onWypij(przedmiot.slot);
        return;
      }

      /*
       * Cala reszta to zwykle przekladanie po wlasnym ekwipunku —
       * zakladanie, zdejmowanie i porzadki w plecaku. Wczesniej sklep
       * po prostu nic z tym nie robil i przedmiot wracal na miejsce.
       */
      onPrzenies(przedmiot.slot, cel);
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
   * Miejsce podswietlane przy zlapaniu przedmiotu — to, w ktore rzecz ma
   * prawo trafic (`IMG_SLOT_SUGGESTION`). Dotyczy i towaru z pólki,
   * i wlasnej rzeczy z plecaka; przedmiot juz zalozony nie ma czego
   * sugerowac. Przy sprzedazy podswietlamy caly sklep.
   */
  const sugerowane =
    ciagniety &&
    (czyMiejsceTowaru(ciagniety.przedmiot.slot) ||
      ciagniety.przedmiot.slot >= PIERWSZY_SLOT_PLECAKA)
      ? slotDlaRodzaju(ciagniety.przedmiot.typ)
      : null;
  const sprzedaje = ciagniety !== null && !czyMiejsceTowaru(ciagniety.przedmiot.slot);

  /** Ktory wiersz cechy ma otwarte rozbicie na czlony. */
  const [rozbitaCecha, setRozbitaCecha] = useState<number | null>(null);
  const [pytanieOWymiane, setPytanieOWymiane] = useState(false);

  /*
   * Epiki na pólce. Odswiezenie towaru je BEZPOWROTNIE kasuje, a epik
   * trafia sie rzadko — wlasciciel gry poprosil, zeby gra pytala, zanim
   * gracz wymieni pólke z epikiem. Oryginal wymienia bez slowa.
   */
  const epikiNaPolce = stan.towar
    .map((t: TowarSklepu) => ({ ...t, slot: PIERWSZE_MIEJSCE_TOWARU + t.slot }))
    .filter((t) => czyEpicki(t));

  /* Pocisk zalozonej broni — u maga i zwiadowcy stoi w miejscu tarczy. */
  const pociskZalozonejBroni =
    gracz.ekwipunek.find((p) => p.slot === SLOT_BRONI)?.pocisk ?? null;

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
  const [klatkaZwierzaka, setKlatkaZwierzaka] = useState(0);

  useEffect(() => {
    if (!wyglad.zwierzak) return;
    const ile = wyglad.zwierzak.klatki.length;
    // `ShopAniTimer` chodzi co 100 ms; malpa zmienia klatke rzadziej.
    const zegar = setInterval(() => setKlatkaZwierzaka((k) => (k + 1) % ile), 700);
    return () => clearInterval(zegar);
  }, [wyglad]);
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

      {/*
        Nick pod portretem.
        SWIADOME ODSTEPSTWO — patrz tabela w CLAUDE.md. Oryginal nie
        wklada `CNT_SCR_CHAR_NAME` do `BNC_SCREEN_SHAKES`, wiec w sklepie
        nazwy postaci nie ma wcale. Miejsce jest to samo, co na ekranie
        postaci (POS_CHAR_NAME).
      */}
      <div className="postac-nazwa" style={styl(przeliczRamke(NAZWA_W_POLU))}>
        {gracz.nick}
      </div>

      {/*
        Pasek doswiadczenia z poziomem — ten sam, co na ekranie postaci.
        Tutaj odstepstwa nie ma: `CA_SCR_CHAR_EXPBAR` NALEZY do
        `BNC_SCREEN_SHAKES` i `BNC_SCREEN_FIDGET`.
      */}
      <PasekDoswiadczenia
        poziom={gracz.poziom}
        doswiadczenie={gracz.doswiadczenie}
        doNastepnegoPoziomu={gracz.doNastepnegoPoziomu}
        postep={gracz.postepPoziomu}
        ramka={przeliczRamke(PASEK_DOSWIADCZENIA)}
      />

      {MIEJSCA.map((m) => (
        <Miejsce
          key={m.slot}
          slot={m.slot}
          nazwa={m.nazwa}
          ramka={przeliczRamke(m.ramka)}
          pusty={
            m.slot === SLOT_BRONI
              ? pustaBron(gracz.klasa)
              : m.slot === SLOT_TARCZY
                ? (pustaTarcza(gracz.klasa, pociskZalozonejBroni) ?? undefined)
                : m.pusty
          }
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
          {/* Klikniecie rozpisuje cechę na czlon wlasny i przedmiotowy. */}
          <button
            type="button"
            className="postac-cecha klikalna"
            style={{ left: KOLUMNY_CECH[0], top: wierszCechy(i) }}
            onClick={() => setRozbitaCecha((c) => (c === i ? null : i))}
          >
            {cecha.nazwa}
          </button>
          <button
            type="button"
            className="postac-cecha klikalna"
            style={{ left: KOLUMNY_CECH[1], top: wierszCechy(i) }}
            onClick={() => setRozbitaCecha((c) => (c === i ? null : i))}
          >
            {cecha.wartosc}
          </button>
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

      {rozbitaCecha !== null && CECHY_PO_KOLEI[rozbitaCecha] && (
        <RozbicieCechy
          nazwa={cechy[rozbitaCecha]?.nazwa ?? ''}
          skladniki={gracz.skladnikiCech[CECHY_PO_KOLEI[rozbitaCecha]]}
          lewo={KOLUMNY_CECH[0] ?? 0}
          gora={wierszCechy(rozbitaCecha)}
          onZamknij={() => setRozbitaCecha(null)}
        />
      )}

      {/* --------------------------------------------- prawa polowa -- */}

      <img className="sklep-tlo" style={styl(TLO)} src={wyglad.tlo} alt="" />

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
        style={styl(wyglad.sprzedawca)}
        src={noc ? wyglad.noc : wyglad.dzien}
        alt=""
      />
      {mruga && !noc && (
        <img className="sklep-sprzedawca" style={styl(wyglad.oczy)} src={wyglad.mrugniecie} alt="" />
      )}

      {/*
        Zwierzak sprzedawcy — w gabinecie magii malpa przewija trzy
        klatki (`IMG_FIDGET_AFFE1..3`), w zbrojowni go nie ma.
      */}
      {wyglad.zwierzak && (
        <img
          className="sklep-sprzedawca"
          style={styl(wyglad.zwierzak.ramka)}
          src={wyglad.zwierzak.klatki[klatkaZwierzaka] ?? wyglad.zwierzak.klatki[0]}
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
        onClick={() => (epikiNaPolce.length > 0 ? setPytanieOWymiane(true) : onWymien())}
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

      {pytanieOWymiane && (
        <PytanieOWymiane
          epiki={epikiNaPolce}
          onOdswiez={() => {
            setPytanieOWymiane(false);
            onWymien();
          }}
          onWroc={() => setPytanieOWymiane(false)}
        />
      )}

      {pokazany && (
        <PodpowiedzPrzedmiotu
          przedmiot={pokazany}
          miejsce={miejscePodpowiedzi(pokazany)}
          /* Rzecz spoza pólki to rzecz GRACZA, czyli tu do sprzedania. */
          sprzedaz={!czyMiejsceTowaru(pokazany.slot)}
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

  /*
   * `IMG_SLOT_SUGGESTION` — to samo podswietlenie, co na ekranie postaci.
   * W sklepie tez jest potrzebne: rzecz z plecaka zaklada sie i stad,
   * a bez podswietlenia nie widac, w ktore miejsce poleci.
   */
  const sugestia = sugerowane ? (
    <img className="podpowiedz-miejsca" src={`${KATALOG_SLOTOW}slot_suggestion.png`} alt="" />
  ) : null;

  if (!przedmiot) {
    return (
      <div className={klasy.join(' ')} style={styl(ramka)} title={nazwa} data-slot={slot}>
        {/* Pocisk przychodzi gotowa sciezka `/res/...`, sylwetki sama nazwa. */}
        {pusty && (
          <img
            className={pusty.startsWith('/') ? 'pusty pocisk' : 'pusty'}
            src={pusty.startsWith('/') ? pusty : KATALOG_SLOTOW + pusty}
            alt=""
          />
        )}
        {sugestia}
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
      {sugestia}
    </button>
  );
}

/**
 * Potwierdzenie wymiany towaru, gdy na pólce lezy epik.
 *
 * SWIADOME ODSTEPSTWO (tabela w CLAUDE.md) — oryginal wymienia bez
 * slowa. Samo okno jest z ekranu Warty, tak samo jak okno cechy:
 * `okno.png` w `POS_IF_WIN`, przyciski obok siebie na `REL_ARBEITEN_BTN_Y`.
 */
function PytanieOWymiane({
  epiki,
  onOdswiez,
  onWroc,
}: {
  epiki: Przedmiot[];
  onOdswiez: () => void;
  onWroc: () => void;
}) {
  return (
    <div className="okno-cechy" role="dialog" aria-label="Wymiana towaru">
      {/* Zaslona przechwytuje klikniecia w reszte ekranu. */}
      <div className="okno-zaslona" onClick={onWroc} role="presentation" />

      <img
        className="okno-tlo"
        src={TLO_OKNA}
        alt=""
        style={{ left: OKNO.lewo, top: OKNO.gora, width: OKNO.szerokosc, height: OKNO.wysokosc }}
      />

      <div className="okno-naglowek" style={{ left: SRODEK_OKNA, top: NAGLOWEK_Y }}>
        Nowy towar
      </div>

      <div
        className="okno-tekst"
        style={{ left: TEKST.lewo, top: TEKST.gora, width: TEKST.szerokosc }}
      >
        <div>
          W sklepie {epiki.length > 1 ? 'są przedmioty epickie' : 'jest przedmiot epicki'} do
          kupienia:
        </div>
        {/*
          Nazwa epika w jego wlasnym kolorze — tym samym, co cytat
          przedmiotu epickiego w podpowiedzi (`--blekit-cytat`), pogrubiona
          i wysrodkowana, zeby od razu bylo widac, o co chodzi.
        */}
        {epiki.map((e) => (
          <div className="nazwa-epika" key={e.slot}>
            „{nazwaPrzedmiotu(e)}"
          </div>
        ))}
        <div>Na pewno chcesz odświeżyć towar?</div>
      </div>

      <button
        type="button"
        className="przycisk"
        style={{
          left: SRODEK_OKNA - PRZYCISK.szerokosc - ODSTEP_PRZYCISKOW / 2,
          top: PRZYCISKI_Y,
          width: PRZYCISK.szerokosc,
          minHeight: PRZYCISK.wysokosc,
        }}
        onClick={onOdswiez}
      >
        {/* Odswiezenie kosztuje grzybka — niech to widac na przycisku. */}
        Odśwież
        <img className="koszt-grzybka" src="/res/sfgame/if/icon_pilz.png" alt="grzyb" />
      </button>
      <button
        type="button"
        className="przycisk"
        style={{
          left: SRODEK_OKNA + ODSTEP_PRZYCISKOW / 2,
          top: PRZYCISKI_Y,
          width: PRZYCISK.szerokosc,
          minHeight: PRZYCISK.wysokosc,
        }}
        onClick={onWroc}
      >
        Wróć
      </button>
    </div>
  );
}
