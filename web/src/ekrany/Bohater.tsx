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
import { nazwaPrzedmiotu } from '../gra/przedmioty';
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

function styl(r: Ramka): React.CSSProperties {
  return { left: r.lewo, top: r.gora, width: r.szerokosc, height: r.wysokosc };
}

/** Wiersz cech: POS_CHAR_PROP_Y + i * REL_CHAR_PROP_Y, minus poczatek ekranu. */
function wiersz(i: number): number {
  return WIERSZ_CECHY_Y - 100 + i * ODSTEP_WIERSZA;
}

export function Bohater({ gracz, onZapiszOpis }: { gracz: Gracz; onZapiszOpis: (opis: string) => void }) {
  const wPlecaku = gracz.ekwipunek.filter((p) => p.slot >= 10);
  const [pokazany, setPokazany] = useState<Przedmiot | null>(null);

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
    <div className="postac">
      <img className="postac-tlo lewe" src={TLO_LEWE} alt="" />
      <img className="postac-tlo prawe" src={TLO_PRAWE} alt="" />

      {/* --- miejsca na przedmioty --- */}
      {MIEJSCA.map((m) => {
        const przedmiot = gracz.ekwipunek.find((p) => p.slot === m.slot);
        const pusty = m.slot === 8 ? pustaBron(gracz.klasa) : m.pusty;
        return (
          <Miejsce
            key={m.slot}
            nazwa={m.nazwa}
            ramka={m.ramka}
            pusty={pusty}
            przedmiot={przedmiot}
            onPokaz={setPokazany}
          />
        );
      })}

      {PLECAK.map((r, i) => (
        <Miejsce
          key={`plecak${i}`}
          nazwa={`Plecak ${i + 1}`}
          ramka={r}
          przedmiot={wPlecaku[i]}
          onPokaz={setPokazany}
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
          miejsce={srodekMiejsca(pokazany, gracz)}
          onZamknij={() => setPokazany(null)}
        />
      )}
    </div>
  );
}

/**
 * Gdzie stoi miejsce, w ktorym lezy przedmiot — podpowiedz ma sie pokazac
 * nad nim, a nie w przypadkowym rogu.
 */
function srodekMiejsca(przedmiot: Przedmiot, gracz: Gracz): { x: number; y: number } {
  const wPlecaku = gracz.ekwipunek.filter((p) => p.slot >= 10);
  const ramka =
    MIEJSCA.find((m) => m.slot === przedmiot.slot)?.ramka ??
    PLECAK[wPlecaku.indexOf(przedmiot)] ??
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

function Miejsce({
  nazwa,
  ramka,
  pusty,
  przedmiot,
  onPokaz,
}: {
  nazwa: string;
  ramka: Ramka;
  pusty?: string | undefined;
  przedmiot?: Przedmiot | undefined;
  onPokaz: (przedmiot: Przedmiot | null) => void;
}) {
  // Puste miejsce nie ma czego pokazywac, wiec zostaje zwyklym kafelkiem.
  if (!przedmiot) {
    return (
      <div className="postac-slot" style={styl(ramka)} title={nazwa}>
        {pusty && <img className="pusty" src={KATALOG_SLOTOW + pusty} alt="" />}
      </div>
    );
  }

  return (
    <button
      type="button"
      className="postac-slot"
      style={styl(ramka)}
      title={nazwaPrzedmiotu(przedmiot)}
      onClick={() => onPokaz(przedmiot)}
    >
      <img
        src={przedmiot.obrazek}
        alt={nazwa}
        onError={(e) => {
          e.currentTarget.style.display = 'none';
        }}
      />
    </button>
  );
}
