/**
 * Mikstury — port regul z `sf555/req.php`.
 *
 * Gracz ma trzy miejsca na dzialajaca miksture (`potion_id1..3`,
 * `potion_value1..3`, `potion_time1..3` w `user_data`). Miksturę wypija
 * sie przeciagajac ja z plecaka na postac; w oryginale robi to akcja
 * `$ACT_USE_ITEM`, ktora dla rodzaju 12 przechwytuje przeniesienie
 * (`req.php`, `if ($item['item_type'] == 12)`).
 *
 * Wypicie NIE dodaje punktow na stale: podnosi jedna cechę o procent,
 * a po uplywie czasu miejsce samo sie zeruje (patrz `loadDefaultData`).
 */

import { round, time } from '../compat/php.js';

/** Rodzaj przedmiotu, ktory jest mikstura. */
export const RODZAJ_MIKSTURY = 12;

/** Ile miejsc na dzialajace mikstury ma postac. */
export const MIEJSC_NA_MIKSTURY = 3;

/**
 * Eliksir Niesmiertelnosci — jedyna mikstura, ktora nie podnosi cechy,
 * tylko punkty zycia, i jedyna, ktorej numer nie miesci sie w schemacie
 * „piatka co poziom mocy".
 */
export const MIKSTURA_ZYCIA = 16;

/**
 * Ile godzin dziala mikstura — `POTION_DUR` z tabeli `game_settings`.
 * Eliksir Niesmiertelnosci dostaje jeszcze 96 godzin extra.
 */
export const CZAS_DZIALANIA_H = 72;
export const DODATKOWY_CZAS_ZYCIA_H = 96;

/** O ile procent Eliksir Niesmiertelnosci podnosi punkty zycia. */
export const PROCENT_ZYCIA = 25;

/**
 * Ktora cechę podnosi mikstura o danym numerze: 1 sila, 2 zrecznosc,
 * 3 inteligencja, 4 wytrzymalosc, 5 szczescie. `0` znaczy „zadna"
 * (pusto albo Eliksir Niesmiertelnosci).
 *
 * Numery 1..15 to trzy piatki: kazda kolejna piatka to ta sama piatka
 * cech, tylko mocniejsza. Wprost z `switch ($potionIDRand)`
 * w generatorze przedmiotow.
 */
export function cechaMikstury(numer: number): number {
  if (numer < 1 || numer > 15) return 0;
  return ((numer - 1) % 5) + 1;
}

/**
 * O jaki UDZIAL mikstura podnosi swoja cechę.
 *
 * `req.php` liczy to w trzech miejscach i w dwoch z nich (`loadDefaultData`
 * i blok pod nim) numer 10 dostaje 0,15 — tyle, ile reszta srodkowej
 * piatki i tyle, ile mowi jej wlasne `atr_val_2`. W konstruktorze klasy
 * `Char` (linia 594) stoi tam 0,25, czyli tyle co w piatce najmocniejszej.
 * To omylka w zrodle: przy 0,25 gracz widzialby na ekranie inna wartosc
 * szczescia niz ta, ktora liczy sie w walce. Bierzemy wersje z dwoch
 * pozostalych miejsc.
 */
export function udzialMikstury(numer: number): number {
  if (numer < 1 || numer > 15) return 0;
  return numer <= 5 ? 0.1 : numer <= 10 ? 0.15 : 0.25;
}

/** Trzy miejsca na mikstury odczytane z wiersza gracza. */
export interface MiejsceMikstury {
  /** Numer mikstury (`potion_id`), 0 gdy pusto. */
  numer: number;
  /** Sila dzialania w procentach (`potion_value`). */
  wartosc: number;
  /** Kiedy przestaje dzialac — czas uniksowy (`potion_time`). */
  koniec: number;
}

/**
 * Wyciaga trzy miejsca na mikstury z wiersza `user_data` — juz BEZ tych,
 * ktorym uplynal czas.
 *
 * Oryginal kasuje wygasle mikstury w `loadDefaultData()`, czyli przy
 * kazdym wczytaniu gracza. Zerowanie w bazie robi `wygasMikstury()`;
 * tutaj wystarczy pominac te, ktorych czas minal, zeby zaden rachunek
 * nie doliczyl dopalacza, ktory juz nie dziala — nawet gdyby zapis
 * jeszcze nie doszedl.
 */
export function miksturyGracza(
  wiersz: Record<string, unknown>,
  teraz: number = time(),
): MiejsceMikstury[] {
  return [1, 2, 3].map((i) => {
    const koniec = Number(wiersz[`potion_time${i}`] ?? 0) || 0;
    if (koniec !== 0 && teraz > koniec) return { numer: 0, wartosc: 0, koniec: 0 };

    return {
      numer: Number(wiersz[`potion_id${i}`] ?? 0) || 0,
      wartosc: Number(wiersz[`potion_value${i}`] ?? 0) || 0,
      koniec,
    };
  });
}

/**
 * Kolumny, ktore trzeba wyzerowac, bo miksturom uplynal czas.
 *
 * Pusty wynik znaczy „nie ma czego zapisywac" — a to jest przypadek
 * zwykly, wiec warto go sprawdzic przed pojsciem do bazy.
 */
