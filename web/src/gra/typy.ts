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
  /** Klasa, dla ktorej przedmiot jest przeznaczony (1 wojownik, 2 mag, 3 lowca). */
  podtyp: number;
  /** Numer w tablicy przedmiotow danego rodzaju — z niego bierze sie nazwa. */
  numer: number;
  /** Poziom ulepszenia; w nazwie pokazywany jako " (+N)". */
  ulepszenie: number;
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

/** Jedno z trzech zadan w karczmie. */
export interface Zadanie {
  numer: 1 | 2 | 3;
  /** Dlugosc w jednostkach po piec minut. */
  dlugosc: number;
  /** Ile naprawde potrwa — z uwzglednieniem wierzchowca. */
  sekundy: number;
  zloto: number;
  doswiadczenie: number;
  /** Numer krainy 1..21. */
  lokacja: number;
  /** Premia rzadkiego zadania w procentach; zero przy zwyklym. */
  premia: number;
  /** Czy przy zadaniu czeka przedmiot do zdobycia. */
  nagrodaPrzedmiotowa: boolean;
}

/** Przebieg walki odegrany po zakonczonej wyprawie. */
export interface PrzebiegWalki {
  gracz: { nazwa: string; zycie: number; klasa: number; poziom: number };
  potwor: { nazwa: string; zycie: number; klasa: number; poziom: number; obrazek: number };
  /** Kolejne ciosy: kto uderzyl i ile zabral zycia. */
  ciosy: { kto: number; obrazenia: number }[];
}

/** Rozliczenie zakonczonej wyprawy. */
export interface Rozliczenie {
  wygrana: boolean;
  awans: number | null;
  nagroda: { zloto: number; doswiadczenie: number; honor: number; grzyby: number } | null;
  zdobytyPrzedmiot: { nazwaSlotu: number } | null;
  /** Nagroda przepadla, bo w plecaku nie bylo miejsca. */
  plecakBylPelny: boolean;
  walka: PrzebiegWalki;
}

/** Stan karczmy tak, jak podaje go backend. */
export interface StanKarczmy {
  wytrzymalosc: number;
  wytrzymaloscMaks: number;
  piwa: number;
  piwaMaks: number;
  progZaZdrowy: number;
  grzyby: number;
  /** 0 wolny, 2 na wyprawie. */
  status: number;
  wybraneZadanie: number;
  /** Czas SERWERA, o ktorym wyprawa sie konczy. */
  koniec: number;
  /** Czas serwera w chwili odpowiedzi — z niego liczymy pozostaly czas. */
  teraz: number;
  wolneMiejsceWPlecaku: boolean;
  zadania: Zadanie[];
  rozliczenie?: Rozliczenie | null;
  gracz?: Gracz;
}
