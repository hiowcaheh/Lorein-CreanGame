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
  /**
   * Ile srebra kosztuje dokupienie kolejnego punktu kazdej cechy —
   * piec liczb w kolejnosci sila, zrecznosc, inteligencja,
   * wytrzymalosc, szczescie.
   */
  cenyCech: number[];

  /** Ile punktow kazdej cechy gracz juz dokupil ponad wartosc startowa. */
  cechyDokupione: number[];

  /** Polowa sily — pierwszy wiersz prawej kolumny. */
  obrona: number;
  unik: number;
  odpornosc: number;
  ciosKrytyczny: number;
  pancerz: number;
  /** Wierzchowiec, ktory DZIALA — po wygasnieciu najmu wraca zero. */
  wierzchowiec: number;
  /** Do kiedy najem, czas uniksowy. Zero, gdy wierzchowca nie ma. */
  wierzchowiecDo: number;

  ekwipunek: Przedmiot[];

  /** Klaser Dokladnosci: ile pozycji zebrano, albo -1, gdy gracza go nie ma. */
  klaser: number;

  /**
   * Magiczne Lustro — trzynascie znacznikow, po jednym na kawalek.
   * Komplet pozwala wejsc na arene i do lochow w trakcie wyprawy.
   */
  lustro: boolean[];

  /** Trzy miejsca na dzialajace mikstury; puste maja `rodzaj` rowny zeru. */
  mikstury: Mikstura[];

  /** Osiem odznak, kazda w stopniu 0..4. */
  osiagniecia: number[];
}

/** Dzialajaca mikstura w jednym z trzech miejsc postaci. */
export interface Mikstura {
  /** Numer mikstury, 0 gdy miejsce puste. */
  rodzaj: number;
  /** Sila dzialania — procent albo punkty. */
  wartosc: number;
  /** Ktora cechę podnosi: 1..5, albo 0 dla Eliksiru Niesmiertelnosci. */
  cecha: number;
  /** Kiedy przestanie dzialac — czas uniksowy. */
  koniec: number;
  /** Adres ikonki, pusty napis dla wolnego miejsca. */
  obrazek: string;
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
  /** Doswiadczenie JUZ z premiami — tak samo pokazuje je oryginal. */
  doswiadczenie: number;
  /** Z czego sklada sie premia do doswiadczenia, w procentach. */
  premie: { klaser: number; rzadkie: number };
  /** Numer krainy 1..21. */
  lokacja: number;
  /** Rodzaj wyprawy — z niego bierze sie jej tytul. */
  rodzaj: number;
  /** Premia rzadkiego zadania w procentach; zero przy zwyklym. */
  premia: number;
  /** Przedmiot czekajacy przy zadaniu, albo `null`. */
  nagrodaPrzedmiotowa: Przedmiot | null;
}

/** Przebieg walki odegrany po zakonczonej wyprawie. */
/** Cechy pokazywane pod portretem w walce. */
export interface CechyWalki {
  sila: number;
  zrecznosc: number;
  intelekt: number;
  wytrzymalosc: number;
  szczescie: number;
}

export interface StronaWalki {
  nazwa: string;
  zycie: number;
  klasa: number;
  poziom: number;
  cechy: CechyWalki;
  /**
   * Czym bije. Zero to gole piesci, wartosc dodatnia — bron, ujemna —
   * pazury i kly potwora (`$weapons` w `getQuestMonster`).
   */
  bron: number;
  /**
   * Ikona zalozonej broni. W oryginale to wlasnie ona leci przez ekran
   * przy ciezkiej galezi animacji — `null` znaczy, ze klient ma uzyc
   * grafiki zastepczej (piesc, kij, kosc, machniecie).
   */
  bronObrazek: string | null;
  /**
   * `charWeaponType` z klienta: 1 bron biala, 2 rozdzka maga, 3 luk
   * zwiadowcy. Kazdy typ ma inna galaz animacji i inne tempo.
   */
  typAnimacji: 1 | 2 | 3;
  /**
   * Klatki lecacego pocisku. Mag losuje z nich co tik, zwiadowca ma
   * jedna. Pusta tablica przy broni bialej.
   */
  pociski: string[];
  /** Czym wybucha trafienie przy broni dystansowej; `null` przy bialej. */
  pociskUderzenia: string | null;
  /** Ikona tarczy — staje po stronie obroncy, kiedy odbije cios. */
  tarczaObrazek: string | null;
}

export interface PrzebiegWalki {
  gracz: StronaWalki;
  potwor: StronaWalki & { obrazek: number };
  /**
   * Kolejne ciosy.
   *
   * `rodzaj`: 0 zwykly, 1 blok tarcza, 2 unik, 3 cios krytyczny. Przy
   * bloku i uniku obrazenia sa zerowe — i wtedy nie wypisujemy zera,
   * tylko slowo, tak jak oryginal.
   */
  ciosy: { kto: number; obrazenia: number; rodzaj: number; zycieObroncy: number }[];
}

/** Rozliczenie zakonczonej wyprawy. */
export interface Rozliczenie {
  wygrana: boolean;
  /** Kraina, w ktorej doszlo do starcia — jej obraz jest tlem walki. */
  lokacja: number;
  awans: number | null;
  nagroda: { zloto: number; doswiadczenie: number; honor: number; grzyby: number } | null;
  /**
   * Skladniki premii do nagrody, w procentach. Wyprawa ich nie odsyla —
   * tam premia siedzi juz w liczbie zadania; loch odsyla, bo tam nagroda
   * powstaje dopiero po walce.
   */
  premie?: { klaser: number };
  /**
   * Zdobyty przedmiot — caly, bo ekran walki pokazuje jego ikone
   * i podpowiedz ze statystykami, a nie sam napis.
   */
  zdobytyPrzedmiot: Przedmiot | null;
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
  /** Wierzchowiec, ktory dziala; zero znaczy „pieszo". */
  wierzchowiec: number;
  wolneMiejsceWPlecaku: boolean;
  zadania: Zadanie[];
  rozliczenie?: Rozliczenie | null;
  gracz?: Gracz;
}

/** Przedmiot lezacy na sklepowej pólce — z cena, ktorej plecak nie ma. */
export interface TowarSklepu extends Przedmiot {
  cena: { zloto: number; grzyby: number };
}

/** Stan sklepu — odpowiedz `GET /api/sklep/:numer`. */
export interface StanSklepu {
  /** 0 zbrojownia, 1 gabinet magii. */
  numer: number;
  towar: TowarSklepu[];
  /** Ile grzybow kosztuje wymiana calego towaru. */
  kosztWymiany: number;
  /** Kiedy towar odnowi sie sam — czas serwera w sekundach. */
  odnowienie: number;
  czasSerwera: number;
  gracz: Gracz;
}
