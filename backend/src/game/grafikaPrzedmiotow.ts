/**
 * Sciezki do grafik przedmiotow — port `GetItemFile()` i `GetArrowID()`
 * z `MainTimeline.as`.
 *
 * Nazwa pliku nie wynika z samego numeru przedmiotu. Wchodzi do niej
 * jeszcze BARWA, liczona z jego statystyk, a przy przedmiotach epickich
 * (numer 50 i wyzej) barwa jest wymuszana na jedna. Dlatego to nie jest
 * miejsce na skladanie sciezek „z glowy" — kazda regula ma tu swoj
 * odpowiednik w kodzie klienta.
 */

const RES = '/res/sfgame';

/**
 * Barwa przedmiotu — suma osmiu pol jego bloku danych modulo piec.
 *
 * `GetItemID()` sumuje pola od `SG_ITM_SCHADEN_MIN` (2) do `SG_ITM_ATTRIBVAL3`
 * (9), czyli obrazenia i komplet atrybutow:
 *
 *     itmColor = 0;
 *     while (i < 8) itmColor += Number(someObj[slotID + SG_ITM_SCHADEN_MIN + i++]);
 *     itmColor = itmColor % 5;
 */
export function barwaPrzedmiotu(pola: {
  dmg_min: number;
  dmg_max: number;
  atr_type_1: number;
  atr_type_2: number;
  atr_type_3: number;
  atr_val_1: number;
  atr_val_2: number;
  atr_val_3: number;
}): number {
  const suma =
    pola.dmg_min +
    pola.dmg_max +
    pola.atr_type_1 +
    pola.atr_type_2 +
    pola.atr_type_3 +
    pola.atr_val_1 +
    pola.atr_val_2 +
    pola.atr_val_3;

  return ((suma % 5) + 5) % 5;
}

/**
 * Numer przedmiotu rozbity na klase i obrazek.
 *
 * Klient robi to petla `while (itmPic >= 1000) { itmPic -= 1000; itmClass++ }`
 * — tysiace koduja klase postaci, reszta numer obrazka. Ta sama liczba
 * decyduje o typie animacji ciosu, bo `charWeaponType` liczy sie
 * dokladnie tak samo, tylko od jedynki.
 */
export function rozlozNumer(numerPrzedmiotu: number): { klasa: number; obrazek: number } {
  let obrazek = numerPrzedmiotu;
  let klasa = 0;
  while (obrazek >= 1000) {
    obrazek -= 1000;
    klasa++;
  }
  return { klasa, obrazek };
}

/**
 * Od tego numeru obrazka przedmiot jest epicki.
 *
 * To ten sam prog, po ktorym `GetItemFile()` poznaje epik i po ktorym
 * `GetItemName()` przeskakuje do osobnej tablicy nazw. Typ 14 (zwoje)
 * jest wyjatkiem — tam numery powyzej piecdziesiatki nie znacza nic
 * nadzwyczajnego.
 */
export const PIERWSZY_EPICKI = 50;

/** Rodzaj przedmiotu, ktory jest bronia — tylko on wypuszcza pocisk. */
export const RODZAJ_BRONI = 1;

/** Czy przedmiot jest epicki — po numerze obrazka, nie po cenie. */
export function czyEpicki(typ: number, numerPrzedmiotu: number): boolean {
  return rozlozNumer(numerPrzedmiotu).obrazek >= PIERWSZY_EPICKI && typ !== 14;
}

/**
 * Plik ikony przedmiotu — `GetItemFile(itmTyp, itmPic, itmColor, itmClass)`.
 *
 *     itm/{typ}-{klasa+1}/itm{typ}-{obrazek}-{barwa+1}-{klasa+1}.png   typ 1-7
 *     itm/{typ}-1/itm{typ}-{obrazek}-{barwa+1}-1.png                   typ 8-9
 *     itm/{typ}-1/itm{typ}-{obrazek}-1.png                             typ 10-14
 *     itm/itm{typ}-{obrazek}.png                                       reszta
 *
 * Przedmiot epicki (obrazek >= 50, poza typem 14) zawsze bierze barwe
 * zerowa — stad w katalogach jest dla niego tylko jeden plik zamiast
 * pieciu.
 */
export function plikIkony(typ: number, numerPrzedmiotu: number, barwa: number): string {
  const { klasa, obrazek } = rozlozNumer(numerPrzedmiotu);
  const b = obrazek >= PIERWSZY_EPICKI && typ !== 14 ? 0 : barwa;
  const podstawa = `itm${typ}-${obrazek}`;

  if (typ === 1 || typ === 2 || (typ >= 3 && typ <= 7)) {
    return `${RES}/itm/${typ}-${klasa + 1}/${podstawa}-${b + 1}-${klasa + 1}.png`;
  }
  if (typ >= 8 && typ <= 14) {
    const zBarwa = typ < 10 ? `${b + 1}-` : '';
    return `${RES}/itm/${typ}-1/${podstawa}-${zBarwa}1.png`;
  }
  return `${RES}/itm/${podstawa}.png`;
}

/**
 * Typ animacji ciosu — `charWeaponType` z klienta.
 *
 * 1 to bron biala, 2 rozdzka maga, 3 luk i kusza zwiadowcy. Klasa
 * zakodowana w tysiacach numeru broni odpowiada klasie postaci, wiec
 * mag zawsze strzela kula, a zwiadowca zawsze belta.
 */
export function typAnimacjiBroni(numerPrzedmiotu: number): 1 | 2 | 3 {
  const { klasa } = rozlozNumer(numerPrzedmiotu);
  const typ = klasa + 1;
  return typ === 2 ? 2 : typ === 3 ? 3 : 1;
}

/**
 * Plik pocisku — reguly z petli definiujacej `GetArrowID()`:
 *
 *     "itm/1-" + (itmTyp + 2) + "/shot" + (itmTyp == 0 ? 2 : 1) + "-" + itmPic
 *       + "-" + ((itmPic >= 50 ? (itmTyp == 0 ? (itmColor == 3 ? 3 : 0) : 0) : itmColor) + 1)
 *
 * `itmTyp` to tutaj klasa broni pomniejszona o jeden: 0 dla maga, 1 dla
 * zwiadowcy. Przy przedmiocie epickim mag ma DWA warianty — zwykly
 * (barwa 0) i osobny dla barwy 3 — a zwiadowca jeden. To wlasnie te
 * „specjalne efekty" epickiego ekwipunku: w katalogu `1-2` przy numerach
 * od 50 w gore lezy tylko `shot2-N-1.png` i `shot2-N-4.png`.
 */
export function plikPocisku(numerPrzedmiotu: number, barwa: number): string | null {
  const { klasa, obrazek } = rozlozNumer(numerPrzedmiotu);
  const k = klasa - 1;
  if (k !== 0 && k !== 1) return null;

  const wariant = obrazek >= 50 ? (k === 0 && barwa === 3 ? 3 : 0) : barwa;
  return `${RES}/itm/1-${k + 2}/shot${k === 0 ? 2 : 1}-${obrazek}-${wariant + 1}.png`;
}
