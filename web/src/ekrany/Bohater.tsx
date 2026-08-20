/**
 * Ekran postaci.
 *
 * Tlo to dwa oryginalne obrazy po 500x700 (lewa polowa z miejscami na
 * przedmioty, prawa z krajobrazem). Wszystko inne lezy na nich w miejscach
 * wyliczonych ze stalych `POS_CHAR_*` klienta Flash — w pikselach
 * oryginalu, bo cala scena jest skalowana jednym `transform`.
 */

import { Fragment, useEffect, useRef, useState } from 'react';
import { PodpowiedzPrzedmiotu } from '../gra/PodpowiedzPrzedmiotu';
import { Portret } from '../gra/Portret';
import { NAZWY_KLAS, NAZWY_RAS } from '../gra/portret';
import { PIERWSZY_SLOT_PLECAKA, nazwaPrzedmiotu, slotDlaRodzaju } from '../gra/przedmioty';
import { usePrzeciaganie } from '../gra/usePrzeciaganie';
import {
  BOK_PLUSA,
  HONOR,
  IKONA_KLASY,
  IKONA_PANCERZA,
  IKONA_TARCZY,
  IKONY_KLAS,
  KATALOG_ODZNAK,
  KATALOG_SLOTOW,
  KOLUMNY_CECH,
  MIEJSCA,
  NAZWA_W_POLU,
  ODSTEP_WIERSZA,
  OPIS,
  OSIAGNIECIA,
  PANCERZ,
  PASEK_DOSWIADCZENIA,
  PLECAK,
  PORTRET,
  PORTRET_WIERZCHOWCA,
  PRZESUNIECIE_PLUSA,
  TLO_CZCI,
  TLO_LEWE,
  TLO_PRAWE,
  WIERSZ_CECHY_Y,
  WIERZCHOWIEC,
  WYPELNIENIE_PASKA,
  pustaBron,
  type Ramka,
} from '../gra/ekranPostaci';
import type { Gracz, Przedmiot } from '../gra/typy';

const NAZWY_WIERZCHOWCOW = ['brak', 'Osioł', 'Koń', 'Tygrys', 'Smok'];

/**
 * Podpowiedz przy pustym opisie — pozycja 116 oryginalnego pliku
 * jezykowego (TXT_ENTERDESC).
 */
const ZACHETA_DO_OPISU = 'W tym miejscu możesz opisać swoją postać.';

/** Miejsce na przedmiot ma 90x90, tak jak same obrazki. */
const BOK_MIEJSCA = 90;

/** Miejsce na bron — jego sylwetka zalezy od klasy. */
const SLOT_BRONI = 8;

function styl(r: Ramka): React.CSSProperties {
  return { left: r.lewo, top: r.gora, width: r.szerokosc, height: r.wysokosc };
}

/** Wiersz cech: POS_CHAR_PROP_Y + i * REL_CHAR_PROP_Y, minus poczatek ekranu. */
function wiersz(i: number): number {
  return WIERSZ_CECHY_Y - 100 + i * ODSTEP_WIERSZA;
}

