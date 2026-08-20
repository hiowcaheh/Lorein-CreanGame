/**
 * Ekran miasta — to, co gracz widzi zaraz po wejsciu do gry.
 *
 * Miasto sklada sie z trzech warstw (niebo, zabudowa, pierwszy plan) i
 * zmienia sie z pora dnia, dokladnie jak w oryginale. Po placu chodza
 * postacie — kazda ma wlasne klatki i wlasne tempo, zeby nie mrugaly
 * wszystkie naraz.
 *
 * Budynki sa klikalne: pod kursorem podswietlaja sie oryginalna grafika
 * podswietlenia, a klikniecie prowadzi do odpowiedniej zakladki.
 */

import { useEffect, useState } from 'react';
import {
  BUDYNKI,
  KATALOG_MIASTA,
  KLATKI_ARENY,
  POSTACIE,
  poraDnia,
  straznik,
  szerokoscProcent,
  warstwyMiasta,
  type Postac,
} from '../gra/miasto';

export function Miasto({ onIdzDo }: { onIdzDo: (zakladka: string) => void }) {
  const [pora, setPora] = useState(poraDnia);
  const [arenaZywa, setArenaZywa] = useState(false);

  // Gracz moze siedziec w grze przez zmiane pory dnia.
  useEffect(() => {
    const licznik = setInterval(() => setPora(poraDnia()), 60_000);
    return () => clearInterval(licznik);
  }, []);

  const warstwy = warstwyMiasta(pora);
  const wachta = straznik(pora);

  return (
    <div className="miasto">
      <img className="miasto-niebo" src={warstwy.niebo} alt="" />
      <img className="miasto-zabudowa" src={warstwy.miasto} alt="" />

      {POSTACIE.map((p) => (
        <Animowana key={p.klucz} postac={p} />
      ))}

      <img
        className="miasto-warstwa"
        src={wachta.obraz}
        alt=""
        style={{ left: wachta.polozenie.lewo, top: wachta.polozenie.gora, width: szerokoscProcent(wachta.szerokosc) }}
      />

      {/* Pierwszy plan zaslania postacie — jak w oryginale. */}
      <img className="miasto-przod" src={warstwy.przod} alt="" />

      {BUDYNKI.map((b) => (
        <button
          key={b.klucz}
          className="miasto-budynek"
          title={b.nazwa}
          aria-label={b.nazwa}
          onClick={() => onIdzDo(b.zakladka)}
          onMouseEnter={() => b.klucz === 'arena' && setArenaZywa(true)}
          onMouseLeave={() => b.klucz === 'arena' && setArenaZywa(false)}
          style={{ left: b.polozenie.lewo, top: b.polozenie.gora, width: szerokoscProcent(b.szerokosc) }}
        >
          <img src={KATALOG_MIASTA + b.podswietlenie} alt="" />
          <span>{b.nazwa}</span>
        </button>
      ))}

      {/* Chmurki "POFF" nad arena — tylko gdy gracz na nia patrzy. */}
      {arenaZywa && (
        <Animowana
          postac={{
            klucz: 'arena-ono',
            klatki: KLATKI_ARENY,
            polozenie: { lewo: '0%', gora: '0%' },
            szerokosc: 577,
            tempo: 220,
          }}
        />
      )}
    </div>
  );
}

function Animowana({ postac }: { postac: Postac }) {
  const [klatka, setKlatka] = useState(0);

  useEffect(() => {
    const licznik = setInterval(() => setKlatka((k) => (k + 1) % postac.klatki.length), postac.tempo);
    return () => clearInterval(licznik);
  }, [postac.klatki.length, postac.tempo]);

  return (
    <img
      className="miasto-warstwa"
      src={KATALOG_MIASTA + postac.klatki[klatka]}
      alt=""
      style={{
        left: postac.polozenie.lewo,
        top: postac.polozenie.gora,
        width: szerokoscProcent(postac.szerokosc),
      }}
    />
  );
}
