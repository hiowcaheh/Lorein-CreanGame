/**
 * Ekran postaci.
 *
 * Tlo to dwa oryginalne obrazy po 500x700 (lewa polowa z miejscami na
 * przedmioty, prawa z krajobrazem). Wszystko inne lezy na nich w miejscach
 * wyliczonych ze stalych `POS_CHAR_*` klienta Flash — tyle ze w procentach,
 * wiec caly ekran skaluje sie razem z oknem.
 */

import { Fragment } from 'react';
import { useSkalaPisma } from '../gra/useSkalaPisma';
import { Portret } from '../gra/Portret';
import { NAZWY_KLAS, NAZWY_RAS } from '../gra/portret';
import {
  CECHY,
  KOLUMNY_CECH,
  WYSOKOSC_WIERSZA,
  HONOR,
  KATALOG_SLOTOW,
  MIEJSCA,
  KATALOG_ODZNAK,
  NAZWA_W_POLU,
  OPIS,
  OSIAGNIECIA,
  PANCERZ,
  PASEK_DOSWIADCZENIA,
  PLECAK,
  PORTRET,
  TLO_LEWE,
  TLO_PRAWE,
  WIERZCHOWIEC,
  pustaBron,
  type Ramka,
} from '../gra/ekranPostaci';
import type { Gracz, Przedmiot } from '../gra/typy';

const NAZWY_WIERZCHOWCOW = ['brak', 'Osioł', 'Koń', 'Tygrys', 'Smok'];

function styl(r: Ramka): React.CSSProperties {
  return { left: r.lewo, top: r.gora, width: r.szerokosc, height: r.wysokosc };
}

export function Bohater({ gracz }: { gracz: Gracz }) {
  const wPlecaku = gracz.ekwipunek.filter((p) => p.slot >= 10);
  const ekran = useSkalaPisma<HTMLDivElement>();

  return (
    <div className="postac" ref={ekran}>
      <img className="postac-tlo lewe" src={TLO_LEWE} alt="" />
      <img className="postac-tlo prawe" src={TLO_PRAWE} alt="" />

      {/* --- miejsca na przedmioty --- */}
      {MIEJSCA.map((m) => {
        const przedmiot = gracz.ekwipunek.find((p) => p.slot === m.slot);
        const pusty = m.slot === 8 ? pustaBron(gracz.klasa) : m.pusty;
        return (
          <Miejsce key={m.slot} nazwa={m.nazwa} ramka={m.ramka} pusty={pusty} przedmiot={przedmiot} />
        );
      })}

      {PLECAK.map((r, i) => (
        <Miejsce key={`plecak${i}`} nazwa={`Plecak ${i + 1}`} ramka={r} przedmiot={wPlecaku[i]} />
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
        <div className="wypelnienie" style={{ width: `${Math.round(gracz.postepPoziomu * 100)}%` }} />
        <span>
          Pzm {gracz.poziom} · {gracz.doswiadczenie} / {gracz.doNastepnegoPoziomu}
        </span>
      </div>

      {/*
        Cechy i wartosci pochodne w JEDNEJ siatce o kolumnach z oryginalu.
        Dwa osobne bloki obok siebie rozjezdzaly sie, bo kazdy ustawial
        szerokosci po swojemu.
      */}
      <div
        className="postac-cechy"
        style={{
          ...styl(CECHY),
          gridTemplateColumns: KOLUMNY_CECH,
          gridAutoRows: WYSOKOSC_WIERSZA,
        }}
      >
        {[
          { nazwa: 'Siła', wartosc: gracz.cechy.sila },
          { nazwa: 'Zręczność', wartosc: gracz.cechy.zrecznosc },
          { nazwa: 'Inteligencja', wartosc: gracz.cechy.intelekt },
          { nazwa: 'Wytrzym.', wartosc: gracz.cechy.wytrzymalosc },
          { nazwa: 'Szczęście', wartosc: gracz.cechy.szczescie },
        ].map((cecha, i) => {
          const pochodne = [
            { nazwa: 'Obrażenia', wartosc: `~${gracz.obrazenia.srednio}`, tytul: `${gracz.obrazenia.min} – ${gracz.obrazenia.max}` },
            { nazwa: 'Zdolność uniku', wartosc: String(gracz.unik) },
            { nazwa: 'Odporność', wartosc: String(gracz.odpornosc) },
            { nazwa: 'Żywotność', wartosc: String(gracz.zycie) },
            { nazwa: 'Cios krytyczny', wartosc: `${gracz.ciosKrytyczny}%` },
          ][i]!;

          return (
            <Fragment key={cecha.nazwa}>
              <span className="nazwa">{cecha.nazwa}</span>
              <b className="wartosc">{cecha.wartosc}</b>
              <button
                type="button"
                className="plus"
                title={`Dodaj punkt: ${cecha.nazwa}`}
                aria-label={`Dodaj punkt: ${cecha.nazwa}`}
                disabled
              />
              <span className="nazwa" title={pochodne.tytul ?? ''}>
                {pochodne.nazwa}
              </span>
              <b className="wartosc">{pochodne.wartosc}</b>
            </Fragment>
          );
        })}
      </div>

      {/* --- prawa polowa --- */}
      <div className="postac-honor" style={styl(HONOR)}>
        <img src="/res/ui/krazek.png" alt="" />
        <span>Poz.: {gracz.poziom}</span>
        <span>Cześć: {gracz.honor}</span>
      </div>

      <div className="postac-opis" style={styl(OPIS)}>
        {gracz.opis || 'W tym miejscu możesz opisać swoją postać.'}
      </div>

      <div className="postac-wierzchowiec" style={styl(WIERZCHOWIEC)}>
        Wierzchowiec: ({NAZWY_WIERZCHOWCOW[gracz.wierzchowiec] ?? 'brak'})
      </div>

      <div className="postac-pancerz" style={styl(PANCERZ)}>
        <img src="/res/ui/tarcza-ikona.png" alt="" />
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
    </div>
  );
}

function Miejsce({
  nazwa,
  ramka,
  pusty,
  przedmiot,
}: {
  nazwa: string;
  ramka: Ramka;
  pusty?: string | undefined;
  przedmiot?: Przedmiot | undefined;
}) {
  return (
    <div className="postac-slot" style={styl(ramka)} title={nazwa}>
      {przedmiot ? (
        <img
          src={przedmiot.obrazek}
          alt={nazwa}
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
      ) : pusty ? (
        <img className="pusty" src={KATALOG_SLOTOW + pusty} alt="" />
      ) : null}
    </div>
  );
}


