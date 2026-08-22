/**
 * Losowanie przedmiotow — przepisane z `genItem()` oryginalnego
 * `sf555/req.php`.
 *
 * Obejmuje oba sklepy: ZBROJOWNIE („sklep 0" — bron, tarcze i czesci
 * zbroi, rodzaje 1-7) i GABINET MAGII („sklep 1" — amulety, pierscienie,
 * relikwie, mikstury i album, rodzaje 8-13). Klucze do lochow i odlamki
 * lustra rodza sie wylacznie w karczmie, wiec ich tu nie ma — oryginal
 * odrzuca rodzaj 11 poza wyprawa: `if ($type == 11 && $option !== "tavern")`.
 *
 * Wszystkie wzory i wszystkie stale pochodza z oryginalu. Tam, gdzie PHP
 * zachowuje sie inaczej niz JavaScript, jest o tym osobna uwaga.
 */

/** Rodzaje przedmiotow ze zbrojowni. */
const NAJNIZSZY_RODZAJ = 1;
const NAJWYZSZY_RODZAJ = 7;

/** Rodzaj przedmiotu: bron. */
const BRON = 1;
/** Rodzaj przedmiotu: tarcza — nosi ja wylacznie wojownik. */
const TARCZA = 2;

/** Klasa postaci: wojownik. */
const WOJOWNIK = 1;

/** Cecha „wszystkie piec naraz" i cecha „szczescie" — numery z oryginalu. */
const CECHA_WSZYSTKIE = 6;
const SZCZESCIE = 5;

/**
 * Mnoznik obrazen broni dla kolejnych klas: wojownik, mag, lowca.
 *
 * Mag bije najmocniej pojedynczym ciosem, bo ma najmniej zycia —
 * `$class_weap_multiplier` w oryginale.
 */
const MNOZNIK_BRONI = [2, 4.2, 2.5];

/**
 * Ile pancerza daje jeden poziom, zaleznie od klasy i rodzaju czesci.
 *
 * Wprost ze zmiennej `$factor` w `genItem()`. Wojownik nosi najciezsze
 * rzeczy, mag najlzejsze. Uwaga na kolejnosc przypisan w oryginale:
 * dla wojownika rodzaj 3 dostaje najpierw 12, a zaraz potem 15 — liczy
 * sie ta druga wartosc.
 */
const PANCERZ_NA_POZIOM: Record<number, Record<number, number>> = {
  1: { 3: 15, 4: 7, 5: 12, 6: 13, 7: 12 },
  2: { 3: 3, 4: 2, 5: 3, 6: 2, 7: 2 },
  3: { 3: 6, 4: 5, 5: 3, 6: 4, 7: 5 },
};

/** Ile blokuje tarcza — zalezy wylacznie od poziomu. */
function blokTarczy(poziom: number): number {
  if (poziom < 10) return 10;
  if (poziom < 25) return 15;
  return 25;
}

/** Zrodlo losowosci — wstrzykiwane, zeby testy mialy powtarzalny wynik. */
export interface Losowanie {
  /** Liczba calkowita z przedzialu domknietego, jak `rand()` w PHP. */
  (od: number, doWlacznie: number): number;
}

const LOSUJ: Losowanie = (od, doWlacznie) =>
  od + Math.floor(Math.random() * (doWlacznie - od + 1));

/**
 * Zaokraglanie takie, jak w PHP.
 *
 * PHP zaokragla polowki OD ZERA (`round(-0.5) === -1`), a JavaScript
 * zawsze w gore (`Math.round(-0.5) === -0`). Przy wartosciach przedmiotow
 * ujemne polowki praktycznie sie nie zdarzaja, ale wzory sa przepisane
 * doslownie i nie chcemy, zeby kiedys zaczely sie rozjezdzac po cichu.
 */
function zaokraglij(x: number): number {
  return x < 0 ? -Math.round(-x) : Math.round(x);
}

export interface Przedmiot {
  item_type: number;
  item_id: number;
  dmg_min: number;
  dmg_max: number;
  atr_type_1: number;
  atr_type_2: number;
  atr_type_3: number;
  atr_val_1: number;
  atr_val_2: number;
  atr_val_3: number;
  gold: number;
  mush: number;
}