export function Bohater({
  gracz,
  onZapiszOpis,
  onPrzenies,
}: {
  gracz: Gracz;
  onZapiszOpis: (opis: string) => void;
  /** `cel === null` znaczy „zaloz na wlasciwe miejsce". */
  onPrzenies: (zrodlo: number, cel: number | null) => void;
}) {
  const [pokazany, setPokazany] = useState<Przedmiot | null>(null);
  const ekran = useRef<HTMLDivElement>(null);

  const przeciaganie = usePrzeciaganie({
    ekran,
    onKlik: (przedmiot) => setPokazany((p) => (p?.slot === przedmiot.slot ? null : przedmiot)),
    onUpusc: (przedmiot, cel) => {
      setPokazany(null);
      onPrzenies(przedmiot.slot, cel);
    },
  });

  const ciagniety = przeciaganie.ciagnie ? przeciaganie.stan : null;

  /*
   * Klikniecie obok zamyka podpowiedz.
   *
   * Klikniecia w same miejsca i w podpowiedz omijamy — tam React ma
   * wlasna obsluge, ktora przelacza podpowiedz. Bez tego wyjatku
   * ponowne stukniecie w ten sam przedmiot najpierw zamykaloby
   * podpowiedz tutaj, a zaraz potem otwieralo ja z powrotem.
   */
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
   * Miejsce, ktore oryginal podswietla przy zlapaniu przedmiotu
   * (`IMG_SLOT_SUGGESTION`): to, w ktorym rzecz ma prawo lezec.
   * Przedmiot juz zalozony nie ma czego sugerowac.
   */
  const sugerowane =
    ciagniety && ciagniety.przedmiot.slot >= PIERWSZY_SLOT_PLECAKA
      ? slotDlaRodzaju(ciagniety.przedmiot.typ)
      : null;

  const cechy = [
    { nazwa: 'Siła', wartosc: String(gracz.cechy.sila) },
    { nazwa: 'Zręczność', wartosc: String(gracz.cechy.zrecznosc) },
    { nazwa: 'Inteligencja', wartosc: String(gracz.cechy.intelekt) },
    // "Wytrzym." — skrot jest w oryginalnym pliku jezykowym (pozycja 63);
    // pelne slowo nie miesci sie w kolumnie szerokiej na 101 px.
    { nazwa: 'Wytrzym.', wartosc: String(gracz.cechy.wytrzymalosc) },
    { nazwa: 'Szczęście', wartosc: String(gracz.cechy.szczescie) },
  ];

  const pochodne = [
    { nazwa: 'Obrażenia', wartosc: `~${gracz.obrazenia.srednio}`, tytul: `${gracz.obrazenia.min} – ${gracz.obrazenia.max}` },
    { nazwa: 'Zdolność uniku', wartosc: String(gracz.unik) },
    { nazwa: 'Odporność', wartosc: String(gracz.odpornosc) },
    { nazwa: 'Żywotność', wartosc: String(gracz.zycie) },
    { nazwa: 'Cios krytyczny', wartosc: `${gracz.ciosKrytyczny}%` },
  ];

  return (
    <div className="postac" ref={ekran}>
      <img className="postac-tlo lewe" src={TLO_LEWE} alt="" />
      <img className="postac-tlo prawe" src={TLO_PRAWE} alt="" />

      {/* --- miejsca na przedmioty --- */}
      {MIEJSCA.map((m) => (
        <Miejsce
          key={m.slot}
          slot={m.slot}
          nazwa={m.nazwa}
          ramka={m.ramka}
          pusty={m.slot === SLOT_BRONI ? pustaBron(gracz.klasa) : m.pusty}
          przedmiot={gracz.ekwipunek.find((p) => p.slot === m.slot)}
          ciagniety={ciagniety?.przedmiot}
          sugerowane={sugerowane === m.slot}
          uchwyty={przeciaganie.uchwyty}
        />
      ))}

      {PLECAK.map((r, i) => (
        <Miejsce
          key={`plecak${i}`}
          slot={PIERWSZY_SLOT_PLECAKA + i}
          nazwa={`Plecak ${i + 1}`}
          ramka={r}
          przedmiot={gracz.ekwipunek.find((p) => p.slot === PIERWSZY_SLOT_PLECAKA + i)}
          ciagniety={ciagniety?.przedmiot}
          sugerowane={false}
          uchwyty={przeciaganie.uchwyty}
        />
      ))}

      {/* --- portret, imie, doswiadczenie --- */}
      <div className="postac-portret" style={styl(PORTRET)}>
        <Portret
          wyglad={{ rasa: gracz.rasa, plec: gracz.plec, klasa: gracz.klasa, czesci: gracz.wyglad }}
          opis={`${NAZWY_RAS[gracz.rasa]}, ${NAZWY_KLAS[gracz.klasa]}`}
        />
      </div>

      <div className="postac-nazwa" style={styl(NAZWA_W_POLU)}>
        {gracz.nick}
      </div>

      <div className="postac-pasek" style={styl(PASEK_DOSWIADCZENIA)} title="Doświadczenie">
        <div
          className="wypelnienie"
          style={{
            width: `${Math.round(gracz.postepPoziomu * 100)}%`,
            backgroundImage: `url('${WYPELNIENIE_PASKA}')`,
          }}
        />
        <span>
          Pzm {gracz.poziom} · {gracz.doswiadczenie} / {gracz.doNastepnegoPoziomu}
        </span>
      </div>

      {/*
        Cechy i wartosci pochodne. Kazdy napis stoi w swojej kolumnie
        wyrownany do lewej — dokladnie tak, jak `DefineLbl` w oryginale
        stawia pola tekstowe w punktach POS_CHAR_PROP_COLUMN_*.
      */}
      {cechy.map((cecha, i) => (
        <Fragment key={cecha.nazwa}>
          <span className="postac-cecha" style={{ left: KOLUMNY_CECH[0], top: wiersz(i) }}>
            {cecha.nazwa}
          </span>
          <span className="postac-cecha" style={{ left: KOLUMNY_CECH[1], top: wiersz(i) }}>
            {cecha.wartosc}
          </span>
          <button
            type="button"
            className="postac-plus"
            style={{
              left: KOLUMNY_CECH[2],
              top: wiersz(i) + PRZESUNIECIE_PLUSA,
              width: BOK_PLUSA,
              height: BOK_PLUSA,
            }}
            title={`Dodaj punkt: ${cecha.nazwa}`}
            aria-label={`Dodaj punkt: ${cecha.nazwa}`}
            disabled
          />
          <span
            className="postac-cecha"
            style={{ left: KOLUMNY_CECH[3], top: wiersz(i) }}
            title={pochodne[i]!.tytul ?? ''}
          >
            {pochodne[i]!.nazwa}
          </span>
          <span className="postac-cecha" style={{ left: KOLUMNY_CECH[4], top: wiersz(i) }}>
            {pochodne[i]!.wartosc}
          </span>
        </Fragment>
      ))}

      {/* --- prawa polowa --- */}
      <img
        className="postac-ikona-klasy"
        style={styl(IKONA_KLASY)}
        src={IKONY_KLAS[gracz.klasa] ?? IKONY_KLAS[1]!}
        alt=""
        title={NAZWY_KLAS[gracz.klasa]}
      />

      <div className="postac-tlo-czci" style={styl(TLO_CZCI)} />
      <div className="postac-honor" style={styl(HONOR)}>
        <span>Poz.: {gracz.poziom}</span>
        <span>Cześć: {gracz.honor}</span>
      </div>

      <Opis wartosc={gracz.opis} onZapisz={onZapiszOpis} />

      <div className="postac-wierzchowiec" style={styl(WIERZCHOWIEC)}>
        Wierzchowiec: ({NAZWY_WIERZCHOWCOW[gracz.wierzchowiec] ?? 'brak'})
      </div>

      {gracz.wierzchowiec > 0 && (
        <img
          className="postac-wierzchowiec-obraz"
          style={styl(PORTRET_WIERZCHOWCA)}
          src={`/res/sfgame/scr/char/mount_portrait_${gracz.wierzchowiec}.jpg`}
          alt=""
        />
      )}

      <img className="postac-ikona-pancerza" style={styl(IKONA_PANCERZA)} src={IKONA_TARCZY} alt="" />
      <div className="postac-pancerz" style={styl(PANCERZ)}>
        Pancerz: {gracz.pancerz}
      </div>

      {/*
        Osiem odznak, kazda w pieciu stopniach (`ach-{numer}-{stopien}.png`).
        Swieza postac ma wszystkie na zerze — i tak jest poprawnie. Prawdziwe
        stopnie dojda razem z portem osiagniec.
      */}
      <div className="postac-osiagniecia" style={styl(OSIAGNIECIA)} title="Osiągnięcia">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((numer, i) => (
          <img key={numer} src={`${KATALOG_ODZNAK}ach-${numer}-${gracz.osiagniecia?.[i] ?? 0}.png`} alt="" />
        ))}
      </div>

      {pokazany && (
        <PodpowiedzPrzedmiotu
          przedmiot={pokazany}
          miejsce={srodekMiejsca(pokazany)}
          onZamknij={() => setPokazany(null)}
        />
      )}

      {/* Przedmiot w locie — leci za palcem i niczego nie zaslania klikom. */}
      {ciagniety && (
        <img
          className="postac-ciagniety"
          src={ciagniety.przedmiot.obrazek}
          alt=""
          style={{ left: ciagniety.x - BOK_MIEJSCA / 2, top: ciagniety.y - BOK_MIEJSCA / 2 }}
        />
      )}
    </div>
  );
}

