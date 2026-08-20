/**
 * Pasek postepu wyprawy.
 *
 * Rama w punkcie POS_QUESTBAR = (390, 580), napis z pozostalym czasem
 * w POS_QUESTBAR_LABEL = (778, 625), przycisk przerwania
 * w POS_QUEST_CANCEL = (780, 700).
 *
 * ZEGAR JEST SERWEROWY. Serwer podaje `koniec` i `teraz` w swoim czasie;
 * zapamietujemy roznice wobec zegara przegladarki i odliczamy od niej.
 * Gdyby gracz przestawil zegarek, pasek doszedlby do konca wczesniej —
 * ale rozliczenie i tak robi serwer i ono sie nie uda.
 */

import { useEffect, useState } from 'react';
import { PODPISY } from '../../gra/karczma-teksty';
import {
  OBRAZ_PASKA,
  OBRAZ_WYPELNIENIA,
  POSTEP,
  POSTEP_NAPIS,
  POSTEP_PRZERWIJ,
  POSTEP_WYPELNIENIE,
  czas,
} from '../../gra/karczmaUklad';
import type { StanKarczmy } from '../../gra/typy';

export function PostepWyprawy({
  stan,
  onPrzerwij,
  onPrzyspiesz,
  onKoniecCzasu,
}: {
  stan: StanKarczmy;
  onPrzerwij: () => void;
  onPrzyspiesz: () => void;
  onKoniecCzasu: () => void;
}) {
  const zadanie = stan.zadania[stan.wybraneZadanie - 1];
  const calosc = Math.max(1, zadanie?.sekundy ?? stan.koniec - stan.teraz);

  const [zostalo, setZostalo] = useState(() => Math.max(0, stan.koniec - stan.teraz));

  useEffect(() => {
    // Roznica miedzy zegarem serwera a naszym. Liczona raz, przy
    // otrzymaniu stanu — potem odliczamy juz lokalnie, zeby nie zasypywac
    // serwera zapytaniami co sekunde.
    const przesuniecie = stan.teraz * 1000 - Date.now();

    const przelicz = () => {
      const teraz = (Date.now() + przesuniecie) / 1000;
      const reszta = Math.max(0, stan.koniec - teraz);
      setZostalo(reszta);
      if (reszta <= 0) onKoniecCzasu();
    };

    przelicz();
    const licznik = setInterval(przelicz, 1000);
    return () => clearInterval(licznik);
  }, [stan.koniec, stan.teraz, onKoniecCzasu]);

  const zrobione = Math.min(1, Math.max(0, 1 - zostalo / calosc));

  return (
    <>
      <img
        style={{ left: POSTEP.lewo, top: POSTEP.gora, width: POSTEP.szerokosc, height: POSTEP.wysokosc }}
        src={OBRAZ_PASKA}
        alt=""
      />

      <div
        className="karczma-wypelnienie"
        style={{
          left: POSTEP_WYPELNIENIE.lewo,
          top: POSTEP_WYPELNIENIE.gora,
          width: Math.round(zrobione * POSTEP_WYPELNIENIE.szerokosc),
          height: POSTEP_WYPELNIENIE.wysokosc,
          backgroundImage: `url('${OBRAZ_WYPELNIENIA}')`,
        }}
      />

      <div className="karczma-czas" style={{ left: POSTEP_NAPIS.lewo, top: POSTEP_NAPIS.gora }}>
        {czas(zostalo)}
      </div>

      <button
        type="button"
        className="przycisk drugi karczma-przerwij"
        style={{
          left: POSTEP_PRZERWIJ.lewo,
          top: POSTEP_PRZERWIJ.gora,
          width: POSTEP_PRZERWIJ.szerokosc,
          minHeight: POSTEP_PRZERWIJ.wysokosc,
        }}
        onClick={onPrzerwij}
      >
        {PODPISY.przerwij}
      </button>

      {/*
        Grzyb konczy wyprawe od razu. Oryginal nie pozwala wydac
        OSTATNIEGO grzyba — odrzuca przy `mushroom <= 1` — wiec przy
        jednym grzybie przycisk jest wygaszony.
      */}
      <button
        type="button"
        className="przycisk karczma-przyspiesz"
        style={{
          left: POSTEP_PRZERWIJ.lewo - 220,
          top: POSTEP_PRZERWIJ.gora,
          width: POSTEP_PRZERWIJ.szerokosc,
          minHeight: POSTEP_PRZERWIJ.wysokosc,
        }}
        disabled={stan.grzyby <= 1}
        title={stan.grzyby <= 1 ? 'Za mało grzybów' : 'Zakończ wyprawę od razu za grzyba'}
        onClick={onPrzyspiesz}
      >
        {PODPISY.pomin}
        <img className="karczma-grzyb" src="/res/sfgame/if/icon_pilz.png" alt="grzyb" />
      </button>
    </>
  );
}
