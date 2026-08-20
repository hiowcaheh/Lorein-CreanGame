/** Stan gracza tak, jak podaje go backend (`src/api/gracz.ts`). */
export interface Gracz {
  id: number;
  nick: string;
  poziom: number;
  klasa: number;
  rasa: number;
  plec: 'm' | 'f';
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

  opis: string;

  obrazenia: { min: number; max: number; srednio: number };
  unik: number;
  odpornosc: number;
  ciosKrytyczny: number;
  pancerz: number;
  wierzchowiec: number;

  ekwipunek: Przedmiot[];

  /** Osiem odznak, kazda w stopniu 0..4. */
  osiagniecia: number[];
}

/** Przedmiot w ekwipunku albo w plecaku. */
export interface Przedmiot {
  slot: number;
  typ: number;
  podtyp: number;
  obrazek: string;
  obrazenia: { min: number; max: number };
  atrybuty: { rodzaj: number; wartosc: number }[];
  zloto: number;
  grzyby: number;
}

export interface OdpowiedzZTokenem {
  token: string;
  gracz: Gracz;
}