/**
 * Gdzie stoi miejsce, w ktorym lezy przedmiot — podpowiedz ma sie pokazac
 * nad nim, a nie w przypadkowym rogu.
 */
function srodekMiejsca(przedmiot: Przedmiot): { x: number; y: number } {
  const ramka =
    MIEJSCA.find((m) => m.slot === przedmiot.slot)?.ramka ??
    PLECAK[przedmiot.slot - PIERWSZY_SLOT_PLECAKA] ??
    PLECAK[0]!;

  return {
    x: parseFloat(ramka.lewo) + parseFloat(ramka.szerokosc) / 2,
    y: parseFloat(ramka.gora),
  };
}

/**
 * Opis postaci.
 *
 * Oryginal trzyma tam pole tekstowe: klikniecie ustawia w nim kursor,
 * a zapis idzie na serwer dopiero przy utracie zaznaczenia
 * (`LeavePlayerDesc` wysyla `ACT_SET_PLAYER_DESC`). Robimy tak samo.
 */
function Opis({ wartosc, onZapisz }: { wartosc: string; onZapisz: (opis: string) => void }) {
  const [pisze, setPisze] = useState(false);
  const [tresc, setTresc] = useState(wartosc);
  const pole = useRef<HTMLTextAreaElement>(null);

  // Opis moze przyjsc z serwera po zapisie — wtedy pole ma pokazac nowa tresc.
  useEffect(() => {
    if (!pisze) setTresc(wartosc);
  }, [wartosc, pisze]);

  useEffect(() => {
    if (pisze) pole.current?.focus();
  }, [pisze]);

  if (!pisze) {
    return (
      <div
        className="postac-opis"
        style={styl(OPIS)}
        role="button"
        tabIndex={0}
        title="Kliknij, aby opisać swoją postać"
        onClick={() => setPisze(true)}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setPisze(true)}
      >
        {tresc || <span className="zacheta">{ZACHETA_DO_OPISU}</span>}
      </div>
    );
  }

  return (
    <textarea
      ref={pole}
      className="postac-opis"
      style={styl(OPIS)}
      value={tresc}
      maxLength={500}
      onChange={(e) => setTresc(e.target.value)}
      onBlur={() => {
        setPisze(false);
        if (tresc !== wartosc) onZapisz(tresc);
      }}
    />
  );
}

