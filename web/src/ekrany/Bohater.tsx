/**
 * Ekran postaci.
 *
 * Tlo to dwa oryginalne obrazy po 500x700 (lewa polowa z miejscami na
 * przedmioty, prawa z krajobrazem). Wszystko inne lezy na nich w miejscach
 * wyliczonych ze stalych `POS_CHAR_*` klienta Flash — tyle ze w procentach,
 * wiec caly ekran skaluje sie razem z oknem.
 */

import { Portret } from '../gra/Portret';
import { NAZWY_KLAS, NAZWY_RAS } from '../gra/portret';
import {
  CECHY_LEWO,
  CECHY_PRAWO,
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

  return (
    <div className="postac">
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

      {/* --- cechy i wartosci pochodne --- */}
      <div className="postac-cechy lewo" style={styl(CECHY_LEWO)}>
        <Wiersz nazwa="Siła" wartosc={gracz.cechy.sila} />
        <Wiersz nazwa="Zręczność" wartosc={gracz.cechy.zrecznosc} />
        <Wiersz nazwa="Inteligencja" wartosc={gracz.cechy.intelekt} />
        <Wiersz nazwa="Wytrzym." wartosc={gracz.cechy.wytrzymalosc} />
        <Wiersz nazwa="Szczęście" wartosc={gracz.cechy.szczescie} />
      </div>

      <div className="postac-cechy prawo" style={styl(CECHY_PRAWO)}>
        <Wiersz nazwa="Obrażenia" wartosc={`~${gracz.obrazenia.srednio}`} tytul={`${gracz.obrazenia.min} – ${gracz.obrazenia.max}`} />
        <Wiersz nazwa="Zdolność uniku" wartosc={gracz.unik} />
        <Wiersz nazwa="Odporność" wartosc={gracz.odpornosc} />
        <Wiersz nazwa="Żywotność" wartosc={gracz.zycie} />
        <Wiersz nazwa="Cios krytyczny" wartosc={`${gracz.ciosKrytyczny}%`} />
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
        <img src={KATALOG_SLOTOW + 'icon_schild.jpg'} alt="" />
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

function Wiersz({
  nazwa,
  wartosc,
  tytul,
}: {
  nazwa: string;
  wartosc: string | number;
  tytul?: string | undefined;
}) {
  return (
    <div className="postac-wiersz" title={tytul ?? ''}>
      <span>{nazwa}</span>
      <b>{wartosc}</b>
    </div>
  );
}
