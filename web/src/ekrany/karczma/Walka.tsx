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

import { useEffect, useState } from 'react';
import { PODPISY, POTWORY } from '../../gra/karczma-teksty';
import { Portret } from '../../gra/Portret';
import {
  KLATKI_UDERZENIA,
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
  WALKA_WYSOKOSC_BRONI,
  obrazPotwora,
  type Ramka,
} from '../../gra/karczmaUklad';
import type { CechyWalki, Gracz, Rozliczenie } from '../../gra/typy';

/** Ile trwa jeden cios. */
const TEMPO_CIOSU = 620;

/** Kto uderzyl: 1 to bohater, 2 przeciwnik. */
const BOHATER = 1;

/**
 * Rodzaje ciosow z silnika walki (`setHit` w oryginale).
 *
 * Przy bloku i uniku obrazenia sa zerowe. Wypisanie tam „0" bylo mylace —
 * wygladalo na cios, ktory nic nie zrobil, a to jest cios ODBITY.
 */
const NAZWY_CIOSOW: Record<number, string> = {
  1: 'Blok!',
  2: 'Unik!',
  3: 'Cios krytyczny!',
};

/** Pieciowierszowa tabelka cech — te same podpisy, co na ekranie postaci. */
const WIERSZE_CECH: { nazwa: string; klucz: keyof CechyWalki }[] = [
  { nazwa: 'Siła', klucz: 'sila' },
  { nazwa: 'Zręczność', klucz: 'zrecznosc' },
  { nazwa: 'Inteligencja', klucz: 'intelekt' },
  { nazwa: 'Wytrzym.', klucz: 'wytrzymalosc' },
  { nazwa: 'Szczęście', klucz: 'szczescie' },
];

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
  const [zadanych, setZadanych] = useState(0);

  // Ciosy ida po kolei; po ostatnim pokazuje sie podsumowanie.
  useEffect(() => {
    if (zadanych >= walka.ciosy.length) return;
    const licznik = setTimeout(() => setZadanych((n) => n + 1), TEMPO_CIOSU);
    return () => clearTimeout(licznik);
  }, [zadanych, walka.ciosy.length]);

  const koniec = zadanych >= walka.ciosy.length;

  // Zycie po kazdej ze stron liczymy z ciosow, ktore juz padly.
  let zycieGracza = walka.gracz.zycie;
  let zyciePotwora = walka.potwor.zycie;
  for (const cios of walka.ciosy.slice(0, zadanych)) {
    if (cios.kto === BOHATER) zyciePotwora -= cios.obrazenia;
    else zycieGracza -= cios.obrazenia;
  }

  const ostatni = zadanych > 0 ? walka.ciosy[zadanych - 1] : undefined;
  const nazwaPotwora = POTWORY[walka.potwor.obrazek - 1] ?? walka.potwor.nazwa;

  /** Obrazek broni bohatera — z tego, co ma zalozone w slocie broni. */
  const bronBohatera = gracz.ekwipunek.find((p) => p.slot === 8)?.obrazek;

  return (
    <div className="walka" onClick={() => (koniec ? onZamknij() : setZadanych(walka.ciosy.length))}>
      <img className="walka-tlo" src="/res/sfgame/scr/fight/schlachtfeld.jpg" alt="" />

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
        obraz={
          <img
            src={obrazPotwora(walka.potwor.obrazek)}
            alt=""
            onError={(e) => {
              e.currentTarget.style.visibility = 'hidden';
            }}
          />
        }
      />

      {/* Ozdobna ramka miedzy tabelkami cech — `box2.png` z oryginalu. */}
      <img
        className="walka-ramka"
        style={ramkaNaStyl(WALKA_RAMKA_SRODKOWA)}
        src={OBRAZ_RAMKI_SRODKOWEJ}
        alt=""
      />

      {ostatni && !koniec && (
        <Cios
          key={zadanych}
          kto={ostatni.kto}
          rodzaj={ostatni.rodzaj}
          obrazenia={ostatni.obrazenia}
          bronGracza={walka.gracz.bron > 0 ? bronBohatera : undefined}
          bronPotwora={walka.potwor.bron}
        />
      )}

      {koniec && (
        <div className="walka-podsumowanie">
          <div className={`walka-wynik ${wygrana ? 'wygrana' : 'przegrana'}`}>
            {wygrana ? 'Zwycięstwo!' : 'Porażka'}
          </div>

          {nagroda && (
            <div className="walka-nagrody">
              <div>
                {PODPISY.doswiadczenie}: {nagroda.doswiadczenie.toLocaleString('pl-PL')}
              </div>
              <div>
                {PODPISY.wynagrodzenie} {Math.floor(nagroda.zloto / 100).toLocaleString('pl-PL')}
                <img src="/res/sfgame/if/icon_gold.png" alt="złota" />
                {String(nagroda.zloto % 100).padStart(2, '0')}
                <img src="/res/sfgame/if/icon_silber.png" alt="srebra" />
              </div>
              {nagroda.grzyby > 0 && (
                <div>
                  Znalezione grzyby: {nagroda.grzyby}
                  <img src="/res/sfgame/if/icon_pilz.png" alt="grzybów" />
                </div>
              )}
            </div>
          )}

          {awans !== null && <div className="walka-awans">Nowy poziom: {awans}!</div>}

          {zdobytyPrzedmiot && <div className="walka-przedmiot">Zdobyto przedmiot — leży w plecaku.</div>}

          {plecakBylPelny && (
            <div className="walka-przedmiot ostrzezenie">Nagroda przepadła — plecak był pełny.</div>
          )}

          <button type="button" className="przycisk walka-dalej" onClick={onZamknij}>
            {PODPISY.wroc}
          </button>
        </div>
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
        {Math.max(0, Math.round(zycie)).toLocaleString('pl-PL')}
      </div>

      <img className="walka-ramka" style={ramkaNaStyl(ramkaStatow)} src={OBRAZ_RAMKI_STATOW} alt="" />

      {WIERSZE_CECH.map((wiersz, i) => (
        <span key={wiersz.klucz}>
          <span className="walka-cecha" style={{ left: kolumny[0], top: WALKA_STATY_Y + i * WALKA_ODSTEP_STATOW }}>
            {wiersz.nazwa}
          </span>
          <span className="walka-cecha" style={{ left: kolumny[1], top: WALKA_STATY_Y + i * WALKA_ODSTEP_STATOW }}>
            {cechy[wiersz.klucz].toLocaleString('pl-PL')}
          </span>
        </span>
      ))}
    </>
  );
}

/**
 * Jeden cios: lecaca bron albo uderzenie piescia, a nad celem liczba
 * obrazen — albo slowo, gdy cios zostal odbity.
 *
 * Oryginal animuje bron lukiem od atakujacego do celu
 * (`POS_FIGHT_WEAPONS_Y` i obrot 280..380 stopni), a przy golych piesciach
 * pokazuje `smash1.png`..`smash6.png`.
 */
function Cios({
  kto,
  rodzaj,
  obrazenia,
  bronGracza,
  bronPotwora,
}: {
  kto: number;
  rodzaj: number;
  obrazenia: number;
  bronGracza?: string | undefined;
  bronPotwora: number;
}) {
  const odBohatera = kto === BOHATER;

  /*
   * Czym leci cios.
   *
   * Bohater bez broni i potwor z UJEMNYM numerem broni (pazury, kly,
   * maczugi z `$weapons` w `getQuestMonster`) uderzaja wprost — oryginal
   * pokazuje wtedy `smash*.png` zamiast lecacego przedmiotu.
   */
  const obrazBroni = odBohatera ? bronGracza : undefined;
  const piescia = obrazBroni === undefined || bronPotwora < 0;

  return (
    <>
      {piescia ? (
        <img
          className={`walka-uderzenie ${odBohatera ? 'w-prawo' : 'w-lewo'}`}
          style={{ top: WALKA_WYSOKOSC_BRONI - 100, left: WALKA_SRODEK_X - 143 }}
          src={KLATKI_UDERZENIA[0]}
          alt=""
        />
      ) : (
        <img
          className={`walka-bron ${odBohatera ? 'w-prawo' : 'w-lewo'}`}
          style={{ top: WALKA_WYSOKOSC_BRONI - 45, left: WALKA_SRODEK_X - 45 }}
          src={obrazBroni}
          alt=""
        />
      )}

      <div className={`walka-obrazenia ${odBohatera ? 'prawa' : 'lewa'}${rodzaj === 3 ? ' krytyk' : ''}`}>
        {NAZWY_CIOSOW[rodzaj] ?? `-${obrazenia.toLocaleString('pl-PL')}`}
        {rodzaj === 3 && <div className="walka-krytyk-liczba">-{obrazenia.toLocaleString('pl-PL')}</div>}
      </div>
    </>
  );
}
