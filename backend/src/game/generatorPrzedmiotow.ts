/**
 * Losowanie przedmiotow — przepisane z `genItem()` oryginalnego
 * `sf555/req.php`.
 *
 * Na razie obejmuje asortyment ZBROJOWNI (w oryginale „sklep 0"): bron,
 * tarcze i czesci zbroi, czyli rodzaje od 1 do 7. Przedmioty epickie,
 * mikstury, klucze do lochow i album przyjda razem z ekranami, ktore ich
 * uzywaja — tam maja wlasne, osobne reguly.
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
  grzybyZaDwieCechy: number;
  /** `ITEMGEN_PMUSH_EPIC` — ile grzybow kosztuje przedmiot epicki. */
  grzybyZaEpik: number;
  /** `EPIC_CHANCE_SHOP` — na ilu setnych przedmiot w sklepie bywa epicki. */
  szansaNaEpik: number;
}

/** Wartosci z `game_settings` w `DATABASE.sql`. */
const DOMYSLNE: Ustawienia = { grzybyZaDwieCechy: 10, grzybyZaEpik: 15, szansaNaEpik: 2 };

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
    losuj = LOSUJ,
    ustawienia = DOMYSLNE,
  }: { rodzaj?: number; losuj?: Losowanie; ustawienia?: Ustawienia } = {},
): Przedmiot {
  let typ = rodzaj ?? losuj(NAJNIZSZY_RODZAJ, NAJWYZSZY_RODZAJ);

  // Tarcze nosi tylko wojownik — oryginal losuje rodzaj od nowa, dopoki
  // nie trafi w cos, co dana klasa uniesie.
  while (klasa !== WOJOWNIK && typ === TARCZA) {
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

  // ------------------------------------------------------ ile cech --

  /*
   * Co siodmy przedmiot ma dwie cechy zamiast jednej i wtedy kosztuje
   * takze grzyby (`$statNumRand` w oryginale). Tarcza wojownika nigdy nie
   * kosztuje grzybow.
   */
  const dwieCechy = losuj(1, 7) === 1;
  /*
   * `$lifepotionmushrand` dotyczy tylko mikstur z gabinetu magii, ale
   * losowanie idzie przed nastepnym i tam zostaje — bez niego caly
   * dalszy ciag rozjechalby sie z oryginalem.
   */
  losuj(1, 25);
  const zaGrzyby = losuj(1, 3) === 1;

  /*
   * Kolejnosc warunkow jest z oryginalu i wyklucza sie nawzajem: tarcza
   * wojownika nigdy nie kosztuje grzybow, epik kosztuje najwiecej i do
   * tego POTRAJA cene w zlocie.
   */
  let grzyby = 0;
  if (klasa === WOJOWNIK && typ === TARCZA) grzyby = 0;
  else if (epicki) {
    grzyby = ustawienia.grzybyZaEpik;
    zloto *= 3;
  } else if (dwieCechy) grzyby = ustawienia.grzybyZaDwieCechy;
  else if (zaGrzyby) grzyby = 1;

  // ----------------------------------------------------- numer i moc --

  // Do osmego poziomu w zbrojowni leza tylko dwa pierwsze wzory kazdego
  // rodzaju; wyzej dochodza kolejne.
  const zwykly =
    poziom <= 8 ? losuj(1, 2) : poziom <= 18 ? losuj(3, 5) : poziom <= 29 ? losuj(5, 7) : losuj(8, 10);

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
    // Klasa siedzi w tysiacach numeru: 1005 to piaty przedmiot maga.
    item_id: numer + (klasa - 1) * 1000,
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

  if (typ === BRON) {
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

  return przedmiot;
}