/**
 * Jedno miejsce na przedmiot.
 *
 * `data-slot` jest tu po to, zeby przeciaganie moglo odczytac numer
 * miejsca wprost z elementu pod palcem — inaczej trzeba by trzymac osobna
 * mape wspolrzednych i pilnowac, zeby nie rozjechala sie z ukladem.
 */
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

  const sugestia = sugerowane ? (
    <img className="podpowiedz-miejsca" src={`${KATALOG_SLOTOW}slot_suggestion.png`} alt="" />
  ) : null;

  // Puste miejsce nie ma czego pokazywac, wiec zostaje zwyklym kafelkiem.
  if (!przedmiot) {
    return (
      <div className={klasy.join(' ')} style={styl(ramka)} title={nazwa} data-slot={slot}>
        {pusty && <img className="pusty" src={KATALOG_SLOTOW + pusty} alt="" />}
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
        // Przedmiot w locie znika ze swojego miejsca — leci za palcem.
        style={ciagniety?.slot === slot ? { visibility: 'hidden' } : undefined}
        src={przedmiot.obrazek}
        alt={nazwa}
        /*
         * Bez tego przegladarka zaczyna WLASNE przeciaganie obrazka
         * (to od upuszczania plików), a ono natychmiast przerywa nasze
         * zdarzenia wskaznika zdarzeniem `pointercancel`. Przedmiot
         * podnosil sie i w tej samej chwili wracal na miejsce.
         */
        draggable={false}
        onError={(e) => {
          e.currentTarget.style.display = 'none';
        }}
      />
      {sugestia}
    </button>
  );
}