export interface Ustawienia {
  /** `ITEMGEN_PMUSH_TWOSTATS` z `game_settings` — cena przedmiotu o dwoch cechach. */
  /**
   * NIEUZYWANE po odstepstwie opisanym przy `grzyby` — zostaje, bo to
   * wartosc z `game_settings` oryginalu i chcemy ja miec pod reka,
   * gdyby ktos kiedys wrocil do pelnej zgodnosci.
   */
  grzybyZaDwieCechy: number;
  /** `ITEMGEN_PMUSH_EPIC` — ile grzybow kosztuje przedmiot epicki. */
  grzybyZaEpik: number;
  /** `EPIC_CHANCE_SHOP` — na ilu setnych przedmiot w sklepie bywa epicki. */
  szansaNaEpik: number;
  /** `ITEMGEN_PMUSH_LIFEPOT` — cena mikstury zycia w grzybach. */
  grzybyZaMiksture: number;
  /** `POTION_DUR` — ile godzin dziala mikstura. */
  czasMikstury: number;
}

/** Wartosci z `game_settings` w `DATABASE.sql`. */
const DOMYSLNE: Ustawienia = {
  grzybyZaDwieCechy: 10,
  grzybyZaEpik: 15,
  szansaNaEpik: 2,
  grzybyZaMiksture: 15,
  czasMikstury: 72,
};

/** Numery sklepow z oryginalu. */
export const SKLEP_ZBROJOWNIA = 0;
export const SKLEP_GABINET = 1;

/** Rodzaje przedmiotow gabinetu magii. */
const AMULET = 8;
const PIERSCIEN = 9;
const KLUCZ = 11;
const MIKSTURA = 12;
const ALBUM = 13;

/** Cecha „czas dzialania" — `$potionDur` w oryginale. */
const CECHA_CZAS = 11;

/**
 * Co daje mikstura o danym numerze — `switch ($potionIDRand)`.
 *
 * Piatki numerow to kolejno cechy 1-5 w sile 10, 15 i 25 procent.
 * Szesnastka to mikstura zycia: dziala o 96 godzin dluzej i ma wlasna
 * ceche numer 12.
 */
/**
 * Rodzaj przedmiotu w gabinecie magii.
 *
 *     if (rand(1, 4) == 1 && $album == -1 && $lvl >= 10) $type = rand(8, 13);
 *     else                                                $type = rand(8, 12);
 *     if ($type == 11 && $option !== "tavern")             $type = rand(8, 10);
 *
 * Album trafia na pólke tylko wtedy, kiedy gracz go jeszcze nie ma.
 * Klucz do lochu (rodzaj 11) nie trafia nigdy — rodzi sie wylacznie
 * z wyprawy, a w sklepie jest natychmiast wymieniany.
 */
function losujRodzajGabinetu(poziom: number, maAlbum: boolean, losuj: Losowanie): number {
  const zAlbumem = losuj(1, 4) === 1 && !maAlbum && poziom >= 10;
  const typ = zAlbumem ? losuj(8, 13) : losuj(8, 12);
  return typ === KLUCZ ? losuj(8, 10) : typ;
}

/**
 * Rodzaj nagrody z WYPRAWY, gdy losowanie wskazalo „gabinet".
 *
 *     if (rand(1, 2) == 1 && check_for_key($SSID) === "go") $type = 11;
 *     else                                                  $type = rand(8, 10);
 *
 * `check_for_key()` sprawdza, czy w czterech pierwszych miejscach plecaka
 * nie lezy juz klucz — dopoki lezy, drugi nie wypadnie. To JEDYNE miejsce
 * w grze, w ktorym rodzi sie rodzaj 11.
 */
function losujRodzajZWyprawy(maJuzKlucz: boolean, losuj: Losowanie): number {
  return losuj(1, 2) === 1 && !maJuzKlucz ? KLUCZ : losuj(8, 10);
}

/**
 * Progi poziomu, od ktorych z wyprawy moze wypasc klucz do kolejnego lochu:
 *
 *     'dungeon_1' => [9, 1], 'dungeon_2' => [19, 2], ... 'dungeon_9' => [109, 9]
 *
 * Klucz wypada do PIERWSZEGO lochu, ktorego gracz jeszcze nie otworzyl
 * i na ktory ma juz poziom. Zamknietego lochu poznaje sie po `dungeon_N == 0`.
 */
export const PROGI_KLUCZY: { loch: number; poziom: number }[] = [
  { loch: 1, poziom: 9 },
  { loch: 2, poziom: 19 },
  { loch: 3, poziom: 29 },
  { loch: 4, poziom: 39 },
  { loch: 5, poziom: 49 },
  { loch: 6, poziom: 69 },
  { loch: 7, poziom: 79 },
  { loch: 8, poziom: 94 },
  { loch: 9, poziom: 109 },
];

