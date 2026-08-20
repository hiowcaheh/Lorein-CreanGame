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
}

const DOMYSLNE: Ustawienia = { grzybyZaDwieCechy: 10 };

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

  // ------------------------------------------------------------ cena --

  const dolnaWidelka = poziom * poziom * (poziom * 4 + 10);
  const gornaWidelka = poziom * poziom * (poziom * 6 + 12);
  const dzielnik = typ === BRON ? 3 : 6;
  const zloto = zaokraglij(losuj(dolnaWidelka, gornaWidelka) / dzielnik + losuj(30, 50));

  // ------------------------------------------------------ ile cech --

  /*
   * Co siodmy przedmiot ma dwie cechy zamiast jednej i wtedy kosztuje
   * takze grzyby (`$statNumRand` w oryginale). Tarcza wojownika nigdy nie
   * kosztuje grzybow.
   */
  const dwieCechy = losuj(1, 7) === 1;
  const zaGrzyby = losuj(1, 3) === 1;

  let grzyby = 0;
  if (klasa === WOJOWNIK && typ === TARCZA) grzyby = 0;
  else if (dwieCechy) grzyby = ustawienia.grzybyZaDwieCechy;
  else if (zaGrzyby) grzyby = 1;

  // ----------------------------------------------------- numer i moc --

  // Do osmego poziomu w zbrojowni leza tylko dwa pierwsze wzory kazdego
  // rodzaju; wyzej dochodza kolejne.
  const numer =
    poziom <= 8 ? losuj(1, 2) : poziom <= 18 ? losuj(3, 5) : poziom <= 29 ? losuj(5, 7) : losuj(8, 10);

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

  if (dwieCechy) {
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
