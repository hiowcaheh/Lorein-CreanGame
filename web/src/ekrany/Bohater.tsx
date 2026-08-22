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
import {
  NAPIS_DO,
  NAPIS_TYMCZASOWO,
  dodatekZMikstury,
  nazwaMikstury,
  podpowiedzMikstury,
} from '../gra/mikstury';
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
  MIEJSCA_MIKSTUR,
  PIERWSZE_MIEJSCE_MIKSTURY,
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
  wierszePochodnych,
  WYPELNIENIE_PASKA,
  pustaBron,
  type Ramka,
} from '../gra/ekranPostaci';
import type { Gracz, Mikstura, Przedmiot } from '../gra/typy';

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

/** Rodzaj przedmiotu, ktory sie pije. */
const RODZAJ_MIKSTURY = 12;

export function Bohater({
  gracz,
  onZapiszOpis,
  onPrzenies,
  onWypij,
  onUsunMiksture,
}: {
  gracz: Gracz;
  onZapiszOpis: (opis: string) => void;
  /** `cel === null` znaczy „zaloz na wlasciwe miejsce". */
  onPrzenies: (zrodlo: number, cel: number | null) => void;
  /** Wypicie mikstury lezacej w podanym miejscu plecaka. */
  onWypij: (slot: number) => void;
  /** Odwolanie dzialania mikstury z miejsca 1..3. */
  onUsunMiksture: (miejsce: number) => void;
}) {
  const [pokazany, setPokazany] = useState<Przedmiot | null>(null);
  const [pokazanaMikstura, setPokazanaMikstura] = useState<number | null>(null);
  const ekran = useRef<HTMLDivElement>(null);

  const przeciaganie = usePrzeciaganie({
    ekran,
    onKlik: (przedmiot) => setPokazany((p) => (p?.slot === przedmiot.slot ? null : przedmiot)),
    onUpusc: (przedmiot, cel) => {
      setPokazany(null);

      /*
       * Mikstury sie nie zaklada — sie ja pije. Oryginal robi to samo
       * i tym samym ruchem: klient wysyla zwykle przeniesienie na postac,
       * a serwer dla rodzaju 12 zamiast zakladac przedmiot zapisuje
       * dzialanie. Upuszczenie wprost na miejsce eliksiru dziala tak samo.
       */
      const naMiksture = cel !== null && cel >= PIERWSZE_MIEJSCE_MIKSTURY;
      if (przedmiot.typ === RODZAJ_MIKSTURY && (cel === null || naMiksture)) {
        onWypij(przedmiot.slot);
        return;
      }

      if (naMiksture) return;
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
    if (!pokazany && pokazanaMikstura === null) return;

    const zamknij = (e: PointerEvent) => {
      const cel = e.target as Element | null;
      if (cel?.closest('[data-slot]') || cel?.closest('.podpowiedz')) return;
      setPokazany(null);
      setPokazanaMikstura(null);
    };

    document.addEventListener('pointerdown', zamknij);
    return () => document.removeEventListener('pointerdown', zamknij);
  }, [pokazany, pokazanaMikstura]);

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
    { nazwa: 'Siła', wartosc: gracz.cechy.sila },
    { nazwa: 'Zręczność', wartosc: gracz.cechy.zrecznosc },
    { nazwa: 'Inteligencja', wartosc: gracz.cechy.intelekt },
    // "Wytrzym." — skrot jest w oryginalnym pliku jezykowym (pozycja 63);
    // pelne slowo nie miesci sie w kolumnie szerokiej na 101 px.
    { nazwa: 'Wytrzym.', wartosc: gracz.cechy.wytrzymalosc },
    { nazwa: 'Szczęście', wartosc: gracz.cechy.szczescie },
  ].map((c, i) => {
    /*
     * Dodatek z mikstury stoi w oryginale osobnym wierszem podpowiedzi
     * cechy: „Dzial. tymczas.  12 (do: 14:05)". Tutaj jest w dymku
     * przegladarki, bo caly ekran postaci uzywa `title`.
     */
    const dodatek = dodatekZMikstury(gracz.mikstury ?? [], i + 1, c.wartosc);
    return {
      ...c,
      wartosc: String(c.wartosc),
      tytul: dodatek ? `${NAPIS_TYMCZASOWO} ${dodatek.ile} (${NAPIS_DO} ${dodatek.doKiedy})` : '',
    };
  });

  /*
   * Prawa kolumna zalezy od KLASY — sklada ja `wierszePochodnych`,
   * ten sam kod, co w sklepach. Wojownik ma „Obrazenia" w wierszu
   * pierwszym, lowca w drugim, mag w trzecim; wiersz zajety przez
   * obrazenia traci swoj zwykly podpis („Obrona", „Zdolnosc uniku"
   * albo „Odpornosc").
   */
  const pochodne = wierszePochodnych(gracz);

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
          <span
            className="postac-cecha"
            style={{ left: KOLUMNY_CECH[0], top: wiersz(i) }}
            title={cecha.tytul}
          >
            {cecha.nazwa}
          </span>
          <span
            className="postac-cecha"
            style={{ left: KOLUMNY_CECH[1], top: wiersz(i) }}
            title={cecha.tytul}
          >
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

      {/*
        Trzy miejsca na dzialajace mikstury. Dwuklik odwoluje dzialanie —
        tak samo jak `PotionDoubleClick` w oryginale, ktory wysyla
        `ACT_KILL_POTION` z numerem miejsca.
      */}
      {MIEJSCA_MIKSTUR.map((r, i) => (
        <MiejsceMikstury
          key={`mikstura${i}`}
          numer={i + 1}
          ramka={r}
          mikstura={gracz.mikstury?.[i]}
          onKlik={() => setPokazanaMikstura((m) => (m === i ? null : i))}
          onDwuklik={() => {
            setPokazanaMikstura(null);
            onUsunMiksture(i + 1);
          }}
        />
      ))}

      {pokazanaMikstura !== null && gracz.mikstury?.[pokazanaMikstura]?.rodzaj ? (
        <PodpowiedzMikstury
          mikstura={gracz.mikstury[pokazanaMikstura]!}
          ramka={MIEJSCA_MIKSTUR[pokazanaMikstura]!}
        />
      ) : null}

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
 * Jedno z trzech miejsc na dzialajaca miksture.
 *
 * Puste miejsce jest przezroczyste — w oryginale stoi tam `C_EMPTY`,
 * czyli po prostu nic. Klikniecie pokazuje podpowiedz, dwuklik odwoluje
 * dzialanie (`PotionSingleClick` / `PotionDoubleClick`).
 */
function MiejsceMikstury({
  numer,
  ramka,
  mikstura,
  onKlik,
  onDwuklik,
}: {
  numer: number;
  ramka: Ramka;
  mikstura?: Mikstura | undefined;
  onKlik: () => void;
  onDwuklik: () => void;
}) {
  const slot = PIERWSZE_MIEJSCE_MIKSTURY + numer - 1;

  if (!mikstura || mikstura.rodzaj === 0) {
    return (
      <div
        className="postac-mikstura pusta"
        style={styl(ramka)}
        data-slot={slot}
        title="Wolne miejsce na eliksir"
      />
    );
  }

  return (
    <button
      type="button"
      className="postac-mikstura"
      style={styl(ramka)}
      data-slot={slot}
      title={nazwaMikstury(mikstura.rodzaj)}
      onClick={onKlik}
      onDoubleClick={onDwuklik}
    >
      <img src={mikstura.obrazek} alt={nazwaMikstury(mikstura.rodzaj)} draggable={false} />
    </button>
  );
}

/**
 * Podpowiedz dzialajacej mikstury — cztery wiersze z `EnablePopup`
 * klienta: nazwa, podniesiona cecha z sila dzialania, godzina konca
 * i zdanie o tym, jak dzialanie odwolac.
 */
function PodpowiedzMikstury({ mikstura, ramka }: { mikstura: Mikstura; ramka: Ramka }) {
  const { nazwa, wiersze, jakOdwolac } = podpowiedzMikstury(mikstura);

  const SZEROKOSC = 300;
  const wysokosc = 16 + (2 + wiersze.length) * 26;
  const srodek = parseFloat(ramka.lewo) + parseFloat(ramka.szerokosc) / 2;

  return (
    <div
      className="podpowiedz"
      style={{
        left: Math.min(Math.max(0, srodek - SZEROKOSC / 2), 1000 - SZEROKOSC),
        top: Math.max(0, parseFloat(ramka.gora) - wysokosc - 8),
        width: SZEROKOSC,
      }}
      role="dialog"
      aria-label={nazwa}
    >
      <div className="nazwa">{nazwa}</div>
      {wiersze.map((w) => (
        <div className="wiersz" key={w.etykieta}>
          <span>{w.etykieta}</span>
          <span style={{ left: 137 }}>{w.wartosc}</span>
        </div>
      ))}
      <div className="cytat">{jakOdwolac}</div>
    </div>
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