/** Ile zlota jest wart klucz — `$item['gold'] = 25000`. */
export const CENA_KLUCZA = 25000;

function dzialanieMikstury(numer: number): { cecha: number; moc: number; dodatkowyCzas: number } {
  if (numer === 16) return { cecha: 12, moc: 25, dodatkowyCzas: 96 };
  const moce = [10, 15, 25];
  return { cecha: ((numer - 1) % 5) + 1, moc: moce[Math.floor((numer - 1) / 5)] ?? 10, dodatkowyCzas: 0 };
}

/**
 * Od tego poziomu w sklepie zdarzaja sie przedmioty epickie.
 *
 * `genItem()`: `elseif ($lvl >= 50 && $sanca <= $epic_chance_shop)`.
 * Ponizej piecdziesiatki nie ma ich wcale — zadne odswiezanie towaru
 * tego nie zmieni.
 */
export const POZIOM_EPIKOW = 50;

/** Ktora cecha jest glowna dla klasy — `$classStat` w oryginale. */
function cechaGlownaKlasy(klasa: number): number {
  return klasa === 1 ? 1 : klasa === 2 ? 3 : 2;
}

/**
 * Ktorym kompletem cech obdarzony jest epik — `$itemstats`.
 *
 * Numer przedmiotu (bez czlonu klasowego) decyduje: jedne epiki daja
 * trzy cechy naraz, inne wszystkie piec, jeszcze inne samo szczescie.
 */
function kompletCechEpika(numer: number): 1 | 2 | 3 {
  if ([50, 51, 56, 57, 61, 62, 63].includes(numer)) return 1;
  if ([53, 54, 55].includes(numer)) return 2;
  return 3;
}

/**
 * Losuje jeden przedmiot do zbrojowni.
 *
 * @param poziom  poziom postaci, dla ktorej przedmiot powstaje
 * @param klasa   1 wojownik, 2 mag, 3 lowca
 * @param rodzaj  wymuszony rodzaj przedmiotu; bez niego losowany 1..7
 */