export function wygasleMikstury(
  wiersz: Record<string, unknown>,
  teraz: number = time(),
): Record<string, number> {
  const doZerowania: Record<string, number> = {};

  for (let i = 1; i <= MIEJSC_NA_MIKSTURY; i++) {
    const koniec = Number(wiersz[`potion_time${i}`] ?? 0) || 0;
    if (koniec === 0 || teraz <= koniec) continue;

    doZerowania[`potion_id${i}`] = 0;
    doZerowania[`potion_value${i}`] = 0;
    doZerowania[`potion_time${i}`] = 0;
  }

  return doZerowania;
}

/**
 * Mnozniki, przez ktore trzeba przemnozyc piec cech, zeby dostac wartosc
 * z dzialajacymi miksturami. Indeks 0 nie jest uzywany — cechy licza sie
 * od jedynki, tak jak `atr_type` przedmiotu.
 */
export function mnoznikiCech(mikstury: readonly MiejsceMikstury[]): number[] {
  const mnozniki = [1, 1, 1, 1, 1, 1];
  for (const m of mikstury) {
    const cecha = cechaMikstury(m.numer);
    if (cecha > 0) mnozniki[cecha] = (mnozniki[cecha] ?? 1) + udzialMikstury(m.numer);
  }
  return mnozniki;
}

/** Czy ktores z miejsc trzyma Eliksir Niesmiertelnosci. */
export function maEliksirZycia(mikstury: readonly MiejsceMikstury[]): boolean {
  return mikstury.some((m) => m.numer === MIKSTURA_ZYCIA);
}

/**
 * Dodatek do punktow zycia od Eliksiru Niesmiertelnosci.
 *
 * `req.php`: `round(($wit * $k * ($lvl + 1)) / 100 * 25)` — czyli 25%
 * zwyklego wzoru na zycie. Liczy sie raz, nawet gdyby eliksir stal
 * w dwoch miejscach naraz (petla nadpisuje, a nie sumuje).
 */
export function bonusZycia(
  mikstury: readonly MiejsceMikstury[],
  wytrzymalosc: number,
  mnoznikKlasy: number,
  poziom: number,
): number {
  if (!maEliksirZycia(mikstury)) return 0;
  return round(((wytrzymalosc * mnoznikKlasy * (poziom + 1)) / 100) * PROCENT_ZYCIA);
}

/**
 * Gdzie trafi wypijana mikstura.
 *
 * Zwraca numer miejsca 1..3 albo powod odmowy:
 *
 * - `slabsza` — w miejscu stoi juz MOCNIEJSZA mikstura tej samej cechy;
 *   oryginal ustawia wtedy `$potionSlot = -1` i konczy bez zmian,
 * - `brak-miejsca` — wszystkie trzy miejsca zajete innymi cechami.
 *
 * Rozpoznawanie „ta sama cecha" idzie po roznicy numerow o 5, 10 i 15 —
 * dokladnie tak, jak w oryginale. Mikstura o numerze rownym albo wiekszym
 * niz stojaca wchodzi na jej miejsce i DOKLADA sie do czasu (patrz
 * `czasPoWypiciu`).
 */
export function miejsceDlaMikstury(
  numer: number,
  mikstury: readonly MiejsceMikstury[],
): number | 'slabsza' | 'brak-miejsca' {
  let miejsce: number | null = null;

  /*
   * Petla z oryginalu nie przerywa sie po trafieniu, wiec pozniejsze
   * miejsce nadpisuje wczesniejsze. Przepisujemy to razem z ta wlasciwoscia.
   */
  for (let i = 0; i < MIEJSC_NA_MIKSTURY; i++) {
    const stojaca = mikstury[i]?.numer ?? 0;

    if (numer === stojaca || numer === stojaca + 5 || numer === stojaca + 10 || numer === stojaca + 15) {
      miejsce = i + 1;
    }

    if ((numer === stojaca - 5 || numer === stojaca - 10 || numer === stojaca - 15) && stojaca !== MIKSTURA_ZYCIA) {
      miejsce = -1;
    }
  }

  /*
   * Eliksir Niesmiertelnosci ma numer 16, wiec „stojaca + 15" trafiloby
   * na kazda miksture sily (numer 1). Oryginal liczy dla niego miejsce
   * osobno i tylko po dokladnej rownosci.
   */
  if (numer === MIKSTURA_ZYCIA) {
    miejsce = null;
    for (let i = 0; i < MIEJSC_NA_MIKSTURY; i++) {
      if (mikstury[i]?.numer === MIKSTURA_ZYCIA) miejsce = i + 1;
    }
  }

  if (miejsce === null) {
    const wolne = mikstury.findIndex((m) => m.numer === 0);
    if (wolne < 0) return 'brak-miejsca';
    miejsce = wolne + 1;
  }

  if (miejsce === -1) return 'slabsza';
  return miejsce;
}

/**
 * Do kiedy mikstura bedzie dzialac.
 *
 * Puste miejsce liczy sie od teraz, zajete DOKLADA czas do konca tego,
 * co juz dziala — dwie takie same mikstury pod rzad daja 144 godziny.
 */
export function czasPoWypiciu(numer: number, koniecPoprzedniej: number, teraz: number): number {
  const godzin = CZAS_DZIALANIA_H + (numer === MIKSTURA_ZYCIA ? DODATKOWY_CZAS_ZYCIA_H : 0);
  const poczatek = koniecPoprzedniej === 0 ? teraz : koniecPoprzedniej;
  return poczatek + 3600 * godzin;
}
