/**
 * Stan gracza w postaci, w ktorej rozumie go nowy klient.
 *
 * Stary protokol wysylal 511 pol sklejonych ukosnikami, a znaczenie
 * kazdego pola bylo zaszyte w numerze indeksu. Nowy klient jest nasz,
 * wiec nie ma powodu tego powtarzac — idzie zwykly JSON z nazwami.
 */

import { LEVELS } from '../protocol/gamedata.js';
import { intval } from '../compat/php.js';

export interface Gracz {
  id: number;
  nick: string;
  poziom: number;
  klasa: number;
  rasa: number;
  plec: 'm' | 'f';
  /** face1..face9 — kolejne warstwy portretu. */
  wyglad: number[];

  srebro: number;
  grzyby: number;
  honor: number;

  doswiadczenie: number;
  doNastepnegoPoziomu: number;
  postepPoziomu: number;

  cechy: {
    sila: number;
    zrecznosc: number;
    intelekt: number;
    wytrzymalosc: number;
    szczescie: number;
  };

  zycie: number;
}

/**
 * Ile doswiadczenia trzeba na kolejny poziom.
 *
 * `LEVELS` to progi z `req.php`. Gracz na ostatnim poziomie tabeli nie
 * awansuje juz nigdzie — wtedy zwracamy jego wlasny prog, zeby pasek
 * pokazywal pelne wypelnienie zamiast dzielenia przez zero.
 */
function progPoziomu(poziom: number): number {
  return LEVELS[poziom] ?? LEVELS[LEVELS.length - 1] ?? 0;
}

/**
 * Punkty zycia. Odpowiednik wzoru z oryginalu: wytrzymalosc razy poziom,
 * ze wspolczynnikiem zaleznym od klasy — wojownik jest najtwardszy.
 */
function policzZycie(klasa: number, wytrzymalosc: number, poziom: number): number {
  const mnoznik = klasa === 1 ? 5 : klasa === 2 ? 2 : 4;
  return wytrzymalosc * mnoznik * (poziom + 1);
}

export function zbudujGracza(wiersz: Record<string, unknown>): Gracz {
  const poziom = intval(wiersz['lvl'] ?? 1);
  const doswiadczenie = intval(wiersz['exp'] ?? 0);

  const progObecny = progPoziomu(poziom - 1);
  const progNastepny = progPoziomu(poziom);
  const zakres = Math.max(1, progNastepny - progObecny);

  const wytrzymalosc = intval(wiersz['attr_wit'] ?? 10);
  const klasa = intval(wiersz['class'] ?? 1);

  return {
    id: intval(wiersz['user_id'] ?? 0),
    nick: String(wiersz['user_name'] ?? ''),
    poziom,
    klasa,
    rasa: intval(wiersz['race'] ?? 1),
    plec: intval(wiersz['gender'] ?? 1) === 2 ? 'f' : 'm',
    wyglad: [1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => intval(wiersz[`face${n}`] ?? 1)),

    srebro: intval(wiersz['silver'] ?? 0),
    grzyby: intval(wiersz['mushroom'] ?? 0),
    honor: intval(wiersz['honor'] ?? 0),

    doswiadczenie,
    doNastepnegoPoziomu: progNastepny,
    postepPoziomu: Math.min(1, Math.max(0, (doswiadczenie - progObecny) / zakres)),

    cechy: {
      sila: intval(wiersz['attr_str'] ?? 10),
      zrecznosc: intval(wiersz['attr_agi'] ?? 10),
      intelekt: intval(wiersz['attr_int'] ?? 10),
      wytrzymalosc,
      szczescie: intval(wiersz['attr_luck'] ?? 10),
    },

    zycie: policzZycie(klasa, wytrzymalosc, poziom),
  };
}