export function wylosujPrzedmiot(
  poziom: number,
  klasa: number,
  {
    rodzaj,
    sklep = SKLEP_ZBROJOWNIA,
    maAlbum = false,
    wyprawa = false,
    maJuzKlucz = false,
    zamknieteLochy = [],
    losuj = LOSUJ,
    ustawienia = DOMYSLNE,
  }: {
    rodzaj?: number;
    /** 0 zbrojownia (rodzaje 1-7), 1 gabinet magii (8-13). */
    sklep?: number;
    /** Czy gracz ma juz album — bez niego gabinet bywa nim handluje. */
    maAlbum?: boolean;
    /** Nagroda z wyprawy — tylko tedy trafiaja sie klucze do lochow. */
    wyprawa?: boolean;
    /** Czy w plecaku lezy juz klucz — wtedy drugi nie wypadnie. */
    maJuzKlucz?: boolean;
    /** Numery lochow, ktorych gracz jeszcze nie otworzyl. */
    zamknieteLochy?: readonly number[];
    losuj?: Losowanie;
    ustawienia?: Ustawienia;
  } = {},
): Przedmiot | null {
  const gabinet = sklep === SKLEP_GABINET;

  let typ =
    rodzaj ??
    (gabinet
      ? wyprawa
        ? losujRodzajZWyprawy(maJuzKlucz, losuj)
        : losujRodzajGabinetu(poziom, maAlbum, losuj)
      : losuj(NAJNIZSZY_RODZAJ, NAJWYZSZY_RODZAJ));

  // Tarcze nosi tylko wojownik — oryginal losuje rodzaj od nowa, dopoki
  // nie trafi w cos, co dana klasa uniesie.
  while (!gabinet && klasa !== WOJOWNIK && typ === TARCZA) {
    typ = losuj(NAJNIZSZY_RODZAJ, NAJWYZSZY_RODZAJ);
  }

  // --------------------------------------------------------- epicki --

  /*
   * Czy trafi sie przedmiot epicki.
   *
   *     $sanca = rand(1, 100);
   *     ... elseif ($lvl >= 50 && $sanca <= $epic_chance_shop) $epicRand = 1;
   *
   * Losowanie idzie ZAWSZE, takze ponizej piecdziesiatego poziomu — tam
   * wynik jest tylko odrzucany. Przy `EPIC_CHANCE_SHOP = 2` wychodzi
   * dwa na sto na przedmiot, czyli mniej wiecej jeden epik na dziewiec
   * odswiezen calej pólki.
   */
  const sanca = losuj(1, 100);
  const epicki = poziom >= POZIOM_EPIKOW && sanca <= ustawienia.szansaNaEpik;

  // ------------------------------------------------------------ cena --

  const dolnaWidelka = poziom * poziom * (poziom * 4 + 10);
  const gornaWidelka = poziom * poziom * (poziom * 6 + 12);
  const dzielnik = typ === BRON ? 3 : 6;
  let zloto = zaokraglij(losuj(dolnaWidelka, gornaWidelka) / dzielnik + losuj(30, 50));

  // Album ma cene sztywna — `if ($type == 13) $itemGold = 2500;`.
  if (typ === ALBUM) zloto = 2500;

  // ------------------------------------------------------ ile cech --

  /*
   * Co siodmy przedmiot ma dwie cechy zamiast jednej i wtedy kosztuje
   * takze grzyby (`$statNumRand` w oryginale). Tarcza wojownika nigdy nie
   * kosztuje grzybow.
   */
  const dwieCechy = losuj(1, 7) === 1;

  /*
   * Numer mikstury. Trzy pierwsze piatki to cechy 1-5 w sile 10, 15 i 25
   * procent; szesnastka to mikstura zycia. Do dziesiatego poziomu
   * gabinet trzyma najslabsze, do trzydziestego srednie.
   */
  const numerMikstury =
    gabinet && typ === MIKSTURA
      ? poziom < 10
        ? losuj(1, 8) === 1
          ? 16
          : losuj(1, 5)
        : poziom < 30
          ? losuj(1, 8) === 1
            ? 16
            : losuj(1, 10)
          : losuj(1, 16)
      : 0;

  /*
   * `$lifepotionmushrand` dotyczy tylko mikstur z gabinetu magii, ale
   * losowanie idzie przed nastepnym i tam zostaje — bez niego caly
   * dalszy ciag rozjechalby sie z oryginalem.
   */
  const zaMiksture = losuj(1, 25);
  // `$mushRand` — po odstepstwie opisanym nizej nic z niego nie wynika,
  // ale losowanie musi zostac, zeby ciag liczb sie nie przesunal.
  losuj(1, 3);

  /*
   * Kolejnosc warunkow jest z oryginalu i wyklucza sie nawzajem: tarcza
   * wojownika nigdy nie kosztuje grzybow, epik kosztuje najwiecej i do
   * tego POTRAJA cene w zlocie.
   *
   * SWIADOME ODSTEPSTWO (patrz tabela w CLAUDE.md): dwie galezie
   * oryginalu — `$statNumRand` (co siodmy przedmiot, dwie cechy, 10
   * grzybow) i `$mushRand` (co trzeci, 1 grzyb) — NIE dokladaja juz
   * grzybow do ceny. Zostaja same losowania, bo `dwieCechy` decyduje
   * dalej o liczbie cech, a kazde pominiete losowanie przesunieloby
   * caly dalszy ciag generatora.
   */
  let grzyby = 0;
  if (klasa === WOJOWNIK && typ === TARCZA) grzyby = 0;
  else if (epicki) {
    grzyby = ustawienia.grzybyZaEpik;
    zloto *= 3;
  } else if (typ === MIKSTURA && numerMikstury === 16 && zaMiksture >= 2) {
    grzyby = ustawienia.grzybyZaMiksture;
  }

  // ----------------------------------------------------- numer i moc --

  // Do osmego poziomu w zbrojowni leza tylko dwa pierwsze wzory kazdego
  // rodzaju; wyzej dochodza kolejne.
  /*
   * Numer zwyklego przedmiotu. Zbrojownia trzyma je w widelkach
   * rosnacych z poziomem; gabinet ma wlasne, szersze — amulety siegaja
   * dwudziestki pierwszej, pierscienie szesnastki, reszta trzydziestki
   * siodmej, a do dwudziestego poziomu wszystko miesci sie w trojce.
   */
  const zwykly = gabinet
    ? poziom <= 19
      ? losuj(1, 3)
      : typ === AMULET
        ? losuj(2, 21)
        : typ === PIERSCIEN
          ? losuj(2, 16)
          : losuj(2, 37)
    : poziom <= 8
      ? losuj(1, 2)
      : poziom <= 18
        ? losuj(3, 5)
        : poziom <= 29
          ? losuj(5, 7)
          : losuj(8, 10);

  /*
   * Numery epikow zaczynaja sie od piecdziesiatki i rosna z poziomem —
   * to wlasnie po tym progu `GetItemFile()` poznaje przedmiot epicki
   * i daje mu jedna, wlasna barwe zamiast pieciu.
   */
  const numer = !epicki
    ? zwykly
    : poziom <= 99
      ? losuj(50, 54)
      : poziom <= 149
        ? losuj(50, 55)
        : poziom <= 189
          ? losuj(50, 56)
          : losuj(50, 57);

  const przedmiot: Przedmiot = {
    item_type: typ,
    /*
     * Klasa siedzi w tysiacach numeru: 1005 to piaty przedmiot maga.
     * Dotyczy to WYLACZNIE zbrojowni — amulety, pierscienie i mikstury
     * sa wspolne dla wszystkich klas i leza w katalogach `{typ}-1/`.
     */
    item_id: gabinet ? numer : numer + (klasa - 1) * 1000,
    dmg_min: 0,
    dmg_max: 0,
    atr_type_1: 0,
    atr_type_2: 0,
    atr_type_3: 0,
    atr_val_1: 0,
    atr_val_2: 0,
    atr_val_3: 0,
    gold: zloto,
    mush: grzyby,
  };

  if (gabinet) {
    // `$item['dmg_min'] = 0;` — gabinet nie handluje ani bronia, ani zbroja.
    przedmiot.dmg_min = 0;
  } else if (typ === BRON) {
    const chwiejnosc = losuj(990, 1010) / 1000;
    const srednia = zaokraglij((poziom - 1) * 1.17 * MNOZNIK_BRONI[klasa - 1]! * chwiejnosc);

    // Szeroki rozrzut obrazen co trzeciej broni: nizsze minimum, wyzsze
    // maksimum. `$range_rand` w oryginale.
    if (losuj(1, 3) === 1) {
      przedmiot.dmg_min = zaokraglij(srednia * 0.75 + losuj(1, 5));
      przedmiot.dmg_max = zaokraglij(srednia * 1.5 + losuj(5, 10));
    } else {
      przedmiot.dmg_min = zaokraglij(srednia + losuj(1, 5));
      przedmiot.dmg_max = zaokraglij(srednia * 1.25 + losuj(5, 10));
    }
  } else if (typ === TARCZA) {
    przedmiot.dmg_min = blokTarczy(poziom);
  } else {
    przedmiot.dmg_min = poziom * (PANCERZ_NA_POZIOM[klasa]?.[typ] ?? 0) + losuj(1, 6);
  }

  // ---------------------------------------------------------- cechy --

  /*
   * Wartosc cechy nigdy nie spada ponizej jedynki. Na pierwszym poziomie
   * wzor `(poziom - 1) * 3 + m` dalby zero albo liczbe ujemna i przedmioty
   * ze zbrojowni bylyby zupelnie puste.
   */
  const drgniecie = () => losuj(5, 15) - 10;
  const wartosc = (mnoznik: number) => Math.max(1, zaokraglij((poziom - 1) * mnoznik + drgniecie()));

  if (epicki) {
    /*
     * Epik ma wlasny komplet cech, zalezny od numeru, a bron maga
     * i lowcy dostaje je PODWOJONE (`$increasedStats`).
     */
    const podwojnie = typ === BRON && klasa !== WOJOWNIK ? 2 : 1;
    const komplet = kompletCechEpika(numer);

    if (komplet === 1) {
      const w = wartosc(2) * podwojnie;
      przedmiot.atr_type_1 = cechaGlownaKlasy(klasa);
      przedmiot.atr_type_2 = 4;
      przedmiot.atr_type_3 = 5;
      przedmiot.atr_val_1 = w;
      przedmiot.atr_val_2 = w;
      przedmiot.atr_val_3 = w;
    } else if (komplet === 2) {
      przedmiot.atr_type_1 = CECHA_WSZYSTKIE;
      przedmiot.atr_val_1 = wartosc(1.8) * podwojnie;
    } else {
      przedmiot.atr_type_1 = SZCZESCIE;
      przedmiot.atr_val_1 = wartosc(6) * podwojnie;
    }
  } else if (dwieCechy) {
    const pierwsza = losuj(1, 5);
    let druga = losuj(1, 5);
    // Dwa razy ta sama cecha nie ma sensu — oryginal przesuwa drugą o jeden.
    if (druga === pierwsza) druga = pierwsza < 2 ? pierwsza + 1 : pierwsza - 1;

    przedmiot.atr_type_1 = pierwsza;
    przedmiot.atr_type_2 = druga;
    przedmiot.atr_val_1 = wartosc(1.6);
    przedmiot.atr_val_2 = wartosc(1.6);
  } else {
    przedmiot.atr_type_1 = losuj(1, 5);
    przedmiot.atr_val_1 = wartosc(3);
  }

  /*
   * Mikstura i album maja wlasne dane i NADPISUJA wszystko, co wyszlo
   * wyzej — tak samo robi oryginal, dwoma osobnymi `if`ami na koncu
   * `genItem()`.
   *
   * Mikstura: pierwsza cecha to czas dzialania (`POTION_DUR`, przy
   * miksturze zycia o 96 godzin dluzej), druga to samo dzialanie.
   * `$fidget_item_ids` w oryginale nie jest nigdzie ustawiane, wiec
   * podstawa numeru wychodzi zero i numerem przedmiotu jest sam numer
   * mikstury.
   */
  if (typ === MIKSTURA) {
    const { cecha, moc, dodatkowyCzas } = dzialanieMikstury(numerMikstury);
    przedmiot.item_id = numerMikstury;
    przedmiot.dmg_min = 0;
    przedmiot.atr_type_1 = CECHA_CZAS;
    przedmiot.atr_val_1 = ustawienia.czasMikstury + dodatkowyCzas;
    przedmiot.atr_type_2 = cecha;
    przedmiot.atr_val_2 = moc;
    przedmiot.atr_type_3 = 0;
    przedmiot.atr_val_3 = 0;
  }

  if (typ === ALBUM) {
    przedmiot.item_id = 1;
    przedmiot.dmg_min = 0;
    przedmiot.atr_type_1 = 0;
    przedmiot.atr_val_1 = 0;
    przedmiot.atr_type_2 = 0;
    przedmiot.atr_val_2 = 0;
    przedmiot.atr_type_3 = 0;
    przedmiot.atr_val_3 = 0;
  }

  /*
   * KLUCZ DO LOCHU. Poza wyprawa rodzaj 11 w ogole tu nie dochodzi —
   * `losujRodzajGabinetu()` zamienia go na bizuterie.
   *
   *     $item['item_id'] = -1;
   *     if (rand(1,2) == 1 && $lvl >= 50 && magic_mirror != '1111111111111') ... odlamek lustra
   *     if (rand(1,2) == 1 && $lvl > 99 && toilet == 0) { item_id = 20; gold = 2500000; }
   *     if (rand(1,2) == 1 && $lvl > 99 && toilet == 1) { item_id = 10; gold =  500000; }
   *     if (item_id == -1) { pierwszy zamkniety loch powyzej progu, albo BRAK NAGRODY }
   *
   * Odlamkow lustra i klucza do wychodka jeszcze nie ma czym obsluzyc —
   * ale ich LOSOWANIA zuzywamy, bo inaczej caly dalszy ciag generatora
   * rozjechalby sie z oryginalem.
   */
  if (typ === KLUCZ) {
    losuj(1, 2); // odlamek lustra
    losuj(1, 2); // klucz do wychodka, wariant pierwszy
    losuj(1, 2); // klucz do wychodka, wariant drugi

    const prog = PROGI_KLUCZY.find(
      (p) => zamknieteLochy.includes(p.loch) && poziom > p.poziom,
    );
    // `return '0/0/0/0/0/0/0/0/0/0/0/0'` — wyprawa nie ma wtedy nagrody.
    if (!prog) return null;

    przedmiot.item_id = prog.loch;
    przedmiot.gold = CENA_KLUCZA;
    przedmiot.mush = 0;
    przedmiot.dmg_min = 0;
    przedmiot.dmg_max = 0;
    przedmiot.atr_type_1 = 0;
    przedmiot.atr_type_2 = 0;
    przedmiot.atr_type_3 = 0;
    przedmiot.atr_val_1 = 0;
    przedmiot.atr_val_2 = 0;
    przedmiot.atr_val_3 = 0;
  }

  return przedmiot;
}
